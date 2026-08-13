// ---------------------------------------------------------------------------
//  Vérificateur d'architecture — règles A1 à A5 de REGLES.md
//
//  « Les règles sont outillées, pas documentées » (A6). Un interdit qu'aucun
//  outil ne vérifie sera violé — pas par mauvaise volonté, mais un vendredi
//  soir de sprint 4.
//
//  Ce script échoue le build. Il n'a aucune dépendance : il doit tourner
//  avant même que npm install ait fini.
// ---------------------------------------------------------------------------

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = join(RACINE, "src");

// Qui a le droit d'importer qui. Tout pointe vers core ; core ne pointe
// vers rien. C'est la seule flèche qui compte.
const DEPENDANCES = {
    core:       ["core"],
    dom:        ["core", "dom"],
    data:       ["core", "data"],
    background: ["core", "dom", "data", "background"],
    content:    ["core", "dom", "content"],
    panel:      ["core", "panel"]
};

// Ce qu'une couche n'a pas le droit de toucher, quelle que soit la
// provenance : ces identifiants trahissent une responsabilité mal placée.
const INTERDITS = {
    core: [
        [/\bchrome\s*\./, "core ne connaît pas les API d'extension (A1)"],
        [/\bdocument\s*\./, "core ne touche pas au DOM (A1)"],
        [/\bwindow\s*\./, "core ne touche pas au DOM (A1)"],
        [/\bfirebase\b/i, "core ne connaît pas la base de données (A1)"]
    ],
    dom: [
        [/\bfirebase\b/i, "seul data/ parle à Firestore (A3)"],
        [/\bfetch\s*\(/, "dom/ n'a aucun accès réseau (A2)"]
    ],
    data: [
        [/\bdocument\s*\./, "data/ ne touche pas au DOM (A2)"],
        [/\bwindow\s*\./, "data/ ne touche pas au DOM (A2)"]
    ],
    background: [
        [/\bdocument\s*\./, "le service worker ne touche jamais au DOM (A4)"]
    ],
    panel: []
};

// Règle S1, la seule qui ne se négocie jamais : l'agent ne soumet pas.
const JAMAIS_NULLE_PART = [
    [/\.submit\s*\(/, "l'extension ne soumet JAMAIS un formulaire (S1)"],
    [/\brequestSubmit\s*\(/, "l'extension ne soumet JAMAIS un formulaire (S1)"]
];

const anomalies = [];

function fichiersTypeScript(dossier) {
    const trouves = [];

    for (const entree of readdirSync(dossier)) {
        const chemin = join(dossier, entree);

        if (statSync(chemin).isDirectory()) {
            trouves.push(...fichiersTypeScript(chemin));
        } else if (entree.endsWith(".ts")) {
            trouves.push(chemin);
        }
    }

    return trouves;
}

function zoneDe(chemin) {
    const [zone] = relative(SOURCES, chemin).split(sep);
    return zone;
}

// Retire commentaires et chaînes : sans ça, une explication en commentaire
// déclencherait une anomalie.
function codeSeul(source) {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/\/\/[^\n]*/g, " ")
        .replace(/`(?:\\.|[^`\\])*`/g, "``")
        .replace(/"(?:\\.|[^"\\])*"/g, '""')
        .replace(/'(?:\\.|[^'\\])*'/g, "''");
}

function importsDe(code) {
    const chemins = [];
    const motif = /(?:^|\s)(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g;
    let trouve;

    while ((trouve = motif.exec(code)) !== null) {
        chemins.push(trouve[1]);
    }

    return chemins;
}

function signaler(fichier, message) {
    anomalies.push(`${relative(RACINE, fichier)}\n    ${message}`);
}

for (const fichier of fichiersTypeScript(SOURCES)) {
    const zone = zoneDe(fichier);
    const brut = readFileSync(fichier, "utf8");
    const code = codeSeul(brut);

    if (!DEPENDANCES[zone]) {
        signaler(fichier, `zone inconnue « ${zone} » — les zones sont : ${Object.keys(DEPENDANCES).join(", ")}`);
        continue;
    }

    // --- Sens des dépendances ---
    for (const chemin of importsDe(brut)) {
        if (!chemin.startsWith(".")) {
            continue;   // dépendance externe, hors périmètre de cette règle
        }

        const cible = resolve(dirname(fichier), chemin);

        if (!cible.startsWith(SOURCES)) {
            signaler(fichier, `import hors de src/ : ${chemin}`);
            continue;
        }

        const zoneCible = zoneDe(cible);

        if (zoneCible !== zone && !DEPENDANCES[zone].includes(zoneCible)) {
            signaler(
                fichier,
                `${zone}/ ne peut pas importer ${zoneCible}/  (${chemin})\n    autorisé depuis ${zone}/ : ${DEPENDANCES[zone].join(", ")}`
            );
        }
    }

    // --- Interdits par couche ---
    for (const [motif, raison] of INTERDITS[zone]) {
        const trouve = code.match(motif);

        if (trouve) {
            signaler(fichier, `« ${trouve[0].trim()} » — ${raison}`);
        }
    }

    // --- Interdits absolus ---
    for (const [motif, raison] of JAMAIS_NULLE_PART) {
        const trouve = code.match(motif);

        if (trouve) {
            signaler(fichier, `« ${trouve[0].trim()} » — ${raison}`);
        }
    }
}

if (anomalies.length > 0) {
    console.error(`\nArchitecture — ${anomalies.length} violation(s) :\n`);
    anomalies.forEach((anomalie) => console.error(`  ✗ ${anomalie}\n`));
    console.error("Voir REGLES.md. Ces règles ne se contournent pas « temporairement ».\n");
    process.exit(1);
}

console.log("Architecture — aucune violation.");
