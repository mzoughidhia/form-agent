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
        // "adresse e-mail", "adresse IP" et "complément d'adresse" ne sont
        // pas l'adresse postale — le dernier recevait la rue entière.
        interdits: [
            /\b(e ?mail|mail|courriel)\b/,
            /\bip\b/,
            /\bcomplement\b/,
            /\b(batiment|escalier|etage|lieu dit)\b/
        ]
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
// Un champ qu'on ne touche jamais : la page l'a verrouillé.
function ignorer(champ) {
    return champ.disabled || champ.readOnly;
}

// Visible à l'écran maintenant. Sert à signaler ce qu'on a écrit sans que
// le courtier puisse le relire — pas à décider si on l'écrit.
//
// getClientRects() plutôt que offsetParent : ce dernier vaut null sur les
// éléments en position:fixed, pourtant bien visibles.
function estVisible(champ) {
    return champ.getClientRects().length > 0;
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

// Une seule fois par page : au-delà, c'est du harcèlement.
let sansClientSignale = false;

function avertirSansClient() {
    if (sansClientSignale) {
        return;
    }

    sansClientSignale = true;

    console.warn(
        "Form Agent — aucun client sélectionné : votre saisie n'apprend rien. " +
        "Ouvrez le popup et tapez un numéro de client (42, 77, 18)."
    );

    alerter(
        [{ cle: "—", libelle: "Votre saisie n'est rattachée à aucune fiche client." }],
        {
            titre: "Aucun client sélectionné — cette saisie n'apprend rien",
            suite: "Ouvrez le popup, tapez un numéro de client (42, 77, 18), " +
                "puis recommencez la saisie."
        }
    );
}

function enregistrer(formulaire) {

    // L'extension a été rechargée pendant que l'onglet était ouvert : le
    // script est orphelin. Un avertissement clair vaut mieux qu'une erreur
    // rouge à chaque frappe.
    if (!contexteVivant()) {
        console.warn("Form Agent : extension rechargée — recharge la page (F5).");
        return;
    }

    const releve = observer(formulaire);
    const renseignes = releve.empreinte.champs
        .filter((fiche) => fiche.valeur).length;

    // Un formulaire entièrement vide n'a rien à apprendre : ne pas écraser
    // une empreinte déjà constituée par une version vierge de la page.
    if (renseignes === 0) {
        return;
    }

    chrome.storage.local.get(
        ["profil", "appris", "formulaires", "recettes", "clientActif"],
        (etat) => {
            const identite = Compagnies.identifier(location.href);
            const aEcrire = {};

            // SANS client actif : mémoire historique, par valeurs.
            // AVEC un client actif : on n'apprend QUE le sens des champs.
            // Mémoriser aussi les valeurs polluerait le profil avec les
            // données d'un dossier — c'est ce qui faisait réapparaître la
            // saisie manuelle dans le popup.
            if (!etat.clientActif) {
                // Le courtier saisit, et l'extension n'apprend rien parce
                // qu'aucune fiche ne sert de référence. Se taire ici, c'est
                // lui faire perdre sa saisie sans qu'il le sache.
                avertirSansClient();

                const formulaires = etat.formulaires || {};
                formulaires[releve.empreinte.cle] = releve.empreinte;

                aEcrire.profil = { ...(etat.profil || {}), ...releve.profil };
                aEcrire.appris = { ...(etat.appris || {}), ...releve.appris };
                aEcrire.formulaires = formulaires;
            }

            if (etat.clientActif && identite) {

                // Le courtier vient de choisir un client : l'avertissement
                // n'a plus lieu d'être, et le laisser à l'écran ferait
                // douter d'un apprentissage qui, lui, fonctionne.
                if (sansClientSignale) {
                    sansClientSignale = false;
                    retirerAlerte();
                }

                const lecon = apprendre(formulaire, etat.clientActif);
                const recettes = etat.recettes || {};

                if (lecon.champs.length > 0) {
                    recettes[identite.cle] = fusionnerRecette(
                        recettes[identite.cle],
                        lecon.champs,
                        identite
                    );

                    aEcrire.recettes = recettes;

                    console.log(
                        `Form Agent — ${lecon.champs.length} champ(s) compris sur ` +
                        `${identite.compagnie || identite.hote}`
                    );
                }

                lecon.hesitations.forEach((doute) => {
                    console.warn(
                        `Form Agent — « ${doute.champ} » : impossible de trancher entre ` +
                        doute.entre.join(" et ")
                    );
                });

                if (lecon.nonReconnus.length > 0) {
                    console.warn(
                        `Form Agent — ${lecon.nonReconnus.length} champ(s) non reconnus : ` +
                        lecon.nonReconnus.join(", ") +
                        ". Les valeurs tapées ne sont dans la fiche d'aucun client — " +
                        "vérifie que le bon client est sélectionné."
                    );
                }

                // Le compte rendu du dernier apprentissage, pour le popup.
                // Aucune valeur saisie : seulement des libellés de champs.
                aEcrire.derniereLecon = {
                    client: etat.clientActif.id,
                    nomClient: etat.clientActif.nom,
                    formulaire: identite.compagnie || identite.hote,
                    compris: lecon.champs.length,
                    nonReconnus: lecon.nonReconnus,
                    hesitations: lecon.hesitations.map((doute) => doute.champ),
                    date: Date.now()
                };
            }

            chrome.storage.local.set(aEcrire);
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
//  L'ONTOLOGIE AU MILIEU
//
//  Jusqu'ici l'extension retenait « dans ce champ, il y avait 07/03/1985 ».
//  Elle rejouait donc la même date pour tous les clients.
//
//  Désormais, quand une fiche client est active, elle retient « ce champ,
//  c'est client.birthDate, écrit en JJ/MM/AAAA ». La recette ne contient
//  plus aucune donnée personnelle : elle vaut pour n'importe quel client.
// ===========================================================================

let dictionnaire = null;

// Libellé normalisé → clé canonique. 92 champs, 333 libellés : c'est ce que
// l'ontologie sait AVANT d'avoir vu le moindre formulaire.
function dictionnaireDesLibelles() {
    if (dictionnaire) {
        return dictionnaire;
    }

    dictionnaire = new Map();

    ONTOLOGIE.fields.forEach((champ) => {
        [champ.label, ...champ.synonyms].forEach((texte) => {
            const cle = normaliser(texte);

            if (cle && !dictionnaire.has(cle)) {
                dictionnaire.set(cle, champ.key);
            }
        });
    });

    return dictionnaire;
}

function cleParLibelle(champ) {
    const index = dictionnaireDesLibelles();

    const candidats = [
        texteLabel(champ),
        champ.getAttribute("aria-label"),
        champ.placeholder,
        champ.title,
        texteVoisin(champ),
        champ.name,
        champ.id
    ];

    for (const candidat of candidats) {
        const trouve = index.get(normaliser(candidat));

        if (trouve) {
            return trouve;
        }
    }

    return null;
}

function libelleCanonique(cle) {
    const champ = Variantes.champDe(cle);

    return champ ? champ.label : cle;
}

/**
 * La fiche du client, enrichie de ce que le courtier a complété à la main
 * dans le popup. Les compléments ne remplacent jamais la fiche d'origine :
 * ils la rattrapent là où elle est muette.
 */
function ficheComplete(client, complements) {
    if (!client) {
        return null;
    }

    const supplement = (complements || {})[client.id] || {};

    return {
        ...client,
        donnees: { ...client.donnees, ...supplement }
    };
}

/**
 * APPRENDRE — rapprochement par valeur.
 *
 * Pour chaque champ rempli, on demande : quelle donnée de la fiche pouvait
 * produire ça ? Une seule réponse → on apprend le champ ET son format.
 * Plusieurs → le libellé départage. Aucune → on tente le dictionnaire.
 */
function apprendre(formulaire, fiche) {
    const champs = champsDe(formulaire);
    const retenus = [];
    const hesitations = [];
    const nonReconnus = [];

    champsUniques(formulaire).forEach((champ) => {

        if (champ.type === "checkbox" && estConsentement(champ)) {
            return;
        }

        const valeur = lireValeur(champ);

        if (!valeur) {
            return;
        }

        const candidats = Variantes.rapprocher(valeur, fiche.donnees);
        const parLibelle = cleParLibelle(champ);
        let retenu = null;

        if (candidats.length === 1) {
            retenu = candidats[0];
        } else if (candidats.length > 1) {
            // « 0612345678 » peut être le portable ou le fixe : c'est le
            // libellé du champ qui tranche.
            retenu = candidats.find((candidat) => candidat.cle === parLibelle) || null;

            if (!retenu) {
                hesitations.push({
                    champ: signature(champ) || "(sans libellé)",
                    entre: candidats.map((candidat) => candidat.cle)
                });
            }
        }

        // Rien ne correspond en valeur, mais le libellé est connu et la
        // fiche porte la donnée : c'est le même champ, écrit autrement.
        if (!retenu && parLibelle && fiche.donnees[parLibelle] !== undefined) {
            retenu = { cle: parLibelle, format: null };
        }

        if (!retenu) {
            // Une valeur saisie qui ne correspond à aucune donnée de la
            // fiche, et dont le libellé n'est pas connu de l'ontologie.
            // C'est LE cas à signaler : sans ça, le courtier croit avoir
            // entraîné l'extension alors qu'elle n'a rien retenu.
            nonReconnus.push(signature(champ) || selecteurDe(champ, champs));
            return;
        }

        retenus.push({
            selecteur: selecteurDe(champ, champs),
            libelle: signature(champ) || "",
            type: champ.tagName === "SELECT" ? "select" : champ.type,
            cle: retenu.cle,
            format: retenu.format
        });
    });

    return { champs: retenus, hesitations, nonReconnus };
}

// La recette est fusionnée, jamais remplacée : une étape de tunnel ne doit
// pas effacer ce qu'on sait des autres.
function fusionnerRecette(ancienne, nouveaux, identite) {
    const parSelecteur = new Map(
        (ancienne ? ancienne.champs : []).map((entree) => [entree.selecteur, entree])
    );

    nouveaux.forEach((entree) => parSelecteur.set(entree.selecteur, entree));

    return {
        compagnie: identite.compagnie,
        service: identite.service,
        hote: identite.hote,
        chemin: identite.chemin,
        miseAJour: Date.now(),
        champs: Array.from(parSelecteur.values())
    };
}

// ===========================================================================
//  REMPLISSAGE
// ===========================================================================
// Un champ qui porte déjà quelque chose. En remplissage automatique, on ne
// l'écrase pas : le courtier est peut-être en train d'y saisir.
function dejaRempli(champ) {
    if (champ.type === "radio") {
        return boutonsDuGroupe(champ).some((bouton) => bouton.checked);
    }

    if (champ.type === "checkbox") {
        return champ.checked;
    }

    if (champ.tagName === "SELECT") {
        const option = champ.selectedOptions[0];
        return Boolean(option && option.value);
    }

    return champ.value.trim() !== "";
}

function remplir(memoire, options) {
    const choix = options || {};
    const seulementVides = Boolean(choix.seulementVides);

    // Mode strict : SEULE la recette de ce formulaire s'applique. Ni
    // dictionnaire, ni mémoire historique. Un formulaire jamais entraîné
    // reste vide — c'est ce qu'il faut pour éprouver un formulaire à la fois.
    const strict = Boolean(choix.recetteSeule || memoire.strict);

    const profil = memoire.profil || {};
    const appris = memoire.appris || {};
    const formulaires = memoire.formulaires || {};
    const recettes = memoire.recettes || {};
    const fiche = ficheComplete(memoire.clientActif, memoire.complements);

    const journal = [];
    const manquants = [];
    const traites = new Set();

    const cibles = [...Array.from(document.forms), null];

    // 0. La recette + la fiche client : le chemin qui vaut pour TOUS les
    //    clients. Il passe avant tout le reste.
    const identite = Compagnies.identifier(location.href);
    const recette = identite ? recettes[identite.cle] : null;

    if (recette && fiche) {
        cibles.forEach((formulaire) => {
            const champs = champsDe(formulaire);

            recette.champs.forEach((entree) => {
                const champ = retrouver(entree, champs);

                if (!champ || ignorer(champ) || traites.has(champ)) {
                    return;
                }

                if (seulementVides && dejaRempli(champ)) {
                    return;
                }

                const brute = fiche.donnees[entree.cle];

                if (brute === undefined || brute === "") {
                    // La fiche ne porte pas la donnée : ce n'est pas un
                    // défaut de l'extension, c'est au courtier de compléter.
                    if (!manquants.some((manque) => manque.cle === entree.cle)) {
                        manquants.push({
                            cle: entree.cle,
                            libelle: libelleCanonique(entree.cle),
                            surLeFormulaire: entree.libelle
                        });
                    }
                    return;
                }

                const texte = entree.format
                    ? Variantes.formater(entree.cle, brute, entree.format)
                    : (Variantes.de(entree.cle, brute)[0] || { texte: brute }).texte;

                if (!ecrireChamp(champ, texte)) {
                    return;
                }

                if (champ.type === "radio") {
                    boutonsDuGroupe(champ).forEach((bouton) => traites.add(bouton));
                } else {
                    traites.add(champ);
                }

                journal.push({
                    champ: entree.selecteur,
                    origine: `fiche » ${entree.cle}` +
                        (entree.format ? ` (${entree.format})` : "") +
                        (estVisible(champ) ? "" : "  [masqué]"),
                    score: 100
                });
            });
        });
    }

    // 1. Restitution exacte à partir de l'empreinte du formulaire.
    cibles.forEach((formulaire) => {

        // Un client est actif : on n'écrit QUE ses données. Les valeurs
        // mémorisées viennent d'une saisie précédente, faite pour un autre
        // dossier — les mélanger produirait un devis faux.
        if (fiche || strict) {
            return;
        }

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

            if (seulementVides && dejaRempli(champ)) {
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
                origine: `structure » ${fiche.libelle || fiche.type}` +
                    (estVisible(champ) ? "" : "  [masqué]"),
                score: 100
            });
        });
    });

    // 2. Repli pour tout ce que l'empreinte ne couvre pas :
    //    dictionnaire de l'ontologie, ou mémoire historique.
    //    En mode strict, on s'arrête ici : rien d'autre que la recette.
    if (strict) {
        return { journal, manquants };
    }

    cibles.forEach((formulaire) => {
        champsUniques(formulaire).forEach((champ) => {

            if (traites.has(champ)) {
                return;
            }

            if (seulementVides && dejaRempli(champ)) {
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

            let valeur = null;
            let origine = null;
            let note = 0;

            if (fiche) {
                // Client actif : la seule source est sa fiche. Le champ n'est
                // pas dans la recette, mais son libellé est peut-être connu
                // de l'ontologie — c'est le dictionnaire qui le rattrape.
                const cle = cleParLibelle(champ);
                const brute = cle ? fiche.donnees[cle] : undefined;

                if (cle && (brute === undefined || brute === "")) {
                    if (!manquants.some((manque) => manque.cle === cle)) {
                        manquants.push({
                            cle,
                            libelle: libelleCanonique(cle),
                            surLeFormulaire: signature(champ) || ""
                        });
                    }
                } else if (cle) {
                    valeur = (Variantes.de(cle, brute)[0] || { texte: brute }).texte;
                    origine = `dictionnaire » ${cle}`;
                    note = 80;
                }
            } else {
                const trouvee = trouverRegle(champ);

                valeur = trouvee ? profil[trouvee.regle.cle] : null;
                origine = trouvee ? `regle » ${trouvee.regle.cle}` : null;
                note = trouvee ? trouvee.score : 0;

                if (!valeur) {
                    const rappel = chercherAppris(champ, appris);

                    if (rappel) {
                        valeur = rappel.valeur;
                        origine = `appris » ${rappel.cle}`;
                        note = rappel.exact ? 100 : 60;
                    }
                }
            }

            if (!valeur || !ecrireChamp(champ, valeur)) {
                return;
            }

            traites.add(champ);

            journal.push({
                champ: champ.name || champ.id || "(sans nom)",
                origine: origine + (estVisible(champ) ? "" : "  [masqué]"),
                score: note
            });
        });
    });

    return { journal, manquants };
}

// ===========================================================================
//  L'ALERTE DANS LA PAGE
//
//  Le courtier ne doit pas avoir à ouvrir le popup pour savoir qu'il manque
//  une donnée : il relit le formulaire, pas l'extension.
// ===========================================================================

const ID_ALERTE = "form-agent-alerte";

function retirerAlerte() {
    const ancienne = document.getElementById(ID_ALERTE);

    if (ancienne) {
        ancienne.remove();
    }
}

/**
 * Le bandeau d'alerte, en bas de la page.
 *
 * `sur_mesure` remplace l'intitulé « N données manquent » : il sert aux
 * avertissements qui ne parlent pas de données absentes — le premier étant
 * « aucun client sélectionné », qui doit se lire sans ouvrir le popup.
 */
function alerter(manquants, sur_mesure) {
    retirerAlerte();

    if (manquants.length === 0) {
        return;
    }

    const bandeau = document.createElement("div");

    bandeau.id = ID_ALERTE;
    bandeau.style.cssText = [
        "position:fixed", "left:16px", "right:16px", "bottom:16px", "z-index:2147483647",
        "background:#f8eeda", "border-left:4px solid #8a5a00", "color:#5c3d00",
        "font:13px/1.5 system-ui,'Segoe UI',sans-serif", "padding:12px 16px",
        "border-radius:3px", "box-shadow:0 2px 12px rgba(0,0,0,.18)",
        "display:flex", "gap:12px", "align-items:flex-start"
    ].join(";");

    const texte = document.createElement("div");
    texte.style.flex = "1";

    const titre = document.createElement("b");
    titre.textContent = sur_mesure
        ? sur_mesure.titre
        : (manquants.length === 1
            ? "1 donnée manque pour ce formulaire"
            : `${manquants.length} données manquent pour ce formulaire`);

    const liste = document.createElement("div");
    liste.style.marginTop = "3px";
    liste.textContent = manquants.map((manque) => manque.libelle).join("  ·  ");

    const suite = document.createElement("div");
    suite.style.cssText = "margin-top:5px;font-size:12px;opacity:.85";
    suite.textContent = sur_mesure
        ? sur_mesure.suite
        : "À compléter dans la fiche du client, ou directement dans le popup.";

    texte.append(titre, liste, suite);

    const fermer = document.createElement("button");
    fermer.textContent = "Fermer";
    fermer.style.cssText =
        "font:inherit;font-size:12px;padding:4px 10px;cursor:pointer;" +
        "border:1px solid #c9a86a;border-radius:3px;background:#fff;color:#5c3d00";
    fermer.addEventListener("click", retirerAlerte);

    bandeau.append(texte, fermer);
    document.body.append(bandeau);
}

// État de la page pour le popup : les empreintes, l'identité du formulaire,
// et surtout la LISTE DES CHAMPS tels qu'ils sont sur cette page — c'est
// elle qui permet au popup d'être le miroir du formulaire.
function champsDuFormulaire(recette) {
    const parSelecteur = new Map(
        (recette ? recette.champs : []).map((entree) => [entree.selecteur, entree])
    );

    const vus = [];

    [...Array.from(document.forms), null].forEach((formulaire) => {
        const champs = champsDe(formulaire);

        champsUniques(formulaire).forEach((champ) => {
            const selecteur = selecteurDe(champ, champs);
            const apprise = parSelecteur.get(selecteur);
            const cle = apprise ? apprise.cle : cleParLibelle(champ);

            vus.push({
                selecteur,
                libelle: signature(champ) || "(sans libellé)",
                type: champ.tagName === "SELECT" ? "select" : champ.type,
                cle: cle || null,
                format: apprise ? apprise.format : null,
                origine: apprise ? "recette" : (cle ? "dictionnaire" : null),
                visible: estVisible(champ),
                consentement: champ.type === "checkbox" && estConsentement(champ)
            });
        });
    });

    return vus;
}

function etat(recettes) {
    const cibles = [...Array.from(document.forms), null];
    const connus = [];

    cibles.forEach((formulaire) => {
        const cle = cleFormulaire(formulaire);
        connus.push({
            cle,
            champs: champsUniques(formulaire).length
        });
    });

    const identite = Compagnies.identifier(location.href);
    const recette = identite ? (recettes || {})[identite.cle] : null;

    return {
        url: location.origin + location.pathname,
        formulaires: connus,
        // Qui est en face : c'est ce que le popup affiche en tête.
        identite,
        // Le formulaire, champ par champ : le popup s'y conforme.
        champs: champsDuFormulaire(recette)
    };
}

// ===========================================================================
//  LE PARCOURS — remplir les pages suivantes
//
//  Un formulaire réparti sur plusieurs URL ne peut pas être rempli d'un seul
//  clic : les autres pages n'existent pas encore dans le navigateur. Ce qui
//  est possible, c'est de retenir que le courtier a cliqué « Remplir », et
//  de remplir chaque page du parcours au moment où elle s'affiche — puis à
//  chaque fois que de nouveaux champs apparaissent.
//
//  Trois limites, qui sont le prix de la sécurité :
//    - le clic vaut consentement, mais seulement pour CE site
//    - il expire au bout de trente minutes
//    - il ne survit pas à un « Arrêter le parcours » depuis le popup
// ===========================================================================

const AUTO_MAX = 5;            // garde-fou anti-boucle sur les pages agitées
const AUTO_DELAI = 400;        // ms d'accalmie avant de retenter

// Le parcours armé vaut-il pour la page où l'on se trouve ?
function parcoursActif(etat) {
    const parcours = etat.parcours;

    return Boolean(parcours) &&
        parcours.origine === location.origin &&
        parcours.jusqua > Date.now();
}

let autoRestants = AUTO_MAX;
let minuteurAuto = null;

// Le contexte meurt quand l'extension est rechargée : l'onglet garde un
// script fantôme. Mieux vaut se taire que lever une erreur à chaque frappe.
function contexteVivant() {
    return Boolean(chrome.runtime && chrome.runtime.id);
}

function remplirDepuisLaMemoire(origine) {
    if (!contexteVivant() || autoRestants <= 0) {
        return;
    }

    chrome.storage.local.get(
        [
            "profil", "appris", "formulaires", "recettes", "clientActif",
            "complements", "parcours"
        ],
        (etat) => {

        if (!parcoursActif(etat)) {
            return;
        }

        // UN FORMULAIRE JAMAIS APPRIS RESTE VIDE.
        //
        // Sans cette porte, le parcours armé sur un formulaire remplissait
        // tous les autres du même site — impossible d'en éprouver un seul.
        const identiteAuto = Compagnies.identifier(location.href);
        const connu = identiteAuto && (etat.recettes || {})[identiteAuto.cle];

        if (!connu) {
            return;
        }

        autoRestants -= 1;
        enCoursDeRemplissage = true;

        // En automatique : la recette de CE formulaire, rien d'autre, et
        // jamais par-dessus une saisie en cours.
        const resultat = remplir(etat, {
            seulementVides: true,
            recetteSeule: true
        });

        setTimeout(() => { enCoursDeRemplissage = false; }, 300);

        if (resultat.journal.length > 0) {
            console.log(
                `Form Agent — ${resultat.journal.length} champ(s) remplis (${origine})`
            );
            console.table(resultat.journal);
        }

        if (resultat.manquants.length > 0) {
            console.warn(
                "Form Agent — à compléter dans le CRM : " +
                resultat.manquants.map((manque) => manque.libelle).join(", ")
            );
            alerter(resultat.manquants);
        }
    });
}

function surveillerLaPage() {
    // Les champs arrivent souvent après la page : appel AJAX, étape suivante
    // d'un tunnel, bloc déplié par un bouton.
    new MutationObserver((mutations) => {

        // Notre propre bandeau d'alerte ne doit pas relancer le cycle.
        const notre = mutations.every((mutation) =>
            mutation.target.id === ID_ALERTE ||
            (mutation.target.closest && mutation.target.closest(`#${ID_ALERTE}`))
        );

        if (notre) {
            return;
        }

        clearTimeout(minuteurAuto);
        minuteurAuto = setTimeout(
            () => remplirDepuisLaMemoire("nouveaux champs"),
            AUTO_DELAI
        );
    }).observe(document.documentElement, { childList: true, subtree: true });
}

if (contexteVivant()) {
    chrome.storage.local.get("parcours", (etat) => {

        if (!parcoursActif(etat)) {
            return;
        }

        if (document.readyState === "loading") {
            document.addEventListener(
                "DOMContentLoaded",
                () => remplirDepuisLaMemoire("chargement")
            );
        } else {
            remplirDepuisLaMemoire("chargement");
        }

        surveillerLaPage();
    });
}

// ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((message, expediteur, repondre) => {

    if (message.action === "etat") {
        // Réponse asynchrone : il faut la recette pour dire, champ par
        // champ, ce que l'extension sait déjà de ce formulaire.
        chrome.storage.local.get("recettes", (memoire) => {
            repondre(etat(memoire.recettes || {}));
        });

        return true;
    }

    if (message.action === "remplir") {
        enCoursDeRemplissage = true;

        const resultat = remplir(message);

        // Laisse passer les événements que l'on vient d'émettre avant de
        // réactiver l'observation, sinon on réenregistre son propre travail.
        setTimeout(() => { enCoursDeRemplissage = false; }, 300);

        const remplis = resultat.journal.filter((ligne) => ligne.score > 0).length;

        console.table(resultat.journal);
        alerter(resultat.manquants);

        repondre({
            remplis,
            journal: resultat.journal,
            manquants: resultat.manquants
        });
        return;
    }
});
