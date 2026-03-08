import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Default Test Organization ───
const DEFAULT_ORG = {
  id: "a0000001-0000-0000-0000-000000000001",
  name: "ZainBook Demo Organization",
  name_ar: "شركة زين بوك التجريبية",
  emirate: "Dubai",
  country: "UAE",
  currency: "AED",
  timezone: "Asia/Dubai",
  email: "info@zainbook.com",
  phone: "+971501234567",
};

// ─── Test Users ───
const USERS_TO_CREATE = [
  // Master Admin (super_admin)
  {
    email: "masteradmin@zainbook.com",
    password: "Master@2024",
    fullName: "Master Admin",
    fullNameAr: "المدير الرئيسي",
    orgRole: null,
    superAdmin: true,
  },
  // Organization Admin
  {
    email: "orgadmin@zainbook.com",
    password: "OrgAdmin@2024",
    fullName: "Organization Admin",
    fullNameAr: "مدير المنظمة",
    orgRole: "organization_admin",
    superAdmin: false,
  },
  // Manager (property_manager)
  {
    email: "manager@zainbook.com",
    password: "Manager@2024",
    fullName: "Property Manager",
    fullNameAr: "مدير العقارات",
    orgRole: "property_manager",
    superAdmin: false,
  },
  // Accountant
  {
    email: "accountant@zainbook.com",
    password: "Account@2024",
    fullName: "Accountant User",
    fullNameAr: "المحاسب",
    orgRole: "accountant",
    superAdmin: false,
  },
  // Staff
  {
    email: "staff@zainbook.com",
    password: "Staff@2024",
    fullName: "Staff Member",
    fullNameAr: "موظف",
    orgRole: "staff",
    superAdmin: false,
  },
  // Tenant
  {
    email: "tenant@zainbook.com",
    password: "Tenant@2024",
    fullName: "Tenant User",
    fullNameAr: "المستأجر",
    orgRole: "tenant",
    superAdmin: false,
  },
  // Property Owner
  {
    email: "owner@zainbook.com",
    password: "Owner@2024",
    fullName: "Property Owner",
    fullNameAr: "مالك العقار",
    orgRole: "property_owner",
    superAdmin: false,
  },
  // Maintenance Staff
  {
    email: "maintenance@zainbook.com",
    password: "Maint@2024",
    fullName: "Maintenance Staff",
    fullNameAr: "فريق الصيانة",
    orgRole: "maintenance_staff",
    superAdmin: false,
  },
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

    const results: any[] = [];

    // ─── 1. Ensure default organization exists ───
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", DEFAULT_ORG.id)
      .maybeSingle();

    if (!existingOrg) {
      const { error: orgError } = await supabase.from("organizations").insert({
        id: DEFAULT_ORG.id,
        name: DEFAULT_ORG.name,
        name_ar: DEFAULT_ORG.name_ar,
        emirate: DEFAULT_ORG.emirate,
        country: DEFAULT_ORG.country,
        currency: DEFAULT_ORG.currency,
        timezone: DEFAULT_ORG.timezone,
        email: DEFAULT_ORG.email,
        phone: DEFAULT_ORG.phone,
      });
      if (orgError) {
        results.push({ step: "create_org", status: "error", error: orgError.message });
      } else {
        results.push({ step: "create_org", status: "created", orgId: DEFAULT_ORG.id });
      }
    } else {
      results.push({ step: "create_org", status: "already_exists", orgId: DEFAULT_ORG.id });
    }

    // ─── 2. Create users ───
    for (const u of USERS_TO_CREATE) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((eu: any) => eu.email === u.email);

      let userId: string;

      if (existing) {
        userId = existing.id;
        results.push({ email: u.email, role: u.orgRole || "super_admin", status: "already_exists", userId });
      } else {
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
        results.push({ email: u.email, role: u.orgRole || "super_admin", status: "created", userId });
      }

      // Ensure profile exists
      await supabase.from("profiles").upsert(
        { user_id: userId, full_name: u.fullName },
        { onConflict: "user_id" }
      );

      // Assign super_admin role if needed
      if (u.superAdmin) {
        const { data: hasRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .eq("role", "super_admin")
          .maybeSingle();

        if (!hasRole) {
          await supabase.from("user_roles").insert({ user_id: userId, role: "super_admin" });
        }
      }

      // Assign org membership if orgRole specified
      if (u.orgRole) {
        const { data: hasMembership } = await supabase
          .from("organization_members")
          .select("id")
          .eq("user_id", userId)
          .eq("organization_id", DEFAULT_ORG.id)
          .maybeSingle();

        if (!hasMembership) {
          await supabase.from("organization_members").insert({
            user_id: userId,
            organization_id: DEFAULT_ORG.id,
            role: u.orgRole,
            is_active: true,
          });
        } else {
          await supabase
            .from("organization_members")
            .update({ role: u.orgRole })
            .eq("id", hasMembership.id);
        }
      }
    }

    // ─── 3. Summary table ───
    const summary = USERS_TO_CREATE.map((u) => ({
      email: u.email,
      password: u.password,
      role: u.superAdmin ? "super_admin (Master Admin)" : u.orgRole,
      name: u.fullName,
    }));

    return new Response(
      JSON.stringify({ success: true, organization: DEFAULT_ORG, results, loginCredentials: summary }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
