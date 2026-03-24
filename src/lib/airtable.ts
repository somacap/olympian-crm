const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!;
const BASE_ID = "appzO3diTm7xrL9nI";
const OLYMPIANS_TABLE = "tblGQAg5t5OK6nvkh";

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
  latestInteraction: string;
  meetingNotes: string;
}

function parseRecord(rec: Record<string, unknown>): Olympian {
  const f = rec.fields as Record<string, unknown>;
  return {
    id: rec.id as string,
    name: (f["Name"] as string) || "",
    firstName: (f["First name"] as string) || "",
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
    spring26Outreach: (f["Spring26 Outreach"] as string) || "",
    spring26Status: (f["Spring26 Status"] as string) || "",
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
  // Airtable allows max 10 per batch
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
