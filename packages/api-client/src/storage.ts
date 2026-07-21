import type { SupabaseClient } from "@supabase/supabase-js";

// Path convention "{profileId}/{filename}" matches the storage RLS policies
// in supabase/migrations/00000000000003_storage_buckets.sql — the first
// path segment must equal auth.uid() or the upload is rejected.
export async function uploadClosetImage(
  supabase: SupabaseClient,
  profileId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${profileId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("closet-original").upload(path, file, {
    contentType: file.type,
  });
  if (error) throw error;

  return path;
}
