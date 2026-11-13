export type Me = { id: string; email: string; display_name: string | null; workspace_id: string; workspace_name: string; role: string };

export async function api<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  let data: unknown;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) {
    const detail = data && typeof data === "object" && "detail" in data ? String((data as {detail: unknown}).detail) : `Request failed (${response.status})`;
    throw new Error(detail);
  }
  return data as T;
}
