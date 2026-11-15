# Kizuna 絆

Map the people you know around the world. Create your profile (name, where you're from, where you live, optional age, phone and photo), then pick a country, save who you know there (name, where they live, phone or social, how you met) and watch your map fill in.

One repo, three parts, sharing one Supabase database:

| Folder | What | Hosted on |
| --- | --- | --- |
| `web/` | Website (Next.js) | Vercel |
| `mobile/` | iPhone app (Expo / React Native) | App Store, via Expo's cloud build |
| `supabase/` | Database setup (`schema.sql`) | Supabase |

There is no password: sign-up is three short steps (name → where you’re from / live → optional extras) and creates a guest account that the browser or phone remembers. Connecting Apple or Google (optional, any time) makes the same map available on the website and every phone. Each person only ever sees their own connections; that's enforced in the database (Row Level Security), not just in the app.

---

## 1. Supabase (5 min)

1. **Create the tables.** Supabase project → **SQL Editor** → New query → paste all of [`supabase/schema.sql`](supabase/schema.sql) → **Run**. It creates `connections`, `profiles` and the `avatars` photo storage. It's safe to run again whenever the file changes.
2. **Turn on guest accounts.** **Authentication → Sign In / Providers** → switch on **Allow anonymous sign-ins** → Save. Kizuna has no email or password: finishing the 3 sign-up steps creates a guest account that the browser (or phone) remembers.
3. **Allow linking.** Same page (**Sign In / Providers**) → switch on **Allow manual linking**. This lets a guest connect Apple or Google later without losing their map.
4. **Google.** Sign In / Providers → **Google** → turn on and paste the Client ID and Client Secret from Google Cloud (see "Apple & Google setup" below).
5. **Apple.** Sign In / Providers → **Apple** → turn on. For the iPhone app, put `com.guyfromhanoi.kizuna,host.exp.Exponent` in **Client IDs** (the second one is Expo Go, for testing). Sign in with Apple on the *website* also needs a Services ID and secret key from Apple; see below.
6. **Redirect URLs.** Authentication → **URL Configuration**: Site URL = your Vercel address. Under Redirect URLs add `https://gokizuna.eu/app`, `kizuna://auth-callback` and, for testing in Expo Go, `exp://**`.
7. **Copy your keys** (click **Connect** at the top of the project, or **Project Settings → API Keys**):
   - Project URL, like `https://abcd1234.supabase.co`
   - Publishable key, like `sb_publishable_…` (older projects call it the *anon* key; either works)

## 2. Website on Vercel (3 min)

1. Vercel → **Add New → Project** → import this repo.
2. **Root Directory:** `web`
3. **Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = your publishable key
4. **Deploy.** Every push to `main` redeploys automatically.

The privacy page (`web/src/app/privacy/page.tsx`) lists linh@appkollab.com as the contact.

Run locally (optional): `cd web && cp .env.example .env.local` (fill it in) → `npm install` → `npm run dev`.

## 3. iPhone app

### Try it on your phone (free, no Apple account needed)

On a laptop with Node.js installed:

```bash
cd mobile
cp .env.example .env      # fill in the three values
npm install
npx expo start
```

Install **Expo Go** from the App Store, then scan the QR code with your iPhone camera. Phone and laptop need to be on the same Wi-Fi (or run `npx expo start --tunnel`).

### Publish to the App Store

You need an **Apple Developer account** ($99/year) and a free **Expo account** (expo.dev). No Mac needed; Expo builds in the cloud.

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest init            # links the app to your Expo account

# give the cloud build your keys (once)
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR-PROJECT.supabase.co" --visibility plaintext
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value "sb_publishable_xxx" --visibility plaintext
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_WEB_URL --value "https://gokizuna.eu" --visibility plaintext

npx eas-cli@latest build --platform ios --profile production   # signs in to Apple and builds
npx eas-cli@latest submit --platform ios                         # uploads to App Store Connect
```

Then in **App Store Connect**:
- The build appears under **TestFlight** first. Install it on your phone and check it.
- Fill in the listing: name, description, screenshots, and **Privacy Policy URL** = `https://gokizuna.eu/privacy`.
- **App Privacy:** you collect *Email address* (for sign-in) and *User content* (the connections). Not used for tracking, linked to the user.
- **Review notes:** no demo account needed; there is no login. Mention that accounts are guest accounts and can be deleted in the Account tab.
- Submit for review (usually 1–3 days).

The bundle ID is `com.guyfromhanoi.kizuna` (in `mobile/app.json`). Change it before your first build if you want; it can't be changed after.

---

## How it fits together

- `supabase/schema.sql`: `connections` table (`name`, `from_country`, `lives_in`, `contact`, `how_met`), RLS policies, and `delete_my_account()`. Apple requires in-app account deletion, and both the app (Account tab) and the website (bottom of My connections) offer it.
- The "Show people by" switch counts each person by **where they're from** (default) or **where they live** (falls back to where they're from if not set).
- Map and country data: `web/src/data/world.json` and `mobile/src/data/world.json`, generated by `scripts/gen-world.mjs` from Natural Earth (world-atlas). To regenerate: `cd scripts && npm install && npm run world`.
- Colors: Sky Blue `#0092F5` (deepened from `#0099FF` for text contrast), Cloudy White `#FDFDFE`, Amber Red `#DD2C04`. Fonts: Anton + Inter.
- Every animation is switched off when the device has *Reduce Motion* turned on.

## Apple & Google setup

**Google** (free): Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID → *Web application*. Authorized redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`. Copy the Client ID and Secret into Supabase → Providers → Google.

**Apple** (needs the Apple Developer account): the app uses native Sign in with Apple, which only needs the bundle ID in Supabase's Apple *Client IDs* and the "Sign in with Apple" capability (EAS turns it on from `app.json`). For Sign in with Apple on the website you also create a *Services ID* and a *Sign in with Apple key* in developer.apple.com and paste them into Supabase; follow Supabase's "Login with Apple" guide. Until then, web users can use Google.
