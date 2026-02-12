export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          phone_zalo: string | null;
          company_name: string | null;
          industry: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          phone_zalo?: string | null;
          company_name?: string | null;
          industry?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          phone_zalo?: string | null;
          company_name?: string | null;
          industry?: string | null;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          profile_id: string | null;
          email: string;
          phone_zalo: string;
          company_name: string | null;
          intent_tag: string;
          source_page: string | null;
          query_text: string | null;
          is_processed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          email: string;
          phone_zalo: string;
          company_name?: string | null;
          intent_tag?: string;
          source_page?: string | null;
          query_text?: string | null;
          is_processed?: boolean;
          created_at?: string;
        };
        Update: {
          profile_id?: string | null;
          email?: string;
          phone_zalo?: string;
          company_name?: string | null;
          intent_tag?: string;
          source_page?: string | null;
          query_text?: string | null;
          is_processed?: boolean;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          profile_id: string | null;
          session_token: string;
          query_summary: string;
          response_summary: string | null;
          is_converted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          session_token: string;
          query_summary: string;
          response_summary?: string | null;
          is_converted?: boolean;
          created_at?: string;
        };
        Update: {
          profile_id?: string | null;
          session_token?: string;
          query_summary?: string;
          response_summary?: string | null;
          is_converted?: boolean;
        };
      };
      chemicals: {
        Row: {
          id: string;
          name_vi: string;
          name_en: string;
          cas_number: string | null;
          un_number: string | null;
          ghs_classification: string | null;
          hazard_pictograms: string[] | null;
          license_required: boolean;
          license_type: string | null;
          storage_requirements: string | null;
          penalty_info: string | null;
          msds_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name_vi: string;
          name_en: string;
          cas_number?: string | null;
          un_number?: string | null;
          ghs_classification?: string | null;
          hazard_pictograms?: string[] | null;
          license_required?: boolean;
          license_type?: string | null;
          storage_requirements?: string | null;
          penalty_info?: string | null;
          msds_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name_vi?: string;
          name_en?: string;
          cas_number?: string | null;
          un_number?: string | null;
          ghs_classification?: string | null;
          hazard_pictograms?: string[] | null;
          license_required?: boolean;
          license_type?: string | null;
          storage_requirements?: string | null;
          penalty_info?: string | null;
          msds_url?: string | null;
          updated_at?: string;
        };
      };
      chemicals_2026: {
        Row: {
          id: string;
          cas_number: string | null;
          vietnamese_name: string;
          english_name: string;
          formula: string | null;
          decree_24_appendix: string;
          appendix_category: string | null;
          requires_incident_plan: boolean;
          threshold_mass_kg: number | null;
          license_type: string | null;
          import_declaration_required: boolean;
          special_control: boolean;
          hazard_class: string | null;
          un_number: string | null;
          storage_requirements: string | null;
          legal_reference: string | null;
          penalty_range: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cas_number?: string | null;
          vietnamese_name: string;
          english_name: string;
          formula?: string | null;
          decree_24_appendix: string;
          appendix_category?: string | null;
          requires_incident_plan?: boolean;
          threshold_mass_kg?: number | null;
          license_type?: string | null;
          import_declaration_required?: boolean;
          special_control?: boolean;
          hazard_class?: string | null;
          un_number?: string | null;
          storage_requirements?: string | null;
          legal_reference?: string | null;
          penalty_range?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          cas_number?: string | null;
          vietnamese_name?: string;
          english_name?: string;
          formula?: string | null;
          decree_24_appendix?: string;
          appendix_category?: string | null;
          requires_incident_plan?: boolean;
          threshold_mass_kg?: number | null;
          license_type?: string | null;
          import_declaration_required?: boolean;
          special_control?: boolean;
          hazard_class?: string | null;
          un_number?: string | null;
          storage_requirements?: string | null;
          legal_reference?: string | null;
          penalty_range?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}

export type Chemical = Database['public']['Tables']['chemicals']['Row'];
export type Chemical2026 = Database['public']['Tables']['chemicals_2026']['Row'];
export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadInsert = Database['public']['Tables']['leads']['Insert'];
export type ChatSession = Database['public']['Tables']['chat_sessions']['Row'];
