// Optional: bake the full Quran text into ./data/quran/{1..114}.json so the app works fully offline from the first launch.
// Run once on a computer with internet:   node tools/build-quran-data.mjs
// Source: https://api.alquran.cloud (Uthmani text + English Saheeh International + Urdu Jalandhry + Hindi). Then re-deploy the folder.
import { mkdir, writeFile } from 'node:fs/promises';
const EDS = { ar: 'quran-uthmani', en: 'en.sahih', ur: 'ur.jalandhry', hi: 'hi.hindi' };
const COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
const strip = t => t.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '').replace(/[\u0671\u0623\u0625\u0622]/g, '\u0627');
const stripBism = t => { const w = t.trim().split(/\s+/); return (w.length > 4 && strip(w[0]) === 'بسم' && strip(w[1]) === 'الله' && strip(w[2]) === 'الرحمن' && strip(w[3]) === 'الرحيم') ? w.slice(4).join(' ') : t; };
await mkdir('data/quran', { recursive: true });
let total = 0;
for (let n = 1; n <= 114; n++) {
  const url = `https://api.alquran.cloud/v1/surah/${n}/editions/${Object.values(EDS).join(',')}`;
  let json;
  for (let tries = 0; tries < 4; tries++) { try { const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); json = await r.json(); break; } catch (e) { if (tries === 3) throw e; await new Promise(r => setTimeout(r, 1500 * (tries + 1))); } }
  const by = Object.fromEntries(json.data.map(e => [e.edition.identifier, e]));
  const ar = by[EDS.ar];
  if (ar.ayahs.length !== COUNTS[n - 1]) throw new Error(`Surah ${n}: expected ${COUNTS[n - 1]} ayat, got ${ar.ayahs.length}`);
  const out = { n, ts: Date.now(), src: { ar: ar.edition.name }, ayahs: [] };
  for (const k of ['en', 'ur', 'hi']) if (by[EDS[k]]) out.src[k] = by[EDS[k]].edition.englishName || by[EDS[k]].edition.name;
  ar.ayahs.forEach((x, i) => {
    const o = { a: x.numberInSurah, ar: (x.numberInSurah === 1 && n !== 1 && n !== 9) ? stripBism(x.text) : x.text };
    for (const k of ['en', 'ur', 'hi']) if (by[EDS[k]]?.ayahs[i]?.text) o[k] = by[EDS[k]].ayahs[i].text;
    out.ayahs.push(o);
  });
  total += out.ayahs.length;
  await writeFile(`data/quran/${n}.json`, JSON.stringify(out));
  console.log(`Surah ${n} saved (${out.ayahs.length} ayat)`);
}
console.log(total === 6236 ? 'Done — all 6,236 ayat saved.' : `Warning: total ${total} ≠ 6236`);
