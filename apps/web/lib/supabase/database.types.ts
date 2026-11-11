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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      availability: {
        Row: {
          created_at: string
          end_time: string
          id: string
          interviewer_id: string
          start_time: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          interviewer_id: string
          start_time: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          interviewer_id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "interviewers"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      collab_documents: {
        Row: {
          name: string
          state: string
          updated_at: string
        }
        Insert: {
          name: string
          state: string
          updated_at?: string
        }
        Update: {
          name?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          created_at: string
          id: string
          improvements: string | null
          scores: Json
          session_id: string
          strengths: string | null
          would_hire: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          improvements?: string | null
          scores: Json
          session_id: string
          strengths?: string | null
          would_hire?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          improvements?: string | null
          scores?: Json
          session_id?: string
          strengths?: string | null
          would_hire?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interviewers: {
        Row: {
          abacate_subaccount_id: string | null
          active: boolean
          areas: string[]
          bio: string | null
          company: string
          created_at: string
          github_url: string | null
          headline: string
          linkedin_url: string | null
          paused: boolean
          price_cents: number
          profile_id: string
          seniority: string
        }
        Insert: {
          abacate_subaccount_id?: string | null
          active?: boolean
          areas: string[]
          bio?: string | null
          company: string
          created_at?: string
          github_url?: string | null
          headline: string
          linkedin_url?: string | null
          paused?: boolean
          price_cents: number
          profile_id: string
          seniority: string
        }
        Update: {
          abacate_subaccount_id?: string | null
          active?: boolean
          areas?: string[]
          bio?: string | null
          company?: string
          created_at?: string
          github_url?: string | null
          headline?: string
          linkedin_url?: string | null
          paused?: boolean
          price_cents?: number
          profile_id?: string
          seniority?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviewers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "interviewer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviewers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          areas: string[] | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          email: string
          experience_years: number | null
          github_url: string | null
          id: string
          linkedin_url: string | null
          name: string
          preferred_name: string | null
          role: string | null
          state: string | null
          target_role: string | null
        }
        Insert: {
          areas?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email: string
          experience_years?: number | null
          github_url?: string | null
          id: string
          linkedin_url?: string | null
          name: string
          preferred_name?: string | null
          role?: string | null
          state?: string | null
          target_role?: string | null
        }
        Update: {
          areas?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string
          experience_years?: number | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          preferred_name?: string | null
          role?: string | null
          state?: string | null
          target_role?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          session_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          session_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          candidate_id: string
          candidate_notes: string | null
          collab_doc_name: string | null
          created_at: string
          ends_at: string
          id: string
          interviewer_id: string
          livekit_room: string | null
          starts_at: string
          status: string
          type: string
        }
        Insert: {
          candidate_id: string
          candidate_notes?: string | null
          collab_doc_name?: string | null
          created_at?: string
          ends_at: string
          id?: string
          interviewer_id: string
          livekit_room?: string | null
          starts_at: string
          status?: string
          type: string
        }
        Update: {
          candidate_id?: string
          candidate_notes?: string | null
          collab_doc_name?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          interviewer_id?: string
          livekit_room?: string | null
          starts_at?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "interviewer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "interviewer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      interviewer_profiles: {
        Row: {
          avatar_url: string | null
          id: string | null
          name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      interviewer_booked_slots: {
        Args: { from_ts: string; interviewer: string; to_ts: string }
        Returns: {
          ends_at: string
          starts_at: string
        }[]
      }
      interviewer_completed_sessions: {
        Args: { interviewer: string }
        Returns: number
      }
      interviewer_ratings: {
        Args: { interviewer_ids: string[] }
        Returns: {
          average: number
          interviewer_id: string
          review_count: number
        }[]
      }
      interviewer_reviews: {
        Args: { interviewer: string }
        Returns: {
          comment: string
          created_at: string
          rating: number
          reviewer_first_name: string
        }[]
      }
      interviewers_booked_slots: {
        Args: { from_ts: string; interviewer_ids: string[]; to_ts: string }
        Returns: {
          ends_at: string
          interviewer_id: string
          starts_at: string
        }[]
      }
      session_participant_names: {
        Args: { session_ids: string[] }
        Returns: {
          candidate_name: string
          interviewer_name: string
          session_id: string
        }[]
      }
      time_multirange: { Args: never; Returns: unknown }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
