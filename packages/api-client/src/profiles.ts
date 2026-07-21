import type { SupabaseClient } from "@supabase/supabase-js";
import type { Gender, Profile } from "@outfitly/types";

interface ProfileRow {
  id: string;
  display_name: string | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  birth_date: string | null;
  preferred_styles: string[];
  favorite_colors: string[];
  favorite_brands: string[];
  favorite_occasions: string[];
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    gender: row.gender,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    birthDate: row.birth_date,
    preferredStyles: row.preferred_styles,
    favoriteColors: row.favorite_colors,
    favoriteBrands: row.favorite_brands,
    favoriteOccasions: row.favorite_occasions,
    onboardingCompletedAt: row.onboarding_completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Every auth user (including guests) gets a profiles row automatically via
// the on_auth_user_created DB trigger, so this never needs a "create" path
// from the client — only read/update.
export async function getMyProfile(supabase: SupabaseClient, userId: string): Promise<Profile> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return mapProfile(data as ProfileRow);
}

export interface OnboardingInput {
  displayName: string;
  gender: Gender;
  heightCm?: number;
  weightKg?: number;
  birthDate?: string;
  preferredStyles?: string[];
  favoriteColors?: string[];
  favoriteBrands?: string[];
  favoriteOccasions?: string[];
}

export async function completeOnboarding(
  supabase: SupabaseClient,
  userId: string,
  input: OnboardingInput,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName,
      gender: input.gender,
      height_cm: input.heightCm,
      weight_kg: input.weightKg,
      birth_date: input.birthDate,
      preferred_styles: input.preferredStyles ?? [],
      favorite_colors: input.favoriteColors ?? [],
      favorite_brands: input.favoriteBrands ?? [],
      favorite_occasions: input.favoriteOccasions ?? [],
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return mapProfile(data as ProfileRow);
}
