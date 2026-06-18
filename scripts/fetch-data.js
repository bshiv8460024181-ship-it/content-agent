// scripts/fetch-data.js
//
// Pulls:
//   1. Your own profile details (followers, post count)
//   2. Your own FULL post history (resultsType: "posts" — not the profile-scraper's
//      latestPosts field, which only returns recent posts)
//   3. Your competitors' recent posts (for benchmarking)
//
// Ranks your own posts by views and writes everything to dashboard/data.json

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
if (!APIFY_TOKEN) {
  console.error('Missing APIFY_API_TOKEN in .env — stopping.');
  process.exit(1);
}

const OWN_HANDLE = 'crystara.diam';
const COMPETITOR_HANDLES = ['yashwantsakhiya', 'jkgems.in', 'udhrashexport'];

// How many of your own posts to pull. Start small (e.g. 50) to confirm everything
// works before bumping this up to your true full history (e.g. 500+).
const OWN_POSTS_LIMIT = Number(process.env.OWN_POSTS_LIMIT || 50);
const COMPETITOR_POSTS_LIMIT = 20;

const ACTOR_ID = 'apify~instagram-scraper'; // apify/instagram-scraper (slash -> ~ in URLs)
const API_BASE = 'https://api.apify.com/v2';

const profileUrl = (handle) => `https://www.instagram.com/${handle}/`;

async function runActor(input, label) {
  console.log(`\n[${label}] Starting Apify run with input:`, input);
  const startRes = await fetch(`${API_BASE}/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!startRes.ok) {
    throw new Error(`[${label}] Failed to start run: ${startRes.status} ${await startRes.text()}`);
  }
  const startData = (await startRes.json()).data;
  const runId = startData.id;
  console.log(`[${label}] Run ${runId} started. Polling...`);

  let status = startData.status;
  let datasetId = startData.defaultDatasetId;
  const POLL_MS = 5000;
  const MAX_WAIT_MS = 10 * 60 * 1000;
  let waited = 0;

  while (!['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    waited += POLL_MS;
    if (waited > MAX_WAIT_MS) throw new Error(`[${label}] Timed out waiting for run to finish.`);
    const pollData = (await (await fetch(`${API_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`)).json()).data;
    status = pollData.status;
    datasetId = pollData.defaultDatasetId;
    console.log(`[${label}] ${status} (${Math.round(waited / 1000)}s elapsed)`);
  }

  if (status !== 'SUCCEEDED') throw new Error(`[${label}] Run ended with status: ${status}`);

  const itemsRes = await fetch(`${API_BASE}/datasets/${datasetId}/items?token=${APIFY_TOKEN}&format=json`);
  if (!itemsRes.ok) throw new Error(`[${label}] Failed to fetch dataset: ${itemsRes.status} ${await itemsRes.text()}`);
  const items = await itemsRes.json();
  console.log(`[${label}] Retrieved ${items.length} items.`);
  return items;
}

const getViews = (item) => item.videoViewCount ?? item.videoPlayCount ?? null;

const slim = (p) => ({
  url: p.url,
  caption: (p.caption || '').slice(0, 120),
  views: getViews(p),
  likes: p.likesCount ?? null,
  comments: p.commentsCount ?? null,
  timestamp: p.timestamp,
});

async function main() {
  const detailsItems = await runActor(
    { directUrls: [profileUrl(OWN_HANDLE)], resultsType: 'details', resultsLimit: 1 },
    'own-details'
  );
  const ownDetails = detailsItems[0] || {};

  const ownPosts = await runActor(
    { directUrls: [profileUrl(OWN_HANDLE)], resultsType: 'posts', resultsLimit: OWN_POSTS_LIMIT },
    'own-posts'
  );

  const competitorPosts = await runActor(
    { directUrls: COMPETITOR_HANDLES.map(profileUrl), resultsType: 'posts', resultsLimit: COMPETITOR_POSTS_LIMIT },
    'competitor-posts'
  );

  if (ownPosts[0]) console.log('\nSample post field names (sanity check):', Object.keys(ownPosts[0]));

  const rankedByViews = ownPosts.filter((p) => getViews(p) !== null).sort((a, b) => getViews(b) - getViews(a));
  const topPosts = rankedByViews.slice(0, 10).map(slim);

  const totalViews = rankedByViews.reduce((s, p) => s + (getViews(p) || 0), 0);
  const totalLikes = ownPosts.reduce((s, p) => s + (p.likesCount || 0), 0);
  const totalComments = ownPosts.reduce((s, p) => s + (p.commentsCount || 0), 0);
  const followers = ownDetails.followersCount ?? null;
  const engagementRate =
    followers && ownPosts.length
      ? (((totalLikes + totalComments) / ownPosts.length / followers) * 100).toFixed(2)
      : null;

  const competitors = {};
  for (const handle of COMPETITOR_HANDLES) {
    competitors[handle] = competitorPosts
      .filter((p) => (p.ownerUsername || '').toLowerCase() === handle.toLowerCase())
      .map(slim);
  }

  const data = {
    scrapedAt: new Date().toISOString(),
    profile: { handle: OWN_HANDLE, followers, postsCount: ownDetails.postsCount ?? ownPosts.length },
    stats: { totalPostsScraped: ownPosts.length, totalViews, totalLikes, totalComments, engagementRate },
    topPosts,
    allOwnPosts: ownPosts.map(slim),
    competitors,
  };

  const outPath = path.join(__dirname, '..', 'dashboard', 'data.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));

  console.log(`\nSaved to ${outPath}`);
  console.log('\n=== SUMMARY ===');
  console.log(`Followers: ${followers}`);
  console.log(`Posts scraped: ${ownPosts.length}`);
  console.log(`Total views across video posts: ${totalViews}`);
  console.log('\nTop 5 by views:');
  topPosts.slice(0, 5).forEach((p, i) => console.log(`${i + 1}. ${p.views ?? 'n/a'} views — ${p.url}`));
}

main().catch((err) => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
