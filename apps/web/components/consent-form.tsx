"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { recordConsent } from "@outfitly/api-client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Terms + Privacy are mandatory and tracked as separate consent_events rows;
// Marketing is optional and off by default. Never collapse these into one
// "agree to everything" checkbox — see docs/ARCHITECTURE.md §10.
export function ConsentForm() {
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canContinue = termsAccepted && privacyAccepted;

  function handleContinue() {
    startTransition(async () => {
      const supabase = createClient();
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError || !data.user) {
        toast.error("Couldn't verify your session — try reloading the page.");
        return;
      }

      try {
        await Promise.all([
          recordConsent(supabase, data.user.id, "terms_of_service", termsAccepted),
          recordConsent(supabase, data.user.id, "privacy_policy", privacyAccepted),
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
          recommendations. We need your consent to do that, and we keep it separate from
          marketing so agreeing to one never bundles in the other.
        </p>
      </div>

      <div className="flex flex-col gap-4 py-8">
        <ConsentRow
          id="terms"
          checked={termsAccepted}
          onCheckedChange={setTermsAccepted}
          required
        >
          I agree to the{" "}
          <Link href="/legal/terms" className="underline underline-offset-2">
            Terms of Service
          </Link>
        </ConsentRow>

        <ConsentRow
          id="privacy"
          checked={privacyAccepted}
          onCheckedChange={setPrivacyAccepted}
          required
        >
          I agree to the{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>{" "}
          (how we handle your closet & body photos)
        </ConsentRow>

        <ConsentRow id="marketing" checked={marketingOptIn} onCheckedChange={setMarketingOptIn}>
          Send me tips and offers by email (optional)
        </ConsentRow>
      </div>

      <Button size="lg" disabled={!canContinue || isPending} onClick={handleContinue}>
        Continue
      </Button>
    </div>
  );
}

function ConsentRow({
  id,
  checked,
  onCheckedChange,
  required,
  children,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} className="mt-0.5" />
      <Label htmlFor={id} className="text-sm font-normal leading-snug">
        {children}
        {required && <span className="text-muted-foreground"> (required)</span>}
      </Label>
    </div>
  );
}
