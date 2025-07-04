export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return res.status(200).send('🔧 LINE Bot is running and ready to receive webhooks.');
    }

    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const events = req.body.events;
    if (!Array.isArray(events)) {
      return res.status(400).send('Invalid webhook payload');
    }

    await Promise.all(events.map(async (event) => {
      if (event.type === 'message' && event.message.type === 'text') {
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'บอทตอบรับแล้วครับ',
        });
      }
    }));

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook Error:', error);
    res.status(500).send('Internal Server Error');
  }
}
