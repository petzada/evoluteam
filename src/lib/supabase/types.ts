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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          company_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: number
          metadata: Json
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          company_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: never
          metadata?: Json
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          company_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: never
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          segment: string
          status: string
          team_size: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          segment: string
          status?: string
          team_size: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          segment?: string
          status?: string
          team_size?: string
          updated_at?: string
        }
        Relationships: []
      }
      competencies: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_archived: boolean
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "competencies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_archived: boolean
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_archived?: boolean
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_archived?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          email: string
          full_name: string
          hire_date: string
          id: string
          internal_notes: string | null
          manager_id: string | null
          phone: string | null
          position_id: string | null
          status: string
          terminated_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          email: string
          full_name: string
          hire_date: string
          id?: string
          internal_notes?: string | null
          manager_id?: string | null
          phone?: string | null
          position_id?: string | null
          status?: string
          terminated_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          email?: string
          full_name?: string
          hire_date?: string
          id?: string
          internal_notes?: string | null
          manager_id?: string | null
          phone?: string | null
          position_id?: string | null
          status?: string
          terminated_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          email: string
          employee_id: string
          expires_at: string
          id: string
          invited_by: string
          revoked_at: string | null
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          email: string
          employee_id: string
          expires_at: string
          id?: string
          invited_by: string
          revoked_at?: string | null
          role: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          email?: string
          employee_id?: string
          expires_at?: string
          id?: string
          invited_by?: string
          revoked_at?: string | null
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          company_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: number
          link_url: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          company_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: never
          link_url?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          company_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: never
          link_url?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_archived: boolean
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_archived?: boolean
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_archived?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      development_plans: {
        Row: {
          id: string
          company_id: string
          employee_id: string
          cycle_id: string | null
          competency_id: string | null
          objective: string
          due_date: string
          status: string
          created_by: string
          concluded_at: string | null
          cancelled_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          employee_id: string
          cycle_id?: string | null
          competency_id?: string | null
          objective: string
          due_date: string
          status?: string
          created_by: string
          concluded_at?: string | null
          cancelled_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          employee_id?: string
          cycle_id?: string | null
          competency_id?: string | null
          objective?: string
          due_date?: string
          status?: string
          created_by?: string
          concluded_at?: string | null
          cancelled_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      development_plan_actions: {
        Row: {
          id: string
          plan_id: string
          company_id: string
          title: string
          due_date: string
          status: string
          responsible_employee_id: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          company_id: string
          title: string
          due_date: string
          status?: string
          responsible_employee_id: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          company_id?: string
          title?: string
          due_date?: string
          status?: string
          responsible_employee_id?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      development_plan_comments: {
        Row: {
          id: string
          plan_id: string
          company_id: string
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          plan_id: string
          company_id: string
          author_id: string
          body: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          plan_id?: string
          company_id?: string
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          company_id: string
          competency_id: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          message: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          type: string
          visibility: string
        }
        Insert: {
          company_id: string
          competency_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          message: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          type: string
          visibility: string
        }
        Update: {
          company_id?: string
          competency_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          message?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          type?: string
          visibility?: string
        }
        Relationships: []
      }
      review_cycles: {
        Row: {
          archived_at: string | null
          closed_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          include_manager: boolean
          include_self: boolean
          name: string
          period_end: string
          period_start: string
          published_at: string | null
          response_end: string
          response_start: string
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          closed_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          include_manager?: boolean
          include_self?: boolean
          name: string
          period_end: string
          period_start: string
          published_at?: string | null
          response_end: string
          response_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          closed_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          include_manager?: boolean
          include_self?: boolean
          name?: string
          period_end?: string
          period_start?: string
          published_at?: string | null
          response_end?: string
          response_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_cycle_participants: {
        Row: {
          added_at: string
          added_by: string | null
          company_id: string
          cycle_id: string
          employee_id: string
          id: string
          removed_at: string | null
          result_released_at: string | null
          result_released_by: string | null
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          company_id: string
          cycle_id: string
          employee_id: string
          id?: string
          removed_at?: string | null
          result_released_at?: string | null
          result_released_by?: string | null
        }
        Update: {
          added_at?: string
          added_by?: string | null
          company_id?: string
          cycle_id?: string
          employee_id?: string
          id?: string
          removed_at?: string | null
          result_released_at?: string | null
          result_released_by?: string | null
        }
        Relationships: []
      }
      review_forms: {
        Row: {
          company_id: string
          created_at: string
          cycle_id: string
          id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          cycle_id: string
          id?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          cycle_id?: string
          id?: string
        }
        Relationships: []
      }
      review_questions: {
        Row: {
          company_id: string
          competency_id: string | null
          form_id: string
          id: string
          is_required: boolean
          question_order: number
          question_text: string
          scale_max: number | null
          scale_min: number | null
          type: string
        }
        Insert: {
          company_id: string
          competency_id?: string | null
          form_id: string
          id?: string
          is_required?: boolean
          question_order: number
          question_text: string
          scale_max?: number | null
          scale_min?: number | null
          type: string
        }
        Update: {
          company_id?: string
          competency_id?: string | null
          form_id?: string
          id?: string
          is_required?: boolean
          question_order?: number
          question_text?: string
          scale_max?: number | null
          scale_min?: number | null
          type?: string
        }
        Relationships: []
      }
      review_assignments: {
        Row: {
          cancelled_at: string | null
          cancelled_reason: string | null
          company_id: string
          cycle_id: string
          form_id: string
          id: string
          reviewee_id: string
          reviewer_id: string
          status: string
          submitted_at: string | null
          type: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          company_id: string
          cycle_id: string
          form_id: string
          id?: string
          reviewee_id: string
          reviewer_id: string
          status?: string
          submitted_at?: string | null
          type: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          company_id?: string
          cycle_id?: string
          form_id?: string
          id?: string
          reviewee_id?: string
          reviewer_id?: string
          status?: string
          submitted_at?: string | null
          type?: string
        }
        Relationships: []
      }
      review_answers: {
        Row: {
          answered_at: string
          assignment_id: string
          company_id: string
          id: string
          question_id: string
          scale_value: number | null
          text_value: string | null
        }
        Insert: {
          answered_at?: string
          assignment_id: string
          company_id: string
          id?: string
          question_id: string
          scale_value?: number | null
          text_value?: string | null
        }
        Update: {
          answered_at?: string
          assignment_id?: string
          company_id?: string
          id?: string
          question_id?: string
          scale_value?: number | null
          text_value?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_stages: {
        Row: {
          id: string
          company_id: string
          name: string
          position: number
          kind: 'entry' | 'intermediate' | 'hired_terminal'
          notifies_hiring_manager: boolean
          archived_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          position: number
          kind?: 'entry' | 'intermediate' | 'hired_terminal'
          notifies_hiring_manager?: boolean
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['recruitment_stages']['Insert']>
        Relationships: []
      }
      job_openings: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string | null
          department_id: string | null
          position_id: string | null
          hiring_manager_id: string | null
          employment_type: 'clt' | 'pj' | 'estagio' | 'temporario' | 'freelancer'
          workplace_type: 'presencial' | 'remoto' | 'hibrido'
          location: string | null
          open_positions: number
          status: 'open' | 'paused' | 'closed' | 'cancelled'
          closed_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description?: string | null
          department_id?: string | null
          position_id?: string | null
          hiring_manager_id?: string | null
          employment_type: 'clt' | 'pj' | 'estagio' | 'temporario' | 'freelancer'
          workplace_type: 'presencial' | 'remoto' | 'hibrido'
          location?: string | null
          open_positions?: number
          status?: 'open' | 'paused' | 'closed' | 'cancelled'
          closed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['job_openings']['Insert']>
        Relationships: [
          {
            foreignKeyName: "job_openings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_openings_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_openings_hiring_manager_id_fkey"
            columns: ["hiring_manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          id: string
          company_id: string
          name: string
          email: string
          phone: string | null
          linkedin_url: string | null
          resume_url: string | null
          source: 'indicacao' | 'linkedin' | 'site_empresa' | 'whatsapp' | 'instagram' | 'indeed' | 'gupy' | 'manual' | 'outro'
          source_other: string | null
          notes: string | null
          hired_employee_id: string | null
          archived_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          email: string
          phone?: string | null
          linkedin_url?: string | null
          resume_url?: string | null
          source?: 'indicacao' | 'linkedin' | 'site_empresa' | 'whatsapp' | 'instagram' | 'indeed' | 'gupy' | 'manual' | 'outro'
          source_other?: string | null
          notes?: string | null
          hired_employee_id?: string | null
          archived_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['candidates']['Insert']>
        Relationships: []
      }
      job_applications: {
        Row: {
          id: string
          company_id: string
          job_opening_id: string
          candidate_id: string
          current_stage_id: string
          status: 'in_progress' | 'hired' | 'rejected' | 'withdrawn' | 'frozen'
          rejection_reason: string | null
          withdrawal_reason: string | null
          reason_other: string | null
          frozen_reason_notes: string | null
          stage_entered_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          job_opening_id: string
          candidate_id: string
          current_stage_id: string
          status?: 'in_progress' | 'hired' | 'rejected' | 'withdrawn' | 'frozen'
          rejection_reason?: string | null
          withdrawal_reason?: string | null
          reason_other?: string | null
          frozen_reason_notes?: string | null
          stage_entered_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['job_applications']['Insert']>
        Relationships: [
          {
            foreignKeyName: "job_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_opening_id_fkey"
            columns: ["job_opening_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "recruitment_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_stage_history: {
        Row: {
          id: string
          application_id: string
          from_stage_id: string | null
          to_stage_id: string | null
          status_change: Json | null
          reason_code: string | null
          reason_notes: string | null
          changed_at: string
          changed_by: string | null
        }
        Insert: {
          id?: string
          application_id: string
          from_stage_id?: string | null
          to_stage_id?: string | null
          status_change?: Json | null
          reason_code?: string | null
          reason_notes?: string | null
          changed_at?: string
          changed_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['candidate_stage_history']['Insert']>
        Relationships: [
          {
            foreignKeyName: "candidate_stage_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_stage_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "recruitment_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_stage_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "recruitment_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_scorecards: {
        Row: {
          id: string
          company_id: string
          application_id: string
          stage_id: string
          author_id: string
          rating_communication: number
          rating_experience: number
          rating_role_fit: number
          rating_culture_fit: number
          salary_expectation: 'compatible' | 'incompatible' | null
          comment: string | null
          recommendation: 'advance' | 'doubt' | 'reject'
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          application_id: string
          stage_id: string
          author_id: string
          rating_communication: number
          rating_experience: number
          rating_role_fit: number
          rating_culture_fit: number
          salary_expectation?: 'compatible' | 'incompatible' | null
          comment?: string | null
          recommendation: 'advance' | 'doubt' | 'reject'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['candidate_scorecards']['Insert']>
        Relationships: [
          {
            foreignKeyName: "candidate_scorecards_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_scorecards_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "recruitment_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_scorecards_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_tasks: {
        Row: {
          id: string
          company_id: string
          application_id: string
          title: string
          due_date: string | null
          responsible_id: string
          created_by: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          application_id: string
          title: string
          due_date?: string | null
          responsible_id: string
          created_by: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['candidate_tasks']['Insert']>
        Relationships: [
          {
            foreignKeyName: "candidate_tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_tasks_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_feedbacks: {
        Row: {
          id: string
          company_id: string
          application_id: string
          stage_id: string
          author_id: string
          content: string
          recommendation: 'advance' | 'doubt' | 'reject' | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          application_id: string
          stage_id: string
          author_id: string
          content: string
          recommendation?: 'advance' | 'doubt' | 'reject' | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['candidate_feedbacks']['Insert']>
        Relationships: [
          {
            foreignKeyName: "candidate_feedbacks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_feedbacks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "recruitment_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_feedbacks_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      my_company_id: { Args: never; Returns: string }
      my_role: { Args: never; Returns: string }
      my_employee_id: { Args: never; Returns: string }
      get_employee_descendants: {
        Args: { root_id: string }
        Returns: { id: string }[]
      }
      get_employee_ancestors: {
        Args: { emp_id: string }
        Returns: { id: string }[]
      }
      is_gestor_of_opening: {
        Args: { p_employee_id: string; p_opening_id: string }
        Returns: boolean
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
    Enums: {},
  },
} as const
