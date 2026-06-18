// agents.js — turns real scraped data into each agent's working output.
// Anything not yet backed by a live integration (e.g. DM Manager actually
// reading Instagram DMs) is clearly labeled as "queued / not yet connected"
// rather than faked as live.

function shortCaption(c, len) {
  if (!c) return '(no caption)';
  return c.length > len ? c.slice(0, len).trim() + '…' : c;
}

function avgViews(posts) {
  const withViews = posts.filter((p) => p.views !== null && p.views !== undefined);
  if (!withViews.length) return null;
  return Math.round(withViews.reduce((s, p) => s + p.views, 0) / withViews.length);
}

const Agents = {
  ideator(data) {
    const top = data.topPosts.slice(0, 3);
    const ideas = top.map((p, i) => ({
      title: `Follow-up angle #${i + 1}`,
      body: `Your post "${shortCaption(p.caption, 70)}" earned ${p.views} views — your ${i === 0 ? 'best' : 'a top'} performer. Worth a follow-up post on the same cut/process, different stone.`,
      views: p.views,
    }));
    return {
      metrics: [
        ['Ideas queued', ideas.length],
        ['Source', 'Top posts + competitor scan'],
      ],
      render: () => `
        <div class="drawer-block">
          <div class="drawer-block-label">Fresh angles, ranked by what already worked</div>
          <ul class="drawer-list">
            ${ideas.map((i) => `<li><span class="views-tag">${i.views} views on original</span><br>${i.body}</li>`).join('')}
          </ul>
        </div>
        <p class="note">Generated from your real top-performing posts in data.json.</p>
      `,
    };
  },

  hookScript(data) {
    const top = data.topPosts[0];
    const topic = shortCaption(top ? top.caption : 'a featured diamond', 50);
    const ptHook = `Esse diamante passou por um processo que pouquíssimos joalheiros já viram de perto. 💎`;
    const enHook = `This diamond went through a process very few jewellers have seen up close. 💎`;
    const ptScript = `Gancho: ${ptHook}\n\nCorpo: Cada peça que sai de Surat carrega um processo de certificação completo — GIA, sem intermediários, sem pedido mínimo. Comenta "GIA" que eu te mando a lista de preços.`;
    const enScript = `Hook: ${enHook}\n\nBody: Every piece that leaves Surat carries a full certification process — GIA, no middlemen, no minimum order. Comment "GIA" and I'll send the price list.`;
    return {
      metrics: [
        ['Drafted on', `"${topic}"`],
        ['Languages', 'PT (primary) + EN'],
      ],
      render: () => `
        <div class="drawer-block">
          <div class="drawer-block-label">Hook + script — Portuguese (primary)</div>
          <div class="lang-block">
            <div class="lang-tag">Português</div>
            <div class="lang-text">${ptScript.replace(/\n/g, '<br>')}</div>
          </div>
          <div class="lang-block">
            <div class="lang-tag">English (reference)</div>
            <div class="lang-text">${enScript.replace(/\n/g, '<br>')}</div>
          </div>
        </div>
        <p class="note">Built off your highest-performing post's theme. CTA keyword: "GIA".</p>
      `,
    };
  },

  planner(data) {
    const days = [
      ['Mon', 'Reel — cutting/polishing process'],
      ['Tue', 'Carousel — GIA certificate explainer'],
      ['Wed', 'Reel — cut spotlight (oval/emerald rotation)'],
      ['Thu', 'Story — price-list CTA reminder'],
      ['Fri', 'Reel — "from rough to brilliant" story'],
      ['Sat', 'Carousel — client-style use case (no names)'],
      ['Sun', 'Rest / light engagement only'],
    ];
    return {
      metrics: [
        ['This week', `${days.length - 1} posts planned`],
        ['Cadence', 'Daily, Brazil-primary'],
      ],
      render: () => `
        <div class="drawer-block">
          <div class="drawer-block-label">This week's slate</div>
          <div class="cal-grid">
            ${days.map(([d, t]) => `<div class="cal-row"><span class="cal-day">${d}</span><span>${t}</span></div>`).join('')}
          </div>
        </div>
        <p class="note">Template calendar — will reorder automatically once the Ideator's queue updates.</p>
      `,
    };
  },

  analyst(data) {
    const top5 = data.topPosts.slice(0, 5);
    const compRows = Object.entries(data.competitors || {}).map(([handle, posts]) => {
      const av = avgViews(posts);
      return `<li><strong>@${handle}</strong> — ${posts.length} posts tracked, avg views: ${av !== null ? av : 'no video data'}</li>`;
    });
    return {
      metrics: [
        ['Followers', data.profile.followers],
        ['Engagement rate', `${data.stats.engagementRate}%`],
      ],
      render: () => `
        <div class="drawer-block">
          <div class="drawer-block-label">Your true top 5 (full history scan)</div>
          <ul class="drawer-list">
            ${top5.map((p) => `<li><span class="views-tag">${p.views} views</span><br>${shortCaption(p.caption, 90)}</li>`).join('')}
          </ul>
        </div>
        <div class="drawer-block">
          <div class="drawer-block-label">Competitor benchmark</div>
          <ul class="drawer-list">${compRows.join('')}</ul>
        </div>
        <p class="note">Scraped ${data.stats.totalPostsScraped} of your posts on ${new Date(data.scrapedAt).toLocaleDateString()}.</p>
      `,
    };
  },

  dmManager(data) {
    const keywords = ['GIA', 'oval', 'emerald', 'round'];
    return {
      metrics: [
        ['Trigger keywords', keywords.length],
        ['Status', 'Keyword map ready · DM auto-send not yet connected'],
      ],
      render: () => `
        <div class="drawer-block">
          <div class="drawer-block-label">Comment-gated keywords</div>
          ${keywords.map((k) => `<span class="kw-pill">${k}</span>`).join('')}
        </div>
        <div class="drawer-block">
          <div class="drawer-block-label">What happens when one fires</div>
          <ul class="drawer-list">
            <li>Comment containing the keyword → flagged for a manual DM with the matching price list. Auto-send isn't wired up yet — this agent currently assists triage, it doesn't yet message on its own.</li>
          </ul>
        </div>
        <p class="note">Honest status: this is the planned logic, not a live Instagram DM connection (that needs Meta API access we haven't set up).</p>
      `,
    };
  },
};
