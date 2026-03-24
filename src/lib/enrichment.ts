export interface EnrichResult {
  recordId: string;
  name: string;
  step: string;
  status: "pending" | "searching" | "found" | "not_found" | "error";
  email?: string;
  source?: string;
  reasoning?: string;
}

const APOLLO_API_KEY = process.env.APOLLO_API_KEY || "";
const EXA_API_KEY = process.env.EXA_API_KEY || "";

export async function enrichViaApollo(
  name: string,
  linkedin?: string
): Promise<{ email?: string; reasoning: string }> {
  if (!APOLLO_API_KEY) return { reasoning: "Apollo API key not configured" };

  try {
    // Try LinkedIn URL first
    if (linkedin) {
      const res = await fetch("https://api.apollo.io/v1/people/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": APOLLO_API_KEY,
        },
        body: JSON.stringify({ linkedin_url: linkedin }),
      });
      const data = await res.json();
      if (data.person?.email) {
        return {
          email: data.person.email,
          reasoning: `Found via Apollo LinkedIn match: ${linkedin}`,
        };
      }
    }

    // Fallback to name search
    const parts = name.split(" ");
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ");

    const res = await fetch("https://api.apollo.io/v1/people/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": APOLLO_API_KEY,
      },
      body: JSON.stringify({ first_name: firstName, last_name: lastName }),
    });
    const data = await res.json();
    if (data.person?.email) {
      return {
        email: data.person.email,
        reasoning: `Found via Apollo name search: ${firstName} ${lastName}`,
      };
    }
    return { reasoning: `Apollo: no email found for ${name}` };
  } catch (e) {
    return { reasoning: `Apollo error: ${(e as Error).message}` };
  }
}

export async function enrichViaExa(
  name: string,
  linkedin?: string
): Promise<{ email?: string; reasoning: string }> {
  if (!EXA_API_KEY) return { reasoning: "Exa API key not configured" };

  try {
    const query = linkedin
      ? `${name} email contact ${linkedin}`
      : `${name} olympiad email contact`;

    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": EXA_API_KEY,
      },
      body: JSON.stringify({
        query,
        numResults: 5,
        useAutoprompt: true,
        type: "neural",
      }),
    });
    const data = await res.json();

    // Extract emails from results
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    for (const result of data.results || []) {
      const text = `${result.title || ""} ${result.text || ""} ${result.url || ""}`;
      const emails = text.match(emailRegex) || [];
      const validEmails = emails.filter(
        (e: string) => !e.includes("example.com") && !e.includes("noreply")
      );
      if (validEmails.length > 0) {
        return {
          email: validEmails[0],
          reasoning: `Found via Exa search: "${query}" -> ${result.url}`,
        };
      }
    }

    // Try with contents if no emails in snippets
    const resContents = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": EXA_API_KEY,
      },
      body: JSON.stringify({
        query,
        numResults: 3,
        useAutoprompt: true,
        type: "neural",
        contents: { text: { maxCharacters: 2000 } },
      }),
    });
    const dataContents = await resContents.json();

    for (const result of dataContents.results || []) {
      const text = `${result.title || ""} ${result.text || ""}`;
      const emails = text.match(emailRegex) || [];
      const validEmails = emails.filter(
        (e: string) => !e.includes("example.com") && !e.includes("noreply")
      );
      if (validEmails.length > 0) {
        return {
          email: validEmails[0],
          reasoning: `Found via Exa deep search: "${query}" -> ${result.url}`,
        };
      }
    }

    return { reasoning: `Exa: no email found in search results for "${query}"` };
  } catch (e) {
    return { reasoning: `Exa error: ${(e as Error).message}` };
  }
}
