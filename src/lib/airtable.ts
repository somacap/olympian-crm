const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!;
const BASE_ID = "appzO3diTm7xrL9nI";
const OLYMPIANS_TABLE = "tblGQAg5t5OK6nvkh";

const DEFAULT_TEMPLATE = (firstName: string) =>
  `Hi ${firstName},

Congrats with a super impressive background. Love to hang and get to know you and see what you're thinking about and building

We also recognize your exceptional talent and wanted to invite you to apply to somafellows.com where superhumans early in their careers come together to scheme and build. Get SF or NY office space and up to 2m uncapped, the deal varies based on where you're at in your journey and what you need...Here are a few notes on us below!

best, aneel

- Early investors in +40 "unicorns" like OpenAI, Anthropic, Ramp (32b), Deel (20b), Rippling (20b), Kalshi (20b), Cognition (15b), Mercor (10b), Etched (5b), etc
- The Ranadive's built multi billion dollar co's like Tibco (4b exit) and often host presidents and Fortune 500 CEOs (tim cook, satya, sundar, zuckerberg, jensen, etc all close friends)
- We own an NBA basketball team, the Sacramento Kings and host floor seats to games
- As Indians we organize CEO trips to India w/ presidents & Modi`;

const DEFAULT_TEMPLATE_HTML = (firstName: string) =>
  `Hi ${firstName},<br><br>Congrats with a super impressive background. Love to hang and get to know you and see what you're thinking about and building<br><br>We also recognize your exceptional talent and wanted to invite you to apply to <a href="http://somafellows.com">somafellows.com</a> where superhumans early in their careers come together to scheme and build. Get SF or NY office space and up to 2m uncapped, the deal varies based on where you're at in your journey and what you need...Here are a few notes on us below!<br><br>best, aneel<br><br>- Early investors in +40 "unicorns" like OpenAI, Anthropic, Ramp (32b), Deel (20b), Rippling (20b), Kalshi (20b), Cognition (15b), Mercor (10b), Etched (5b), etc<br>- The Ranadive's built multi billion dollar co's like Tibco (4b exit) and often host <a href="https://fortune.com/2025/09/05/trump-tech-dinner-full-attendee-list/">presidents and Fortune 500 CEOs</a> (tim cook, satya, sundar, zuckerberg, jensen, etc all close friends)<br>- We own an <a href="https://finance.yahoo.com/news/vivek-ranadive-snatched-major-league-124552500.html">NBA basketball team, the Sacramento Kings</a> and host floor seats to games<br>- As Indians we <a href="https://fortune.com/2015/02/27/sacramento-kings-chairman-vivek-ranadive-my-trip-to-india-with-obama/">organize CEO trips to India w/ presidents & Modi</a>`;

export { DEFAULT_TEMPLATE_HTML };

export interface Olympian {
  id: string;
  name: string;
  firstName: string;
  email: string;
  linkedin: string;
  country: string;
  university: string;
  year: number;
  source: string;
  city: string;
  readyToSend: boolean;
  w26Outreach: string;
  w26Status: string;
  spring26Outreach: string;
  spring26Status: string;
  spring26Body: string;
  spring26BodyHtml: string;
  latestInteraction: string;
  meetingNotes: string;
}

function parseRecord(rec: Record<string, unknown>): Olympian {
  const f = rec.fields as Record<string, unknown>;
  const spring26Outreach = (f["Spring26 Outreach"] as string) || "";
  const firstName = (f["First name"] as string) || (f["Name"] as string || "").split(" ")[0] || "";
  return {
    id: rec.id as string,
    name: (f["Name"] as string) || "",
    firstName,
    email: (f["Personal Email"] as string) || "",
    linkedin: (f["LinkedIn"] as string) || "",
    country: (f["Country"] as string) || "",
    university: (f["University"] as string) || "",
    year: (f["Year"] as number) || 0,
    source: (f["Source"] as string) || "",
    city: (f["City"] as string) || "",
    readyToSend: (f["Ready to send"] as boolean) || false,
    w26Outreach: (f["W26 Outreach"] as string) || "",
    w26Status: (f["W26 Status"] as string) || "",
    spring26Outreach,
    spring26Status: (f["Spring26 Status"] as string) || "",
    spring26Body: spring26Outreach || DEFAULT_TEMPLATE(firstName),
    spring26BodyHtml: spring26Outreach || DEFAULT_TEMPLATE_HTML(firstName),
    latestInteraction: (f["Latest Interaction"] as string) || "",
    meetingNotes: (f["Meeting Notes"] as string) || "",
  };
}

export async function fetchAllOlympians(): Promise<Olympian[]> {
  const all: Olympian[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);

    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${OLYMPIANS_TABLE}?${params}`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
        next: { revalidate: 60 },
      }
    );
    const data = await res.json();
    for (const rec of data.records || []) {
      all.push(parseRecord(rec));
    }
    offset = data.offset;
  } while (offset);

  return all;
}

export async function updateOlympian(
  recordId: string,
  fields: Record<string, unknown>
): Promise<void> {
  await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${OLYMPIANS_TABLE}/${recordId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    }
  );
}

export async function batchUpdateOlympians(
  updates: { id: string; fields: Record<string, unknown> }[]
): Promise<void> {
  for (let i = 0; i < updates.length; i += 10) {
    const batch = updates.slice(i, i + 10);
    await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${OLYMPIANS_TABLE}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: batch }),
      }
    );
  }
}
