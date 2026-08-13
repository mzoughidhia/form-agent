// ---------------------------------------------------------------------------
//  Construction de l'extension.
//
//  Les content scripts de Manifest V3 sont des scripts classiques : ils ne
//  peuvent pas faire d'import ESM. Il faut donc regrouper chaque point
//  d'entrée en un seul fichier.
// ---------------------------------------------------------------------------

import { existsSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SORTIE = join(RACINE, "extension");

// Chaque point d'entrée arrive avec le sprint qui le crée.
const ENTREES = [
    { source: "src/content/agent.ts", sortie: "agent.js", sprint: 2 },
    { source: "src/content/crm.ts", sortie: "crm.js", sprint: 1 },
    { source: "src/background/index.ts", sortie: "fond.js", sprint: 1 },
    { source: "src/panel/index.ts", sortie: "panneau.js", sprint: 1 }
];

const presentes = ENTREES.filter(({ source }) => existsSync(join(RACINE, source)));
const attendues = ENTREES.filter(({ source }) => !existsSync(join(RACINE, source)));

if (presentes.length === 0) {
    console.log("Aucun point d'entrée à construire pour l'instant.");
    console.log("Les premiers arrivent au sprint 1 :");
    attendues.forEach(({ source, sprint }) => console.log(`  · ${source}  (sprint ${sprint})`));
    process.exit(0);
}

mkdirSync(SORTIE, { recursive: true });

await esbuild.build({
    entryPoints: presentes.map(({ source, sortie }) => ({
        in: join(RACINE, source),
        out: sortie.replace(/\.js$/, "")
    })),
    outdir: SORTIE,
    bundle: true,
    format: "iife",
    target: "chrome120",
    platform: "browser",
    sourcemap: true,
    logLevel: "info"
});

console.log(`\n${presentes.length} point(s) d'entrée construit(s) dans extension/`);

if (attendues.length > 0) {
    console.log("Pas encore écrits :");
    attendues.forEach(({ source, sprint }) => console.log(`  · ${source}  (sprint ${sprint})`));
}
