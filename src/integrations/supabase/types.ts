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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_views: {
        Row: {
          ad_id: string | null
          earnings: number | null
          id: string
          video_id: string | null
          video_owner_id: string | null
          viewed_at: string | null
          viewer_id: string | null
        }
        Insert: {
          ad_id?: string | null
          earnings?: number | null
          id?: string
          video_id?: string | null
          video_owner_id?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Update: {
          ad_id?: string | null
          earnings?: number | null
          id?: string
          video_id?: string | null
          video_owner_id?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_views_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          ad_type: string
          adsense_slot: string | null
          click_url: string | null
          created_at: string | null
          duration: number | null
          earnings_per_view: number | null
          id: string
          is_active: boolean | null
          media_url: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          ad_type: string
          adsense_slot?: string | null
          click_url?: string | null
          created_at?: string | null
          duration?: number | null
          earnings_per_view?: number | null
          id?: string
          is_active?: boolean | null
          media_url?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          ad_type?: string
          adsense_slot?: string | null
          click_url?: string | null
          created_at?: string | null
          duration?: number | null
          earnings_per_view?: number | null
          id?: string
          is_active?: boolean | null
          media_url?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      creator_earnings: {
        Row: {
          ad_id: string | null
          amount: number
          created_at: string | null
          creator_id: string
          id: string
          type: string
          video_id: string | null
        }
        Insert: {
          ad_id?: string | null
          amount: number
          created_at?: string | null
          creator_id: string
          id?: string
          type: string
          video_id?: string | null
        }
        Update: {
          ad_id?: string | null
          amount?: number
          created_at?: string | null
          creator_id?: string
          id?: string
          type?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_earnings_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_earnings_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_tasks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          reward_amount: number
          task_type: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          reward_amount?: number
          task_type?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          reward_amount?: number
          task_type?: string
          title?: string
        }
        Relationships: []
      }
      earnings: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          language_preference: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          language_preference?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          language_preference?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_milestones: {
        Row: {
          achieved_at: string
          bonus_coins: number
          id: string
          milestone: number
          referred_id: string
          referrer_id: string
        }
        Insert: {
          achieved_at?: string
          bonus_coins: number
          id?: string
          milestone: number
          referred_id: string
          referrer_id: string
        }
        Update: {
          achieved_at?: string
          bonus_coins?: number
          id?: string
          milestone?: number
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      referral_task_completions: {
        Row: {
          coins_earned: number
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          task_id: string
          task_title: string
        }
        Insert: {
          coins_earned?: number
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          task_id: string
          task_title: string
        }
        Update: {
          coins_earned?: number
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          task_id?: string
          task_title?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          coin_price: number
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
        }
        Insert: {
          coin_price?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
        }
        Update: {
          coin_price?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      user_bank_details: {
        Row: {
          account_holder_name: string
          account_number: string
          bank_name: string
          created_at: string
          id: string
          ifsc_code: string
          is_primary: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          bank_name: string
          created_at?: string
          id?: string
          ifsc_code: string
          is_primary?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          bank_name?: string
          created_at?: string
          id?: string
          ifsc_code?: string
          is_primary?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_daily_tasks: {
        Row: {
          completed_at: string
          date: string
          id: string
          reward_claimed: boolean | null
          task_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          date?: string
          id?: string
          reward_claimed?: boolean | null
          task_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          date?: string
          id?: string
          reward_claimed?: boolean | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rewards: {
        Row: {
          expires_at: string | null
          id: string
          is_active: boolean | null
          purchased_at: string
          reward_id: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          purchased_at?: string
          reward_id: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          purchased_at?: string
          reward_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_login_date: string | null
          longest_streak: number
          streak_updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          streak_updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          streak_updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          balance: number
          coins: number
          created_at: string | null
          id: string
          total_earned: number
          total_withdrawn: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          coins?: number
          created_at?: string | null
          id?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          coins?: number
          created_at?: string | null
          id?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      video_watches: {
        Row: {
          claim_hour: string | null
          coins_earned: number
          id: string
          user_id: string
          video_id: string
          watch_date: string
          watched_at: string
        }
        Insert: {
          claim_hour?: string | null
          coins_earned?: number
          id?: string
          user_id: string
          video_id: string
          watch_date?: string
          watched_at?: string
        }
        Update: {
          claim_hour?: string | null
          coins_earned?: number
          id?: string
          user_id?: string
          video_id?: string
          watch_date?: string
          watched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_watches_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          is_featured: boolean | null
          status: string | null
          thumbnail_url: string | null
          title: string
          total_earnings: number | null
          uploader_id: string | null
          video_url: string | null
          view_count: number | null
          youtube_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_featured?: boolean | null
          status?: string | null
          thumbnail_url?: string | null
          title: string
          total_earnings?: number | null
          uploader_id?: string | null
          video_url?: string | null
          view_count?: number | null
          youtube_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_featured?: boolean | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          total_earnings?: number | null
          uploader_id?: string | null
          video_url?: string | null
          view_count?: number | null
          youtube_id?: string
        }
        Relationships: []
      }
      watch_history: {
        Row: {
          id: string
          user_id: string
          video_id: string
          watched_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          video_id: string
          watched_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          video_id?: string
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watch_history_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          account_holder_name: string
          account_number: string
          admin_notes: string | null
          amount: number
          bank_name: string
          created_at: string | null
          id: string
          ifsc_code: string
          processed_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          admin_notes?: string | null
          amount: number
          bank_name: string
          created_at?: string | null
          id?: string
          ifsc_code: string
          processed_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          admin_notes?: string | null
          amount?: number
          bank_name?: string
          created_at?: string | null
          id?: string
          ifsc_code?: string
          processed_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          display_name: string | null
          id: string | null
          referral_code: string | null
        }
        Insert: {
          display_name?: never
          id?: string | null
          referral_code?: string | null
        }
        Update: {
          display_name?: never
          id?: string | null
          referral_code?: string | null
        }
        Relationships: []
      }
      user_bank_details_masked: {
        Row: {
          account_holder_masked: string | null
          account_number_masked: string | null
          bank_name_masked: string | null
          created_at: string | null
          id: string | null
          ifsc_masked: string | null
          is_primary: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_holder_masked?: never
          account_number_masked?: never
          bank_name_masked?: never
          created_at?: string | null
          id?: string | null
          ifsc_masked?: never
          is_primary?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_holder_masked?: never
          account_number_masked?: never
          bank_name_masked?: never
          created_at?: string | null
          id?: string | null
          ifsc_masked?: never
          is_primary?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      withdrawal_requests_masked: {
        Row: {
          account_holder_masked: string | null
          account_number_masked: string | null
          admin_notes: string | null
          amount: number | null
          bank_name_masked: string | null
          created_at: string | null
          id: string | null
          ifsc_masked: string | null
          processed_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          account_holder_masked?: never
          account_number_masked?: never
          admin_notes?: string | null
          amount?: number | null
          bank_name_masked?: never
          created_at?: string | null
          id?: string | null
          ifsc_masked?: never
          processed_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          account_holder_masked?: never
          account_number_masked?: never
          admin_notes?: string | null
          amount?: number | null
          bank_name_masked?: never
          created_at?: string | null
          id?: string | null
          ifsc_masked?: never
          processed_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_referral_bonus: {
        Args: { p_referred_id: string; p_referrer_id: string }
        Returns: undefined
      }
      award_streak_bonus: {
        Args: {
          p_bonus_coins: number
          p_streak_count: number
          p_user_id: string
        }
        Returns: boolean
      }
      claim_task_reward: {
        Args: { p_task_id: string; p_user_id: string }
        Returns: boolean
      }
      convert_coins_to_rupees: {
        Args: { p_coins: number; p_user_id: string }
        Returns: boolean
      }
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_withdrawal:
        | { Args: { p_amount: number; p_user_id: string }; Returns: undefined }
        | {
            Args: {
              p_amount: number
              p_user_id: string
              p_withdrawal_id: string
            }
            Returns: boolean
          }
      purchase_reward: {
        Args: { p_reward_id: string; p_user_id: string }
        Returns: boolean
      }
      record_ad_view: {
        Args: { p_ad_id: string; p_video_id: string; p_viewer_id: string }
        Returns: boolean
      }
      record_video_view: {
        Args: { p_user_id: string; p_video_id: string }
        Returns: boolean
      }
      submit_withdrawal_request: {
        Args: {
          p_account_holder_name: string
          p_account_number: string
          p_amount: number
          p_bank_name: string
          p_ifsc_code: string
          p_save_bank_details?: boolean
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
