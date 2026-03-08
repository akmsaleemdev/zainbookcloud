import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USERS_TO_CREATE = [
  { email: "superadmin@zainbook.com", password: "Super@2024", fullName: "Super Admin", orgRole: null, superAdmin: true },
  { email: "orgadmin@zainbook.com", password: "OrgAdmin@2024", fullName: "Org Admin", orgRole: "organization_admin", superAdmin: false },
  { email: "owner@zainbook.com", password: "Owner@2024", fullName: "Property Owner", orgRole: "property_owner", superAdmin: false },
  { email: "manager@zainbook.com", password: "Manager@2024", fullName: "Property Manager", orgRole: "property_manager", superAdmin: false },
  { email: "staff@zainbook.com", password: "Staff@2024", fullName: "Staff Member", orgRole: "staff", superAdmin: false },
  { email: "accountant@zainbook.com", password: "Account@2024", fullName: "Accountant User", orgRole: "accountant", superAdmin: false },
  { email: "maintenance@zainbook.com", password: "Maint@2024", fullName: "Maintenance Staff", orgRole: "maintenance_staff", superAdmin: false },
  { email: "tenant@zainbook.com", password: "Tenant@2024", fullName: "Tenant User", orgRole: "tenant", superAdmin: false },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Use first org as default
    const orgId = "a0000001-0000-0000-0000-000000000001";
    const results: any[] = [];

    for (const u of USERS_TO_CREATE) {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((eu: any) => eu.email === u.email);

      let userId: string;

      if (existing) {
        userId = existing.id;
        results.push({ email: u.email, status: "already_exists", userId });
      } else {
        // Create user with confirmed email
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.fullName },
        });

        if (createError) {
          results.push({ email: u.email, status: "error", error: createError.message });
          continue;
        }
        userId = newUser.user.id;
        results.push({ email: u.email, status: "created", userId });
      }

      // Ensure profile exists
      await supabase.from("profiles").upsert({
        user_id: userId,
        full_name: u.fullName,
      }, { onConflict: "user_id" });

      // Assign super_admin role if needed
      if (u.superAdmin) {
        const { data: hasRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .eq("role", "super_admin")
          .maybeSingle();

        if (!hasRole) {
          await supabase.from("user_roles").insert({
            user_id: userId,
            role: "super_admin",
          });
        }
      }

      // Assign org membership if orgRole specified
      if (u.orgRole) {
        const { data: hasMembership } = await supabase
          .from("organization_members")
          .select("id")
          .eq("user_id", userId)
          .eq("organization_id", orgId)
          .maybeSingle();

        if (!hasMembership) {
          await supabase.from("organization_members").insert({
            user_id: userId,
            organization_id: orgId,
            role: u.orgRole,
            is_active: true,
          });
        } else {
          await supabase.from("organization_members")
            .update({ role: u.orgRole })
            .eq("id", hasMembership.id);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
