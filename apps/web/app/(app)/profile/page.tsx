import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getMyProfile, getMySubscription } from "@outfitly/api-client";

export default async function ProfilePage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return (
      <div className="px-6 pt-24 text-center text-sm text-muted-foreground">
        No session — something is wrong with the guest sign-in in middleware.ts.
      </div>
    );
  }

  const [profile, subscription] = await Promise.all([
    getMyProfile(supabase, user.id),
    getMySubscription(supabase, user.id),
  ]);

  return (
    <div className="flex flex-col gap-6 px-6 pt-16">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Session</dt>
        <dd>{user.is_anonymous ? "Guest" : "Signed in"}</dd>

        <dt className="text-muted-foreground">Profile ID</dt>
        <dd className="truncate font-mono text-xs">{profile.id}</dd>

        <dt className="text-muted-foreground">Plan</dt>
        <dd className="capitalize">{subscription.planId}</dd>

        <dt className="text-muted-foreground">Onboarding</dt>
        <dd>{profile.onboardingCompletedAt ? "Completed" : "Not started"}</dd>
      </dl>

      <p className="text-xs text-muted-foreground">
        Full profile editing, avatar, and account settings ship alongside onboarding (M1+).
      </p>
    </div>
  );
}
