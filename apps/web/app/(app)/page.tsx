import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@outfitly/api-client";
import { ClosetGrid } from "@/components/closet/closet-grid";

export default async function ClosetPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return (
      <div className="px-6 pt-24 text-center text-sm text-muted-foreground">
        No session — something is wrong with the guest sign-in in proxy.ts.
      </div>
    );
  }

  return <ClosetGrid profileId={user.id} />;
}
