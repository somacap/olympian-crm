# Airtable Send Automation Runbook

## Overview
Set up an Airtable Automation that sends emails when Spring26 Status = "Queued", then updates status to "Sent".

## Prerequisites
- Gmail or SendGrid connected to Airtable (Integrations > Connected accounts)
- Spring26 Outreach + Spring26 Status fields exist (already created)

## Step-by-step

### 1. Create the Automation
1. Open Airtable base
2. Go to **Automations** tab (top bar)
3. Click **Create automation**
4. Name it: `Spring26 Fellows - Send Email`

### 2. Set the Trigger
1. Choose: **When record matches conditions**
2. Table: Olympians
3. Conditions:
   - `Spring26 Status` **is** `Queued`
   - `Personal Email` **is not empty**
   - `Send Email` **is** checked (optional safety gate)

> The "Send Email" checkbox is a manual safety latch. Queue people via CRM, then batch-check "Send Email" in Airtable when ready to actually fire.

### 3. Add Action: Send Email
1. **Add action** > **Send email** (Gmail)
2. Configure:
   - **To:** `{Personal Email}`
   - **From:** your connected Gmail (e.g. aneel@somacap.com)
   - **Subject:** `Quick note`
   - **Body:** Use template below with `{First name}` and `{Source}` fields

### 4. Email Template

```
Congrats on a super impressive background. {Source} is exactly the kind of talent we love meeting. Love to hang and get to know you and see what you're thinking about these days, connect you w/ other world class founders and send some fun invites!

We own an NBA team the Sacramento Kings and host many fun events at sports games and dinners. We also thought you could be a candidate for Soma Fellows (https://programs.somacap.com/fellows) which gives up to 2m uncapped if you build something, or we can help shortcut your path to joining a generational tech co we invested in like OpenAI, Anthropic, Ramp, Cognition etc.

The next Fellows deadline is April 1 so wanted to make sure this was on your radar.

Thanks for taking a quick look. Hope for the great pleasure to meet you and hang soon! 650-714-6220 and of course feel free to share this w/ any friends you'd recommend
```

### 5. Add Action: Update Record
1. **Add action** > **Update record**
2. Same table, triggering record
3. Set `Spring26 Status` to `Sent`

### 6. Test
1. Pick one test record
2. Set Spring26 Outreach = "Spring26 Fellows", Spring26 Status = "Queued"
3. Check "Send Email"
4. Watch automation fire (check Run History)
5. Verify email received + status = "Sent"

### 7. Go Live
1. Turn on the automation
2. Queue target audience via CRM or Airtable
3. Batch-check "Send Email" for those you want to send
4. Automation fires, sends, updates status

## Rate Limits
- Airtable automations: 25,000 runs/month (Pro)
- Gmail: ~500/day (personal) or 2,000/day (Workspace)
- Stagger if >100 at once

## Sync with CRM
CRM reads Spring26 Status from Airtable directly. Once automation sets "Sent", the CRM campaigns page reflects it. No extra sync needed.

## Fallback
If automation breaks:
1. Filter Airtable to Spring26 Status = "Queued"
2. Export CSV
3. Mail merge (GMass, Mailmeteor, etc.)
4. Manually update status to "Sent"
