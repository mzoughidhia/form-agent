// Test de la sonde : on fait tourner le VRAI sonde.js sur un formulaire
// représentatif et on vérifie ce qu'il relève.
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");

// La page de test navigue vers l'étape 2 : jsdom n'implémente pas la
// navigation et le signalerait bruyamment. Sans importance ici.
const consoleVirtuelle = new VirtualConsole();
consoleVirtuelle.on("jsdomError", () => {});

const DOSSIER = __dirname;
const ADRESSE = "https://extranet-test.fr/tarificateur/auto";

const html = fs.readFileSync(`${DOSSIER}/test-formulaire.html`, "utf8");
const commun = fs.readFileSync(`${DOSSIER}/commun.js`, "utf8");
const sonde = fs.readFileSync(`${DOSSIER}/sonde.js`, "utf8");

let echecs = 0;

function verifier(intitule, condition, detail) {
    const marque = condition ? "  OK  " : " ECHEC";
    console.log(`${marque}  ${intitule}${detail ? `  →  ${detail}` : ""}`);
    if (!condition) echecs += 1;
}

async function executer() {
    const dom = new JSDOM(html, {
        runScripts: "dangerously",
        url: ADRESSE,
        pretendToBeVisual: true,
        virtualConsole: consoleVirtuelle
    });

    const { window } = dom;

    // jsdom n'implémente pas CSS.escape ; la sonde s'en sert pour les labels.
    if (!window.CSS) window.CSS = {};
    if (!window.CSS.escape) {
        window.CSS.escape = (valeur) => String(valeur).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
    }

    // Bouchon des API d'extension. Il vit ici, et non dans la page de test :
    // celle-ci doit rester un formulaire ordinaire, pour servir aussi à
    // essayer la vraie extension dans Chrome.
    window.__releve = null;
    window.chrome = {
        storage: {
            local: { get: async () => ({ domaines: [new URL(ADRESSE).origin] }) }
        },
        runtime: {
            sendMessage: async (message) => {
                window.__releve = message;
                return {};
            }
        }
    };

    // On injecte les fichiers réels, dans l'ordre du manifeste.
    [commun, sonde].forEach((source) => {
        const balise = window.document.createElement("script");
        balise.textContent = source;
        window.document.body.appendChild(balise);
    });

    await new Promise((r) => setTimeout(r, 1400));

    const releve = window.__releve;

    console.log("\n=== RELEVÉ ===\n");
    verifier("un relevé a été envoyé", Boolean(releve));
    if (!releve) return;

    const formulaire = releve.formulaires[0];
    const champs = formulaire.champs;
    const parNom = Object.fromEntries(champs.map((c) => [c.nom || c.identifiant, c]));

    console.log(
        champs
            .map((c) => `   ${String(c.position).padStart(2)}  ${c.type.padEnd(8)} ${(c.nom || "—").padEnd(22)} « ${c.libelle} »`)
            .join("\n")
    );
    console.log("");

    // --- Extraction des libellés, les 4 cas ---
    verifier("Q·libellé  label for=",       parNom.conducteur_nom?.libelle === "Nom de naissance",        parNom.conducteur_nom?.libelle);
    verifier("Q·libellé  label englobant",  parNom.conducteur_prenom?.libelle === "Prénom",               parNom.conducteur_prenom?.libelle);
    verifier("Q·libellé  aria-label",       parNom.date_naissance?.libelle === "Date de naissance",       parNom.date_naissance?.libelle);
    verifier("Q·libellé  texte précédent",  parNom.permis_date?.libelle === "Date d'obtention du permis", parNom.permis_date?.libelle);

    // --- Sections ---
    verifier("section depuis <legend>", parNom.conducteur_nom?.section === "Conducteur principal", parNom.conducteur_nom?.section);
    verifier("section du 2e fieldset",  parNom.immatriculation?.section === "Véhicule",            parNom.immatriculation?.section);

    // --- Contraintes structurelles ---
    verifier("required relevé",   parNom.conducteur_nom?.requis === true);
    verifier("maxlength relevé",  parNom.conducteur_nom?.longueurMax === 40, String(parNom.conducteur_nom?.longueurMax));
    verifier("pattern relevé",    parNom.date_naissance?.motif === "\\d{2}/\\d{2}/\\d{4}", parNom.date_naissance?.motif);
    verifier("placeholder relevé", parNom.permis_date?.indice === "JJ/MM/AAAA", parNom.permis_date?.indice);

    // --- Select : les valeurs opaques doivent être conservées ---
    const situation = parNom.situation_familiale;
    verifier("select : options relevées", situation?.options?.length === 4, `${situation?.options?.length} options`);
    verifier(
        "select : valeur opaque conservée",
        situation?.options?.some((o) => o.texte === "Marié(e)" && o.valeur === "2"),
        JSON.stringify(situation?.options?.find((o) => o.texte === "Marié(e)"))
    );

    // --- Groupe radio : 3 boutons = 1 champ, libellé du GROUPE ---
    const radios = champs.filter((c) => c.type === "radio");
    verifier("radio : groupe compté une seule fois", radios.length === 1, `${radios.length} champ(s) radio`);
    verifier("radio : libellé du groupe, pas de l'option", radios[0]?.libelle === "Sexe", radios[0]?.libelle);
    verifier("radio : options du groupe relevées", radios[0]?.options?.length === 3, `${radios[0]?.options?.length} options`);

    // --- Le champ conditionnel n'est pas encore dans le DOM ---
    verifier("champ conditionnel absent au départ", !parNom.bailleur);
    verifier("aucun conditionnel au 1er relevé", releve.page.conditionnels === 0, String(releve.page.conditionnels));

    // --- Exclusions ---
    verifier("mot de passe exclu",   !champs.some((c) => c.type === "password"));
    verifier("champ caché exclu",    !champs.some((c) => c.nom === "__VIEWSTATE"));

    // --- Détection du cadre applicatif via le DOM ---
    verifier(
        "Q4 · __VIEWSTATE détecté",
        releve.page.cadresApplicatifs.includes("asp.net-webforms"),
        JSON.stringify(releve.page.cadresApplicatifs)
    );

    // --- Empreinte ---
    verifier("empreinte calculée", /^[0-9a-f]{8}$/.test(formulaire.empreinte), formulaire.empreinte);
    verifier("premier relevé marqué", releve.page.premierReleve === true);
    verifier("signal de chargement complet", releve.page.signaux.includes("chargement-complet"));

    // --- Q3 · l'empreinte doit survivre à des identifiants regénérés ---
    //  Cas isolé : on ne change QUE les id/name, la structure est identique.
    console.log("\n=== Q3 · identifiants regénérés (structure inchangée) ===\n");

    const permis = window.document.getElementById("ctl00_dtPermis");
    permis.id = "ctl00_XYZ_dtPermis_9981";
    permis.name = "permis_date_9981";

    window.__releve = null;
    // id et name ne sont pas dans le filtre d'attributs observés : on
    // déclenche l'observateur par une mutation de classe, comme le ferait
    // n'importe quelle interaction réelle.
    window.document.body.classList.add("recalcul");

    await new Promise((r) => setTimeout(r, 1400));

    const memeStructure = window.__releve;
    verifier("relevé envoyé après changement d'identifiants", Boolean(memeStructure));

    if (memeStructure) {
        verifier(
            "Q3 · empreinte stable malgré id/name changés",
            memeStructure.formulaires[0].empreinte === formulaire.empreinte,
            `${formulaire.empreinte} → ${memeStructure.formulaires[0].empreinte}`
        );
        verifier(
            "Q3 · aucun conditionnel déclenché à tort",
            memeStructure.page.conditionnels === 0,
            String(memeStructure.page.conditionnels)
        );
        verifier("relevé suivant non marqué premier", memeStructure.page.premierReleve === false);
    }

    // --- Q5 · apparition d'un champ conditionnel ---
    console.log("\n=== Q5 · champ conditionnel ===\n");

    window.__releve = null;
    window.document.getElementById("financement").value = "L";
    window.document.getElementById("financement")
        .dispatchEvent(new window.Event("change", { bubbles: true }));

    await new Promise((r) => setTimeout(r, 1400));

    const apres = window.__releve;
    verifier("relevé envoyé après apparition du champ", Boolean(apres));

    if (apres) {
        const formApres = apres.formulaires[0];

        verifier(
            "Q5 · exactement 1 champ conditionnel détecté",
            apres.page.conditionnels === 1,
            `${apres.page.conditionnels} détecté(s)`
        );
        verifier(
            "Q5 · le champ apparu est bien le bailleur",
            formApres.champs.some((c) => c.nom === "bailleur")
        );
        verifier(
            "Q5 · signal champs-conditionnels",
            apres.page.signaux.includes("champs-conditionnels"),
            JSON.stringify(apres.page.signaux)
        );
        verifier(
            "Q5 · empreinte différente : la structure a changé",
            formApres.empreinte !== formulaire.empreinte,
            `${formulaire.empreinte} → ${formApres.empreinte}`
        );
    }

    // --- Relevé avant navigation ---
    //  Le scénario réel : on remplit le dernier champ, et on clique aussitôt
    //  sur « Suivant ». Le `change` du champ relance le report d'inactivité
    //  au moment exact où la page part. Sans relevé immédiat au submit, le
    //  formulaire rempli n'est jamais observé.
    console.log("\n=== Relevé avant navigation ===\n");

    window.__releve = null;

    const dernierChamp = window.document.getElementById("immat");
    dernierChamp.value = "AB-123-CD";
    dernierChamp.dispatchEvent(new window.Event("change", { bubbles: true }));

    verifier(
        "le report d'inactivité est bien relancé (rien de relevé encore)",
        window.__releve === null
    );

    window.document.getElementById("devis")
        .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

    verifier(
        "relevé déclenché immédiatement au submit, sans attendre",
        window.__releve !== null,
        window.__releve ? `${window.__releve.formulaires[0].nombreChamps} champs` : "perdu"
    );

    console.log(`\n${echecs === 0 ? "TOUS LES TESTS PASSENT" : `${echecs} ÉCHEC(S)`}\n`);
    process.exit(echecs === 0 ? 0 : 1);
}

executer();
