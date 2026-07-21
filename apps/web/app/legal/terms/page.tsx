export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-sm leading-relaxed text-muted-foreground">
      <div className="mb-8 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive-foreground">
        <strong className="block text-foreground">Draft — not legal advice.</strong>
        This is placeholder text so the app has a working consent flow during development. It has
        not been reviewed by a lawyer and must not be treated as real Terms of Service until it
        is — replace before allowing real users to sign up.
      </div>

      <h1 className="mb-4 text-2xl font-semibold text-foreground">Terms of Service</h1>

      <h2 className="mt-6 font-semibold text-foreground">The service</h2>
      <p>
        Outfitly lets you digitize your wardrobe and get AI-generated outfit suggestions. The
        Free plan and Premium plan (subscription) have different limits, described in-app.
      </p>

      <h2 className="mt-6 font-semibold text-foreground">Your content</h2>
      <p>
        You own the photos you upload. You grant us the license needed to process them (AI
        tagging, background removal, outfit rendering) solely to provide the service to you.
      </p>

      <h2 className="mt-6 font-semibold text-foreground">Guest accounts</h2>
      <p>
        You can use Outfitly without creating an account. Guest data is tied to your device/
        browser session and can be lost if local storage is cleared — sign in to keep it
        permanently.
      </p>

      <h2 className="mt-6 font-semibold text-foreground">Termination</h2>
      <p>You may delete your account at any time; we may suspend accounts that abuse the service.</p>

      <h2 className="mt-6 font-semibold text-foreground">Contact</h2>
      <p>[company name / contact email placeholder]</p>
    </div>
  );
}
