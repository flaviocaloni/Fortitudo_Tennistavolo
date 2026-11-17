// Utilità condivise dalle pagine statistiche admin.

/** Supabase restituisce al massimo 1000 righe per richiesta: pagina finché serve. */
export async function fetchAll<T>(
  make: (from: number, to: number) => PromiseLike<{ data: unknown[] | null }>
): Promise<T[]> {
  const out: T[] = [];
  const size = 1000;
  for (let page = 0; ; page++) {
    const { data } = await make(page * size, page * size + size - 1);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}

/** Percentuale arrotondata, null se il denominatore è zero. */
export const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : null);
