// Tipos manuais das tabelas novas da FT-8. Mantem-se aqui ate o
// Supabase CLI regenerar src/lib/supabase/types.ts apos a aplicacao
// da migration em ambiente conectado.

export type RhPermissionsRow = {
  profile_id: string;
  company_id: string;
  can_employees: boolean;
  can_reviews: boolean;
  can_recruitment: boolean;
  can_pdi_feedback: boolean;
  can_invites: boolean;
  can_audit: boolean;
  created_at: string;
  updated_at: string;
};

export type RhPermissionsInsert = {
  profile_id: string;
  company_id: string;
  can_employees?: boolean;
  can_reviews?: boolean;
  can_recruitment?: boolean;
  can_pdi_feedback?: boolean;
  can_invites?: boolean;
  can_audit?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type RhPermissionsUpdate = Partial<RhPermissionsInsert>;

export type ReviewResultCommentRow = {
  id: string;
  company_id: string;
  cycle_id: string;
  reviewee_employee_id: string;
  author_employee_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
};

export type ReviewResultCommentInsert = {
  id?: string;
  company_id: string;
  cycle_id: string;
  reviewee_employee_id: string;
  author_employee_id: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
};

export type ReviewResultCommentUpdate = Partial<ReviewResultCommentInsert>;
