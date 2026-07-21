// Domain types shared between apps/web and any future native client.
// Mirrors supabase/migrations/00000000000001_core_schema.sql — keep these
// in sync when the schema changes (see docs/ARCHITECTURE.md §7-8).

export type Gender = "male" | "female" | "nonbinary" | "unspecified";

export interface Profile {
  id: string;
  displayName: string | null;
  gender: Gender | null;
  heightCm: number | null;
  weightKg: number | null;
  birthDate: string | null;
  preferredStyles: string[];
  favoriteColors: string[];
  favoriteBrands: string[];
  favoriteOccasions: string[];
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ConsentKind =
  | "terms_of_service"
  | "privacy_policy"
  | "body_photo_processing"
  | "marketing_email";

export interface ConsentEvent {
  id: string;
  profileId: string;
  kind: ConsentKind;
  granted: boolean;
  policyVersion: string;
  createdAt: string;
}

export type BodyPhotoPose = "front" | "side" | "back" | "full_body";

export interface BodyPhoto {
  id: string;
  profileId: string;
  storagePath: string;
  pose: BodyPhotoPose | null;
  isAvatarSource: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  slug: string;
  parentId: string | null;
  label: string;
}

export type ProcessingStatus = "processing" | "ready" | "needs_review";

export interface ClosetItem {
  id: string;
  profileId: string;
  categoryId: string | null;
  subcategory: string | null;
  brand: string | null;
  name: string | null;
  material: string | null;
  pattern: string | null;
  fit: string | null;
  sleeveLength: string | null;
  season: string[];
  occasion: string[];
  style: string[];
  primaryColorHex: string | null;
  secondaryColorHex: string | null;
  aiConfidence: number | null;
  processingStatus: ProcessingStatus;
  imageOriginalPath: string;
  imageProcessedPath: string | null;
  imageThumbPath: string | null;
  /** Signed URL for the best available image (thumb > processed > original) — resolved by
   * the api-client, not a DB column; null only if signing failed. */
  imageUrl: string | null;
  isFavorite: boolean;
  isWishlist: boolean;
  archivedAt: string | null;
  lastWornAt: string | null;
  wearCount: number;
  purchasePrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export type OutfitSource = "ai_generated" | "user_created";

export interface Outfit {
  id: string;
  profileId: string;
  name: string | null;
  occasion: string | null;
  source: OutfitSource;
  aiReasoning: string | null;
  coverImagePath: string | null;
  isFavorite: boolean;
  createdAt: string;
  items?: ClosetItem[];
}

export interface WornLogEntry {
  id: string;
  closetItemId: string;
  profileId: string;
  wornOn: string;
  outfitId: string | null;
  createdAt: string;
}

export interface Collection {
  id: string;
  profileId: string;
  name: string;
  createdAt: string;
}

export type PlanId = "free" | "premium";

export interface Plan {
  id: PlanId;
  closetItemLimit: number | null;
  aiGenerationMonthlyLimit: number | null;
  features: Record<string, boolean>;
}

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled";

export interface Subscription {
  profileId: string;
  planId: PlanId;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  updatedAt: string;
}

export type AiGenerationKind =
  | "item_tagging"
  | "outfit_generation"
  | "virtual_try_on"
  | "search"
  | "shopping_check";

export interface AiGenerationLog {
  id: string;
  profileId: string;
  kind: AiGenerationKind;
  costEstimate: number | null;
  createdAt: string;
}
