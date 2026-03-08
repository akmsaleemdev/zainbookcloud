export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      amenities: {
        Row: {
          billing_frequency: string | null
          category: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_paid: boolean | null
          name: string
          name_ar: string | null
          organization_id: string
          price: number | null
          property_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          billing_frequency?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_paid?: boolean | null
          name: string
          name_ar?: string | null
          organization_id: string
          price?: number | null
          property_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          billing_frequency?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_paid?: boolean | null
          name?: string
          name_ar?: string | null
          organization_id?: string
          price?: number | null
          property_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amenities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          organization_id: string | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bed_spaces: {
        Row: {
          bed_number: string
          bed_type: string | null
          created_at: string
          id: string
          monthly_rent: number | null
          room_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          bed_number: string
          bed_type?: string | null
          created_at?: string
          id?: string
          monthly_rent?: number | null
          room_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          bed_number?: string
          bed_type?: string | null
          created_at?: string
          id?: string
          monthly_rent?: number | null
          room_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bed_spaces_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          created_at: string
          floors_count: number | null
          id: string
          is_active: boolean | null
          name: string
          property_id: string
          updated_at: string
          year_built: number | null
        }
        Insert: {
          created_at?: string
          floors_count?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          property_id: string
          updated_at?: string
          year_built?: number | null
        }
        Update: {
          created_at?: string
          floors_count?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          property_id?: string
          updated_at?: string
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buildings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ejari_contracts: {
        Row: {
          annual_rent: number
          contract_number: string | null
          contract_type: string | null
          created_at: string
          ejari_number: string
          end_date: string
          expiry_date: string | null
          id: string
          lease_id: string | null
          notes: string | null
          organization_id: string
          payment_method: string | null
          property_name: string | null
          registration_date: string | null
          security_deposit: number | null
          start_date: string
          status: string | null
          tenant_id: string
          unit_number: string | null
          updated_at: string
        }
        Insert: {
          annual_rent: number
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string
          ejari_number: string
          end_date: string
          expiry_date?: string | null
          id?: string
          lease_id?: string | null
          notes?: string | null
          organization_id: string
          payment_method?: string | null
          property_name?: string | null
          registration_date?: string | null
          security_deposit?: number | null
          start_date: string
          status?: string | null
          tenant_id: string
          unit_number?: string | null
          updated_at?: string
        }
        Update: {
          annual_rent?: number
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string
          ejari_number?: string
          end_date?: string
          expiry_date?: string | null
          id?: string
          lease_id?: string | null
          notes?: string | null
          organization_id?: string
          payment_method?: string | null
          property_name?: string | null
          registration_date?: string | null
          security_deposit?: number | null
          start_date?: string
          status?: string | null
          tenant_id?: string
          unit_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ejari_contracts_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ejari_contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ejari_contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          due_date: string
          id: string
          invoice_number: string
          lease_id: string | null
          organization_id: string
          status: string | null
          tenant_id: string
          total_amount: number
          updated_at: string
          vat_amount: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          invoice_number: string
          lease_id?: string | null
          organization_id: string
          status?: string | null
          tenant_id: string
          total_amount: number
          updated_at?: string
          vat_amount?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          lease_id?: string | null
          organization_id?: string
          status?: string | null
          tenant_id?: string
          total_amount?: number
          updated_at?: string
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          bed_space_id: string | null
          created_at: string
          ejari_number: string | null
          end_date: string
          id: string
          lease_type: string | null
          monthly_rent: number
          organization_id: string
          payment_frequency: string | null
          room_id: string | null
          security_deposit: number | null
          start_date: string
          status: string | null
          tenant_id: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          bed_space_id?: string | null
          created_at?: string
          ejari_number?: string | null
          end_date: string
          id?: string
          lease_type?: string | null
          monthly_rent: number
          organization_id: string
          payment_frequency?: string | null
          room_id?: string | null
          security_deposit?: number | null
          start_date: string
          status?: string | null
          tenant_id: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          bed_space_id?: string | null
          created_at?: string
          ejari_number?: string | null
          end_date?: string
          id?: string
          lease_type?: string | null
          monthly_rent?: number
          organization_id?: string
          payment_frequency?: string | null
          room_id?: string | null
          security_deposit?: number | null
          start_date?: string
          status?: string | null
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_bed_space_id_fkey"
            columns: ["bed_space_id"]
            isOneToOne: false
            referencedRelation: "bed_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          organization_id: string
          priority: string | null
          reported_by: string | null
          room_id: string | null
          status: string | null
          title: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          organization_id: string
          priority?: string | null
          reported_by?: string | null
          room_id?: string | null
          status?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          organization_id?: string
          priority?: string | null
          reported_by?: string | null
          room_id?: string | null
          status?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          email: string | null
          emirate: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          name_ar: string | null
          phone: string | null
          trade_license: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          emirate?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          name_ar?: string | null
          phone?: string | null
          trade_license?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          emirate?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          name_ar?: string | null
          phone?: string | null
          trade_license?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          organization_id: string
          payment_date: string
          payment_method: string | null
          reference_number: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          organization_id: string
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          organization_id?: string
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          emirates_id: string | null
          full_name: string | null
          id: string
          nationality: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          emirates_id?: string | null
          full_name?: string | null
          id?: string
          nationality?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          emirates_id?: string | null
          full_name?: string | null
          id?: string
          nationality?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          area: string | null
          city: string | null
          community: string | null
          created_at: string
          emirate: string
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          name_ar: string | null
          organization_id: string
          property_type: string
          total_units: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          area?: string | null
          city?: string | null
          community?: string | null
          created_at?: string
          emirate: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          name_ar?: string | null
          organization_id: string
          property_type?: string
          total_units?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          area?: string | null
          city?: string | null
          community?: string | null
          created_at?: string
          emirate?: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          name_ar?: string | null
          organization_id?: string
          property_type?: string
          total_units?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          furnishing: string | null
          id: string
          max_occupancy: number | null
          monthly_rent: number | null
          room_number: string
          room_type: string | null
          status: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          furnishing?: string | null
          id?: string
          max_occupancy?: number | null
          monthly_rent?: number | null
          room_number: string
          room_type?: string | null
          status?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          furnishing?: string | null
          id?: string
          max_occupancy?: number | null
          monthly_rent?: number | null
          room_number?: string
          room_type?: string | null
          status?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          email: string | null
          emergency_contact: string | null
          emirates_id: string | null
          employer: string | null
          full_name: string
          id: string
          nationality: string | null
          occupation: string | null
          organization_id: string
          passport_number: string | null
          phone: string | null
          status: string | null
          updated_at: string
          user_id: string | null
          visa_expiry: string | null
          visa_number: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          emirates_id?: string | null
          employer?: string | null
          full_name: string
          id?: string
          nationality?: string | null
          occupation?: string | null
          organization_id: string
          passport_number?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          visa_expiry?: string | null
          visa_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          emirates_id?: string | null
          employer?: string | null
          full_name?: string
          id?: string
          nationality?: string | null
          occupation?: string | null
          organization_id?: string
          passport_number?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          visa_expiry?: string | null
          visa_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          area_sqft: number | null
          bathrooms: number | null
          bedrooms: number | null
          building_id: string
          created_at: string
          floor_number: number | null
          id: string
          monthly_rent: number | null
          status: string | null
          unit_number: string
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_id: string
          created_at?: string
          floor_number?: number | null
          id?: string
          monthly_rent?: number | null
          status?: string | null
          unit_number: string
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_id?: string
          created_at?: string
          floor_number?: number | null
          id?: string
          monthly_rent?: number | null
          status?: string | null
          unit_number?: string
          unit_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      utility_meters: {
        Row: {
          account_number: string | null
          created_at: string
          id: string
          meter_number: string
          organization_id: string
          property_id: string | null
          provider: string | null
          status: string | null
          unit_id: string | null
          updated_at: string
          utility_type: string
        }
        Insert: {
          account_number?: string | null
          created_at?: string
          id?: string
          meter_number: string
          organization_id: string
          property_id?: string | null
          provider?: string | null
          status?: string | null
          unit_id?: string | null
          updated_at?: string
          utility_type?: string
        }
        Update: {
          account_number?: string | null
          created_at?: string
          id?: string
          meter_number?: string
          organization_id?: string
          property_id?: string | null
          provider?: string | null
          status?: string | null
          unit_id?: string | null
          updated_at?: string
          utility_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "utility_meters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_readings: {
        Row: {
          amount: number | null
          consumption: number | null
          created_at: string
          id: string
          meter_id: string
          notes: string | null
          reading_date: string
          reading_value: number
        }
        Insert: {
          amount?: number | null
          consumption?: number | null
          created_at?: string
          id?: string
          meter_id: string
          notes?: string | null
          reading_date?: string
          reading_value: number
        }
        Update: {
          amount?: number | null
          consumption?: number | null
          created_at?: string
          id?: string
          meter_id?: string
          notes?: string | null
          reading_date?: string
          reading_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "utility_readings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "utility_meters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "organization_admin"
        | "property_owner"
        | "property_manager"
        | "staff"
        | "accountant"
        | "maintenance_staff"
        | "tenant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "organization_admin",
        "property_owner",
        "property_manager",
        "staff",
        "accountant",
        "maintenance_staff",
        "tenant",
      ],
    },
  },
} as const
