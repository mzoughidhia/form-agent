// Vérifie que la sonde répond juste sur chaque cas du banc d'essai.
// Complète test-sonde.js, qui couvre l'extraction sur un formulaire simple.
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const DOSSIER = __dirname;
const BANC = path.join(DOSSIER, "banc");

const commun = fs.readFileSync(`${DOSSIER}/commun.js`, "utf8");
const sonde = fs.readFileSync(`${DOSSIER}/sonde.js`, "utf8");

let echecs = 0;

function verifier(intitule, condition, detail) {
    console.log(`${condition ? "  OK  " : " ECHEC"}  ${intitule}${detail ? `  →  ${detail}` : ""}`);
    if (!condition) echecs += 1;
}

// Charge une page du banc avec la sonde injectée, et rend la fenêtre.
async function ouvrir(fichier, adresse) {
    const consoleVirtuelle = new VirtualConsole();
    consoleVirtuelle.on("jsdomError", () => {});

    const dom = new JSDOM(fs.readFileSync(path.join(BANC, fichier), "utf8"), {
        runScripts: "dangerously",
        url: adresse,
        pretendToBeVisual: true,
        virtualConsole: consoleVirtuelle
    });

    const { window } = dom;

    if (!window.CSS) window.CSS = {};
    if (!window.CSS.escape) {
        window.CSS.escape = (v) => String(v).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
    }

    window.__releve = null;
    window.chrome = {
        storage: { local: { get: async () => ({ domaines: [new URL(adresse).origin] }) } },
        runtime: {
            sendMessage: async (message) => {
                window.__releve = message;
                return {};
            }
        }
    };

    [commun, sonde].forEach((source) => {
        const balise = window.document.createElement("script");
        balise.textContent = source;
        window.document.body.appendChild(balise);
    });

    await new Promise((r) => setTimeout(r, 1400));
    return window;
}

async function executer() {

    // ------------------------------------------------------------------
    console.log("\n=== Cas B · route interne (SPA) ===\n");

    const b = await ouvrir("b-spa.html", "https://banc.test/b-spa.html");
    const empreinteEtape1 = b.__releve.formulaires[0].empreinte;

    verifier("étape 1 relevée", Boolean(b.__releve), `${b.__releve.formulaires[0].nombreChamps} champs`);

    b.__releve = null;
    b.document.getElementById("suivant").dispatchEvent(new b.Event("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 1400));

    verifier("étape 2 relevée après pushState", Boolean(b.__releve));
    verifier(
        "Q2 · signal route-interne émis",
        b.__releve.page.signaux.includes("route-interne"),
        JSON.stringify(b.__releve.page.signaux)
    );
    verifier(
        "Q1 · étape 2 a bien une autre empreinte",
        b.__releve.formulaires[0].empreinte !== empreinteEtape1,
        `${empreinteEtape1} → ${b.__releve.formulaires[0].empreinte}`
    );
    verifier(
        "aucun rechargement complet signalé après la 1re fois",
        b.__releve.page.premierReleve === false
    );

    // ------------------------------------------------------------------
    console.log("\n=== Cas C · remplacement partiel ===\n");

    const c = await ouvrir("c-ajax.html", "https://banc.test/c-ajax.html");
    const urlAvant = c.location.href;
    const empreinteC1 = c.__releve.formulaires[0].empreinte;

    c.__releve = null;
    c.document.getElementById("suivant").dispatchEvent(new c.Event("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 1400));

    verifier("étape 2 relevée après remplacement du DOM", Boolean(c.__releve));
    verifier("Q2 · l'URL n'a pas changé", c.location.href === urlAvant, c.location.href);
    verifier(
        "Q2 · aucun signal de route interne",
        !c.__releve.page.signaux.includes("route-interne"),
        JSON.stringify(c.__releve.page.signaux)
    );
    verifier(
        "Q1 · empreinte différente pour la 2e étape",
        c.__releve.formulaires[0].empreinte !== empreinteC1,
        `${empreinteC1} → ${c.__releve.formulaires[0].empreinte}`
    );

    // ------------------------------------------------------------------
    console.log("\n=== Cas D · identifiants regénérés ===\n");

    const d1 = await ouvrir("d-instable.html", "https://banc.test/d-instable.html");
    const d2 = await ouvrir("d-instable.html", "https://banc.test/d-instable.html");

    const champs1 = d1.__releve.formulaires[0].champs;
    const champs2 = d2.__releve.formulaires[0].champs;

    const idsDifferents = champs1.every(
        (champ, i) => champ.identifiant !== champs2[i].identifiant
    );
    const libellesIdentiques = champs1.every(
        (champ, i) => champ.libelle === champs2[i].libelle
    );

    verifier("les deux chargements relèvent le même nombre de champs",
        champs1.length === champs2.length, `${champs1.length} / ${champs2.length}`);
    verifier("Q3 · tous les identifiants ont changé", idsDifferents,
        `${champs1[0].identifiant} → ${champs2[0].identifiant}`);
    verifier("Q3 · tous les libellés sont restés identiques", libellesIdentiques);
    verifier(
        "l'empreinte reste stable — le formulaire est toujours reconnu",
        d1.__releve.formulaires[0].empreinte === d2.__releve.formulaires[0].empreinte,
        d1.__releve.formulaires[0].empreinte
    );

    // ------------------------------------------------------------------
    console.log("\n=== Cas G · captcha ===\n");

    const g = await ouvrir("g-captcha.html", "https://banc.test/g-captcha.html");

    verifier("Q6 · captcha détecté", g.__releve.page.obstacles.captcha === true);
    verifier("le formulaire est tout de même relevé",
        g.__releve.formulaires[0].nombreChamps === 3,
        `${g.__releve.formulaires[0].nombreChamps} champs`);

    // ------------------------------------------------------------------
    console.log("\n=== Cas H · sans balise form, champs conditionnels ===\n");

    const h = await ouvrir("h-sans-form.html", "https://banc.test/h-sans-form.html");

    verifier("relevé malgré l'absence de <form>", Boolean(h.__releve));
    verifier("les 5 champs de départ sont vus",
        h.__releve.formulaires[0].nombreChamps === 5,
        `${h.__releve.formulaires[0].nombreChamps} champs`);
    verifier("aucun conditionnel au premier relevé",
        h.__releve.page.conditionnels === 0, String(h.__releve.page.conditionnels));

    h.__releve = null;
    h.document.getElementById("local").value = "C";
    h.document.getElementById("local").dispatchEvent(new h.Event("change", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 1400));

    verifier("Q5 · 3 champs conditionnels détectés",
        h.__releve.page.conditionnels === 3, `${h.__releve.page.conditionnels} détecté(s)`);
    verifier("le groupe radio conditionnel compte pour un seul champ",
        h.__releve.formulaires[0].nombreChamps === 8,
        `${h.__releve.formulaires[0].nombreChamps} champs`);

    console.log(`\n${echecs === 0 ? "TOUS LES TESTS PASSENT" : `${echecs} ÉCHEC(S)`}\n`);
    process.exit(echecs === 0 ? 0 : 1);
}

executer();
