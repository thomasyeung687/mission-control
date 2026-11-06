export type Loaded<T> = { ok: true; data: T } | { ok: false; error: unknown };

export async function load<T>(work: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    return { ok: false, error };
  }
}
