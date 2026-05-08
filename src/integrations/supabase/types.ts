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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accessory_calculation_rules: {
        Row: {
          accessory_type: string
          by_meter: boolean
          created_at: string | null
          description: string | null
          id: string
          ratio: number
          updated_at: string | null
        }
        Insert: {
          accessory_type: string
          by_meter?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          ratio: number
          updated_at?: string | null
        }
        Update: {
          accessory_type?: string
          by_meter?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          ratio?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          acoustic_reduction: number | null
          acoustic_report_code: string | null
          break_resistance: string | null
          break_resistance_notes: string | null
          break_resistance_report_code: string | null
          catalog_page: string | null
          certifier: string
          code: string
          created_at: string
          curvature_radius: number | null
          curvature_radius_description: string | null
          document_url: string | null
          expiry_date: string
          extension_code: string | null
          fire_test_report_code: string | null
          id: string
          issue_date: string
          max_height: number | null
          name: string
          solution_code: string | null
          solution_number: string | null
          structure_width: number | null
          supplier_name: string | null
          type: string
          updated_at: string
          value: string
          wall_thickness: number | null
        }
        Insert: {
          acoustic_reduction?: number | null
          acoustic_report_code?: string | null
          break_resistance?: string | null
          break_resistance_notes?: string | null
          break_resistance_report_code?: string | null
          catalog_page?: string | null
          certifier: string
          code: string
          created_at?: string
          curvature_radius?: number | null
          curvature_radius_description?: string | null
          document_url?: string | null
          expiry_date: string
          extension_code?: string | null
          fire_test_report_code?: string | null
          id?: string
          issue_date: string
          max_height?: number | null
          name: string
          solution_code?: string | null
          solution_number?: string | null
          structure_width?: number | null
          supplier_name?: string | null
          type: string
          updated_at?: string
          value: string
          wall_thickness?: number | null
        }
        Update: {
          acoustic_reduction?: number | null
          acoustic_report_code?: string | null
          break_resistance?: string | null
          break_resistance_notes?: string | null
          break_resistance_report_code?: string | null
          catalog_page?: string | null
          certifier?: string
          code?: string
          created_at?: string
          curvature_radius?: number | null
          curvature_radius_description?: string | null
          document_url?: string | null
          expiry_date?: string
          extension_code?: string | null
          fire_test_report_code?: string | null
          id?: string
          issue_date?: string
          max_height?: number | null
          name?: string
          solution_code?: string | null
          solution_number?: string | null
          structure_width?: number | null
          supplier_name?: string | null
          type?: string
          updated_at?: string
          value?: string
          wall_thickness?: number | null
        }
        Relationships: []
      }
      certified_stratigraphy_materials: {
        Row: {
          certification_id: string | null
          created_at: string
          id: string
          material_code: string | null
          material_description: string
          position_order: number | null
          position_side: string | null
          position_type: string
          specifications: string | null
          thickness: number | null
        }
        Insert: {
          certification_id?: string | null
          created_at?: string
          id?: string
          material_code?: string | null
          material_description: string
          position_order?: number | null
          position_side?: string | null
          position_type: string
          specifications?: string | null
          thickness?: number | null
        }
        Update: {
          certification_id?: string | null
          created_at?: string
          id?: string
          material_code?: string | null
          material_description?: string
          position_order?: number | null
          position_side?: string | null
          position_type?: string
          specifications?: string | null
          thickness?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "certified_stratigraphy_materials_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
        ]
      }
      configurator_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      customer_discounts: {
        Row: {
          created_at: string
          discounts: number[]
          family_id: string | null
          id: string
          net_price: number | null
          notes: string | null
          organization_id: string
          source_document: string | null
          supplier_id: string
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          discounts?: number[]
          family_id?: string | null
          id?: string
          net_price?: number | null
          notes?: string | null
          organization_id: string
          source_document?: string | null
          supplier_id: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          discounts?: number[]
          family_id?: string | null
          id?: string
          net_price?: number | null
          notes?: string | null
          organization_id?: string
          source_document?: string | null
          supplier_id?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_discounts_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "supplier_product_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_discounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_discounts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_stratigraphies: {
        Row: {
          area: number
          calculated_materials: Json | null
          created_at: string
          description: string | null
          estimate_id: string
          finish_level: string | null
          id: string
          is_snapshot: boolean | null
          layers_data: Json | null
          name: string
          original_stratigraphy_id: string | null
          prices_updated_at: string | null
          quantity: number
          stratigraphy_data: Json | null
          stratigraphy_id: string | null
          total_cost: number
          unit_cost: number
          updated_at: string
          wall_height: number | null
        }
        Insert: {
          area?: number
          calculated_materials?: Json | null
          created_at?: string
          description?: string | null
          estimate_id: string
          finish_level?: string | null
          id?: string
          is_snapshot?: boolean | null
          layers_data?: Json | null
          name: string
          original_stratigraphy_id?: string | null
          prices_updated_at?: string | null
          quantity?: number
          stratigraphy_data?: Json | null
          stratigraphy_id?: string | null
          total_cost?: number
          unit_cost?: number
          updated_at?: string
          wall_height?: number | null
        }
        Update: {
          area?: number
          calculated_materials?: Json | null
          created_at?: string
          description?: string | null
          estimate_id?: string
          finish_level?: string | null
          id?: string
          is_snapshot?: boolean | null
          layers_data?: Json | null
          name?: string
          original_stratigraphy_id?: string | null
          prices_updated_at?: string | null
          quantity?: number
          stratigraphy_data?: Json | null
          stratigraphy_id?: string | null
          total_cost?: number
          unit_cost?: number
          updated_at?: string
          wall_height?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_stratigraphies_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_stratigraphies_original_stratigraphy_id_fkey"
            columns: ["original_stratigraphy_id"]
            isOneToOne: false
            referencedRelation: "stratigraphies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_stratigraphies_stratigraphy_id_fkey"
            columns: ["stratigraphy_id"]
            isOneToOne: false
            referencedRelation: "stratigraphies"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_walls: {
        Row: {
          accessories_cost: number
          area: number
          created_at: string
          estimate_id: string
          id: string
          labor_cost: number
          material_cost: number
          name: string
          notes: string | null
          price_per_sqm: number
          stratigraphy_id: string | null
          total_cost: number
          updated_at: string
          wall_type: Database["public"]["Enums"]["wall_type"]
        }
        Insert: {
          accessories_cost?: number
          area?: number
          created_at?: string
          estimate_id: string
          id?: string
          labor_cost?: number
          material_cost?: number
          name: string
          notes?: string | null
          price_per_sqm?: number
          stratigraphy_id?: string | null
          total_cost?: number
          updated_at?: string
          wall_type: Database["public"]["Enums"]["wall_type"]
        }
        Update: {
          accessories_cost?: number
          area?: number
          created_at?: string
          estimate_id?: string
          id?: string
          labor_cost?: number
          material_cost?: number
          name?: string
          notes?: string | null
          price_per_sqm?: number
          stratigraphy_id?: string | null
          total_cost?: number
          updated_at?: string
          wall_type?: Database["public"]["Enums"]["wall_type"]
        }
        Relationships: [
          {
            foreignKeyName: "estimate_walls_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_walls_stratigraphy_id_fkey"
            columns: ["stratigraphy_id"]
            isOneToOne: false
            referencedRelation: "stratigraphies"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string | null
          project_id: string
          status: Database["public"]["Enums"]["estimate_status"]
          total_amount: number
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["estimate_status"]
          total_amount?: number
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["estimate_status"]
          total_amount?: number
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_estimates_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      finish_level_settings: {
        Row: {
          cost_multiplier: number
          created_at: string | null
          finish_level: string
          id: string
          notes: string | null
          time_multiplier: number
          updated_at: string | null
        }
        Insert: {
          cost_multiplier?: number
          created_at?: string | null
          finish_level: string
          id?: string
          notes?: string | null
          time_multiplier?: number
          updated_at?: string | null
        }
        Update: {
          cost_multiplier?: number
          created_at?: string | null
          finish_level?: string
          id?: string
          notes?: string | null
          time_multiplier?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      fire_class_mappings: {
        Row: {
          board_type: string
          created_at: string
          description: string
          fire_class: string
          id: string
          usage_notes: string
        }
        Insert: {
          board_type: string
          created_at?: string
          description: string
          fire_class: string
          id?: string
          usage_notes: string
        }
        Update: {
          board_type?: string
          created_at?: string
          description?: string
          fire_class?: string
          id?: string
          usage_notes?: string
        }
        Relationships: []
      }
      layers: {
        Row: {
          created_at: string
          id: string
          installation_time_minutes: number | null
          inter_axis: number | null
          labor_cost_per_hour: number | null
          labor_cost_per_sqm: number | null
          material_cost_per_sqm: number | null
          material_id: string
          position: number
          screw_cost_per_sqm: number | null
          screw_material_id: string | null
          screw_quantity: number | null
          stratigraphy_id: string
          thickness: number
        }
        Insert: {
          created_at?: string
          id?: string
          installation_time_minutes?: number | null
          inter_axis?: number | null
          labor_cost_per_hour?: number | null
          labor_cost_per_sqm?: number | null
          material_cost_per_sqm?: number | null
          material_id: string
          position: number
          screw_cost_per_sqm?: number | null
          screw_material_id?: string | null
          screw_quantity?: number | null
          stratigraphy_id: string
          thickness: number
        }
        Update: {
          created_at?: string
          id?: string
          installation_time_minutes?: number | null
          inter_axis?: number | null
          labor_cost_per_hour?: number | null
          labor_cost_per_sqm?: number | null
          material_cost_per_sqm?: number | null
          material_id?: string
          position?: number
          screw_cost_per_sqm?: number | null
          screw_material_id?: string | null
          screw_quantity?: number | null
          stratigraphy_id?: string
          thickness?: number
        }
        Relationships: [
          {
            foreignKeyName: "layers_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layers_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials_with_pricing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layers_screw_material_id_fkey"
            columns: ["screw_material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layers_screw_material_id_fkey"
            columns: ["screw_material_id"]
            isOneToOne: false
            referencedRelation: "materials_with_pricing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layers_stratigraphy_id_fkey"
            columns: ["stratigraphy_id"]
            isOneToOne: false
            referencedRelation: "stratigraphies"
            referencedColumns: ["id"]
          },
        ]
      }
      material_coefficients: {
        Row: {
          coefficient_type: string
          coefficient_value: number
          created_at: string
          finish_level: string
          id: string
          material_category: Database["public"]["Enums"]["material_category"]
          unit: string
          updated_at: string
        }
        Insert: {
          coefficient_type: string
          coefficient_value: number
          created_at?: string
          finish_level: string
          id?: string
          material_category: Database["public"]["Enums"]["material_category"]
          unit: string
          updated_at?: string
        }
        Update: {
          coefficient_type?: string
          coefficient_value?: number
          created_at?: string
          finish_level?: string
          id?: string
          material_category?: Database["public"]["Enums"]["material_category"]
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          acoustic_performance: number | null
          board_type: string | null
          board_typology: string | null
          box_pieces: number | null
          carbon_footprint: string | null
          category: Database["public"]["Enums"]["material_category"]
          code: string
          color_hex: string | null
          compatible_board_types: string[] | null
          created_at: string
          delivery_indicator: string | null
          density: number | null
          description: string | null
          discount: string | null
          disposal_percentage: number | null
          ean_code: string | null
          en_520_type: string | null
          environmental_certification: string | null
          epd: string | null
          family_code: string | null
          family_id: string | null
          fire_class: string | null
          fire_description: string | null
          fire_performance_notes: string | null
          fire_resistance_class: string | null
          fire_usage_notes: string | null
          flexural_strength: string | null
          humidity_resistance_class: string | null
          id: string
          incidence_base: number | null
          incidence_per_sqm: number | null
          installation_notes: string | null
          installation_time_per_sqm: number | null
          intended_use: string[] | null
          is_active: boolean
          is_variable_thickness: boolean | null
          length: number | null
          list_price: number | null
          material_type: string | null
          mechanical_performance: string | null
          name: string
          organization_id: string | null
          passo: number | null
          profile_type: string | null
          recycled_content: number | null
          rei_compatible: boolean | null
          sheet_thickness: number | null
          supplier: string
          supplier_id: string | null
          surface_finish: string | null
          surface_hardness: string | null
          sustainability_notes: string | null
          system_compatibility: string | null
          thermal_capacity: string | null
          thermal_conductivity: number | null
          thermal_performance_notes: string | null
          thickness: number | null
          unit: string
          unit_price: number
          updated_at: string
          valid_until: string | null
          vapor_permeability: string | null
          voc_class: string | null
          waste_percentage: number | null
          water_absorption: string | null
          weight_per_ml: number | null
          weight_per_sqm: number | null
          width: number | null
        }
        Insert: {
          acoustic_performance?: number | null
          board_type?: string | null
          board_typology?: string | null
          box_pieces?: number | null
          carbon_footprint?: string | null
          category: Database["public"]["Enums"]["material_category"]
          code: string
          color_hex?: string | null
          compatible_board_types?: string[] | null
          created_at?: string
          delivery_indicator?: string | null
          density?: number | null
          description?: string | null
          discount?: string | null
          disposal_percentage?: number | null
          ean_code?: string | null
          en_520_type?: string | null
          environmental_certification?: string | null
          epd?: string | null
          family_code?: string | null
          family_id?: string | null
          fire_class?: string | null
          fire_description?: string | null
          fire_performance_notes?: string | null
          fire_resistance_class?: string | null
          fire_usage_notes?: string | null
          flexural_strength?: string | null
          humidity_resistance_class?: string | null
          id?: string
          incidence_base?: number | null
          incidence_per_sqm?: number | null
          installation_notes?: string | null
          installation_time_per_sqm?: number | null
          intended_use?: string[] | null
          is_active?: boolean
          is_variable_thickness?: boolean | null
          length?: number | null
          list_price?: number | null
          material_type?: string | null
          mechanical_performance?: string | null
          name: string
          organization_id?: string | null
          passo?: number | null
          profile_type?: string | null
          recycled_content?: number | null
          rei_compatible?: boolean | null
          sheet_thickness?: number | null
          supplier: string
          supplier_id?: string | null
          surface_finish?: string | null
          surface_hardness?: string | null
          sustainability_notes?: string | null
          system_compatibility?: string | null
          thermal_capacity?: string | null
          thermal_conductivity?: number | null
          thermal_performance_notes?: string | null
          thickness?: number | null
          unit: string
          unit_price: number
          updated_at?: string
          valid_until?: string | null
          vapor_permeability?: string | null
          voc_class?: string | null
          waste_percentage?: number | null
          water_absorption?: string | null
          weight_per_ml?: number | null
          weight_per_sqm?: number | null
          width?: number | null
        }
        Update: {
          acoustic_performance?: number | null
          board_type?: string | null
          board_typology?: string | null
          box_pieces?: number | null
          carbon_footprint?: string | null
          category?: Database["public"]["Enums"]["material_category"]
          code?: string
          color_hex?: string | null
          compatible_board_types?: string[] | null
          created_at?: string
          delivery_indicator?: string | null
          density?: number | null
          description?: string | null
          discount?: string | null
          disposal_percentage?: number | null
          ean_code?: string | null
          en_520_type?: string | null
          environmental_certification?: string | null
          epd?: string | null
          family_code?: string | null
          family_id?: string | null
          fire_class?: string | null
          fire_description?: string | null
          fire_performance_notes?: string | null
          fire_resistance_class?: string | null
          fire_usage_notes?: string | null
          flexural_strength?: string | null
          humidity_resistance_class?: string | null
          id?: string
          incidence_base?: number | null
          incidence_per_sqm?: number | null
          installation_notes?: string | null
          installation_time_per_sqm?: number | null
          intended_use?: string[] | null
          is_active?: boolean
          is_variable_thickness?: boolean | null
          length?: number | null
          list_price?: number | null
          material_type?: string | null
          mechanical_performance?: string | null
          name?: string
          organization_id?: string | null
          passo?: number | null
          profile_type?: string | null
          recycled_content?: number | null
          rei_compatible?: boolean | null
          sheet_thickness?: number | null
          supplier?: string
          supplier_id?: string | null
          surface_finish?: string | null
          surface_hardness?: string | null
          sustainability_notes?: string | null
          system_compatibility?: string | null
          thermal_capacity?: string | null
          thermal_conductivity?: number | null
          thermal_performance_notes?: string | null
          thickness?: number | null
          unit?: string
          unit_price?: number
          updated_at?: string
          valid_until?: string | null
          vapor_permeability?: string | null
          voc_class?: string | null
          waste_percentage?: number | null
          water_absorption?: string | null
          weight_per_ml?: number | null
          weight_per_sqm?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "supplier_product_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["organization_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["organization_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["organization_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          is_default: boolean
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          is_default?: boolean
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          is_default?: boolean
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
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
          billing_email: string | null
          country_code: string
          created_at: string
          id: string
          name: string
          plan: string
          settings: Json
          slug: string
          trial_ends_at: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          billing_email?: string | null
          country_code?: string
          created_at?: string
          id?: string
          name: string
          plan?: string
          settings?: Json
          slug: string
          trial_ends_at?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          billing_email?: string | null
          country_code?: string
          created_at?: string
          id?: string
          name?: string
          plan?: string
          settings?: Json
          slug?: string
          trial_ends_at?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client: string
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          client: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          client?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      screw_configurations: {
        Row: {
          compatible_board_types: string[]
          created_at: string | null
          id: string
          margin: number
          notes: string | null
          plates_count: number
          screw_code: string
          screw_length: number
          updated_at: string | null
        }
        Insert: {
          compatible_board_types: string[]
          created_at?: string | null
          id?: string
          margin?: number
          notes?: string | null
          plates_count: number
          screw_code: string
          screw_length: number
          updated_at?: string | null
        }
        Update: {
          compatible_board_types?: string[]
          created_at?: string | null
          id?: string
          margin?: number
          notes?: string | null
          plates_count?: number
          screw_code?: string
          screw_length?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      screw_preference_rules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          max_length_mm: number | null
          min_length_mm: number
          preferred_order: string[]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_length_mm?: number | null
          min_length_mm: number
          preferred_order: string[]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_length_mm?: number | null
          min_length_mm?: number
          preferred_order?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      screw_quantity_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          position_in_block: number
          quantity_per_sqm: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          position_in_block: number
          quantity_per_sqm: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          position_in_block?: number
          quantity_per_sqm?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      stratigraphies: {
        Row: {
          acoustic_performance: number | null
          certification_id: string | null
          comprehensive_cost_per_sqm: number | null
          cost_per_sqm: number | null
          created_at: string
          description: string | null
          fire_resistance_class: string | null
          id: string
          installation_time_per_sqm: number | null
          is_certified: boolean
          labor_cost_per_sqm: number | null
          material_cost_per_sqm: number | null
          name: string
          organization_id: string | null
          screw_cost_per_sqm: number | null
          thermal_performance: number | null
          total_thickness: number
          type: Database["public"]["Enums"]["wall_type"]
          updated_at: string
          user_id: string | null
          weight_per_sqm: number | null
        }
        Insert: {
          acoustic_performance?: number | null
          certification_id?: string | null
          comprehensive_cost_per_sqm?: number | null
          cost_per_sqm?: number | null
          created_at?: string
          description?: string | null
          fire_resistance_class?: string | null
          id?: string
          installation_time_per_sqm?: number | null
          is_certified?: boolean
          labor_cost_per_sqm?: number | null
          material_cost_per_sqm?: number | null
          name: string
          organization_id?: string | null
          screw_cost_per_sqm?: number | null
          thermal_performance?: number | null
          total_thickness?: number
          type: Database["public"]["Enums"]["wall_type"]
          updated_at?: string
          user_id?: string | null
          weight_per_sqm?: number | null
        }
        Update: {
          acoustic_performance?: number | null
          certification_id?: string | null
          comprehensive_cost_per_sqm?: number | null
          cost_per_sqm?: number | null
          created_at?: string
          description?: string | null
          fire_resistance_class?: string | null
          id?: string
          installation_time_per_sqm?: number | null
          is_certified?: boolean
          labor_cost_per_sqm?: number | null
          material_cost_per_sqm?: number | null
          name?: string
          organization_id?: string | null
          screw_cost_per_sqm?: number | null
          thermal_performance?: number | null
          total_thickness?: number
          type?: Database["public"]["Enums"]["wall_type"]
          updated_at?: string
          user_id?: string | null
          weight_per_sqm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stratigraphies_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stratigraphies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_product_families: {
        Row: {
          brand: string | null
          category: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_product_families_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          country_code: string
          created_at: string
          default_discount: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          notes: string | null
          organization_id: string | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          country_code?: string
          created_at?: string
          default_discount?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          notes?: string | null
          organization_id?: string | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          country_code?: string
          created_at?: string
          default_discount?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      wall_configurations: {
        Row: {
          acoustic_performance: number | null
          area: number
          configuration_data: Json | null
          cost_per_sqm: number | null
          created_at: string
          description: string | null
          fire_resistance_class: string | null
          id: string
          name: string
          organization_id: string | null
          stratigraphy_id: string | null
          thermal_performance: number | null
          total_cost: number | null
          updated_at: string
          user_id: string
          wall_type: Database["public"]["Enums"]["wall_type"]
          weight_per_sqm: number | null
        }
        Insert: {
          acoustic_performance?: number | null
          area?: number
          configuration_data?: Json | null
          cost_per_sqm?: number | null
          created_at?: string
          description?: string | null
          fire_resistance_class?: string | null
          id?: string
          name: string
          organization_id?: string | null
          stratigraphy_id?: string | null
          thermal_performance?: number | null
          total_cost?: number | null
          updated_at?: string
          user_id: string
          wall_type: Database["public"]["Enums"]["wall_type"]
          weight_per_sqm?: number | null
        }
        Update: {
          acoustic_performance?: number | null
          area?: number
          configuration_data?: Json | null
          cost_per_sqm?: number | null
          created_at?: string
          description?: string | null
          fire_resistance_class?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          stratigraphy_id?: string | null
          thermal_performance?: number | null
          total_cost?: number | null
          updated_at?: string
          user_id?: string
          wall_type?: Database["public"]["Enums"]["wall_type"]
          weight_per_sqm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wall_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wall_configurations_stratigraphy_id_fkey"
            columns: ["stratigraphy_id"]
            isOneToOne: false
            referencedRelation: "stratigraphies"
            referencedColumns: ["id"]
          },
        ]
      }
      walls: {
        Row: {
          accessories_cost: number
          area: number
          created_at: string
          estimate_id: string
          id: string
          labor_cost: number
          name: string
          price_per_sqm: number
          stratigraphy_id: string
          total_cost: number
          type: Database["public"]["Enums"]["wall_type"]
          updated_at: string
        }
        Insert: {
          accessories_cost?: number
          area: number
          created_at?: string
          estimate_id: string
          id?: string
          labor_cost?: number
          name: string
          price_per_sqm?: number
          stratigraphy_id: string
          total_cost?: number
          type: Database["public"]["Enums"]["wall_type"]
          updated_at?: string
        }
        Update: {
          accessories_cost?: number
          area?: number
          created_at?: string
          estimate_id?: string
          id?: string
          labor_cost?: number
          name?: string
          price_per_sqm?: number
          stratigraphy_id?: string
          total_cost?: number
          type?: Database["public"]["Enums"]["wall_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "walls_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walls_stratigraphy_id_fkey"
            columns: ["stratigraphy_id"]
            isOneToOne: false
            referencedRelation: "stratigraphies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      materials_with_pricing: {
        Row: {
          acoustic_performance: number | null
          board_type: string | null
          board_typology: string | null
          box_pieces: number | null
          carbon_footprint: string | null
          category: Database["public"]["Enums"]["material_category"] | null
          code: string | null
          color_hex: string | null
          compatible_board_types: string[] | null
          created_at: string | null
          delivery_indicator: string | null
          density: number | null
          description: string | null
          discount: string | null
          discount_chain: number[] | null
          discount_id: string | null
          discount_org_id: string | null
          discount_valid_until: string | null
          disposal_percentage: number | null
          ean_code: string | null
          en_520_type: string | null
          environmental_certification: string | null
          epd: string | null
          family_code: string | null
          family_id: string | null
          fire_class: string | null
          fire_description: string | null
          fire_performance_notes: string | null
          fire_resistance_class: string | null
          fire_usage_notes: string | null
          flexural_strength: string | null
          has_discount: boolean | null
          humidity_resistance_class: string | null
          id: string | null
          incidence_base: number | null
          incidence_per_sqm: number | null
          installation_notes: string | null
          installation_time_per_sqm: number | null
          intended_use: string[] | null
          is_active: boolean | null
          is_variable_thickness: boolean | null
          length: number | null
          list_price: number | null
          material_type: string | null
          mechanical_performance: string | null
          name: string | null
          net_price: number | null
          organization_id: string | null
          passo: number | null
          profile_type: string | null
          recycled_content: number | null
          rei_compatible: boolean | null
          sheet_thickness: number | null
          supplier: string | null
          supplier_id: string | null
          surface_finish: string | null
          surface_hardness: string | null
          sustainability_notes: string | null
          system_compatibility: string | null
          thermal_capacity: string | null
          thermal_conductivity: number | null
          thermal_performance_notes: string | null
          thickness: number | null
          unit: string | null
          unit_price: number | null
          updated_at: string | null
          valid_until: string | null
          vapor_permeability: string | null
          voc_class: string | null
          waste_percentage: number | null
          water_absorption: string | null
          weight_per_ml: number | null
          weight_per_sqm: number | null
          width: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_discounts_organization_id_fkey"
            columns: ["discount_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "supplier_product_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles_with_names: {
        Row: {
          created_at: string | null
          id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invitation: { Args: { p_token: string }; Returns: string }
      cumulative_discount_factor: {
        Args: { p_discounts: number[] }
        Returns: number
      }
      default_org_id: { Args: never; Returns: string }
      get_invitation_by_token: {
        Args: { p_token: string }
        Returns: {
          expires_at: string
          invitation_email: string
          invitation_id: string
          invitation_role: Database["public"]["Enums"]["organization_role"]
          is_accepted: boolean
          is_expired: boolean
          is_revoked: boolean
          organization_id: string
          organization_name: string
        }[]
      }
      has_org_role: {
        Args: {
          p_organization_id: string
          p_roles: Database["public"]["Enums"]["organization_role"][]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_super: { Args: { _user_id: string }; Returns: boolean }
      is_member_of: { Args: { p_organization_id: string }; Returns: boolean }
      org_role_in: {
        Args: { p_organization_id: string }
        Returns: Database["public"]["Enums"]["organization_role"]
      }
      resolve_family_id: {
        Args: { p_family_code: string; p_supplier_id: string }
        Returns: string
      }
      revoke_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      update_comprehensive_costs: { Args: never; Returns: undefined }
      update_comprehensive_costs_correct: { Args: never; Returns: undefined }
      update_comprehensive_costs_final: { Args: never; Returns: undefined }
    }
    Enums: {
      estimate_status: "draft" | "pending" | "approved" | "contracted"
      material_category:
        | "board"
        | "structure_frame"
        | "structure_guide"
        | "insulation"
        | "accessory"
        | "other"
        | "screw"
      organization_role: "owner" | "admin" | "manager" | "technician" | "viewer"
      project_status: "active" | "completed" | "archived"
      user_role:
        | "user"
        | "power_user"
        | "technical_validator"
        | "admin"
        | "super_user"
      wall_type: "plating" | "counterwall" | "single" | "double" | "ceiling"
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
      estimate_status: ["draft", "pending", "approved", "contracted"],
      material_category: [
        "board",
        "structure_frame",
        "structure_guide",
        "insulation",
        "accessory",
        "other",
        "screw",
      ],
      organization_role: ["owner", "admin", "manager", "technician", "viewer"],
      project_status: ["active", "completed", "archived"],
      user_role: [
        "user",
        "power_user",
        "technical_validator",
        "admin",
        "super_user",
      ],
      wall_type: ["plating", "counterwall", "single", "double", "ceiling"],
    },
  },
} as const
