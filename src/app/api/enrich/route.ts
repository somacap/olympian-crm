import { NextResponse } from "next/server";
import { fetchAllOlympians, updateOlympian } from "@/lib/airtable";
import { enrichViaApollo, enrichViaExa } from "@/lib/enrichment";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min for batch enrichment

export async function POST(req: Request) {
  const { ids, pushToAirtable } = await req.json();

  if (!ids?.length) {
    return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
  }

  const allOlympians = await fetchAllOlympians();
  const targets = allOlympians.filter((o) => ids.includes(o.id));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({
        type: "start",
        total: targets.length,
        message: `Starting enrichment for ${targets.length} olympians`,
      });

      let found = 0;
      let notFound = 0;

      for (let i = 0; i < targets.length; i++) {
        const o = targets[i];

        // Skip if already has email
        if (o.email) {
          send({
            type: "skip",
            index: i,
            recordId: o.id,
            name: o.name,
            email: o.email,
            reasoning: "Already has email on file",
          });
          found++;
          continue;
        }

        // Step 1: Apollo
        send({
          type: "progress",
          index: i,
          recordId: o.id,
          name: o.name,
          step: "apollo",
          status: "searching",
          reasoning: `Searching Apollo for ${o.name}${o.linkedin ? ` (LinkedIn: ${o.linkedin})` : ""}...`,
        });

        const apolloResult = await enrichViaApollo(o.name, o.linkedin);

        if (apolloResult.email) {
          send({
            type: "found",
            index: i,
            recordId: o.id,
            name: o.name,
            step: "apollo",
            email: apolloResult.email,
            reasoning: apolloResult.reasoning,
          });

          if (pushToAirtable) {
            await updateOlympian(o.id, { "Personal Email": apolloResult.email });
            send({
              type: "airtable_sync",
              index: i,
              recordId: o.id,
              name: o.name,
              reasoning: `Pushed ${apolloResult.email} to Airtable`,
            });
          }

          found++;
          continue;
        }

        send({
          type: "progress",
          index: i,
          recordId: o.id,
          name: o.name,
          step: "apollo",
          status: "not_found",
          reasoning: apolloResult.reasoning,
        });

        // Step 2: Exa
        send({
          type: "progress",
          index: i,
          recordId: o.id,
          name: o.name,
          step: "exa",
          status: "searching",
          reasoning: `Searching Exa for ${o.name}...`,
        });

        const exaResult = await enrichViaExa(o.name, o.linkedin);

        if (exaResult.email) {
          send({
            type: "found",
            index: i,
            recordId: o.id,
            name: o.name,
            step: "exa",
            email: exaResult.email,
            reasoning: exaResult.reasoning,
          });

          if (pushToAirtable) {
            await updateOlympian(o.id, { "Personal Email": exaResult.email });
            send({
              type: "airtable_sync",
              index: i,
              recordId: o.id,
              name: o.name,
              reasoning: `Pushed ${exaResult.email} to Airtable`,
            });
          }

          found++;
          continue;
        }

        send({
          type: "not_found",
          index: i,
          recordId: o.id,
          name: o.name,
          step: "exa",
          reasoning: exaResult.reasoning,
        });
        notFound++;
      }

      send({
        type: "complete",
        total: targets.length,
        found,
        notFound,
        message: `Enrichment complete: ${found} emails found, ${notFound} not found out of ${targets.length}`,
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
