# Content Agent — Crystra Diam

## Who I am
- Business: Crystra Diam — natural diamond manufacturing & supply, based in Surat, Gujarat, India.
- What we sell: GIA/IGI certified loose natural diamonds, direct to jewellers.
- Model: No middlemen, no minimum order quantity (MOQ), USDT-only advance payment.
- Instagram handle: @crystara.diam

## Markets
- Primary: Brazil
- Secondary: Indonesia
- Expansion targets: Portugal, Spain, Colombia, Argentina, wider Europe

## Competitors (tracked for benchmarking)
- @yashwantsakhiya
- @jkgems.in
- @udhrashexport

## Voice & content rules
- Brazil-market content is Portuguese-primary, not bilingual in the caption itself —
  but any Portuguese content shown to Shiv must come with an English translation alongside it.
- Casual, WhatsApp-native tone in outreach — not corporate or formal.
- No hashtags. Trade keywords (e.g. "GIA", "oval") go directly in the caption body text,
  not as hashtags — hashtags have been tested and confirmed ineffective for this account.
- Comment-gated CTA pattern: caption invites a keyword comment (e.g. "GIA" or "oval") which
  triggers a DM with the price list.
- Trust signals to lead with: GIA certification, direct-from-Surat sourcing, no intermediaries,
  no MOQ, natural-only diamonds (never lab-grown).
- Never use real client names/details as trust references in public content — privacy constraint.

## The 5 agents this project runs
1. **Ideator (Scout)** — pulls fresh content angles from own + competitor post performance.
2. **Hook & Script writer** — drafts Reel hooks/scripts in Shiv's voice (Portuguese-primary
   for Brazil, with English translation attached).
3. **Planner** — lays out a daily/weekly content calendar from the Ideator's backlog.
4. **Analyst** — tracks real Instagram stats (followers, views, engagement) over time and
   ranks all-time top posts.
5. **DM Manager** — assists with incoming DM triage (keyword-triggered price list sends,
   objection handling drafts).

## Data sources
- Instagram data pulled via Apify's `instagram-scraper` actor (resultsType: posts),
  NOT `instagram-profile-scraper`'s latestPosts field (that only returns recent posts
  and misjudges true top-performing content).
- Own account: full post history pull.
- Competitor accounts: recent posts pull (benchmarking only).

## Output locations
- Raw + ranked data: `dashboard/data.json`
- Dashboard: `dashboard/index.html` (local server, deployable later)
- Digest delivery: Telegram bot, sent on a schedule (Windows Task Scheduler)
