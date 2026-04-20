import { describe, it, expect, vi, beforeEach } from 'vitest';

const selectSpy = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => ({
    from: () => ({
      select: (cols: string) => {
        selectSpy(cols);
        return {
          eq: () => ({
            single: async () => ({ data: { id: 'e-1' }, error: null }),
          }),
        };
      },
    }),
  }),
}));

import { getEmployee } from './queries';

describe('getEmployee — proteção de internal_notes', () => {
  beforeEach(() => {
    selectSpy.mockClear();
  });

  it('NÃO inclui internal_notes quando opts.includeInternalNotes é falsy', async () => {
    await getEmployee('e-1');
    expect(selectSpy).toHaveBeenCalledOnce();
    const cols = selectSpy.mock.calls[0][0] as string;
    expect(cols).not.toMatch(/internal_notes/);
  });

  it('NÃO inclui internal_notes quando opts.includeInternalNotes=false', async () => {
    await getEmployee('e-1', { includeInternalNotes: false });
    const cols = selectSpy.mock.calls[0][0] as string;
    expect(cols).not.toMatch(/internal_notes/);
  });

  it('INCLUI internal_notes quando opts.includeInternalNotes=true', async () => {
    await getEmployee('e-1', { includeInternalNotes: true });
    const cols = selectSpy.mock.calls[0][0] as string;
    expect(cols).toMatch(/internal_notes/);
  });
});
