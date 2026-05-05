import { describe, it, expect, vi, beforeEach } from 'vitest';

type FakeRow = { id: string; name: string; is_archived: boolean; created_at: string };

const state: {
  rows: FakeRow[];
  lastFilters: { eqs: Array<[string, unknown]>; orderCol: string | null };
} = {
  rows: [],
  lastFilters: { eqs: [], orderCol: null },
};

// Mock do supabase server: builder thenable com select/eq/order. O resolve
// e disparado quando alguem await na chain (o codigo real e: query =
// .eq().order(); query = query.eq() (opcional); await query).
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => ({
    from: (_table: string) => {
      const eqs: Array<[string, unknown]> = [];
      let orderCol: string | null = null;

      const resolve = () => {
        state.lastFilters.eqs = [...eqs];
        state.lastFilters.orderCol = orderCol;
        let rows = state.rows;
        for (const [c, v] of eqs) {
          // company_id nao existe nos rows do mock — ignorado para o teste.
          if (c === 'company_id') continue;
          rows = rows.filter((r) => (r as unknown as Record<string, unknown>)[c] === v);
        }
        rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
        return { data: rows, error: null };
      };

      type Builder = {
        select(cols: string): Builder;
        eq(col: string, val: unknown): Builder;
        order(col: string): Builder;
        then<T>(onfulfilled: (v: { data: FakeRow[]; error: null }) => T): Promise<T>;
      };

      const builder: Builder = {
        select: () => builder,
        eq: (col, val) => {
          eqs.push([col, val]);
          return builder;
        },
        order: (col) => {
          orderCol = col;
          return builder;
        },
        then: (onfulfilled) => Promise.resolve(resolve()).then(onfulfilled),
      };
      return builder;
    },
  }),
}));

import { listUnits } from './queries';

describe('listUnits', () => {
  beforeEach(() => {
    state.rows = [
      { id: 'u1', name: 'Hugs',  is_archived: false, created_at: '2026-01-01' },
      { id: 'u2', name: 'ACR',   is_archived: false, created_at: '2026-01-02' },
      { id: 'u3', name: 'Hope',  is_archived: true,  created_at: '2026-01-03' },
    ];
    state.lastFilters = { eqs: [], orderCol: null };
  });

  it('retorna apenas ativas por default', async () => {
    const rows = await listUnits('co-1');
    expect(rows.map((r) => r.id)).toEqual(['u2', 'u1']);
  });

  it('inclui arquivadas com includeArchived=true', async () => {
    const rows = await listUnits('co-1', { includeArchived: true });
    // Ordem alfabetica: ACR, Hope, Hugs.
    expect(rows.map((r) => r.id)).toEqual(['u2', 'u3', 'u1']);
  });

  it('ordena alfabeticamente por nome', async () => {
    const rows = await listUnits('co-1', { includeArchived: true });
    expect(state.lastFilters.orderCol).toBe('name');
    expect(rows.map((r) => r.name)).toEqual(['ACR', 'Hope', 'Hugs']);
  });

  it('filtra por company_id', async () => {
    await listUnits('co-1');
    const eq = state.lastFilters.eqs.find(([c]) => c === 'company_id');
    expect(eq?.[1]).toBe('co-1');
  });
});
