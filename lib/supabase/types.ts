/**
 * Supabase database type definitions.
 * Run `npx supabase gen types typescript --project-id <id>` to auto-generate
 * once you have the Supabase CLI and project linked.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type SubscriptionTier   = "free" | "pro" | "lab" | "institution";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "unpaid";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          stripe_customer_id: string | null;
          subscription_tier: SubscriptionTier;
          subscription_status: SubscriptionStatus | null;
          subscription_period_end: string | null;
          word_conversions_this_month: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          subscription_tier?: SubscriptionTier;
          subscription_status?: SubscriptionStatus | null;
          subscription_period_end?: string | null;
          word_conversions_this_month?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          subscription_tier?: SubscriptionTier;
          subscription_status?: SubscriptionStatus | null;
          subscription_period_end?: string | null;
          word_conversions_this_month?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          is_pinned: boolean;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          content?: string;
          is_pinned?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          is_pinned?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      subscription_tier: SubscriptionTier;
      subscription_status: SubscriptionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
