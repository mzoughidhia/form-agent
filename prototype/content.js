// ---------------------------------------------------------------------------
// Normalisation : minuscules, sans accents, ponctuation aplatie en espaces.
// "Adresse e-mail *" -> "adresse e mail"
// "N° de téléphone"  -> "n de telephone"
// ---------------------------------------------------------------------------
function normaliser(texte) {
    return (texte || "")
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

// ---------------------------------------------------------------------------
// Les règles. Une entrée par donnée connue du profil.
//
//   autocomplete : valeurs standard HTML -> décisif quand présent
//   types        : types d'input qui confirment la règle
//   motsCles     : motifs testés sur le texte normalisé, avec leur poids
//   interdits    : si l'un correspond, la règle est écartée
//
// Elles ne servent plus qu'au premier passage sur un formulaire inconnu :
// dès qu'un formulaire a été observé, c'est son empreinte qui fait foi.
// ---------------------------------------------------------------------------
const REGLES = [
    {
        cle: "civilite",
        autocomplete: ["honorific-prefix", "sex"],
        motsCles: [
            { motif: /\bcivilite\b/, poids: 50 },
            { motif: /\b(salutation|titre)\b/, poids: 35 },
            { motif: /\b(genre|sexe)\b/, poids: 30 }
        ],
        interdits: []
    },
    {
        cle: "prenom",
        autocomplete: ["given-name"],
        motsCles: [
            { motif: /\bprenom\b/, poids: 40 },
            { motif: /\b(first|given) ?name\b/, poids: 40 },
            { motif: /\bfname\b/, poids: 30 }
        ],
        interdits: []
    },
    {
        cle: "nom",
        autocomplete: ["family-name"],
        motsCles: [
            { motif: /\bnom de famille\b/, poids: 50 },
            { motif: /\b(last ?name|lastname|surname)\b/, poids: 40 },
            { motif: /\blname\b/, poids: 30 },
            { motif: /\bnom\b/, poids: 25 }
        ],
        // "prénom", "nom d'utilisateur" et "nom complet" ne sont pas le nom
        interdits: [
            /\bprenom\b/,
            /\bnom d utilisateur\b/,
            /\busername\b/,
            /\bnom complet\b/,
            /\bfull ?name\b/
        ]
    },
    {
        cle: "email",
        autocomplete: ["email"],
        types: ["email"],
        motsCles: [
            { motif: /\be ?mail\b/, poids: 45 },
            { motif: /\bcourriel\b/, poids: 45 },
            { motif: /\bmail\b/, poids: 25 }
        ],
        interdits: []
    },
    {
        cle: "telephone",
        autocomplete: ["tel", "tel-national"],
        types: ["tel"],
        motsCles: [
            { motif: /\btelephone\b/, poids: 45 },
            { motif: /\b(phone|mobile|portable|gsm)\b/, poids: 40 },
            { motif: /\btel\b/, poids: 30 }
        ],
        interdits: []
    },
    {
        cle: "adresse",
        autocomplete: ["street-address", "address-line1"],
        motsCles: [
            { motif: /\badresse (postale|de residence|du domicile)\b/, poids: 55 },
            { motif: /\b(rue|street)\b/, poids: 40 },
            { motif: /\b(adresse|address)\b/, poids: 30 },
            { motif: /\bdomicile\b/, poids: 30 }
        ],
        // "adresse e-mail" et "adresse IP" ne sont pas une adresse postale
        interdits: [/\b(e ?mail|mail|courriel)\b/, /\bip\b/]
    },
    {
        cle: "codePostal",
        autocomplete: ["postal-code"],
        motsCles: [
            { motif: /\bcode postal\b/, poids: 55 },
            { motif: /\b(postal ?code|zip ?code|zip)\b/, poids: 45 },
            { motif: /\bcp\b/, poids: 30 }
        ],
        interdits: []
    },
    {
        cle: "ville",
        autocomplete: ["address-level2"],
        motsCles: [
            { motif: /\bville\b/, poids: 45 },
            { motif: /\b(city|town)\b/, poids: 45 },
            { motif: /\bcommune\b/, poids: 40 },
            { motif: /\blocalite\b/, poids: 35 }
        ],
        interdits: []
    },
    {
        cle: "pays",
        autocomplete: ["country", "country-name"],
        motsCles: [
            { motif: /\bpays\b/, poids: 50 },
            { motif: /\bcountry\b/, poids: 50 }
        ],
        interdits: []
    },
    {
        cle: "dateNaissance",
        autocomplete: ["bday"],
        types: ["date"],
        motsCles: [
            { motif: /\bdate de naissance\b/, poids: 55 },
            { motif: /\b(birth ?date|date of birth|birthday)\b/, poids: 50 },
            { motif: /\bnaissance\b/, poids: 40 },
            { motif: /\bne le\b/, poids: 35 },
            { motif: /\bdob\b/, poids: 30 }
        ],
        interdits: []
    },
    {
        cle: "newsletter",
        motsCles: [
            { motif: /\bnewsletter\b/, poids: 50 },
            { motif: /\b(infolettre|lettre d information)\b/, poids: 45 },
            { motif: /\b(actualites|nouveautes)\b/, poids: 30 },
            { motif: /\boffres\b/, poids: 25 }
        ],
        interdits: []
    }
];

const SEUIL = 10;          // en dessous, on préfère ne rien écrire
const BONUS_TYPE = 30;     // input type="email", type="tel"...
const DELAI_ENREGISTREMENT = 600;   // ms d'inactivité avant sauvegarde

// Formes équivalentes rencontrées dans les listes déroulantes et les radios.
const SYNONYMES = [
    ["m", "mr", "monsieur", "homme", "male", "masculin"],
    ["mme", "mrs", "ms", "madame", "femme", "female", "feminin"],
    ["mlle", "miss", "mademoiselle"],
    ["oui", "yes", "true", "o", "1"],
    ["non", "no", "false", "n", "0"]
];

// Une case de consentement n'est ni cochée ni mémorisée automatiquement :
// accepter des conditions est un acte juridique, pas un remplissage.
const CONSENTEMENT =
    /\b(conditions|cgu|cgv|politique|confidentialite|privacy|terms|consent|charte|reglement|accepte|certifie|autorise|engage)\b/;

// ---------------------------------------------------------------------------
// Récupération du libellé associé à un champ.
// ---------------------------------------------------------------------------
function texteLabel(champ) {
    const morceaux = [];

    if (champ.id) {
        document
            .querySelectorAll(`label[for="${CSS.escape(champ.id)}"]`)
            .forEach((label) => morceaux.push(label.textContent));
    }

    const labelParent = champ.closest("label");

    if (labelParent) {
        morceaux.push(labelParent.textContent);
    }

    const decritPar = champ.getAttribute("aria-labelledby");

    if (decritPar) {
        decritPar.split(/\s+/).forEach((id) => {
            const element = document.getElementById(id);
            if (element) {
                morceaux.push(element.textContent);
            }
        });
    }

    return morceaux.join(" ");
}

// Texte proche : l'élément précédent, et le texte brut du conteneur.
// C'est ce qui rattrape les <label>Nom</label><input> non associés par "for".
function texteVoisin(champ) {
    const morceaux = [];
    const precedent = champ.previousElementSibling;

    if (precedent && !precedent.matches("input, select, textarea")) {
        morceaux.push(precedent.textContent);
    }

    const conteneur = champ.parentElement;

    if (conteneur) {
        conteneur.childNodes.forEach((noeud) => {
            if (noeud.nodeType === Node.TEXT_NODE) {
                morceaux.push(noeud.textContent);
            }
        });
    }

    return morceaux.join(" ").slice(0, 150);
}

// Pour un radio ou une case, l'information est souvent portée par le groupe :
// <fieldset><legend>Civilité</legend> ... </fieldset>
// Réservé à ces deux types : sur un champ texte, une légende large
// ("Adresse") contaminerait tous les champs qu'elle contient.
function texteGroupe(champ) {
    const morceaux = [];
    const fieldset = champ.closest("fieldset");

    if (fieldset) {
        const legende = fieldset.querySelector("legend");
        if (legende) {
            morceaux.push(legende.textContent);
        }
    }

    const groupe = champ.closest("[role=radiogroup], [role=group]");

    if (groupe) {
        morceaux.push(groupe.getAttribute("aria-label") || "");
    }

    return morceaux.join(" ");
}

// Chaque source de texte a une fiabilité différente.
function sources(champ) {
    const liste = [
        { texte: texteLabel(champ), poids: 1 },
        { texte: champ.getAttribute("aria-label"), poids: 1 },
        { texte: champ.name, poids: 0.9 },
        { texte: champ.id, poids: 0.9 },
        { texte: champ.placeholder, poids: 0.8 },
        { texte: champ.title, poids: 0.7 },
        { texte: texteVoisin(champ), poids: 0.5 }
    ];

    if (champ.type === "radio" || champ.type === "checkbox") {
        liste.push({ texte: texteGroupe(champ), poids: 0.9 });
    }

    return liste;
}

// ---------------------------------------------------------------------------
// Score d'une règle pour un champ donné.
// ---------------------------------------------------------------------------
function score(champ, regle, textes) {
    const autocomplete = normaliser(champ.getAttribute("autocomplete"))
        .replace(/ /g, "-");

    // Signal standard : on ne cherche pas plus loin.
    if (regle.autocomplete && regle.autocomplete.includes(autocomplete)) {
        return 100;
    }

    let meilleur = 0;

    for (const source of textes) {

        if (!source.texte) {
            continue;
        }

        if (regle.interdits.some((motif) => motif.test(source.texte))) {
            continue;
        }

        for (const cle of regle.motsCles) {
            if (cle.motif.test(source.texte)) {
                meilleur = Math.max(meilleur, cle.poids * source.poids);
            }
        }
    }

    if (meilleur > 0 && regle.types && regle.types.includes(champ.type)) {
        meilleur += BONUS_TYPE;
    }

    return meilleur;
}

function trouverRegle(champ) {
    const textes = sources(champ).map((source) => ({
        texte: normaliser(source.texte),
        poids: source.poids
    }));

    let gagnante = null;
    let meilleur = 0;

    for (const regle of REGLES) {
        const valeur = score(champ, regle, textes);

        if (valeur > meilleur) {
            meilleur = valeur;
            gagnante = regle;
        }
    }

    return (gagnante && meilleur >= SEUIL)
        ? { regle: gagnante, score: Math.round(meilleur) }
        : null;
}

// ---------------------------------------------------------------------------
// Libellé normalisé servant de clé dans la mémoire transversale.
// ---------------------------------------------------------------------------
function signature(champ) {
    const candidats = [];

    // Sur un radio, le libellé propre est celui de l'option ("Monsieur") :
    // inutilisable comme clé. C'est le groupe qui identifie la question.
    if (champ.type === "radio") {
        candidats.push(texteGroupe(champ), champ.name);
    }

    candidats.push(
        texteLabel(champ),
        champ.getAttribute("aria-label"),
        champ.placeholder,
        champ.title,
        texteVoisin(champ),
        champ.name,
        champ.id
    );

    for (const candidat of candidats) {
        const cle = normaliser(candidat).slice(0, 60).trim();

        if (cle.length >= 2) {
            return cle;
        }
    }

    return null;
}

function chercherAppris(champ, appris) {
    const cle = signature(champ);

    if (!cle || !appris) {
        return null;
    }

    if (appris[cle] !== undefined) {
        return { cle, valeur: appris[cle], exact: true };
    }

    for (const [connue, valeur] of Object.entries(appris)) {
        if (connue.length >= 4 &&
            (cle.includes(connue) || connue.includes(cle))) {
            return { cle: connue, valeur, exact: false };
        }
    }

    return null;
}

// ---------------------------------------------------------------------------
// Comparaison d'une valeur mémorisée avec une étiquette de la page.
// "M." doit reconnaître "Monsieur", "Tunisie" doit reconnaître "TUNISIE".
// ---------------------------------------------------------------------------
function equivalents(a, b) {
    if (a === b) {
        return true;
    }

    return SYNONYMES.some((groupe) => groupe.includes(a) && groupe.includes(b));
}

function correspondance(candidat, valeur) {
    if (!candidat || !valeur) {
        return 0;
    }

    if (equivalents(candidat, valeur)) {
        return 4;
    }

    // En dessous de 3 caractères, "m" collerait aussi bien à "Monsieur"
    // qu'à "Madame" : on exige une base suffisante.
    if (candidat.length < 3 || valeur.length < 3) {
        return 0;
    }

    if (candidat.startsWith(valeur) || valeur.startsWith(candidat)) {
        return 3;
    }

    if (candidat.includes(valeur) || valeur.includes(candidat)) {
        return 2;
    }

    return 0;
}

function etiquettes(element) {
    if (element.tagName === "OPTION") {
        return [
            normaliser(element.textContent),
            normaliser(element.value),
            normaliser(element.getAttribute("label"))
        ];
    }

    return [
        normaliser(texteLabel(element)),
        normaliser(element.value),
        normaliser(texteVoisin(element))
    ];
}

function meilleureCorrespondance(elements, valeur) {
    let gagnant = null;
    let meilleur = 0;

    for (const element of elements) {
        for (const etiquette of etiquettes(element)) {
            const note = correspondance(etiquette, valeur);

            if (note > meilleur) {
                meilleur = note;
                gagnant = element;
            }
        }
    }

    return meilleur > 0 ? gagnant : null;
}

function etiquettePrincipale(element) {
    const candidats = [
        texteLabel(element),
        texteVoisin(element),
        element.value
    ];

    for (const candidat of candidats) {
        const texte = (candidat || "").replace(/\s+/g, " ").trim();

        if (texte) {
            return texte;
        }
    }

    return "";
}

// ---------------------------------------------------------------------------
// Écriture, en prévenant la page.
// Sans ces événements, React / Vue / Angular ignorent la saisie.
// ---------------------------------------------------------------------------
function notifier(champ) {
    champ.dispatchEvent(new Event("input", { bubbles: true }));
    champ.dispatchEvent(new Event("change", { bubbles: true }));
}

function surligner(champ) {
    const cible = (champ.type === "radio" || champ.type === "checkbox")
        ? (champ.closest("label") || champ)
        : champ;

    const bordure = cible.style.outline;
    cible.style.outline = "2px solid #2e7d32";
    setTimeout(() => { cible.style.outline = bordure; }, 1500);
}

function versFormatDate(valeur) {
    const jourMoisAnnee = valeur.match(/^(\d{2})\D(\d{2})\D(\d{4})$/);

    return jourMoisAnnee
        ? `${jourMoisAnnee[3]}-${jourMoisAnnee[2]}-${jourMoisAnnee[1]}`
        : valeur;
}

function versFormatLisible(valeur) {
    const anneeMoisJour = valeur.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    return anneeMoisJour
        ? `${anneeMoisJour[3]}/${anneeMoisJour[2]}/${anneeMoisJour[1]}`
        : valeur;
}

function optionInvite(option) {
    const texte = normaliser(option.textContent);

    return !option.value ||
        texte === "" ||
        /^(choisir|choisissez|selectionner|selectionnez|select|aucun|none)\b/
            .test(texte);
}

function remplirSelect(champ, valeur) {
    const options = Array.from(champ.options).filter(
        (option) => !optionInvite(option) && !option.disabled
    );

    const gagnante = meilleureCorrespondance(options, normaliser(valeur));

    if (!gagnante) {
        return false;
    }

    champ.value = gagnante.value;
    notifier(champ);
    surligner(champ);
    return true;
}

function boutonsDuGroupe(champ) {
    const formulaire = champ.form || document;

    return Array.from(formulaire.querySelectorAll(
        `input[type=radio][name="${CSS.escape(champ.name)}"]`
    )).filter((bouton) => !bouton.disabled);
}

function remplirRadio(champ, valeur) {
    const gagnant = meilleureCorrespondance(
        boutonsDuGroupe(champ),
        normaliser(valeur)
    );

    if (!gagnant) {
        return false;
    }

    gagnant.checked = true;
    notifier(gagnant);
    surligner(gagnant);
    return true;
}

// Point d'entrée unique de l'écriture, quel que soit le type de champ.
function ecrireChamp(champ, valeur) {

    if (champ.tagName === "SELECT") {
        return remplirSelect(champ, valeur);
    }

    if (champ.type === "radio") {
        return remplirRadio(champ, valeur);
    }

    if (champ.type === "checkbox") {
        const brute = normaliser(valeur);
        const oui = equivalents(brute, "oui");
        const non = equivalents(brute, "non");

        // Une valeur non booléenne n'a rien à faire sur une case.
        if (!oui && !non) {
            return false;
        }

        if (champ.checked !== oui) {
            champ.checked = oui;
            notifier(champ);
            surligner(champ);
        }

        return true;
    }

    champ.value = (champ.type === "date")
        ? versFormatDate(valeur)
        : valeur;

    notifier(champ);
    surligner(champ);
    return true;
}

// ---------------------------------------------------------------------------
function ignorer(champ) {
    // getClientRects() plutôt que offsetParent : ce dernier vaut null
    // sur les éléments en position:fixed, pourtant bien visibles.
    return champ.disabled ||
        champ.readOnly ||
        champ.getClientRects().length === 0;
}

function estConsentement(champ) {
    return CONSENTEMENT.test(normaliser(
        `${texteLabel(champ)} ${texteVoisin(champ)} ${champ.name}`
    ));
}

const SELECTEUR =
    "input" +
    ":not([type=submit]):not([type=button]):not([type=reset])" +
    ":not([type=image]):not([type=hidden]):not([type=password])" +
    ":not([type=file])" +
    ", select, textarea";

function estChampRemplissable(element) {
    return element instanceof Element && element.matches(SELECTEUR);
}

// Les champs rattachés à un formulaire donné (null = ceux qui n'en ont aucun).
function champsDe(formulaire) {
    const tous = Array.from(document.querySelectorAll(SELECTEUR));

    return tous.filter((champ) => (champ.form || null) === formulaire);
}

// Un seul représentant par groupe de radios.
function champsUniques(formulaire) {
    const groupes = new Set();

    return champsDe(formulaire).filter((champ) => {

        if (ignorer(champ)) {
            return false;
        }

        if (champ.type === "radio") {
            if (groupes.has(champ.name)) {
                return false;
            }
            groupes.add(champ.name);
        }

        return true;
    });
}

// ===========================================================================
//  EMPREINTE DE FORMULAIRE
//  Identité du formulaire + structure de ses champs + valeurs observées.
// ===========================================================================

// L'URL sans la chaîne de requête : ?nom=&prenom= change à chaque envoi
// en GET, et donnerait une empreinte différente à chaque fois.
function cleFormulaire(formulaire) {
    const base = location.origin + location.pathname;
    const index = formulaire ? Array.from(document.forms).indexOf(formulaire) : -1;

    return `${base}::${index >= 0 ? index : "libre"}`;
}

function selecteurDe(champ, champs) {
    if (champ.id) {
        return `#${CSS.escape(champ.id)}`;
    }

    if (champ.name) {
        return `[name="${CSS.escape(champ.name)}"]`;
    }

    // Dernier recours : la position dans le formulaire.
    return `::index(${champs.indexOf(champ)})`;
}

function retrouver(fiche, champs) {
    const parIndex = fiche.selecteur.match(/^::index\((\d+)\)$/);

    if (parIndex) {
        return champs[Number(parIndex[1])] || null;
    }

    try {
        return champs.find((champ) => champ.matches(fiche.selecteur)) || null;
    } catch (erreur) {
        return null;
    }
}

// Valeur observée d'un champ. null = rien à retenir.
function lireValeur(champ) {

    if (champ.type === "radio") {
        const coche = boutonsDuGroupe(champ).find((bouton) => bouton.checked);
        return coche ? etiquettePrincipale(coche) : null;
    }

    if (champ.type === "checkbox") {
        return champ.checked ? "oui" : "non";
    }

    if (champ.tagName === "SELECT") {
        const option = champ.selectedOptions[0];

        if (!option || optionInvite(option)) {
            return null;
        }

        // Le texte, pas la valeur : "Informatique" se retrouve ailleurs,
        // "it" est propre à ce site.
        return option.textContent.replace(/\s+/g, " ").trim();
    }

    const brute = champ.value.trim();

    if (!brute) {
        return null;
    }

    return champ.type === "date" ? versFormatLisible(brute) : brute;
}

// Structure complète d'un formulaire, valeurs comprises.
function observer(formulaire) {
    const champs = champsDe(formulaire);
    const fiches = [];
    const profil = {};
    const appris = {};

    champsUniques(formulaire).forEach((champ) => {

        const trouvee = trouverRegle(champ);
        const protege = champ.type === "checkbox" && estConsentement(champ);
        const valeur = protege ? null : lireValeur(champ);

        // La structure est enregistrée même sans valeur : c'est elle
        // qui décrit le formulaire.
        fiches.push({
            selecteur: selecteurDe(champ, champs),
            libelle: signature(champ) || "",
            type: champ.tagName === "SELECT" ? "select" : champ.type,
            regle: trouvee ? trouvee.regle.cle : null,
            protege,
            valeur: valeur || ""
        });

        if (!valeur) {
            return;
        }

        // Mémoire transversale, pour les formulaires jamais observés.
        if (trouvee) {
            profil[trouvee.regle.cle] = valeur;
        } else {
            const cle = signature(champ);
            if (cle) {
                appris[cle] = valeur;
            }
        }
    });

    return {
        empreinte: {
            cle: cleFormulaire(formulaire),
            url: location.origin + location.pathname,
            titre: (document.title || "").slice(0, 80),
            miseAJour: Date.now(),
            champs: fiches
        },
        profil,
        appris
    };
}

// ===========================================================================
//  ENREGISTREMENT AUTOMATIQUE
// ===========================================================================

let minuteur = null;
let enCoursDeRemplissage = false;

function enregistrer(formulaire) {
    const releve = observer(formulaire);
    const renseignes = releve.empreinte.champs
        .filter((fiche) => fiche.valeur).length;

    // Un formulaire entièrement vide n'a rien à apprendre : ne pas écraser
    // une empreinte déjà constituée par une version vierge de la page.
    if (renseignes === 0) {
        return;
    }

    chrome.storage.local.get(
        ["profil", "appris", "formulaires"],
        (etat) => {
            const formulaires = etat.formulaires || {};
            formulaires[releve.empreinte.cle] = releve.empreinte;

            chrome.storage.local.set({
                profil: { ...(etat.profil || {}), ...releve.profil },
                appris: { ...(etat.appris || {}), ...releve.appris },
                formulaires
            });
        }
    );
}

function planifier(cible) {
    if (enCoursDeRemplissage) {
        return;
    }

    const formulaire = cible.form || null;

    clearTimeout(minuteur);
    minuteur = setTimeout(() => enregistrer(formulaire), DELAI_ENREGISTREMENT);
}

// Phase de capture : les événements sont vus même si la page les arrête.
document.addEventListener("input", (evenement) => {
    if (estChampRemplissable(evenement.target)) {
        planifier(evenement.target);
    }
}, true);

document.addEventListener("change", (evenement) => {
    if (estChampRemplissable(evenement.target)) {
        planifier(evenement.target);
    }
}, true);

// À l'envoi, la saisie est complète : c'est le meilleur moment pour figer.
document.addEventListener("submit", (evenement) => {
    clearTimeout(minuteur);
    enregistrer(evenement.target instanceof HTMLFormElement
        ? evenement.target
        : null);
}, true);

// ===========================================================================
//  REMPLISSAGE
// ===========================================================================
function remplir(profil, appris, formulaires) {
    const journal = [];
    const traites = new Set();

    const cibles = [...Array.from(document.forms), null];

    // 1. Restitution exacte à partir de l'empreinte du formulaire.
    cibles.forEach((formulaire) => {
        const empreinte = (formulaires || {})[cleFormulaire(formulaire)];

        if (!empreinte) {
            return;
        }

        const champs = champsDe(formulaire);

        empreinte.champs.forEach((fiche) => {

            if (!fiche.valeur || fiche.protege) {
                return;
            }

            const champ = retrouver(fiche, champs);

            if (!champ || ignorer(champ) || traites.has(champ)) {
                return;
            }

            if (!ecrireChamp(champ, fiche.valeur)) {
                return;
            }

            if (champ.type === "radio") {
                boutonsDuGroupe(champ).forEach((bouton) => traites.add(bouton));
            } else {
                traites.add(champ);
            }

            journal.push({
                champ: fiche.selecteur,
                origine: `structure » ${fiche.libelle || fiche.type}`,
                score: 100
            });
        });
    });

    // 2. Repli pour tout ce que l'empreinte ne couvre pas :
    //    règles connues, puis mémoire transversale.
    cibles.forEach((formulaire) => {
        champsUniques(formulaire).forEach((champ) => {

            if (traites.has(champ)) {
                return;
            }

            if (champ.type === "checkbox" && estConsentement(champ)) {
                journal.push({
                    champ: champ.name || champ.id || "(sans nom)",
                    origine: "— ignoré (consentement)",
                    score: 0
                });
                return;
            }

            const trouvee = trouverRegle(champ);

            let valeur = trouvee ? profil[trouvee.regle.cle] : null;
            let origine = trouvee ? `regle » ${trouvee.regle.cle}` : null;
            let note = trouvee ? trouvee.score : 0;

            if (!valeur) {
                const rappel = chercherAppris(champ, appris);

                if (rappel) {
                    valeur = rappel.valeur;
                    origine = `appris » ${rappel.cle}`;
                    note = rappel.exact ? 100 : 60;
                }
            }

            if (!valeur || !ecrireChamp(champ, valeur)) {
                return;
            }

            traites.add(champ);

            journal.push({
                champ: champ.name || champ.id || "(sans nom)",
                origine,
                score: note
            });
        });
    });

    return journal;
}

// État des empreintes connues pour la page courante, pour le popup.
function etat() {
    const cibles = [...Array.from(document.forms), null];
    const connus = [];

    cibles.forEach((formulaire) => {
        const cle = cleFormulaire(formulaire);
        connus.push({
            cle,
            champs: champsUniques(formulaire).length
        });
    });

    return { url: location.origin + location.pathname, formulaires: connus };
}

// ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((message, expediteur, repondre) => {

    if (message.action === "etat") {
        repondre(etat());
        return;
    }

    if (message.action === "remplir") {
        enCoursDeRemplissage = true;

        const journal = remplir(
            message.profil || {},
            message.appris || {},
            message.formulaires || {}
        );

        // Laisse passer les événements que l'on vient d'émettre avant de
        // réactiver l'observation, sinon on réenregistre son propre travail.
        setTimeout(() => { enCoursDeRemplissage = false; }, 300);

        const remplis = journal.filter((ligne) => ligne.score > 0).length;

        console.table(journal);
        repondre({ remplis, journal });
        return;
    }
});
