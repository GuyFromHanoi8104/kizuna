import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy · Kizuna" };

// Plain-language policy. Review it and replace [YOUR CONTACT EMAIL] before publishing.
export default function Privacy() {
  return (
    <main className="prose">
      <h1>Privacy</h1>
      <p>Last updated: November 2026</p>

      <h2>What Kizuna stores</h2>
      <p>
        Your email address, so you can sign in. And the connections you add yourself: a name, the country they are from, optionally where they
        live, a phone number or social handle, and how you met.
      </p>

      <h2>Who can see it</h2>
      <p>
        Only you. Your connections are tied to your account and protected so that no other user can read them. Kizuna has no public profiles, no
        feed, and does not sell or share your data. There is no advertising and no tracking.
      </p>

      <h2>Where it is stored</h2>
      <p>Data is stored with our database provider, Supabase, and the website is hosted on Vercel.</p>

      <h2>People you add</h2>
      <p>The people you save don’t have a Kizuna account and aren’t contacted. Only add details they would be comfortable with you keeping.</p>

      <h2>Deleting your data</h2>
      <p>
        You can remove any connection at any time. You can delete your whole account in the app or on the website (My connections, then Delete
        account). This permanently erases your account and every connection you saved.
      </p>

      <h2>Contact</h2>
      <p>Questions: [YOUR CONTACT EMAIL]</p>
    </main>
  );
}
