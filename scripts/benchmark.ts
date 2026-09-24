/**
 * Mini-benchmark des modèles Replicate (§35).
 *
 *   npm run benchmark -- --sketches ./bench-sketches --models prunaai/p-image-edit,black-forest-labs/flux-kontext-pro
 *
 * Options :
 *   --sketches <dossier>   photos de croquis Velleda (jpg/png/webp), idéalement ~10 vrais dessins
 *   --models a,b,c         modèles à comparer (défaut : tous les adaptateurs connus)
 *   --runs <n>             répétitions par couple croquis × modèle (défaut 1)
 *   --concurrency <n>      générations simultanées (défaut 2)
 *
 * Produit bench-results/<horodatage>/report.html : grille visuelle croquis → résultats,
 * temps médian / P95 / taux d'échec par modèle, et une notation manuelle (1–5) exportable en CSV
 * sur les critères clés (reconnaissance du dessin, silhouette, caractéristiques, esthétique, artefacts).
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { animals, movements, powers } from "@/config/choices";
import { generateDrone } from "@/lib/generation/generateDrone";
import { MODEL_ADAPTERS } from "@/lib/generation/models";
import { buildDronePrompt, choicesKey } from "@/lib/generation/prompts";
import { percentile } from "@/lib/server/metrics";
import { sniffMime } from "@/lib/server/image";

for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(f);
  } catch {
    /* fichier absent */
  }
}

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

interface Row {
  sketch: string;
  model: string;
  combo: string;
  run: number;
  ok: boolean;
  ms: number;
  file?: string;
  error?: string;
}

