import { middleware, Client } from '@line/bot-sdk';
import { config } from 'dotenv';

config();

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const events = req.body.events;
  if (!Array.isArray(events)) {
    res.status(400).send('Invalid webhook payload');
    return;
  }

  await Promise.all(events.map(async (event) => {
    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text.toLowerCase();
      let reply = 'พิมพ์ !today เพื่อดูอีเวนต์วันนี้ หรือ !all เพื่อดูทั้งหมดครับ';

      if (text.includes('!today') || text.includes('!all')) {
        const puppeteer = require('puppeteer');
        const cheerio = require('cheerio');

        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.goto('https://ra.co/events/th/bangkok', { waitUntil: 'networkidle2' });
        const html = await page.content();
        await browser.close();

        const $ = cheerio.load(html);
        const events = [];
        $('a.event-item').each((i, el) => {
          const title = $(el).find('.title').text().trim();
          const date = $(el).find('.date').text().trim();
          if (title && date) events.push(`${date}: ${title}`);
        });

        if (text.includes('!today')) {
          const today = new Date().toLocaleDateString('en-GB');
          reply = events.filter(e => e.includes(today)).join('\n') || 'ไม่พบอีเวนต์วันนี้ครับ';
        } else {
          reply = events.slice(0, 10).join('\n');
        }
      }

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: reply,
      });
    }
  }));

  res.status(200).send('OK');
}