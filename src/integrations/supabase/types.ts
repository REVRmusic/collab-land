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
  public: {
    Tables: {
      covers: {
        Row: {
          author_id: string
          caption: string | null
          created_at: string
          id: string
          image_url: string
          project_id: string
        }
        Insert: {
          author_id: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          project_id: string
        }
        Update: {
          author_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "covers_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "covers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          audio_url: string | null
          author_id: string
          body: string | null
          created_at: string
          duration: number | null
          id: string
          kind: string
          peaks: Json | null
          project_id: string
          reply_to_id: string | null
          version_id: string | null
        }
        Insert: {
          audio_url?: string | null
          author_id: string
          body?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          kind?: string
          peaks?: Json | null
          project_id: string
          reply_to_id?: string | null
          version_id?: string | null
        }
        Update: {
          audio_url?: string | null
          author_id?: string
          body?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          kind?: string
          peaks?: Json | null
          project_id?: string
          reply_to_id?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "project_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          data: Json
          emailed: boolean
          id: string
          project_id: string | null
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          data?: Json
          emailed?: boolean
          id?: string
          project_id?: string | null
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          data?: Json
          emailed?: boolean
          id?: string
          project_id?: string | null
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string | null
          email_digest: boolean
          id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_digest?: boolean
          id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_digest?: boolean
          id?: string
          username?: string
        }
        Relationships: []
      }
      project_invites: {
        Row: {
          created_at: string
          created_by: string
          project_id: string
          revoked_at: string | null
          token: string
        }
        Insert: {
          created_at?: string
          created_by: string
          project_id: string
          revoked_at?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          project_id?: string
          revoked_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_versions: {
        Row: {
          audio_url: string
          author_id: string
          created_at: string
          download_url: string | null
          duration: number | null
          id: string
          notes: string | null
          peaks: Json | null
          project_id: string
          stems_url: string | null
          title: string | null
          version_number: number
        }
        Insert: {
          audio_url: string
          author_id: string
          created_at?: string
          download_url?: string | null
          duration?: number | null
          id?: string
          notes?: string | null
          peaks?: Json | null
          project_id: string
          stems_url?: string | null
          title?: string | null
          version_number?: number
        }
        Update: {
          audio_url?: string
          author_id?: string
          created_at?: string
          download_url?: string | null
          duration?: number | null
          id?: string
          notes?: string | null
          peaks?: Json | null
          project_id?: string
          stems_url?: string | null
          title?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_versions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          bpm: number | null
          cover_url: string | null
          created_at: string
          description: string | null
          download_url: string | null
          genre: string | null
          help_needed: string | null
          id: string
          musical_key: string | null
          owner_id: string
          showcase: boolean
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          bpm?: number | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          download_url?: string | null
          genre?: string | null
          help_needed?: string | null
          id?: string
          musical_key?: string | null
          owner_id: string
          showcase?: boolean
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          bpm?: number | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          download_url?: string | null
          genre?: string | null
          help_needed?: string | null
          id?: string
          musical_key?: string | null
          owner_id?: string
          showcase?: boolean
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stem_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          project_id: string
          requester_id: string
          status: string
          version_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          project_id: string
          requester_id: string
          status?: string
          version_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          project_id?: string
          requester_id?: string
          status?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stem_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stem_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stem_requests_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "project_versions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_project_invite: { Args: { _token: string }; Returns: string }
      are_friends: { Args: { a: string; b: string }; Returns: boolean }
      can_read_media: {
        Args: { _bucket: string; _name: string; _uid: string }
        Returns: boolean
      }
      can_view_project: {
        Args: { _pid: string; _uid: string }
        Returns: boolean
      }
      get_or_create_project_invite: {
        Args: { _project_id: string }
        Returns: string
      }
      is_project_owner: {
        Args: { _pid: string; _uid: string }
        Returns: boolean
      }
      is_showcase_media: {
        Args: { _bucket: string; _name: string }
        Returns: boolean
      }
      message_author: { Args: { _mid: string }; Returns: string }
      message_project: { Args: { _mid: string }; Returns: string }
      project_participants: { Args: { _pid: string }; Returns: string[] }
      revoke_project_invite: {
        Args: { _project_id: string }
        Returns: undefined
      }
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
  public: {
    Enums: {},
  },
} as const