async function main() {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("REPLICATE_API_TOKEN manquant (dans .env.local ou l'environnement).");
    process.exit(1);
  }
  process.env.GENERATION_PROVIDER = "replicate";
  process.env.REPLICATE_MAX_RETRIES = "0"; // on mesure le taux d'échec brut

  const dir = arg("sketches", "./bench-sketches")!;
  const models = (arg("models") ?? MODEL_ADAPTERS.map((m) => m.id).join(",")).split(",").map((s) => s.trim()).filter(Boolean);
  const runs = Number(arg("runs", "1"));
  const concurrency = Math.max(1, Number(arg("concurrency", "2")));

  const files = (await readdir(dir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
  if (files.length === 0) {
    console.error(`Aucun croquis trouvé dans ${dir}`);
    process.exit(1);
  }

  const outDir = path.resolve("bench-results", new Date().toISOString().replace(/[:.]/g, "-"));
  await mkdir(outDir, { recursive: true });

  // Chaque croquis reçoit une combinaison différente (rotation déterministe) pour couvrir les choix.
  const tasks: (() => Promise<Row>)[] = [];
  files.forEach((file, i) => {
    const choices = {
      animal: animals[i % animals.length]!.id,
      movement: movements[i % movements.length]!.id,
      power: powers[(i + Math.floor(i / animals.length)) % powers.length]!.id,
    };
    for (const model of models) {
      for (let run = 1; run <= runs; run++) {
        tasks.push(async () => {
          const bytes = await readFile(path.join(dir, file));
          const mime = sniffMime(bytes) ?? "image/jpeg";
          const start = Date.now();
          try {
            const res = await generateDrone({ ...choices, sketchImage: { bytes, mime }, model });
            const ext = res.mime === "image/png" ? "png" : res.mime === "image/webp" ? "webp" : "jpg";
            const name = `${path.parse(file).name}__${model.replace(/[/:]/g, "_")}__${run}.${ext}`;
            await writeFile(path.join(outDir, name), res.image);
            const ms = Date.now() - start;
            console.log(`✓ ${model} ${file} ${choicesKey(choices)} ${ms} ms`);
            return { sketch: file, model, combo: choicesKey(choices), run, ok: true, ms, file: name };
          } catch (err) {
            const ms = Date.now() - start;
            console.log(`✗ ${model} ${file} ${ms} ms — ${err instanceof Error ? err.message : err}`);
            return { sketch: file, model, combo: choicesKey(choices), run, ok: false, ms, error: String(err).slice(0, 200) };
          }
        });
      }
    }
  });

  const rows: Row[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < tasks.length) rows.push(await tasks[next++]!());
    }),
  );

  // Copie des croquis pour le rapport.
  for (const f of files) await writeFile(path.join(outDir, `sketch__${f}`), await readFile(path.join(dir, f)));

  const summary = models.map((model) => {
    const r = rows.filter((x) => x.model === model);
    const ok = r.filter((x) => x.ok).map((x) => x.ms);
    return {
      model,
      n: r.length,
      failRate: r.length ? (r.length - ok.length) / r.length : 0,
      median: percentile(ok, 50),
      p95: percentile(ok, 95),
    };
  });

  await writeFile(path.join(outDir, "results.json"), JSON.stringify({ summary, rows }, null, 2));
  await writeFile(path.join(outDir, "report.html"), renderReport(files, models, rows, summary));
  console.table(summary);
  console.log(`\nRapport : ${path.join(outDir, "report.html")}`);
  console.log(`Exemple de prompt :\n${buildDronePrompt({ animal: "shark", movement: "dive", power: "sonar" })}`);
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function renderReport(files: string[], models: string[], rows: Row[], summary: { model: string; n: number; failRate: number; median: number | null; p95: number | null }[]) {
  const criteria = ["reconnaissance", "silhouette", "caractéristiques", "esthétique", "sans artefacts"];
  const head = models.map((m) => `<th>${esc(m)}</th>`).join("");
  const body = files
    .map((f) => {
      const cells = models
        .map((m) => {
          const r = rows.filter((x) => x.sketch === f && x.model === m);
          return `<td>${r
            .map((x) =>
              x.ok
                ? `<figure><img src="${esc(x.file!)}" loading="lazy"><figcaption>${(x.ms / 1000).toFixed(1)} s · ${esc(x.combo)}</figcaption>${criteria
                    .map((c) => `<label>${c} <select data-key="${esc(`${f}|${m}|${x.run}|${c}`)}"><option></option>${[1, 2, 3, 4, 5].map((n) => `<option>${n}</option>`).join("")}</select></label>`)
                    .join("")}</figure>`
                : `<div class="fail">échec (${(x.ms / 1000).toFixed(1)} s)<br><small>${esc(x.error ?? "")}</small></div>`,
            )
            .join("")}</td>`;
        })
        .join("");
      return `<tr><td><img src="sketch__${esc(f)}"><br><small>${esc(f)}</small></td>${cells}</tr>`;
    })
    .join("");
  const sum = summary
    .map((s) => `<tr><td>${esc(s.model)}</td><td>${s.n}</td><td>${s.median !== null ? (s.median / 1000).toFixed(1) + " s" : "–"}</td><td>${s.p95 !== null ? (s.p95 / 1000).toFixed(1) + " s" : "–"}</td><td>${(s.failRate * 100).toFixed(0)} %</td></tr>`)
    .join("");
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Benchmark drones</title>
<style>body{font-family:system-ui;margin:24px}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:8px;vertical-align:top}
img{max-width:320px;display:block}figure{margin:0 0 12px}label{display:block;font-size:12px}.fail{color:#b00;max-width:300px}</style>
<h1>Benchmark des modèles</h1>
<p>Critère clé : <b>l'enfant doit pouvoir reconnaître SON dessin.</b> Notez chaque résultat (1–5), puis exportez.</p>
<table><tr><th>Modèle</th><th>n</th><th>Médiane</th><th>P95</th><th>Échecs</th></tr>${sum}</table>
<p><button id="csv">Exporter les notes (CSV)</button></p>
<table><tr><th>Croquis</th>${head}</tr>${body}</table>
<script>
const KEY='bench:'+location.pathname;const saved=JSON.parse(localStorage.getItem(KEY)||'{}');
document.querySelectorAll('select[data-key]').forEach(s=>{s.value=saved[s.dataset.key]||'';s.onchange=()=>{saved[s.dataset.key]=s.value;localStorage.setItem(KEY,JSON.stringify(saved))}});
document.getElementById('csv').onclick=()=>{const lines=['croquis;modele;essai;critere;note'];for(const [k,v] of Object.entries(saved)){if(v)lines.push(k.split('|').join(';')+';'+v)}
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([lines.join('\\n')],{type:'text/csv'}));a.download='notes.csv';a.click()};
</script></html>`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
