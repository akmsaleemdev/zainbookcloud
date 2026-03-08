import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are ZainBook AI Support Assistant, an expert in property management for the UAE real estate market.

You help customers with:
- **Sales**: Subscription plans, pricing, features, module comparisons
- **Technical**: System setup, ERP integrations (Oracle NetSuite, SAP, Dynamics 365, Odoo, Zoho), API usage, troubleshooting
- **Billing**: Invoice queries, payment methods, plan upgrades/downgrades, subscription management
- **General**: Property management best practices, UAE real estate regulations, Ejari, RERA compliance

Key behaviors:
1. Automatically classify the user's request category (sales/technical/billing/general)
2. Provide clear, actionable solutions
3. If the issue is complex or requires account access, suggest creating a support ticket
4. Be professional, concise, and helpful
5. Reference UAE-specific regulations when relevant (Ejari, RERA, DLD)
6. For technical issues, ask for specific error messages or steps to reproduce

Available subscription plans: Free Trial (14 days), Starter (AED 199/mo), Professional (AED 499/mo), Enterprise (AED 1,499/mo)

Available modules: Property Management, Tenant Management, Lease Management, Unit Management, Maintenance, Financial Reports, AI Insights, Document Management, Accounting Sync, ERP Integration, CRM, Support System`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Support chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
