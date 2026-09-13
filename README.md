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
| `tools/smoke.js` | Headless end-to-end test (jsdom) that plays a full learning cycle. |

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

## Regenerating data / assets

```bash
npm run build:data     # xlsx → app/data/vocab.js  (after editing the spreadsheet)
npm run build:icons    # SVG → PNG icons
npm run brand:android  # re-apply icons/splash to android/res
npm test               # headless E2E: onboarding → study → exams → revision gate → mistakes
```

## Design notes

Smooth-retro look: Fraunces (display serif) + Nunito (rounded UI) + Noto Sans Bengali,
all self-hosted as woff2; pastel gradient cards (peach/rose/mint/sky/lavender/butter),
generous radii, layered soft shadows, mildly animated dropdowns, accordion word lists,
3D flip cards, stroke-drawn tick/cross marks, confetti and WebAudio chimes (mutable).
