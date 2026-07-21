import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@outfitly/api-client";
import { CaptureForm } from "@/components/closet/capture-form";

export default async function CapturePage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return (
      <div className="px-6 pt-24 text-center text-sm text-muted-foreground">
        No session — something is wrong with the guest sign-in in proxy.ts.
      </div>
    );
  }

  return <CaptureForm profileId={user.id} />;
}
