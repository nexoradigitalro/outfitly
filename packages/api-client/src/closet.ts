import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, ClosetItem, ProcessingStatus } from "@outfitly/types";

interface CategoryRow {
  id: string;
  slug: string;
  parent_id: string | null;
  label: string;
}

function mapCategory(row: CategoryRow): Category {
  return { id: row.id, slug: row.slug, parentId: row.parent_id, label: row.label };
}

export async function listCategories(supabase: SupabaseClient): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("label");
  if (error) throw error;
  return (data as CategoryRow[]).map(mapCategory);
}

interface ClosetItemRow {
  id: string;
  profile_id: string;
  category_id: string | null;
  subcategory: string | null;
  brand: string | null;
  name: string | null;
  material: string | null;
  pattern: string | null;
  fit: string | null;
  sleeve_length: string | null;
  season: string[];
  occasion: string[];
  style: string[];
  primary_color_hex: string | null;
  secondary_color_hex: string | null;
  ai_confidence: number | null;
  processing_status: ProcessingStatus;
  image_original_path: string;
  image_processed_path: string | null;
  image_thumb_path: string | null;
  is_favorite: boolean;
  is_wishlist: boolean;
  archived_at: string | null;
  last_worn_at: string | null;
  wear_count: number;
  purchase_price: number | null;
  created_at: string;
  updated_at: string;
}

function mapClosetItemRow(row: ClosetItemRow): Omit<ClosetItem, "imageUrl"> {
  return {
    id: row.id,
    profileId: row.profile_id,
    categoryId: row.category_id,
    subcategory: row.subcategory,
    brand: row.brand,
    name: row.name,
    material: row.material,
    pattern: row.pattern,
    fit: row.fit,
    sleeveLength: row.sleeve_length,
    season: row.season,
    occasion: row.occasion,
    style: row.style,
    primaryColorHex: row.primary_color_hex,
    secondaryColorHex: row.secondary_color_hex,
    aiConfidence: row.ai_confidence,
    processingStatus: row.processing_status,
    imageOriginalPath: row.image_original_path,
    imageProcessedPath: row.image_processed_path,
    imageThumbPath: row.image_thumb_path,
    isFavorite: row.is_favorite,
    isWishlist: row.is_wishlist,
    archivedAt: row.archived_at,
    lastWornAt: row.last_worn_at,
    wearCount: row.wear_count,
    purchasePrice: row.purchase_price,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Thumb/processed images live in the closet-processed bucket once the AI
// pipeline (docs/ARCHITECTURE.md §12) writes them; until then every item
// only has an original in closet-original. Both buckets are private, so
// display always goes through a signed URL, never a public one.
async function resolveImageUrl(supabase: SupabaseClient, row: ClosetItemRow): Promise<string | null> {
  const [bucket, path] = row.image_thumb_path
    ? (["closet-processed", row.image_thumb_path] as const)
    : row.image_processed_path
      ? (["closet-processed", row.image_processed_path] as const)
      : (["closet-original", row.image_original_path] as const);

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

async function mapClosetItem(supabase: SupabaseClient, row: ClosetItemRow): Promise<ClosetItem> {
  const imageUrl = await resolveImageUrl(supabase, row);
  return { ...mapClosetItemRow(row), imageUrl };
}

export async function listClosetItems(
  supabase: SupabaseClient,
  profileId: string,
  categoryId?: string,
): Promise<ClosetItem[]> {
  let query = supabase
    .from("closet_items")
    .select("*")
    .eq("profile_id", profileId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query;
  if (error) throw error;
  return Promise.all((data as ClosetItemRow[]).map((row) => mapClosetItem(supabase, row)));
}

export interface CreateClosetItemInput {
  categoryId?: string;
  name: string;
  primaryColorHex: string;
  imageOriginalPath: string;
}

// Full capture pipeline (upload -> background removal -> AI tagging, M1
// docs/ARCHITECTURE.md §12) lands separately; this is the plain insert path
// both that pipeline and any manual/demo entry point reuse.
export async function createClosetItem(
  supabase: SupabaseClient,
  profileId: string,
  input: CreateClosetItemInput,
): Promise<ClosetItem> {
  const { data, error } = await supabase
    .from("closet_items")
    .insert({
      profile_id: profileId,
      category_id: input.categoryId ?? null,
      name: input.name,
      primary_color_hex: input.primaryColorHex,
      image_original_path: input.imageOriginalPath,
      processing_status: "ready",
    })
    .select()
    .single();
  if (error) throw error;
  return mapClosetItem(supabase, data as ClosetItemRow);
}

export interface UpdateClosetItemInput {
  name?: string;
  categoryId?: string | null;
  primaryColorHex?: string;
  isFavorite?: boolean;
}

export async function updateClosetItem(
  supabase: SupabaseClient,
  itemId: string,
  input: UpdateClosetItemInput,
): Promise<ClosetItem> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.categoryId !== undefined) patch.category_id = input.categoryId;
  if (input.primaryColorHex !== undefined) patch.primary_color_hex = input.primaryColorHex;
  if (input.isFavorite !== undefined) patch.is_favorite = input.isFavorite;

  const { data, error } = await supabase
    .from("closet_items")
    .update(patch)
    .eq("id", itemId)
    .select()
    .single();
  if (error) throw error;
  return mapClosetItem(supabase, data as ClosetItemRow);
}

// Soft delete (docs/ARCHITECTURE.md §7) — archived_at, never a hard delete,
// so cost-per-wear/analytics keep working off historical items later.
export async function archiveClosetItem(supabase: SupabaseClient, itemId: string): Promise<void> {
  const { error } = await supabase
    .from("closet_items")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", itemId);
  if (error) throw error;
}
