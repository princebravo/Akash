// api/track-lead.js
// Vercel Serverless Function — same job as server.js, but runs as a
// free serverless function instead of a standalone Node server.
// Available automatically at: https://your-project.vercel.app/api/track-lead

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_id, event_source_url, fbp, fbc, user_agent } = req.body;

    if (!event_id) {
      return res.status(400).json({ error: 'event_id is required' });
    }

    const PIXEL_ID = process.env.META_PIXEL_ID;
    const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    const GRAPH_VERSION = process.env.GRAPH_API_VERSION || 'v21.0';
    const CAPI_URL = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events`;

    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket?.remoteAddress ||
      '';

    const eventPayload = {
      data: [
        {
          event_name: 'Lead',
          event_time: Math.floor(Date.now() / 1000),
          event_id: event_id, // must match the eventID sent from the Pixel on the frontend
          event_source_url: event_source_url,
          action_source: 'website',
          user_data: {
            client_ip_address: clientIp,
            client_user_agent: user_agent,
            fbp: fbp || undefined,
            fbc: fbc || undefined
          }
        }
      ]
      // test_event_code: 'TEST12345', // uncomment while testing in Events Manager
    };

    const metaRes = await fetch(`${CAPI_URL}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventPayload)
    });

    const result = await metaRes.json();

    if (!metaRes.ok) {
      console.error('CAPI error:', result);
      return res.status(500).json({ error: 'CAPI request failed', details: result });
    }

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
