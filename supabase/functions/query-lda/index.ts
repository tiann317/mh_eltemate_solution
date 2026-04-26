// Edge function: proxy LDA Legal Data Hub queries using server-side credentials.
// Reads from "LDA" secret, expecting either JSON {client_id, client_secret} or "id:secret".

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function parseLDA(raw: string | undefined): { id: string; secret: string } | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw);
    if (j.client_id && j.client_secret) return { id: j.client_id, secret: j.client_secret };
  } catch { /* not json */ }
  if (raw.includes(":")) {
    const [id, ...rest] = raw.split(":");
    return { id, secret: rest.join(":") };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const raw = Deno.env.get("LDA") ?? '{"client_id":"hack01-0fec5330b1ef9f63","client_secret":"41bbeb1670283fc4a73db8dcf2bc3b5d"}';
    const creds = parseLDA(raw);
    if (!creds) {
      console.warn("LDA secret could not be parsed. Raw preview:", raw?.slice(0, 20));
      return new Response(
        JSON.stringify({
          answer: "",
          sources: [],
          skipped: "LDA credentials not configured.",
          debug: { hasEnv: !!raw, length: raw?.length ?? 0 },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing prompt." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokRes = await fetch("https://online.otto-schmidt.de/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: creds.id,
        client_secret: creds.secret,
      }),
    });
    if (!tokRes.ok) {
      return new Response(JSON.stringify({ error: "LDA token request failed." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const tok = await tokRes.json();
    const token = tok.access_token;
    if (!token) {
      return new Response(JSON.stringify({ error: "No LDA token returned." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const qna = await fetch("https://otto-schmidt.legal-data-hub.com/api/qna", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        data_asset: "Beratermodul Datenschutzrecht",
        mode: "attribution",
        filter: [{}],
        prompt,
      }),
    });
    const d = await qna.json();
    return new Response(
      JSON.stringify({
        answer: d.answer ?? "",
        sources: Array.isArray(d.sourcedocuments) ? d.sourcedocuments : [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("query-lda error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
