export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_action_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          description: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_action_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notification_settings: {
        Row: {
          created_at: string | null
          daily_notification_summary: boolean | null
          id: string
          new_contact_messages: boolean | null
          new_user_signup: boolean | null
          notification_email: string
          notify_slack: boolean | null
          notify_telegram: boolean | null
          security_alerts: boolean | null
          slack_webhook_url: string | null
          telegram_bot_token: string | null
          telegram_chat_id: string | null
          updated_at: string | null
          user_id: string
          user_subscription_changes: boolean | null
        }
        Insert: {
          created_at?: string | null
          daily_notification_summary?: boolean | null
          id?: string
          new_contact_messages?: boolean | null
          new_user_signup?: boolean | null
          notification_email: string
          notify_slack?: boolean | null
          notify_telegram?: boolean | null
          security_alerts?: boolean | null
          slack_webhook_url?: string | null
          telegram_bot_token?: string | null
          telegram_chat_id?: string | null
          updated_at?: string | null
          user_id: string
          user_subscription_changes?: boolean | null
        }
        Update: {
          created_at?: string | null
          daily_notification_summary?: boolean | null
          id?: string
          new_contact_messages?: boolean | null
          new_user_signup?: boolean | null
          notification_email?: string
          notify_slack?: boolean | null
          notify_telegram?: boolean | null
          security_alerts?: boolean | null
          slack_webhook_url?: string | null
          telegram_bot_token?: string | null
          telegram_chat_id?: string | null
          updated_at?: string | null
          user_id?: string
          user_subscription_changes?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          admin_deleted_at: string | null
          admin_id: string | null
          archived_at: string | null
          category: string | null
          client_deleted_at: string | null
          client_id: string
          closed_at: string | null
          created_at: string
          id: string
          project_id: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          admin_deleted_at?: string | null
          admin_id?: string | null
          archived_at?: string | null
          category?: string | null
          client_deleted_at?: string | null
          client_id: string
          closed_at?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          admin_deleted_at?: string | null
          admin_id?: string | null
          archived_at?: string | null
          category?: string | null
          client_deleted_at?: string | null
          client_id?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "admin_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_admin: boolean
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_admin: boolean
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_ratings: {
        Row: {
          comments: string | null
          conversation_id: string
          created_at: string
          id: string
          rating: number
        }
        Insert: {
          comments?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          rating: number
        }
        Update: {
          comments?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_ratings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_privacy_settings: {
        Row: {
          cookie_preferences: Json | null
          created_at: string
          id: string
          marketing_emails: boolean | null
          newsletter: boolean | null
          updated_at: string
          usage_analytics: boolean | null
          user_id: string
        }
        Insert: {
          cookie_preferences?: Json | null
          created_at?: string
          id?: string
          marketing_emails?: boolean | null
          newsletter?: boolean | null
          updated_at?: string
          usage_analytics?: boolean | null
          user_id: string
        }
        Update: {
          cookie_preferences?: Json | null
          created_at?: string
          id?: string
          marketing_emails?: boolean | null
          newsletter?: boolean | null
          updated_at?: string
          usage_analytics?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_privacy_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          address: string | null
          business_name: string
          city: string | null
          country: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          city?: string | null
          country?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          city?: string | null
          country?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      client_projects: {
        Row: {
          actual_end_date: string | null
          created_at: string
          description: string | null
          estimated_completion_days: number
          expected_end_date: string | null
          id: string
          name: string
          order_id: string | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_end_date?: string | null
          created_at?: string
          description?: string | null
          estimated_completion_days: number
          expected_end_date?: string | null
          id?: string
          name: string
          order_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_end_date?: string | null
          created_at?: string
          description?: string | null
          estimated_completion_days?: number
          expected_end_date?: string | null
          id?: string
          name?: string
          order_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      client_subscriptions: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tax_info: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          legal_name: string | null
          postal_code: string | null
          province: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          postal_code?: string | null
          province?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          postal_code?: string | null
          province?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tax_info_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          notes: string | null
          phone: string | null
          priority: Database["public"]["Enums"]["contact_priority"]
          project_type: string | null
          status: Database["public"]["Enums"]["contact_status"]
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          notes?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["contact_priority"]
          project_type?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          notes?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["contact_priority"]
          project_type?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_accounts: {
        Row: {
          deleted_at: string
          deleted_by: string | null
          email: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          deleted_at?: string
          deleted_by?: string | null
          email: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          deleted_at?: string
          deleted_by?: string | null
          email?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      my_packs: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          features: string[]
          id: string
          is_active: boolean | null
          name: string
          position: number
          price: number
          short_description: string | null
          slug: string
          target: string | null
          type: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          features?: string[]
          id?: string
          is_active?: boolean | null
          name: string
          position: number
          price: number
          short_description?: string | null
          slug: string
          target?: string | null
          type: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          features?: string[]
          id?: string
          is_active?: boolean | null
          name?: string
          position?: number
          price?: number
          short_description?: string | null
          slug?: string
          target?: string | null
          type?: string
        }
        Relationships: []
      }
      my_services: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean | null
          name: string
          price: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          order_id: string
          price_at_purchase: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          order_id: string
          price_at_purchase: number
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          order_id?: string
          price_at_purchase?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          installment_plan: string | null
          payment_id: string | null
          payment_method: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          installment_plan?: string | null
          payment_id?: string | null
          payment_method?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          installment_plan?: string | null
          payment_id?: string | null
          payment_method?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_services: {
        Row: {
          created_at: string
          id: string
          pack_id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pack_id: string
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pack_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_services_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "my_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "my_services"
            referencedColumns: ["id"]
          },
        ]
      }
      project_forms: {
        Row: {
          created_at: string
          description: string | null
          form_data: Json
          form_type: string
          id: string
          is_completed: boolean
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          form_data?: Json
          form_type: string
          id?: string
          is_completed?: boolean
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          form_data?: Json
          form_type?: string
          id?: string
          is_completed?: boolean
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_forms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "admin_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_forms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean
          position: number | null
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          position?: number | null
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          position?: number | null
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "admin_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notes: {
        Row: {
          admin_id: string
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "admin_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_progress: {
        Row: {
          created_at: string
          estimated_end_date: string
          id: string
          progress_percentage: number
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_end_date: string
          id?: string
          progress_percentage?: number
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_end_date?: string
          id?: string
          progress_percentage?: number
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          admin_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "admin_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_tasks: {
        Row: {
          created_at: string
          created_by: string | null
          cron_expression: string
          description: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          next_run_at: string | null
          task_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cron_expression: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          task_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cron_expression?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          task_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopping_cart: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_cart_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          item_id: string
          item_type: string
          quantity: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "shopping_cart"
            referencedColumns: ["id"]
          },
        ]
      }
      system_constants: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      task_execution_history: {
        Row: {
          completed_at: string | null
          details: Json | null
          id: string
          result: string | null
          started_at: string
          status: string
          task_id: string
        }
        Insert: {
          completed_at?: string | null
          details?: Json | null
          id?: string
          result?: string | null
          started_at?: string
          status?: string
          task_id: string
        }
        Update: {
          completed_at?: string | null
          details?: Json | null
          id?: string
          result?: string | null
          started_at?: string
          status?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_execution_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "scheduled_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          created_at: string | null
          description: string
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          expires_at: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token: string
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      user_modules: {
        Row: {
          created_at: string
          id: string
          service_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_modules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "my_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_modules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          active_services: number
          created_at: string
          demos_generated: number
          forms_submitted: number
          id: string
          month: string
          updated_at: string
          user_id: string
          visits: number
        }
        Insert: {
          active_services?: number
          created_at?: string
          demos_generated?: number
          forms_submitted?: number
          id?: string
          month: string
          updated_at?: string
          user_id: string
          visits?: number
        }
        Update: {
          active_services?: number
          created_at?: string
          demos_generated?: number
          forms_submitted?: number
          id?: string
          month?: string
          updated_at?: string
          user_id?: string
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      website_settings: {
        Row: {
          address: string | null
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          enable_blog: boolean | null
          enable_registration: boolean | null
          google_analytics_id: string | null
          id: string
          maintenance_mode: boolean | null
          meta_description: string
          meta_title: string
          site_name: string
          tagline: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          enable_blog?: boolean | null
          enable_registration?: boolean | null
          google_analytics_id?: string | null
          id?: string
          maintenance_mode?: boolean | null
          meta_description: string
          meta_title: string
          site_name: string
          tagline?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          enable_blog?: boolean | null
          enable_registration?: boolean | null
          google_analytics_id?: string | null
          id?: string
          maintenance_mode?: boolean | null
          meta_description?: string
          meta_title?: string
          site_name?: string
          tagline?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_projects_view: {
        Row: {
          actual_end_date: string | null
          business_name: string | null
          created_at: string | null
          email: string | null
          estimated_completion_days: number | null
          expected_end_date: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          name: string | null
          order_id: string | null
          order_total: number | null
          progress_percentage: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles_with_email: {
        Row: {
          address: string | null
          business_name: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: never
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: never
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_with_email"
            referencedColumns: ["id"]
          },
        ]
      }
      users_with_email: {
        Row: {
          email: string | null
          id: string | null
        }
        Insert: {
          email?: string | null
          id?: string | null
        }
        Update: {
          email?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_get_cart_items: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          cart_id: string
          item_id: string
          item_type: string
          quantity: number
          created_at: string
          updated_at: string
          user_id: string
          item_name: string
          item_price: number
          total_price: number
          first_name: string
          last_name: string
          business_name: string
          email: string
        }[]
      }
      email_available_for_signup: {
        Args: { p_email: string }
        Returns: boolean
      }
      execute_sql: {
        Args: { query: string }
        Returns: Json
      }
      get_project_details: {
        Args: { project_id_param: string }
        Returns: {
          actual_end_date: string | null
          business_name: string | null
          created_at: string | null
          email: string | null
          estimated_completion_days: number | null
          expected_end_date: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          name: string | null
          order_id: string | null
          order_total: number | null
          progress_percentage: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }[]
      }
      get_user_email: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_email_by_id: {
        Args: { user_uuid: string }
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_user_active: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      soft_delete_user: {
        Args: { p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "employee" | "client"
      contact_priority: "low" | "medium" | "high"
      contact_status: "new" | "in_progress" | "completed"
      invitation_status: "pending" | "accepted" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "employee", "client"],
      contact_priority: ["low", "medium", "high"],
      contact_status: ["new", "in_progress", "completed"],
      invitation_status: ["pending", "accepted", "expired"],
    },
  },
} as const
