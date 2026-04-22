// Tipos manuais das tabelas FT-8 que ainda nao entraram no gerado.

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
