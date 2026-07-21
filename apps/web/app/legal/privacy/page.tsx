export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-sm leading-relaxed text-muted-foreground">
      <div className="mb-8 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive-foreground">
        <strong className="block text-foreground">Draft — not legal advice.</strong>
        This is placeholder text so the app has a working consent flow during development. It has
        not been reviewed by a lawyer and must not be treated as a real Privacy Policy until it
        is — replace before allowing real users to sign up.
      </div>

      <h1 className="mb-4 text-2xl font-semibold text-foreground">Privacy Policy</h1>

      <h2 className="mt-6 font-semibold text-foreground">What we collect</h2>
      <p>
        Account info (email or OAuth identity), profile details you provide (gender, height,
        weight, style preferences), photos of clothing items, and — if you use Virtual Try-On —
        photos of your body.
      </p>

      <h2 className="mt-6 font-semibold text-foreground">Why we collect it</h2>
      <p>
        To digitize your wardrobe, generate outfit recommendations, and render try-on previews.
        Body photos are used only for these features and are never used to train AI models.
      </p>

      <h2 className="mt-6 font-semibold text-foreground">Where it&apos;s stored</h2>
      <p>
        On Supabase infrastructure hosted in the EU. Access to your data is restricted to your
        account via database-level security (Row Level Security) — no other user can read your
        closet or photos.
      </p>

      <h2 className="mt-6 font-semibold text-foreground">Your rights</h2>
      <p>
        You can request a copy of your data, correct it, or delete your account and all
        associated data (including body photos) at any time from Settings.
      </p>

      <h2 className="mt-6 font-semibold text-foreground">Contact</h2>
      <p>[company name / contact email placeholder]</p>
    </div>
  );
}
