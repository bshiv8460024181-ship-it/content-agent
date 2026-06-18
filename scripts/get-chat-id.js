// scripts/get-chat-id.js
// Run this AFTER you've sent your bot at least one message in Telegram.
// It calls getUpdates and prints the chat ID(s) it finds.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN in .env — add it first.');
  process.exit(1);
}

async function main() {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates`);
  const data = await res.json();

  if (!data.ok) {
    console.error('Telegram API error:', data.description);
    process.exit(1);
  }

  if (!data.result.length) {
    console.log('\nNo messages found yet. Make sure you sent your bot a message in Telegram, then run this again.\n');
    return;
  }

  console.log('\nFound message(s):');
  const seen = new Set();
  for (const update of data.result) {
    const chat = update.message?.chat;
    if (!chat) continue;
    if (seen.has(chat.id)) continue;
    seen.add(chat.id);
    console.log(`  Chat ID: ${chat.id}  (${chat.first_name || chat.title || 'unknown'}, type: ${chat.type})`);
  }
  console.log('\nCopy the Chat ID above into TELEGRAM_CHAT_ID in your .env file.\n');
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
