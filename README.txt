ZIKR DEEN APP — v16 (Netlify deploy)

Upload the CONTENTS of this folder (index.html must be at the root) to Netlify.
- index.html            : new Android-style app (Home, Quran, Al-Mulk, Saved, More)
- journey.html          : your original 30-day Al-Mulk page (opens from the app: "30-day journey")
- tools/build-quran-data.mjs : OPTIONAL. Run once on a PC with internet:  node tools/build-quran-data.mjs
  It saves all 114 surahs into data/quran/ so every surah works offline from first launch. Re-deploy afterwards.

Without that step the app downloads each surah (text) the first time you open it, saves it on the phone,
and works offline afterwards. Settings -> More -> "Save all 114 surahs" downloads everything in one go.
Surah Al-Mulk is built in and always works offline.

Sources: Quran text/translations via api.alquran.cloud; audio via everyayah.com. Not live-tested in the build environment
(no internet there) — please test on your phone after deploying. Amiri font: SIL OFL.

v14: intro sound is now a pre-rendered seamless loop (audio/intro-pad.wav) instead of live synthesis -> no more crackle/breaks.
     The optional Al-Mulk recitation in the intro is downloaded first and then played (no streaming stalls).

v15: Home has an "Aaj ki Ayah" card (Al-Mulk, Arabic + Roman + Hinglish, play, mark read, share as image, next) and a streak reminder.
     Intro now defaults to once a day (change in More). New intro-sound option: "Al-Mulk recitation only (no music)". Intro volume lowered.
     Next ayah is prefetched while one plays (no silent gap). Intro animation uses lighter resolution on small phones.

v16: intro now opens with the azan (audio/azan-intro.mp3, extracted from the supplied video). The synthesised ambience was removed.
     More -> Intro sound: Azan / Al-Mulk recitation only / Off.
