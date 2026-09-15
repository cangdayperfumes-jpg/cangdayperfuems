/**
 * Supabase/PostgREST caps any single request at its project's "Max Rows"
 * setting (1000 by default), silently truncating past that regardless of
 * how the query is written (a plain .select() with no .range() included).
 * Pages through in chunks so callers get every matching row instead of an
 * undercount past the cap.
 */
export async function fetchAllRows<T>(
  buildPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 1000
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await buildPage(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}
