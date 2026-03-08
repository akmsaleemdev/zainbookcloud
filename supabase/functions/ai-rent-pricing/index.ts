import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { property_type, emirate, area_sqft, bedrooms, furnishing, community } = await req.json();

    // Query existing leases for comparable pricing
    const { data: leases } = await supabaseClient
      .from("leases")
      .select("monthly_rent, units(area_sqft, bedrooms, unit_type, buildings(properties(emirate, property_type, community)))")
      .eq("status", "active")
      .limit(200);

    // Filter comparable leases
    const comparables = (leases || []).filter((l: any) => {
      const prop = l.units?.buildings?.properties;
      if (!prop) return false;
      const sameEmirate = !emirate || prop.emirate === emirate;
      const sameType = !property_type || prop.property_type === property_type;
      return sameEmirate || sameType;
    });

    // Calculate statistics
    const rents = comparables.map((l: any) => l.monthly_rent).filter(Boolean);
    const avgRent = rents.length > 0 ? rents.reduce((a: number, b: number) => a + b, 0) / rents.length : 0;
    const minRent = rents.length > 0 ? Math.min(...rents) : 0;
    const maxRent = rents.length > 0 ? Math.max(...rents) : 0;

    // Estimate based on area if provided
    let estimatedRent = avgRent;
    if (area_sqft && rents.length > 0) {
      const areas = comparables
        .map((l: any) => ({ rent: l.monthly_rent, sqft: l.units?.area_sqft }))
        .filter((x: any) => x.sqft > 0);

      if (areas.length > 0) {
        const avgPricePerSqft = areas.reduce((sum: number, x: any) => sum + x.rent / x.sqft, 0) / areas.length;
        estimatedRent = Math.round(avgPricePerSqft * area_sqft);
      }
    }

    // Adjustments
    let adjustmentFactor = 1.0;
    if (furnishing === "furnished") adjustmentFactor += 0.15;
    if (furnishing === "semi-furnished") adjustmentFactor += 0.07;
    if (bedrooms && bedrooms >= 3) adjustmentFactor += 0.05;

    const suggestedRent = Math.round(estimatedRent * adjustmentFactor);
    const lowRange = Math.round(suggestedRent * 0.9);
    const highRange = Math.round(suggestedRent * 1.1);

    // AI-powered insights using Google AI Studio
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    let aiInsight = "";

    if (GOOGLE_API_KEY && suggestedRent > 0) {
      try {
        const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GOOGLE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: "You are a UAE real estate expert. Give a brief 2-3 sentence rental pricing insight. Be concise and data-driven."
              },
              {
                role: "user",
                content: `Property: ${property_type || "residential"} in ${emirate || "Dubai"}, ${area_sqft || "N/A"} sqft, ${bedrooms || "N/A"} bedrooms, ${furnishing || "unfurnished"}, community: ${community || "N/A"}. Based on ${rents.length} comparable leases, avg rent is AED ${avgRent.toFixed(0)}/mo (range: ${minRent}-${maxRent}). Suggested: AED ${suggestedRent}/mo. Give a brief market insight.`
              }
            ],
            max_tokens: 150,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiInsight = aiData.choices?.[0]?.message?.content || "";
        }
      } catch (e) {
        console.error("AI insight error:", e);
      }
    }

    return new Response(JSON.stringify({
      suggested_rent: suggestedRent,
      low_range: lowRange,
      high_range: highRange,
      avg_comparable_rent: Math.round(avgRent),
      min_comparable_rent: minRent,
      max_comparable_rent: maxRent,
      comparable_count: rents.length,
      adjustment_factor: adjustmentFactor,
      ai_insight: aiInsight,
      parameters: { property_type, emirate, area_sqft, bedrooms, furnishing, community },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
