"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { recordConsent } from "@outfitly/api-client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// Terms + Privacy acceptance is the "Accept & Continue" button itself (one
// affirmative action, still logged as two separate consent_events rows —
// docs/ARCHITECTURE.md §10). Marketing stays a separate, optional, off-by-
// default toggle so it's never bundled into the required acceptance.
export function ConsentForm() {
  const router = useRouter();
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      const supabase = createClient();
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError || !data.user) {
        toast.error("Couldn't verify your session — try reloading the page.");
        return;
      }

      try {
        await Promise.all([
          recordConsent(supabase, data.user.id, "terms_of_service", true),
          recordConsent(supabase, data.user.id, "privacy_policy", true),
          recordConsent(supabase, data.user.id, "marketing_email", marketingOptIn),
        ]);
        router.push("/");
        router.refresh();
      } catch {
        toast.error("Couldn't save your choice — try again.");
      }
    });
  }

  return (
    <div className="flex min-h-full flex-col justify-between px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Before we start</h1>
        <p className="text-sm text-muted-foreground">
          Outfitly stores your closet photos and, later, body photos to build outfit
          recommendations. By continuing you agree to the{" "}
          <Link href="/legal/terms" className="underline underline-offset-2">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <div
        role="checkbox"
        aria-checked={marketingOptIn}
        aria-labelledby="marketing-label"
        tabIndex={0}
        onClick={() => setMarketingOptIn((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setMarketingOptIn((v) => !v);
          }
        }}
        className="-mx-2 my-8 flex cursor-pointer items-start gap-3 rounded-lg px-2 py-3 [touch-action:manipulation] active:bg-accent/60"
      >
        <Checkbox
          checked={marketingOptIn}
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none mt-0.5"
        />
        <span id="marketing-label" className="text-sm font-normal leading-snug">
          Send me tips and offers by email <span className="text-muted-foreground">(optional)</span>
        </span>
      </div>

      <Button size="lg" disabled={isPending} onClick={handleAccept}>
        Accept & Continue
      </Button>
    </div>
  );
}
