const AGENT_DEFS = [
  { id: 'ideator', name: 'Ideator', role: 'Scouts content angles', fn: 'ideator' },
  { id: 'hook', name: 'Hook & Script', role: 'Drafts hooks + scripts', fn: 'hookScript' },
  { id: 'planner', name: 'Planner', role: 'Builds the calendar', fn: 'planner' },
  { id: 'analyst', name: 'Analyst', role: 'Tracks real stats', fn: 'analyst' },
  { id: 'dm', name: 'DM Manager', role: 'Triages keyword DMs', fn: 'dmManager' },
];

function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('en-US');
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function renderTicket(data) {
  const top = data.topPosts[0];
  const cells = [
    ['Followers', fmtNum(data.profile.followers), ''],
    ['Total views', fmtNum(data.stats.totalViews), ''],
    ['Engagement', data.stats.engagementRate ?? '—', '%'],
    ['Top post', fmtNum(top ? top.views : null), 'views'],
    ['Posts tracked', fmtNum(data.stats.totalPostsScraped), ''],
  ];
  document.getElementById('statsTicket').innerHTML = cells
    .map(
      ([label, val, unit]) => `
      <div class="ticket-cell">
        <div class="ticket-label">${label}</div>
        <div class="ticket-value">${val}${unit ? `<span class="unit">${unit}</span>` : ''}</div>
      </div>`
    )
    .join('');
}

function renderAgents(data) {
  const grid = document.getElementById('agentsGrid');
  grid.innerHTML = AGENT_DEFS.map((def) => {
    const out = Agents[def.fn](data);
    const metricsHtml = out.metrics
      .map(([l, v]) => `<div><span class="m-label">${l}: </span><span class="m-val">${v}</span></div>`)
      .join('');
    return `
      <div class="agent-card" tabindex="0" data-agent="${def.id}" role="button" aria-haspopup="dialog">
        <div class="agent-top">
          <div>
            <div class="agent-name">${def.name}</div>
            <div class="agent-role">${def.role}</div>
          </div>
          <span class="agent-status"></span>
        </div>
        <div class="agent-metrics">${metricsHtml}</div>
        <div class="agent-cta">View output →</div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.agent-card').forEach((card) => {
    const open = () => openDrawer(card.dataset.agent, data);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });
}

function openDrawer(agentId, data) {
  const def = AGENT_DEFS.find((d) => d.id === agentId);
  const out = Agents[def.fn](data);
  document.getElementById('drawerContent').innerHTML = `
    <h3>${def.name}</h3>
    <div class="drawer-role">${def.role}</div>
    ${out.render()}
  `;
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawerBackdrop').classList.add('open');
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerBackdrop').classList.remove('open');
}

document.getElementById('drawerClose').addEventListener('click', closeDrawer);
document.getElementById('drawerBackdrop').addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDrawer();
});

fetch('./data.json')
  .then((r) => r.json())
  .then((data) => {
    document.getElementById('syncText').textContent = `Synced ${timeAgo(data.scrapedAt)}`;
    renderTicket(data);
    renderAgents(data);
  })
  .catch((err) => {
    document.getElementById('syncText').textContent = 'Could not load data.json';
    console.error(err);
  });
