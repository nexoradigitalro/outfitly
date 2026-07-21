import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConsentEvent, ConsentKind } from "@outfitly/types";

// Bump this whenever the Terms of Service or Privacy Policy text changes —
// every user whose latest recorded consent is on an older version gets
// re-prompted (docs/ARCHITECTURE.md §10). Not tied to app releases.
export const CURRENT_POLICY_VERSION = "2026-07-21";

// Terms + Privacy are mandatory and tracked separately from Marketing,
// which is optional and off by default — never bundle them into one
// "agree to everything" flag (docs/ARCHITECTURE.md §10, docs/ROADMAP.md).
export const REQUIRED_CONSENT_KINDS: ConsentKind[] = ["terms_of_service", "privacy_policy"];

interface ConsentEventRow {
  id: string;
  profile_id: string;
  kind: ConsentKind;
  granted: boolean;
  policy_version: string;
  created_at: string;
}

function mapConsentEvent(row: ConsentEventRow): ConsentEvent {
  return {
    id: row.id,
    profileId: row.profile_id,
    kind: row.kind,
    granted: row.granted,
    policyVersion: row.policy_version,
    createdAt: row.created_at,
  };
}

export async function recordConsent(
  supabase: SupabaseClient,
  profileId: string,
  kind: ConsentKind,
  granted: boolean,
  policyVersion: string = CURRENT_POLICY_VERSION,
): Promise<ConsentEvent> {
  const { data, error } = await supabase
    .from("consent_events")
    .insert({ profile_id: profileId, kind, granted, policy_version: policyVersion })
    .select()
    .single();
  if (error) throw error;
  return mapConsentEvent(data as ConsentEventRow);
}

// Checks whether both required consents are on file, granted, and current
// — the app-level gate that blocks entry until this is true (docs/ROADMAP.md M0).
export async function hasCurrentRequiredConsent(
  supabase: SupabaseClient,
  profileId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("consent_events")
    .select("kind, granted, policy_version, created_at")
    .eq("profile_id", profileId)
    .in("kind", REQUIRED_CONSENT_KINDS)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return REQUIRED_CONSENT_KINDS.every((kind) => {
    const latest = (data as ConsentEventRow[]).find((row) => row.kind === kind);
    return !!latest && latest.granted && latest.policy_version === CURRENT_POLICY_VERSION;
  });
}
