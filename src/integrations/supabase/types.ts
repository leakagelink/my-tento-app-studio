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
      banners: {
        Row: {
          active: boolean
          banner_type: string
          created_at: string
          id: string
          image_url: string | null
          sort_order: number
          subtitle: string
          title: string
        }
        Insert: {
          active?: boolean
          banner_type: string
          created_at?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          subtitle?: string
          title: string
        }
        Update: {
          active?: boolean
          banner_type?: string
          created_at?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          subtitle?: string
          title?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_code: string
          booking_type: string
          city: string
          created_at: string
          customer_id: string
          details: Json
          discount: number
          drop_location: string
          event_date: string
          event_time: string
          guests: number
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          pickup_location: string
          provider_id: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          subtotal: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          booking_code?: string
          booking_type: string
          city?: string
          created_at?: string
          customer_id: string
          details?: Json
          discount?: number
          drop_location?: string
          event_date: string
          event_time?: string
          guests?: number
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_location?: string
          provider_id?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          booking_code?: string
          booking_type?: string
          city?: string
          created_at?: string
          customer_id?: string
          details?: Json
          discount?: number
          drop_location?: string
          event_date?: string
          event_time?: string
          guests?: number
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_location?: string
          provider_id?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          image_url: string | null
          name: string
          price: number
          provider_id: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          price?: number
          provider_id: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience: Database["public"]["Enums"]["app_role"] | null
          created_at: string
          id: string
          message: string
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          audience?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          audience?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_percent: number
          ends_at: string | null
          id: string
          max_discount: number | null
          starts_at: string | null
          title: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_percent: number
          ends_at?: string | null
          id?: string
          max_discount?: number | null
          starts_at?: string | null
          title: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_percent?: number
          ends_at?: string | null
          id?: string
          max_discount?: number | null
          starts_at?: string | null
          title?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          customer_id: string
          id: string
          method: string
          provider_order_id: string | null
          provider_payment_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          customer_id: string
          id?: string
          method: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          customer_id?: string
          id?: string
          method?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string
          avatar_url: string | null
          city: string
          created_at: string
          full_name: string
          id: string
          phone: string
          preferred_language: string
          updated_at: string
        }
        Insert: {
          address?: string
          avatar_url?: string | null
          city?: string
          created_at?: string
          full_name?: string
          id: string
          phone?: string
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          address?: string
          avatar_url?: string | null
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_availability: {
        Row: {
          available_date: string
          id: string
          provider_id: string
          status: string
        }
        Insert: {
          available_date: string
          id?: string
          provider_id: string
          status?: string
        }
        Update: {
          available_date?: string
          id?: string
          provider_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_availability_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_services: {
        Row: {
          active: boolean
          base_price: number
          details: string
          id: string
          provider_id: string
          service_id: string
        }
        Insert: {
          active?: boolean
          base_price?: number
          details?: string
          id?: string
          provider_id: string
          service_id: string
        }
        Update: {
          active?: boolean
          base_price?: number
          details?: string
          id?: string
          provider_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          active: boolean
          area: string
          banner_url: string | null
          business_name: string
          city: string
          created_at: string
          description: string
          distance_km: number
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          owner_id: string | null
          phone: string
          rating: number
          review_count: number
          updated_at: string
          verified: boolean
        }
        Insert: {
          active?: boolean
          area?: string
          banner_url?: string | null
          business_name: string
          city: string
          created_at?: string
          description?: string
          distance_km?: number
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          owner_id?: string | null
          phone?: string
          rating?: number
          review_count?: number
          updated_at?: string
          verified?: boolean
        }
        Update: {
          active?: boolean
          area?: string
          banner_url?: string | null
          business_name?: string
          city?: string
          created_at?: string
          description?: string
          distance_km?: number
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          owner_id?: string | null
          phone?: string
          rating?: number
          review_count?: number
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string
          created_at: string
          customer_id: string
          id: string
          provider_id: string
          rating: number
        }
        Insert: {
          booking_id: string
          comment?: string
          created_at?: string
          customer_id: string
          id?: string
          provider_id: string
          rating: number
        }
        Update: {
          booking_id?: string
          comment?: string
          created_at?: string
          customer_id?: string
          id?: string
          provider_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          subtitle: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          subtitle?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          subtitle?: string
        }
        Relationships: []
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
      vehicles: {
        Row: {
          active: boolean
          base_fare: number
          created_at: string
          id: string
          per_km_rate: number
          provider_id: string | null
          seats: number
          vehicle_number: string
          vehicle_type: string
        }
        Insert: {
          active?: boolean
          base_fare?: number
          created_at?: string
          id?: string
          per_km_rate?: number
          provider_id?: string | null
          seats?: number
          vehicle_number?: string
          vehicle_type: string
        }
        Update: {
          active?: boolean
          base_fare?: number
          created_at?: string
          id?: string
          per_km_rate?: number
          provider_id?: string | null
          seats?: number
          vehicle_number?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
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
      register_provider: {
        Args: {
          _area: string
          _business_name: string
          _city: string
          _description: string
          _phone: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "provider" | "customer"
      booking_status:
        | "pending"
        | "confirmed"
        | "team_assigned"
        | "setup_started"
        | "completed"
        | "declined"
        | "cancelled"
      payment_status:
        | "pending"
        | "advance_paid"
        | "paid"
        | "failed"
        | "refunded"
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
    Enums: {
      app_role: ["admin", "provider", "customer"],
      booking_status: [
        "pending",
        "confirmed",
        "team_assigned",
        "setup_started",
        "completed",
        "declined",
        "cancelled",
      ],
      payment_status: ["pending", "advance_paid", "paid", "failed", "refunded"],
    },
  },
} as const
