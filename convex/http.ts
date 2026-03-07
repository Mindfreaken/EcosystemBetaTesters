import { httpRouter } from "convex/server";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Riot LoL: ingest a match by matchId
http.route({
  path: "/riot/ingest",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const matchId = url.searchParams.get("matchId");
    if (!matchId) {
      return new Response(JSON.stringify({ error: "Missing matchId" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    try {
      const result = await ctx.runAction(api.riot.league.ingest.ingestMatchById, { matchId });
      return new Response(JSON.stringify({ ok: true, result }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  }),
});

// Riot LoL: get stored bundle for a matchId
http.route({
  path: "/riot/bundle",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const matchId = url.searchParams.get("matchId");
    if (!matchId) {
      return new Response(JSON.stringify({ error: "Missing matchId" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const bundle = await ctx.runQuery(api.riot.league.matches.getMatchBundle, { matchId });
    return new Response(JSON.stringify(bundle), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }),
});

// Schedules bulk upload
http.route({
  path: "/schedules/upload",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      if (!body || !Array.isArray(body.entries)) {
        return new Response(JSON.stringify({ ok: false, error: "entries[] required" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      const replace = Boolean(body.replace);
      const inserted = await ctx.runMutation(api.dailies.nerdle.schedules.upsertMany, {
        entries: body.entries,
        replace,
      });
      return new Response(JSON.stringify({ ok: true, inserted }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  }),
});

export default http;