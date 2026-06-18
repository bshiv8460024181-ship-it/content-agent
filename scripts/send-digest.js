// scripts/send-digest.js
// Sends a digest of your real stats + top content idea to Telegram.
// Run: node scripts/send-digest.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN || !CHAT_ID) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env — add both first.');
  process.exit(1);
}

const dataPath = path.join(__dirname, '..', 'dashboard', 'data.json');
if (!fs.existsSync(dataPath)) {
  console.error(`Could not find ${dataPath} — run scripts/fetch-data.js first.`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

function buildMessage(d) {
  const top = d.topPosts[0];
  const second = d.topPosts[1];

  return [
    `*Crystra Diam — Content Agent Digest*`,
    `_Synced: ${new Date(d.scrapedAt).toLocaleString()}_`,
    ``,
    `*Stats*`,
    `Followers: ${d.profile.followers}`,
    `Posts tracked: ${d.stats.totalPostsScraped}`,
    `Total views: ${d.stats.totalViews}`,
    `Engagement rate: ${d.stats.engagementRate}%`,
    ``,
    `*Top post*`,
    `${top.views} views — ${top.caption}`,
    top.url,
    ``,
    `*Top idea for next post*`,
    `Your top post ("${second ? second.caption.slice(0, 60) : top.caption.slice(0, 60)}...") performed well — consider a follow-up in the same style with a different stone or cut.`,
  ].join('\n');
}

async function main() {
  const text = buildMessage(data);
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'Markdown' }),
  });
  const result = await res.json();
  if (!result.ok) {
    console.error('Telegram API error:', result.description);
    process.exit(1);
  }
  console.log('Digest sent successfully. Check your phone!');
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
