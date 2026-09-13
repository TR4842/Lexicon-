# Vocab Ledger 📖

A **fully offline**, retro-pastel vocabulary learning app for Android.
12 word lists × 10 groups × 10 words = **1200 words** (with Bengali meanings, synonyms,
antonyms and example sentences), a daily learning ritual, gated exams, a consistency
calendar and a mistake book.

> Credit: **Engr. Tanjim Ahmed Khan** · Prepared with Love by **Tusher Khan** ·
> Contact on Telegram: [@tusherkhan42](https://t.me/tusherkhan42)

---

## What's in this repo

| Path | Purpose |
| --- | --- |
| `app/` | The app itself — a zero-build, zero-dependency web app (HTML/CSS/vanilla JS) that runs 100% offline as an installable PWA. |
| `android/` | A ready-made **Capacitor** Android project (Gradle, branded icons & splash) that packages `app/` into a real APK. |
| `WordSmart_Vocabulary_List-v18.xlsx` | Source dataset (single sheet: Group / Word / Bengali Meaning / English Meaning / Synonyms / Antonyms / Example Sentence). |
| `tools/build_vocab.py` | Extracts the xlsx → `app/data/vocab.js` (no third-party deps; xlsx is parsed as zip+XML). |
| `tools/make-icons.js` | Rasterises the SVG brand marks into PWA icons (`sharp`). |
| `tools/brand-android.js` | Copies the brand icons/splash into the Android resource folders. |
| `tools/serve.js` | Tiny static server for desktop previews (`npm run serve`). |
| `tools/smoke.js` | Headless end-to-end test (jsdom) that plays a full learning cycle **and** proves an old save file upgrades without losing data. |
| `tools/check-release.js` | Release guard: offline precache completeness, version agreement across `package.json`/`store.js`/`build.gradle`, and the permanent storage key. |
| `.github/workflows/build.yml` | CI: tests the web app, then builds/verifies/publishes the Android APK (and `.aab` on tags). |
| `android/keystore.properties.example` | Template for release signing — required so a new APK updates the installed one. |

## The learning system

- **Onboarding** — first launch asks for name, gender and an avatar (3 avatars per gender).
- **Daily goal** — 2 groups (20 words) per day → flip-cards study, then a **daily exam**
  (you pick **20 / 25 / 30** questions, pass mark 80%).
- **Revision gate** — after every 4 groups (2 days) a **40-question revision exam** on those
  4 groups unlocks the next days; pass mark **90%**. After groups 9–10 a *List Final Exam*
  unlocks the next word list. Passing any exam triggers confetti + congratulations.
- **Landing screen** — avatar + name, learning statistics (words learned, streak, accuracy,
  exams passed), today's checklist, and a **consistency calendar**: ✓ for a completed day
  (goal + exam), ✗ for a missed day, amber dot for a started day.
- **Mistake Book** — every wrong answer is tracked with its frequency; answer a flagged word
  correctly twice and it heals. Filter by list and run focused practice exams.
- **Hamburger menu** — Home, Today's Goal, Word Lists, Mistake Book, About, Edit Profile.
- **Offline forever** — all data, fonts, icons and the 1200-word dataset ship inside the app;
  a service worker caches everything, and progress lives in local storage. No permissions,
  no network calls (the Android manifest requests nothing).

## Run it right now (web / PWA)

```bash
npm run serve        # → http://localhost:8080
```

On an Android phone, open the URL in Chrome and use **⋮ → Add to Home screen / Install app**:
you get a standalone, offline, full-screen app with the Vocab Ledger icon.

## Build the real Android APK

Prereqs: Node 18+, Android Studio (or JDK 17 + Android SDK with `ANDROID_HOME` set).

```bash
npm install
npx cap sync android          # copies app/ into the Android project
npm run cap:open              # opens Android Studio → Run/Build → APK
# or headless:
npm run android:build         # gradlew assembleDebug → android/app/build/outputs/apk/debug/
```

The APK is a plain WebView shell around the same offline web app; everything (dataset,
fonts, icons) is bundled in `assets`, so the installed app needs no internet at all.

## Continuous build (GitHub Actions)

`.github/workflows/build.yml` runs on every push to `main`, every pull request, every
`v*.*.*` tag, and on demand (**Actions → Build → Run workflow**):

1. **web** — `npm ci`, `node tools/check-release.js` (version sync, offline precache,
   storage-key guard), `node tools/smoke.js` (headless E2E **plus** the
   upgrade-without-data-loss suite), then archives `app/`.
2. **android** — JDK 17 + Android SDK, `npx cap sync android`, `gradlew assembleRelease`
   (or `assembleDebug` when no keystore secret is configured), then it verifies with
   `aapt dump badging` that the **applicationId is unchanged** and the **versionCode
   matches**, and uploads `VocabLedger-<version>-<versionCode>.apk`.
   On a tag push it also builds the `.aab` and attaches everything to a GitHub Release.

Signing secrets (repo → Settings → Secrets and variables → Actions):

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | key alias |
| `ANDROID_KEY_PASSWORD` | key password |

Without them the workflow still builds — you get a debug-signed APK, which only updates
a debug-signed install.

## Releasing an update (installs over the previous version, keeps all data)

Android replaces an installed app only when **the `applicationId` and the signing
certificate are identical** and **`versionCode` is higher**. So for every release:

```bash
npm version patch --no-git-tag-version          # 1.0.1 → 1.0.2 (package.json + lock)
```

then bump the same three places by hand — `node tools/check-release.js` fails if they
disagree:

| Where | Field |
| --- | --- |
| `android/app/build.gradle` | `DEFAULT_VERSION_CODE` (**+1, every release**) and `DEFAULT_VERSION_NAME` |
| `app/js/store.js` | `APP_VERSION` (shown on the About screen) |
| `package.json` | `version` |

Finally `git tag v1.0.2 && git push --follow-tags` — CI builds, verifies and publishes it.

**Never** change `appId` in `capacitor.config.json`, `applicationId` in `build.gradle`, or
`server.androidScheme`: the WebView origin (`https://localhost`) is the key that
localStorage is stored under, and changing it orphans every user's progress.

Why an update loses nothing:

- Progress lives in WebView **localStorage**, inside the app's data directory, which
  Android keeps on an in-place update (only an uninstall clears it — and
  `android:hasFragileUserData="true"` makes even that ask *"keep app data?"* first,
  while `allowBackup="true"` includes it in device backups).
- The storage key `vocabLedger.state.v1` is **permanent**; `tools/check-release.js`
  fails the build if it is ever renamed.
- Old save files are **deep-merged** over the new defaults and run through versioned
  `MIGRATIONS`, so fields a newer build expects are filled in without discarding
  anything the old build stored. A `.bak` snapshot of the previous payload is written
  before migrating, and a legacy/corrupt payload falls back gracefully instead of
  wiping the learner's history.
- The service worker only caches **static assets**; bumping `VERSION` in `app/sw.js`
  swaps the cache on activate and touches no user data. Bump it whenever you ship
  CSS/JS/asset changes, otherwise installed PWAs keep serving the old files.
- **About → Backup & restore** exports the whole state as JSON (copy/paste, no
  permissions, no network) and restores it on any device — the safety net for
  reinstalls and phone changes.

## Regenerating data / assets

```bash
npm run build:data     # xlsx → app/data/vocab.js  (after editing the spreadsheet)
npm run build:icons    # SVG → PNG icons
npm run brand:android  # re-apply icons/splash to android/res
npm run check:release  # version sync + offline precache + storage-key guard
npm test               # check:release + headless E2E + upgrade/no-data-loss suite
```

## Design notes

Smooth-retro look: Fraunces (display serif) + Nunito (rounded UI) + Noto Sans Bengali,
all self-hosted as woff2; pastel gradient cards (peach/rose/mint/sky/lavender/butter),
generous radii, layered soft shadows, mildly animated dropdowns, accordion word lists,
3D flip cards, stroke-drawn tick/cross marks, confetti and WebAudio chimes (mutable).
