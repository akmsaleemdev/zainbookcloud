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
      access_cards: {
        Row: {
          card_number: string
          card_type: string | null
          created_at: string
          deposit_amount: number | null
          expiry_date: string | null
          id: string
          issued_date: string | null
          notes: string | null
          property_id: string
          status: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          card_number: string
          card_type?: string | null
          created_at?: string
          deposit_amount?: number | null
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          notes?: string | null
          property_id: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          card_number?: string
          card_type?: string | null
          created_at?: string
          deposit_amount?: number | null
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          notes?: string | null
          property_id?: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_cards_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_cards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_sessions: {
        Row: {
          category: string | null
          created_at: string
          escalated_ticket_id: string | null
          id: string
          organization_id: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          escalated_ticket_id?: string | null
          id?: string
          organization_id?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          escalated_ticket_id?: string | null
          id?: string
          organization_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_sessions_escalated_ticket_id_fkey"
            columns: ["escalated_ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chat_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
      attendance_logs: {
        Row: {
          attendance_date: string
          check_in_location: Json | null
          check_in_method: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          employee_id: string
          id: string
          is_early_leave: boolean | null
          is_late: boolean | null
          late_minutes: number | null
          notes: string | null
          organization_id: string
          overtime_hours: number | null
          scheduled_end: string | null
          scheduled_start: string | null
          shift_name: string | null
          status: string
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          attendance_date?: string
          check_in_location?: Json | null
          check_in_method?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          employee_id: string
          id?: string
          is_early_leave?: boolean | null
          is_late?: boolean | null
          late_minutes?: number | null
          notes?: string | null
          organization_id: string
          overtime_hours?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          shift_name?: string | null
          status?: string
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          check_in_location?: Json | null
          check_in_method?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          is_early_leave?: boolean | null
          is_late?: boolean | null
          late_minutes?: number | null
          notes?: string | null
          organization_id?: string
          overtime_hours?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          shift_name?: string | null
          status?: string
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      automation_rules: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          organization_id: string
          run_count: number | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          action_config?: Json | null
          action_type?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          organization_id: string
          run_count?: number | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          organization_id?: string
          run_count?: number | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          account_id: string | null
          balance: number | null
          bank_name: string | null
          created_at: string
          credit: number | null
          debit: number | null
          description: string | null
          id: string
          is_reconciled: boolean | null
          notes: string | null
          organization_id: string
          reconciled_at: string | null
          reconciled_with: string | null
          reference: string | null
          source: string | null
          transaction_date: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          balance?: number | null
          bank_name?: string | null
          created_at?: string
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          is_reconciled?: boolean | null
          notes?: string | null
          organization_id: string
          reconciled_at?: string | null
          reconciled_with?: string | null
          reference?: string | null
          source?: string | null
          transaction_date: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          balance?: number | null
          bank_name?: string | null
          created_at?: string
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          is_reconciled?: boolean | null
          notes?: string | null
          organization_id?: string
          reconciled_at?: string | null
          reconciled_with?: string | null
          reference?: string | null
          source?: string | null
          transaction_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_organization_id_fkey"
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
      billing_history: {
        Row: {
          action: string
          amount: number | null
          billing_cycle: string | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          invoice_number: string | null
          organization_id: string
          plan_name: string | null
          status: string | null
          subscription_id: string | null
        }
        Insert: {
          action?: string
          amount?: number | null
          billing_cycle?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          invoice_number?: string | null
          organization_id: string
          plan_name?: string | null
          status?: string | null
          subscription_id?: string | null
        }
        Update: {
          action?: string
          amount?: number | null
          billing_cycle?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          invoice_number?: string | null
          organization_id?: string
          plan_name?: string | null
          status?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "customer_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      building_inspections: {
        Row: {
          attachments: Json | null
          building_id: string | null
          checklist: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          findings: string | null
          id: string
          inspection_date: string
          inspection_type: string
          inspector_name: string | null
          next_inspection_date: string | null
          property_id: string
          status: string | null
          tenant_id: string | null
          title: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          building_id?: string | null
          checklist?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          findings?: string | null
          id?: string
          inspection_date?: string
          inspection_type?: string
          inspector_name?: string | null
          next_inspection_date?: string | null
          property_id: string
          status?: string | null
          tenant_id?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          building_id?: string | null
          checklist?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          findings?: string | null
          id?: string
          inspection_date?: string
          inspection_type?: string
          inspector_name?: string | null
          next_inspection_date?: string | null
          property_id?: string
          status?: string | null
          tenant_id?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_inspections_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_inspections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_inspections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_inspections_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
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
      chart_of_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_name_ar: string | null
          account_type: string
          created_at: string
          currency: string | null
          current_balance: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_group: boolean | null
          opening_balance: number | null
          organization_id: string
          parent_account_id: string | null
          updated_at: string
        }
        Insert: {
          account_code: string
          account_name: string
          account_name_ar?: string | null
          account_type?: string
          created_at?: string
          currency?: string | null
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_group?: boolean | null
          opening_balance?: number | null
          organization_id: string
          parent_account_id?: string | null
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_name?: string
          account_name_ar?: string | null
          account_type?: string
          created_at?: string
          currency?: string | null
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_group?: boolean | null
          opening_balance?: number | null
          organization_id?: string
          parent_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cheque_tracking: {
        Row: {
          amount: number
          bank_name: string | null
          bounce_reason: string | null
          bounced_date: string | null
          cheque_date: string
          cheque_number: string
          cleared_date: string | null
          created_at: string
          deposited_date: string | null
          id: string
          lease_id: string | null
          notes: string | null
          organization_id: string
          replacement_cheque_id: string | null
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_name?: string | null
          bounce_reason?: string | null
          bounced_date?: string | null
          cheque_date: string
          cheque_number: string
          cleared_date?: string | null
          created_at?: string
          deposited_date?: string | null
          id?: string
          lease_id?: string | null
          notes?: string | null
          organization_id: string
          replacement_cheque_id?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_name?: string | null
          bounce_reason?: string | null
          bounced_date?: string | null
          cheque_date?: string
          cheque_number?: string
          cleared_date?: string | null
          created_at?: string
          deposited_date?: string | null
          id?: string
          lease_id?: string | null
          notes?: string | null
          organization_id?: string
          replacement_cheque_id?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cheque_tracking_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cheque_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cheque_tracking_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          organization_id: string
          priority: string
          property_id: string | null
          resolution: string | null
          resolved_at: string | null
          status: string
          subject: string
          tenant_id: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          category?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          organization_id: string
          priority?: string
          property_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          tenant_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          organization_id?: string
          priority?: string
          property_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          tenant_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_subscriptions: {
        Row: {
          billing_cycle: string | null
          created_at: string
          expires_at: string | null
          id: string
          next_billing_date: string | null
          notes: string | null
          organization_id: string
          plan_id: string
          started_at: string
          status: string
          total_amount: number | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          next_billing_date?: string | null
          notes?: string | null
          organization_id: string
          plan_id: string
          started_at?: string
          status?: string
          total_amount?: number | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          next_billing_date?: string | null
          notes?: string | null
          organization_id?: string
          plan_id?: string
          started_at?: string
          status?: string
          total_amount?: number | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          expiry_date: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          lease_id: string | null
          name: string
          organization_id: string
          property_id: string | null
          related_id: string | null
          related_type: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          lease_id?: string | null
          name: string
          organization_id: string
          property_id?: string | null
          related_id?: string | null
          related_type?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          lease_id?: string | null
          name?: string
          organization_id?: string
          property_id?: string | null
          related_id?: string | null
          related_type?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      email_domains: {
        Row: {
          created_at: string
          dns_records: Json | null
          domain: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          dns_records?: Json | null
          domain: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          dns_records?: Json | null
          domain?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          created_at: string
          document_number: string | null
          document_type: string
          employee_id: string
          expiry_date: string | null
          file_name: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          issuing_authority: string | null
          issuing_country: string | null
          notes: string | null
          organization_id: string
          renewal_alert_days: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_type: string
          employee_id: string
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          issuing_country?: string | null
          notes?: string | null
          organization_id: string
          renewal_alert_days?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_type?: string
          employee_id?: string
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          issuing_country?: string | null
          notes?: string | null
          organization_id?: string
          renewal_alert_days?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_loans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          installments_count: number | null
          loan_amount: number
          loan_type: string | null
          monthly_deduction: number
          notes: string | null
          organization_id: string
          remaining_balance: number | null
          start_date: string
          status: string
          total_paid: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          installments_count?: number | null
          loan_amount: number
          loan_type?: string | null
          monthly_deduction: number
          notes?: string | null
          organization_id: string
          remaining_balance?: number | null
          start_date?: string
          status?: string
          total_paid?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          installments_count?: number | null
          loan_amount?: number
          loan_type?: string | null
          monthly_deduction?: number
          notes?: string | null
          organization_id?: string
          remaining_balance?: number | null
          start_date?: string
          status?: string
          total_paid?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_loans_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_loans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          avatar_url: string | null
          bank_account_number: string | null
          bank_name: string | null
          basic_salary: number | null
          contract_end_date: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_number: string
          employment_type: string | null
          first_name: string
          first_name_ar: string | null
          food_allowance: number | null
          gender: string | null
          hire_date: string
          housing_allowance: number | null
          iban: string | null
          id: string
          job_position: string | null
          job_title: string | null
          last_name: string
          last_name_ar: string | null
          marital_status: string | null
          nationality: string | null
          notes: string | null
          organization_id: string
          other_allowances: number | null
          phone: string | null
          phone_allowance: number | null
          probation_end_date: string | null
          region: string | null
          routing_code: string | null
          status: string
          termination_date: string | null
          total_salary: number | null
          transport_allowance: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          contract_end_date?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number: string
          employment_type?: string | null
          first_name: string
          first_name_ar?: string | null
          food_allowance?: number | null
          gender?: string | null
          hire_date?: string
          housing_allowance?: number | null
          iban?: string | null
          id?: string
          job_position?: string | null
          job_title?: string | null
          last_name: string
          last_name_ar?: string | null
          marital_status?: string | null
          nationality?: string | null
          notes?: string | null
          organization_id: string
          other_allowances?: number | null
          phone?: string | null
          phone_allowance?: number | null
          probation_end_date?: string | null
          region?: string | null
          routing_code?: string | null
          status?: string
          termination_date?: string | null
          total_salary?: number | null
          transport_allowance?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          contract_end_date?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number?: string
          employment_type?: string | null
          first_name?: string
          first_name_ar?: string | null
          food_allowance?: number | null
          gender?: string | null
          hire_date?: string
          housing_allowance?: number | null
          iban?: string | null
          id?: string
          job_position?: string | null
          job_title?: string | null
          last_name?: string
          last_name_ar?: string | null
          marital_status?: string | null
          nationality?: string | null
          notes?: string | null
          organization_id?: string
          other_allowances?: number | null
          phone?: string | null
          phone_allowance?: number | null
          probation_end_date?: string | null
          region?: string | null
          routing_code?: string | null
          status?: string
          termination_date?: string | null
          total_salary?: number | null
          transport_allowance?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_connections: {
        Row: {
          config: Json | null
          connection_name: string
          created_at: string
          enabled_sync_types: string[] | null
          erp_type: string
          id: string
          last_sync_at: string | null
          organization_id: string
          status: string | null
          sync_frequency: string | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          connection_name: string
          created_at?: string
          enabled_sync_types?: string[] | null
          erp_type: string
          id?: string
          last_sync_at?: string | null
          organization_id: string
          status?: string | null
          sync_frequency?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          connection_name?: string
          created_at?: string
          enabled_sync_types?: string[] | null
          erp_type?: string
          id?: string
          last_sync_at?: string | null
          organization_id?: string
          status?: string | null
          sync_frequency?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_sync_logs: {
        Row: {
          completed_at: string | null
          connection_id: string
          created_at: string
          error_message: string | null
          id: string
          records_synced: number | null
          started_at: string | null
          status: string | null
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          connection_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string | null
          status?: string | null
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          connection_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string | null
          status?: string | null
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_sync_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "erp_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_claims: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string | null
          claim_number: string | null
          created_at: string
          description: string | null
          employee_id: string
          expense_date: string
          id: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          receipt_url: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          claim_number?: string | null
          created_at?: string
          description?: string | null
          employee_id: string
          expense_date?: string
          id?: string
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          claim_number?: string | null
          created_at?: string
          description?: string | null
          employee_id?: string
          expense_date?: string
          id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_claims_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_claims_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          account_id: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string
          description: string | null
          employee_id: string | null
          expense_date: string
          expense_number: string | null
          id: string
          notes: string | null
          organization_id: string
          payment_method: string | null
          property_id: string | null
          receipt_url: string | null
          reference_number: string | null
          status: string
          total_amount: number
          updated_at: string
          vat_amount: number | null
          vendor_name: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          employee_id?: string | null
          expense_date?: string
          expense_number?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          payment_method?: string | null
          property_id?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          vat_amount?: number | null
          vendor_name?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          employee_id?: string | null
          expense_date?: string
          expense_number?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          payment_method?: string | null
          property_id?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          vat_amount?: number | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
      leads: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          listing_id: string | null
          listing_label: string | null
          listing_type: string
          message: string | null
          move_in_date: string | null
          organization_id: string
          phone: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          listing_id?: string | null
          listing_label?: string | null
          listing_type?: string
          message?: string | null
          move_in_date?: string | null
          organization_id: string
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          listing_id?: string | null
          listing_label?: string | null
          listing_type?: string
          message?: string | null
          move_in_date?: string | null
          organization_id?: string
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          auto_generate_invoice: boolean | null
          bed_space_id: string | null
          created_at: string
          deposit_status: string | null
          ejari_number: string | null
          end_date: string
          grace_period_days: number | null
          id: string
          late_fee_rate: number | null
          lease_type: string | null
          monthly_rent: number
          organization_id: string
          payment_frequency: string | null
          renewal_reminder_days: number | null
          rent_due_day: number | null
          room_id: string | null
          security_deposit: number | null
          start_date: string
          status: string | null
          tenant_id: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          auto_generate_invoice?: boolean | null
          bed_space_id?: string | null
          created_at?: string
          deposit_status?: string | null
          ejari_number?: string | null
          end_date: string
          grace_period_days?: number | null
          id?: string
          late_fee_rate?: number | null
          lease_type?: string | null
          monthly_rent: number
          organization_id: string
          payment_frequency?: string | null
          renewal_reminder_days?: number | null
          rent_due_day?: number | null
          room_id?: string | null
          security_deposit?: number | null
          start_date: string
          status?: string | null
          tenant_id: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_generate_invoice?: boolean | null
          bed_space_id?: string | null
          created_at?: string
          deposit_status?: string | null
          ejari_number?: string | null
          end_date?: string
          grace_period_days?: number | null
          id?: string
          late_fee_rate?: number | null
          lease_type?: string | null
          monthly_rent?: number
          organization_id?: string
          payment_frequency?: string | null
          renewal_reminder_days?: number | null
          rent_due_day?: number | null
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
      leave_balances: {
        Row: {
          carried_over: number | null
          created_at: string
          employee_id: string
          entitled_days: number
          id: string
          leave_type: string
          organization_id: string
          remaining_days: number | null
          updated_at: string
          used_days: number
          year: number
        }
        Insert: {
          carried_over?: number | null
          created_at?: string
          employee_id: string
          entitled_days?: number
          id?: string
          leave_type: string
          organization_id: string
          remaining_days?: number | null
          updated_at?: string
          used_days?: number
          year?: number
        }
        Update: {
          carried_over?: number | null
          created_at?: string
          employee_id?: string
          entitled_days?: number
          id?: string
          leave_type?: string
          organization_id?: string
          remaining_days?: number | null
          updated_at?: string
          used_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attachment_url: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          notes: string | null
          organization_id: string
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: string
          total_days: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type?: string
          notes?: string | null
          organization_id: string
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string
          total_days?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          notes?: string | null
          organization_id?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      messages: {
        Row: {
          body: string
          channel: string | null
          created_at: string
          id: string
          is_read: boolean | null
          organization_id: string
          parent_id: string | null
          priority: string | null
          recipient_id: string | null
          related_id: string | null
          related_type: string | null
          sender_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          channel?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          organization_id: string
          parent_id?: string | null
          priority?: string | null
          recipient_id?: string | null
          related_id?: string | null
          related_type?: string | null
          sender_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          channel?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          organization_id?: string
          parent_id?: string | null
          priority?: string | null
          recipient_id?: string | null
          related_id?: string | null
          related_type?: string | null
          sender_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          attachments: Json | null
          created_at: string
          created_by: string
          description: string | null
          expires_at: string | null
          id: string
          notice_type: string
          organization_id: string
          property_id: string | null
          published_at: string | null
          recipient_ids: string[] | null
          recipient_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          expires_at?: string | null
          id?: string
          notice_type?: string
          organization_id: string
          property_id?: string | null
          published_at?: string | null
          recipient_ids?: string[] | null
          recipient_type?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          notice_type?: string
          organization_id?: string
          property_id?: string | null
          published_at?: string | null
          recipient_ids?: string[] | null
          recipient_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          category: string | null
          created_at: string
          id: string
          is_read: boolean | null
          organization_id: string
          related_id: string | null
          related_type: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          organization_id: string
          related_id?: string | null
          related_type?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          organization_id?: string
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          country: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          email: string | null
          emirate: string | null
          id: string
          is_active: boolean | null
          language: string | null
          logo_url: string | null
          name: string
          name_ar: string | null
          phone: string | null
          timezone: string | null
          trade_license: string | null
          updated_at: string
          vat_enabled: boolean | null
          vat_number: string | null
          vat_rate: number | null
        }
        Insert: {
          address?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          email?: string | null
          emirate?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          logo_url?: string | null
          name: string
          name_ar?: string | null
          phone?: string | null
          timezone?: string | null
          trade_license?: string | null
          updated_at?: string
          vat_enabled?: boolean | null
          vat_number?: string | null
          vat_rate?: number | null
        }
        Update: {
          address?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          email?: string | null
          emirate?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          logo_url?: string | null
          name?: string
          name_ar?: string | null
          phone?: string | null
          timezone?: string | null
          trade_license?: string | null
          updated_at?: string
          vat_enabled?: boolean | null
          vat_number?: string | null
          vat_rate?: number | null
        }
        Relationships: []
      }
      parking_spaces: {
        Row: {
          created_at: string
          floor_level: string | null
          id: string
          monthly_fee: number | null
          permit_expiry: string | null
          permit_number: string | null
          property_id: string
          space_number: string
          space_type: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string
          vehicle_plate: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          floor_level?: string | null
          id?: string
          monthly_fee?: number | null
          permit_expiry?: string | null
          permit_number?: string | null
          property_id: string
          space_number: string
          space_type?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          floor_level?: string | null
          id?: string
          monthly_fee?: number | null
          permit_expiry?: string | null
          permit_number?: string | null
          property_id?: string
          space_number?: string
          space_type?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parking_spaces_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parking_spaces_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateway_configs: {
        Row: {
          access_token: string | null
          api_key: string | null
          created_at: string
          display_name: string
          extra_config: Json | null
          id: string
          is_active: boolean | null
          is_test_mode: boolean | null
          merchant_id: string | null
          provider: string
          secret_key: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          api_key?: string | null
          created_at?: string
          display_name: string
          extra_config?: Json | null
          id?: string
          is_active?: boolean | null
          is_test_mode?: boolean | null
          merchant_id?: string | null
          provider: string
          secret_key?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          api_key?: string | null
          created_at?: string
          display_name?: string
          extra_config?: Json | null
          id?: string
          is_active?: boolean | null
          is_test_mode?: boolean | null
          merchant_id?: string | null
          provider?: string
          secret_key?: string | null
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
      payroll_items: {
        Row: {
          absence_deduction: number | null
          absent_days: number | null
          basic_salary: number | null
          created_at: string
          employee_id: string
          food_allowance: number | null
          gross_salary: number | null
          housing_allowance: number | null
          id: string
          loan_deduction: number | null
          net_salary: number | null
          notes: string | null
          other_allowances: number | null
          other_deductions: number | null
          overtime_amount: number | null
          overtime_hours: number | null
          payroll_run_id: string
          penalty_deduction: number | null
          phone_allowance: number | null
          status: string
          total_deductions: number | null
          transport_allowance: number | null
          updated_at: string
          working_days: number | null
        }
        Insert: {
          absence_deduction?: number | null
          absent_days?: number | null
          basic_salary?: number | null
          created_at?: string
          employee_id: string
          food_allowance?: number | null
          gross_salary?: number | null
          housing_allowance?: number | null
          id?: string
          loan_deduction?: number | null
          net_salary?: number | null
          notes?: string | null
          other_allowances?: number | null
          other_deductions?: number | null
          overtime_amount?: number | null
          overtime_hours?: number | null
          payroll_run_id: string
          penalty_deduction?: number | null
          phone_allowance?: number | null
          status?: string
          total_deductions?: number | null
          transport_allowance?: number | null
          updated_at?: string
          working_days?: number | null
        }
        Update: {
          absence_deduction?: number | null
          absent_days?: number | null
          basic_salary?: number | null
          created_at?: string
          employee_id?: string
          food_allowance?: number | null
          gross_salary?: number | null
          housing_allowance?: number | null
          id?: string
          loan_deduction?: number | null
          net_salary?: number | null
          notes?: string | null
          other_allowances?: number | null
          other_deductions?: number | null
          overtime_amount?: number | null
          overtime_hours?: number | null
          payroll_run_id?: string
          penalty_deduction?: number | null
          phone_allowance?: number | null
          status?: string
          total_deductions?: number | null
          transport_allowance?: number | null
          updated_at?: string
          working_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          payroll_month: number
          payroll_year: number
          run_date: string
          status: string
          total_allowances: number | null
          total_basic: number | null
          total_deductions: number | null
          total_employees: number | null
          total_net_salary: number | null
          updated_at: string
          wps_file_url: string | null
          wps_generated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          payroll_month: number
          payroll_year: number
          run_date?: string
          status?: string
          total_allowances?: number | null
          total_basic?: number | null
          total_deductions?: number | null
          total_employees?: number | null
          total_net_salary?: number | null
          updated_at?: string
          wps_file_url?: string | null
          wps_generated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          payroll_month?: number
          payroll_year?: number
          run_date?: string
          status?: string
          total_allowances?: number | null
          total_basic?: number | null
          total_deductions?: number | null
          total_employees?: number | null
          total_net_salary?: number | null
          updated_at?: string
          wps_file_url?: string | null
          wps_generated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_modules: {
        Row: {
          addon_price: number | null
          id: string
          is_included: boolean | null
          module_id: string
          plan_id: string
        }
        Insert: {
          addon_price?: number | null
          id?: string
          is_included?: boolean | null
          module_id: string
          plan_id: string
        }
        Update: {
          addon_price?: number | null
          id?: string
          is_included?: boolean | null
          module_id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "platform_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_modules_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_modules: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
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
      property_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          is_primary: boolean | null
          property_id: string
          sort_order: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean | null
          property_id: string
          sort_order?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean | null
          property_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_invoices: {
        Row: {
          amount: number
          auto_send: boolean | null
          created_at: string
          description: string | null
          frequency: string
          id: string
          is_active: boolean | null
          lease_id: string | null
          next_generate_date: string
          organization_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          auto_send?: boolean | null
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          lease_id?: string | null
          next_generate_date: string
          organization_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          auto_send?: boolean | null
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          lease_id?: string | null
          next_generate_date?: string
          organization_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoices_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_schedules: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          late_fee: number | null
          lease_id: string
          notes: string | null
          organization_id: string
          paid_date: string | null
          payment_id: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          late_fee?: number | null
          lease_id: string
          notes?: string | null
          organization_id: string
          paid_date?: string | null
          payment_id?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          late_fee?: number | null
          lease_id?: string
          notes?: string | null
          organization_id?: string
          paid_date?: string | null
          payment_id?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_schedules_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_schedules_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_schedules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_approve: boolean
          can_create: boolean
          can_delete: boolean
          can_export: boolean
          can_manage: boolean
          can_read: boolean
          can_update: boolean
          created_at: string
          id: string
          module_slug: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          can_approve?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_export?: boolean
          can_manage?: boolean
          can_read?: boolean
          can_update?: boolean
          created_at?: string
          id?: string
          module_slug: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          can_approve?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_export?: boolean
          can_manage?: boolean
          can_read?: boolean
          can_update?: boolean
          created_at?: string
          id?: string
          module_slug?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
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
      service_charges: {
        Row: {
          amount: number
          charge_type: string
          created_at: string
          description: string | null
          effective_date: string | null
          end_date: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          property_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          charge_type?: string
          created_at?: string
          description?: string | null
          effective_date?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          property_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          charge_type?: string
          created_at?: string
          description?: string | null
          effective_date?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_charges_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_modules: {
        Row: {
          enabled_at: string | null
          id: string
          is_enabled: boolean | null
          module_id: string
          subscription_id: string
        }
        Insert: {
          enabled_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_id: string
          subscription_id: string
        }
        Update: {
          enabled_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_id?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "platform_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_modules_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "customer_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          ai_features_access: boolean | null
          ai_usage_limit: number | null
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          max_api_calls: number | null
          max_properties: number | null
          max_storage_gb: number | null
          max_tenants: number | null
          max_units: number | null
          max_users: number | null
          name: string
          plan_type: string
          price: number
          report_access: boolean | null
          sort_order: number | null
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          ai_features_access?: boolean | null
          ai_usage_limit?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_api_calls?: number | null
          max_properties?: number | null
          max_storage_gb?: number | null
          max_tenants?: number | null
          max_units?: number | null
          max_users?: number | null
          name: string
          plan_type?: string
          price?: number
          report_access?: boolean | null
          sort_order?: number | null
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          ai_features_access?: boolean | null
          ai_usage_limit?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_api_calls?: number | null
          max_properties?: number | null
          max_storage_gb?: number | null
          max_tenants?: number | null
          max_units?: number | null
          max_users?: number | null
          name?: string
          plan_type?: string
          price?: number
          report_access?: boolean | null
          sort_order?: number | null
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          ai_suggested_solution: string | null
          assigned_to: string | null
          category: string
          closed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          organization_id: string | null
          priority: string
          resolved_at: string | null
          sla_due_at: string | null
          status: string
          subject: string
          tags: string[] | null
          ticket_number: string
          updated_at: string
        }
        Insert: {
          ai_suggested_solution?: string | null
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          organization_id?: string | null
          priority?: string
          resolved_at?: string | null
          sla_due_at?: string | null
          status?: string
          subject: string
          tags?: string[] | null
          ticket_number: string
          updated_at?: string
        }
        Update: {
          ai_suggested_solution?: string | null
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          organization_id?: string | null
          priority?: string
          resolved_at?: string | null
          sla_due_at?: string | null
          status?: string
          subject?: string
          tags?: string[] | null
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_family_members: {
        Row: {
          created_at: string
          date_of_birth: string | null
          emirates_id: string | null
          full_name: string
          id: string
          relationship: string
          tenant_id: string
          visa_expiry: string | null
          visa_number: string | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          emirates_id?: string | null
          full_name: string
          id?: string
          relationship?: string
          tenant_id: string
          visa_expiry?: string | null
          visa_number?: string | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          emirates_id?: string | null
          full_name?: string
          id?: string
          relationship?: string
          tenant_id?: string
          visa_expiry?: string | null
          visa_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_family_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          profile_photo_url: string | null
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
          profile_photo_url?: string | null
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
          profile_photo_url?: string | null
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
      ticket_messages: {
        Row: {
          attachments: Json | null
          body: string
          created_at: string
          id: string
          sender_id: string | null
          sender_type: string | null
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          body: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_type?: string | null
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          body?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_type?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
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
      usage_limits: {
        Row: {
          current_count: number
          id: string
          organization_id: string
          resource_type: string
          updated_at: string
        }
        Insert: {
          current_count?: number
          id?: string
          organization_id: string
          resource_type: string
          updated_at?: string
        }
        Update: {
          current_count?: number
          id?: string
          organization_id?: string
          resource_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_limits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      vat_records: {
        Row: {
          created_at: string
          id: string
          invoice_number: string | null
          notes: string | null
          organization_id: string
          period_month: number | null
          period_year: number | null
          record_type: string
          related_id: string | null
          related_type: string | null
          status: string
          taxable_amount: number
          total_amount: number
          transaction_date: string
          trn_number: string | null
          updated_at: string
          vat_amount: number
          vat_rate: number
          vendor_customer_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          organization_id: string
          period_month?: number | null
          period_year?: number | null
          record_type?: string
          related_id?: string | null
          related_type?: string | null
          status?: string
          taxable_amount?: number
          total_amount?: number
          transaction_date?: string
          trn_number?: string | null
          updated_at?: string
          vat_amount?: number
          vat_rate?: number
          vendor_customer_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          organization_id?: string
          period_month?: number | null
          period_year?: number | null
          record_type?: string
          related_id?: string | null
          related_type?: string | null
          status?: string
          taxable_amount?: number
          total_amount?: number
          transaction_date?: string
          trn_number?: string | null
          updated_at?: string
          vat_amount?: number
          vat_rate?: number
          vendor_customer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vat_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_logs: {
        Row: {
          approved_by: string | null
          check_in_at: string
          check_out_at: string | null
          created_at: string
          id: string
          notes: string | null
          property_id: string
          purpose: string | null
          status: string | null
          tenant_id: string | null
          unit_number: string | null
          vehicle_plate: string | null
          visitor_emirates_id: string | null
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: {
          approved_by?: string | null
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          property_id: string
          purpose?: string | null
          status?: string | null
          tenant_id?: string | null
          unit_number?: string | null
          vehicle_plate?: string | null
          visitor_emirates_id?: string | null
          visitor_name: string
          visitor_phone?: string | null
        }
        Update: {
          approved_by?: string | null
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          property_id?: string
          purpose?: string | null
          status?: string | null
          tenant_id?: string | null
          unit_number?: string | null
          vehicle_plate?: string | null
          visitor_emirates_id?: string | null
          visitor_name?: string
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_expire_leases: { Args: never; Returns: number }
      check_plan_module_access: {
        Args: { _module_slug: string; _org_id: string }
        Returns: boolean
      }
      check_usage_limit: {
        Args: { _org_id: string; _resource: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      onboard_organization: {
        Args: {
          _billing_cycle?: string
          _emirate?: string
          _org_email?: string
          _org_name: string
          _org_name_ar?: string
          _org_phone?: string
          _plan_id?: string
          _user_id: string
        }
        Returns: Json
      }
      refresh_usage_counts: { Args: { _org_id: string }; Returns: undefined }
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
