// Escalation endpoint: assigns staff to an incident (or pre-intake),
// writes an audit entry, and attempts an email notification.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  source: "pre_intake" | "incident";
  pre_intake_id?: string;
  incident_id?: string;
  staff_id: string;
  reason?: string;
  reporter_name?: string;
  reporter_email?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body.staff_id || !body.source) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: staff, error: sErr } = await supabase
      .from("staff_members")
      .select("id, name, email, role")
      .eq("id", body.staff_id)
      .maybeSingle();
    if (sErr || !staff) {
      return new Response(JSON.stringify({ error: "staff not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let incidentId = body.incident_id ?? null;

    // If only a pre-intake, mark escalated and stash responsible staff.
    if (body.source === "pre_intake" && body.pre_intake_id) {
      await supabase.from("pre_intakes").update({
        escalated: true,
        escalated_to_staff_id: staff.id,
        responsible_staff_id: staff.id,
      }).eq("id", body.pre_intake_id);
    }

    if (incidentId) {
      await supabase.from("incidents").update({
        responsible_staff_id: staff.id,
        responsible_staff_name: staff.name,
        responsible_staff_email: staff.email,
      }).eq("id", incidentId);

      await supabase.from("incident_roles").insert([{
        incident_id: incidentId,
        staff_id: staff.id,
        staff_name: staff.name,
        staff_email: staff.email,
        role: "allocated_responder",
      }]);

      await supabase.from("audit_logs").insert([{
        incident_id: incidentId,
        message: `Escalated to ${staff.name}${body.reason ? ` — ${body.reason}` : ""}`,
      }]);
    }

    // Best-effort email notification via Lovable transactional emails.
    let emailStatus: "sent" | "skipped" | "error" = "skipped";
    let emailDetail: string | undefined;
    if (staff.email) {
      try {
        const idemKey = `escalate-${body.source}-${body.pre_intake_id ?? incidentId ?? Date.now()}-${staff.id}`;
        const subject = `Incident escalated to you${body.reporter_name ? ` by ${body.reporter_name}` : ""}`;
        const lines = [
          `Hello ${staff.name},`,
          ``,
          `An incident report has been escalated to you as the responsible person.`,
          body.reporter_name ? `Reporter: ${body.reporter_name}${body.reporter_email ? ` (${body.reporter_email})` : ""}` : "",
          body.reason ? `Reason: ${body.reason}` : "",
          incidentId ? `Incident ID: ${incidentId}` : `Pre-intake ID: ${body.pre_intake_id ?? "(unknown)"}`,
          ``,
          `Please log in to the Aegis Notice dashboard to review.`,
        ].filter(Boolean);

        const { error: invokeErr } = await supabase.functions.invoke(
          "send-transactional-email",
          {
            body: {
              templateName: "escalation-notice",
              recipientEmail: staff.email,
              idempotencyKey: idemKey,
              templateData: {
                staffName: staff.name,
                reporterName: body.reporter_name ?? "",
                reporterEmail: body.reporter_email ?? "",
                reason: body.reason ?? "",
                incidentId: incidentId ?? "",
                preIntakeId: body.pre_intake_id ?? "",
                bodyText: lines.join("\n"),
                subject,
              },
            },
          },
        );
        if (invokeErr) {
          emailStatus = "error";
          emailDetail = invokeErr.message;
        } else {
          emailStatus = "sent";
        }
      } catch (e) {
        emailStatus = "error";
        emailDetail = e instanceof Error ? e.message : String(e);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        staff_name: staff.name,
        staff_email: staff.email,
        email_status: emailStatus,
        email_detail: emailDetail,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
