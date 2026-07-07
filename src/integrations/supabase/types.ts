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
      attestations_log: {
        Row: {
          created_at: string
          entreprise_id: string | null
          id: string
          matricule: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entreprise_id?: string | null
          id?: string
          matricule: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          entreprise_id?: string | null
          id?: string
          matricule?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attestations_log_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      conges: {
        Row: {
          created_at: string
          date_debut: string
          date_fin: string
          entreprise_id: string | null
          id: string
          jours: number
          matricule: string
          motif: string | null
          statut: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_debut: string
          date_fin: string
          entreprise_id?: string | null
          id?: string
          jours?: number
          matricule: string
          motif?: string | null
          statut?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_debut?: string
          date_fin?: string
          entreprise_id?: string | null
          id?: string
          jours?: number
          matricule?: string
          motif?: string | null
          statut?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conges_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      contrats: {
        Row: {
          clauses_particulieres: string | null
          created_at: string
          date_debut: string
          date_fin: string | null
          entreprise_id: string | null
          id: string
          lieu_travail: string | null
          matricule: string
          periode_essai_mois: number | null
          remuneration: number | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clauses_particulieres?: string | null
          created_at?: string
          date_debut: string
          date_fin?: string | null
          entreprise_id?: string | null
          id?: string
          lieu_travail?: string | null
          matricule: string
          periode_essai_mois?: number | null
          remuneration?: number | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clauses_particulieres?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          entreprise_id?: string | null
          id?: string
          lieu_travail?: string | null
          matricule?: string
          periode_essai_mois?: number | null
          remuneration?: number | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contrats_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      convention_categories: {
        Row: {
          code: string
          convention_id: string
          created_at: string
          entreprise_id: string | null
          id: string
          libelle: string
          salaire_minima: number | null
          statut: string | null
        }
        Insert: {
          code: string
          convention_id: string
          created_at?: string
          entreprise_id?: string | null
          id?: string
          libelle: string
          salaire_minima?: number | null
          statut?: string | null
        }
        Update: {
          code?: string
          convention_id?: string
          created_at?: string
          entreprise_id?: string | null
          id?: string
          libelle?: string
          salaire_minima?: number | null
          statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convention_categories_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convention_categories_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      conventions: {
        Row: {
          created_at: string
          date_signature: string | null
          description: string | null
          entreprise_id: string | null
          id: string
          nom: string
          secteur: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_signature?: string | null
          description?: string | null
          entreprise_id?: string | null
          id?: string
          nom: string
          secteur?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_signature?: string | null
          description?: string | null
          entreprise_id?: string | null
          id?: string
          nom?: string
          secteur?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conventions_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          adresse: string | null
          avance_caisse: number
          avance_financiere: number
          avance_tabaski: number
          categorie: string | null
          contrat: string | null
          convention: string | null
          created_at: string
          date_entree: string
          date_naissance: string | null
          date_sortie: string | null
          email: string
          enfants: number
          entreprise_id: string | null
          femmes: number
          fonction: string
          frais_medicaux: number
          heures_abs_maladie: number
          heures_absence: number
          hs115: number
          hs140: number
          hs160: number
          hs200: number
          id: string
          ind_kilometrique: number
          lieu_naissance: string | null
          matricule: string
          motif_sortie: string | null
          nationalite: string | null
          nb_paniers: number
          nom: string
          prenom: string
          ret_cooperative: number
          salaire_base: number
          sexe: string
          situation_famille: string | null
          statut: string | null
          sursalaire: number
          taux_maladie: number
          telephone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adresse?: string | null
          avance_caisse?: number
          avance_financiere?: number
          avance_tabaski?: number
          categorie?: string | null
          contrat?: string | null
          convention?: string | null
          created_at?: string
          date_entree: string
          date_naissance?: string | null
          date_sortie?: string | null
          email?: string
          enfants?: number
          entreprise_id?: string | null
          femmes?: number
          fonction?: string
          frais_medicaux?: number
          heures_abs_maladie?: number
          heures_absence?: number
          hs115?: number
          hs140?: number
          hs160?: number
          hs200?: number
          id?: string
          ind_kilometrique?: number
          lieu_naissance?: string | null
          matricule: string
          motif_sortie?: string | null
          nationalite?: string | null
          nb_paniers?: number
          nom: string
          prenom: string
          ret_cooperative?: number
          salaire_base?: number
          sexe?: string
          situation_famille?: string | null
          statut?: string | null
          sursalaire?: number
          taux_maladie?: number
          telephone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adresse?: string | null
          avance_caisse?: number
          avance_financiere?: number
          avance_tabaski?: number
          categorie?: string | null
          contrat?: string | null
          convention?: string | null
          created_at?: string
          date_entree?: string
          date_naissance?: string | null
          date_sortie?: string | null
          email?: string
          enfants?: number
          entreprise_id?: string | null
          femmes?: number
          fonction?: string
          frais_medicaux?: number
          heures_abs_maladie?: number
          heures_absence?: number
          hs115?: number
          hs140?: number
          hs160?: number
          hs200?: number
          id?: string
          ind_kilometrique?: number
          lieu_naissance?: string | null
          matricule?: string
          motif_sortie?: string | null
          nationalite?: string | null
          nb_paniers?: number
          nom?: string
          prenom?: string
          ret_cooperative?: number
          salaire_base?: number
          sexe?: string
          situation_famille?: string | null
          statut?: string | null
          sursalaire?: number
          taux_maladie?: number
          telephone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      entreprise_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          entreprise_id: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          entreprise_id: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          entreprise_id?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "entreprise_invitations_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      entreprise_members: {
        Row: {
          created_at: string
          entreprise_id: string
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          entreprise_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          entreprise_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entreprise_members_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      entreprises: {
        Row: {
          adresse: string | null
          bulletin_template: string
          created_at: string
          email: string | null
          id: string
          logo: string | null
          ninea: string | null
          nom: string
          rccm: string | null
          telephone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adresse?: string | null
          bulletin_template?: string
          created_at?: string
          email?: string | null
          id?: string
          logo?: string | null
          ninea?: string | null
          nom?: string
          rccm?: string | null
          telephone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adresse?: string | null
          bulletin_template?: string
          created_at?: string
          email?: string | null
          id?: string
          logo?: string | null
          ninea?: string | null
          nom?: string
          rccm?: string | null
          telephone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payroll_history: {
        Row: {
          annee: number
          created_at: string
          data: Json
          entreprise_id: string | null
          id: string
          jours_absence: number | null
          mois: number
          updated_at: string
          user_id: string
        }
        Insert: {
          annee: number
          created_at?: string
          data?: Json
          entreprise_id?: string | null
          id?: string
          jours_absence?: number | null
          mois: number
          updated_at?: string
          user_id: string
        }
        Update: {
          annee?: number
          created_at?: string
          data?: Json
          entreprise_id?: string | null
          id?: string
          jours_absence?: number | null
          mois?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_history_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_params: {
        Row: {
          created_at: string
          entreprise_id: string | null
          id: string
          params: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entreprise_id?: string | null
          id?: string
          params?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entreprise_id?: string | null
          id?: string
          params?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_params_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_entreprise_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_member_any: {
        Args: {
          _entreprise_id: string
          _roles: Database["public"]["Enums"]["app_role"][]
        }
        Returns: boolean
      }
      is_member_of: {
        Args: {
          _entreprise_id: string
          _role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "drh" | "comptable" | "manager"
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
      app_role: ["admin", "drh", "comptable", "manager"],
    },
  },
} as const
