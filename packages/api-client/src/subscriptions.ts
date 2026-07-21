import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanId, Subscription, SubscriptionStatus } from "@outfitly/types";

interface SubscriptionRow {
  profile_id: string;
  plan_id: PlanId;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_end: string | null;
  updated_at: string;
}

function mapSubscription(row: SubscriptionRow): Subscription {
  return {
    profileId: row.profile_id,
    planId: row.plan_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    updatedAt: row.updated_at,
  };
}

// Every profile gets a 'free' subscription row automatically via the
// on_profile_created DB trigger — this never needs a "create" path either.
export async function getMySubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<Subscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("profile_id", userId)
    .single();
  if (error) throw error;
  return mapSubscription(data as SubscriptionRow);
}
