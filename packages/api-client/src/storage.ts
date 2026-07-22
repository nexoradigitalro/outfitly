import type { SupabaseClient } from "@supabase/supabase-js";

// crypto.randomUUID() is a secure-context-only API — it's undefined (throws
// "not a function") on plain http:// origins that aren't localhost, e.g.
// testing on a phone against a LAN IP like http://192.168.1.x:3000. This
// only needs to be unique, not cryptographically strong, so fall back to a
// manual id rather than requiring HTTPS for local device testing to work.
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// Path convention "{profileId}/{filename}" matches the storage RLS policies
// in supabase/migrations/00000000000003_storage_buckets.sql — the first
// path segment must equal auth.uid() or the upload is rejected.
export async function uploadClosetImage(
  supabase: SupabaseClient,
  profileId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${profileId}/${generateId()}.${ext}`;

  const { error } = await supabase.storage.from("closet-original").upload(path, file, {
    contentType: file.type,
  });
  if (error) throw error;

  return path;
}
