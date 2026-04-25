-- Leads comerciais capturados pela landing publica.
-- Sem policy publica: inserts acontecem apenas via service role no Server Action.

CREATE TABLE leads (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL,
  role text NOT NULL,
  team_size text NOT NULL,
  source text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
