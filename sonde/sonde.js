// ---------------------------------------------------------------------------
//  SONDE — reconnaissance de formulaires
//
//  Cette extension LIT, et rien d'autre. Elle n'écrit dans aucun champ,
//  ne clique sur aucun bouton, ne soumet aucun formulaire, et ne relève
//  AUCUNE valeur saisie par l'utilisateur.
//
//  Elle observe la structure des formulaires et la façon dont les pages
//  s'enchaînent, puis publie un rapport de reconnaissance.
//
//  Les six questions auxquelles elle doit répondre :
//    Q1  combien d'étapes, dans quel ordre
//    Q2  comment la page suivante se charge   (structurant)
//    Q3  les sélecteurs sont-ils stables       (structurant)
//    Q4  quel cadre applicatif
//    Q5  y a-t-il des champs conditionnels
//    Q6  quels obstacles (cadres, captcha, expiration)
// ---------------------------------------------------------------------------

const DELAI_OBSERVATION = 800;   // ms d'inactivité du DOM avant de relever
const ATTENTE_MAX = 3000;        // au-delà, on relève même si ça bouge encore
const RECOUVREMENT_MEME_FORMULAIRE = 0.5;   // en deçà, c'est une autre étape
const LONGUEUR_LIBELLE = 120;    // au-delà, ce n'est plus un libellé

// Un rechargement complet de page réinitialise ce script. C'est précisément
// ce qui permet de répondre à Q2 sans toucher au contexte de la page :
// si on repart de zéro, il y a eu navigation ; sinon, c'est du client.
const DEBUT = Date.now();
const DANS_UN_CADRE = window.top !== window;

// Un même chargement de page produit plusieurs relevés (le DOM bouge). Un seul
// doit compter comme « visite », sans quoi la stabilité des sélecteurs se
// mesurerait contre soi-même et paraîtrait toujours parfaite.
let premierReleve = true;

let minuteur = null;
let debutAttente = 0;
let urlObservee = location.href;
let signaux = new Set();

// Repérage des champs conditionnels : le premier relevé sert de référence.
// Le drapeau ne bascule qu'une fois TOUS les champs vus, sinon chaque champ
// après le premier passerait pour une apparition.
let clesConnues = new Set();
let referenceEtablie = false;
let conditionnels = 0;


// ---------------------------------------------------------------------------
//  LISTE BLANCHE
//
//  On énumère ce qu'on lit. Une liste noire finirait par laisser passer
//  un attribut contenant une donnée personnelle.
// ---------------------------------------------------------------------------

function normaliser(texte) {
    return (texte || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, LONGUEUR_LIBELLE);
}

// Les boutons d'un même groupe radio.
function groupeRadio(champ) {
    if (champ.type !== "radio" || !champ.name) {
        return [];
    }

    const portee = champ.form || document;

    return Array.from(
        portee.querySelectorAll(`input[type="radio"][name="${CSS.escape(champ.name)}"]`)
    );
}

function ancetreCommun(elements) {
    let noeud = elements[0] ? elements[0].parentElement : null;

    while (noeud && !elements.every((element) => noeud.contains(element))) {
        noeud = noeud.parentElement;
    }

    return noeud;
}

// Pour un groupe radio, le <label> englobant porte le texte de l'OPTION
// (« Homme »), pas celui du champ (« Sexe »). L'intitulé du groupe est
// presque toujours le premier bloc de texte du conteneur commun.
function libelleDeGroupe(champ) {
    const groupe = groupeRadio(champ);

    if (groupe.length < 2) {
        return "";
    }

    const ancetre = ancetreCommun(groupe);

    if (!ancetre) {
        return "";
    }

    const interne = Array.from(ancetre.children).find(
        (enfant) =>
            enfant.tagName !== "INPUT" &&
            !enfant.querySelector(SELECTEUR_CHAMPS) &&
            normaliser(enfant.textContent)
    );

    if (interne) {
        return normaliser(interne.textContent);
    }

    const precedent = ancetre.previousElementSibling;

    if (precedent && !precedent.querySelector(SELECTEUR_CHAMPS)) {
        return normaliser(precedent.textContent);
    }

    return "";
}

function libelleDe(champ) {

    const duGroupe = libelleDeGroupe(champ);
    if (duGroupe) {
        return duGroupe;
    }

    if (champ.id) {
        const associe = document.querySelector(`label[for="${CSS.escape(champ.id)}"]`);
        if (associe) {
            return normaliser(associe.textContent);
        }
    }

    const englobant = champ.closest("label");
    if (englobant) {
        return normaliser(englobant.textContent);
    }

    const aria = champ.getAttribute("aria-label");
    if (aria) {
        return normaliser(aria);
    }

    const parAria = champ.getAttribute("aria-labelledby");
    if (parAria) {
        const cible = document.getElementById(parAria);
        if (cible) {
            return normaliser(cible.textContent);
        }
    }

    // Beaucoup d'extranets n'ont aucun label : le texte qui précède
    // immédiatement le champ est souvent le seul indice disponible.
    const precedent = champ.previousElementSibling;
    if (precedent && !precedent.querySelector("input, select, textarea")) {
        return normaliser(precedent.textContent);
    }

    return "";
}

function sectionDe(champ) {
    const groupe = champ.closest("fieldset");
    const legende = groupe && groupe.querySelector("legend");

    return legende ? normaliser(legende.textContent) : "";
}

// Structure d'un champ. Aucune valeur, aucun état coché, jamais.
function ficheChamp(champ, position) {
    const fiche = {
        position,
        balise: champ.tagName.toLowerCase(),
        type: champ.tagName === "SELECT" ? "select" : (champ.type || "text"),
        nom: champ.name || "",
        identifiant: champ.id || "",
        libelle: libelleDe(champ),
        section: sectionDe(champ),
        indice: normaliser(champ.getAttribute("placeholder")),
        requis: champ.required === true,
        longueurMax: champ.maxLength > 0 ? champ.maxLength : null,
        motif: champ.getAttribute("pattern") || "",
        autocompletion: champ.getAttribute("autocomplete") || ""
    };

    // Les libellés d'options appartiennent au site, pas au client. On en a
    // besoin pour savoir si les valeurs envoyées sont des codes opaques.
    if (champ.tagName === "SELECT") {
        fiche.options = Array.from(champ.options)
            .slice(0, 40)
            .map((option) => ({
                texte: normaliser(option.textContent),
                valeur: option.value
            }));
    }

    if (champ.type === "radio") {
        fiche.options = groupeRadio(champ)
            .slice(0, 40)
            .map((bouton) => ({
                texte: normaliser(
                    bouton.closest("label")?.textContent || bouton.getAttribute("aria-label")
                ),
                valeur: bouton.value
            }));
    }

    return fiche;
}


// ---------------------------------------------------------------------------
//  EMPREINTE
//
//  Volontairement calculée SANS les identifiants ni les noms : s'ils sont
//  regénérés à chaque session (Q3), l'empreinte doit rester stable quand
//  même. Leur stabilité est mesurée séparément.
// ---------------------------------------------------------------------------

function condenser(texte) {
    let valeur = 5381;

    for (let i = 0; i < texte.length; i += 1) {
        valeur = ((valeur * 33) ^ texte.charCodeAt(i)) >>> 0;
    }

    return valeur.toString(16).padStart(8, "0");
}

function empreinteDe(fiches) {
    const structure = fiches
        .map((fiche) => `${fiche.type}|${fiche.libelle}|${fiche.requis ? 1 : 0}`)
        .join("\n");

    return condenser(structure);
}

// Chaque champ a une clé stable, indépendante de l'ordre : elle sert à
// repérer l'apparition d'un champ conditionnel (Q5).
function cleChamp(fiche) {
    return `${fiche.type}|${fiche.libelle || fiche.nom || fiche.position}`;
}


// ---------------------------------------------------------------------------
//  Q4 · CADRE APPLICATIF — marqueurs visibles depuis le DOM
//
//  Les variables de page (window.jQuery, __vue__...) ne sont pas visibles
//  d'ici : un script de contenu vit dans un monde isolé. Le panneau lance
//  une détection complémentaire dans le contexte de la page, à la demande.
// ---------------------------------------------------------------------------

function cadresApplicatifs() {
    const trouves = [];

    if (document.querySelector("[ng-version]")) {
        const version = document.querySelector("[ng-version]").getAttribute("ng-version");
        trouves.push(`angular ${version}`);
    }

    if (document.querySelector("[ng-app], [data-ng-app], .ng-scope")) {
        trouves.push("angularjs");
    }

    if (document.querySelector("[data-reactroot], #react-root")) {
        trouves.push("react");
    }

    if (document.querySelector("[data-v-app], [data-vue-meta]")) {
        trouves.push("vue");
    }

    // ASP.NET WebForms : c'est aussi le principal suspect pour des
    // identifiants regénérés à chaque session (Q3).
    if (document.querySelector("input[name='__VIEWSTATE']")) {
        trouves.push("asp.net-webforms");
    }

    if (document.querySelector("input[name='javax.faces.ViewState']")) {
        trouves.push("jsf");
    }

    return trouves;
}


// ---------------------------------------------------------------------------
//  Q6 · OBSTACLES
// ---------------------------------------------------------------------------

function obstacles() {
    const cadres = Array.from(document.querySelectorAll("iframe")).map((cadre) => {
        let accessible = false;

        // Un cadre d'une autre origine est un mur : on ne pourra jamais
        // y lire ni y écrire. Le seul moyen de le savoir est d'essayer.
        try {
            accessible = Boolean(cadre.contentDocument);
        } catch (erreur) {
            accessible = false;
        }

        return { source: (cadre.src || "").slice(0, 200), accessible };
    });

    const captcha = Boolean(
        document.querySelector(
            ".g-recaptcha, .h-captcha, iframe[src*='recaptcha'], iframe[src*='hcaptcha'], [data-sitekey]"
        )
    );

    return { cadres, captcha };
}


// ---------------------------------------------------------------------------
//  Q2 · MÉCANISME DE PAGINATION
//
//  Trois cas se distinguent sans jamais toucher au contexte de la page :
//    - le script vient de démarrer      → rechargement complet
//    - l'URL change sans redémarrage    → route interne (SPA)
//    - le formulaire change sans l'URL  → remplacement partiel (AJAX)
// ---------------------------------------------------------------------------

function surveillerUrl() {
    if (location.href === urlObservee) {
        return false;
    }

    urlObservee = location.href;
    signaux.add("route-interne");
    return true;
}

window.addEventListener("popstate", () => signaux.add("route-interne"));
window.addEventListener("hashchange", () => signaux.add("route-interne"));


// ---------------------------------------------------------------------------
//  RELEVÉ
// ---------------------------------------------------------------------------

const SELECTEUR_CHAMPS = "input, select, textarea";

function estObservable(champ) {
    const type = (champ.type || "").toLowerCase();

    if (["hidden", "submit", "button", "reset", "image", "file"].includes(type)) {
        return false;
    }

    // Un champ de mot de passe ne doit jamais être décrit, même en structure.
    return type !== "password";
}

// Un groupe de boutons radio décrit UN choix, pas cinq champs. Sans ce
// regroupement, l'empreinte et le nombre de champs seraient gonflés.
function sansDoublonsRadio(champs) {
    const groupesVus = new Set();

    return champs.filter((champ) => {
        if (champ.type !== "radio" || !champ.name) {
            return true;
        }

        if (groupesVus.has(champ.name)) {
            return false;
        }

        groupesVus.add(champ.name);
        return true;
    });
}

function formulaires() {
    const liste = Array.from(document.forms).filter(
        (formulaire) => formulaire.querySelector(SELECTEUR_CHAMPS)
    );

    if (liste.length > 0) {
        return liste;
    }

    // Beaucoup d'extranets modernes n'utilisent plus de balise <form> :
    // les champs flottent dans la page et un bouton envoie en AJAX.
    return document.querySelector(SELECTEUR_CHAMPS) ? [document.body] : [];
}

function relever() {
    const rapports = [];
    const clesRelevees = new Set();

    formulaires().forEach((racine, index) => {
        const champs = sansDoublonsRadio(
            Array.from(racine.querySelectorAll(SELECTEUR_CHAMPS)).filter(estObservable)
        );

        if (champs.length === 0) {
            return;
        }

        const fiches = champs.map((champ, position) => ficheChamp(champ, position));

        fiches.forEach((fiche) => clesRelevees.add(cleChamp(fiche)));

        rapports.push({
            indexFormulaire: index,
            empreinte: empreinteDe(fiches),
            titre: normaliser(document.title),
            nombreChamps: fiches.length,
            champs: fiches
        });
    });

    if (rapports.length === 0) {
        return;
    }

    // Q5 · un champ conditionnel apparaît DANS le formulaire en cours. Passer
    // à l'étape suivante remplace le formulaire par un autre — sans cette
    // distinction, chaque changement d'étape compterait tous ses champs comme
    // des apparitions, et une application à étapes afficherait des dizaines de
    // faux conditionnels. On tranche par le recouvrement : beaucoup de champs
    // communs = même formulaire ; presque aucun = nouvelle étape.
    if (!referenceEtablie) {
        clesConnues = clesRelevees;
        referenceEtablie = true;
    } else {
        const communs = [...clesRelevees].filter((cle) => clesConnues.has(cle)).length;
        const plusPetit = Math.min(clesRelevees.size, clesConnues.size);
        const recouvrement = plusPetit === 0 ? 0 : communs / plusPetit;

        if (recouvrement >= RECOUVREMENT_MEME_FORMULAIRE) {
            const apparus = [...clesRelevees].filter((cle) => !clesConnues.has(cle)).length;

            if (apparus > 0) {
                conditionnels += apparus;
                signaux.add("champs-conditionnels");
            }

            clesRelevees.forEach((cle) => clesConnues.add(cle));
        } else {
            clesConnues = clesRelevees;
        }
    }

    const premier = premierReleve;
    premierReleve = false;

    const paquet = {
        type: "sonde.releve",
        page: {
            origine: siteDe(location.href),
            chemin: location.pathname,
            url: siteDe(location.href) + location.pathname,
            dansUnCadre: DANS_UN_CADRE,
            premierReleve: premier,
            ageDuScript: Date.now() - DEBUT,
            cadresApplicatifs: cadresApplicatifs(),
            obstacles: obstacles(),
            signaux: Array.from(signaux),
            conditionnels
        },
        formulaires: rapports
    };

    try {
        chrome.runtime.sendMessage(paquet).catch(() => {
            // Le service worker peut dormir : ce n'est pas une erreur.
        });
    } catch (erreur) {
        // « Extension context invalidated » : l'extension vient d'être
        // rechargée et ce script est orphelin. Il lève de façon synchrone,
        // ce qu'un .catch() ne rattrape pas. La prochaine navigation
        // injectera une version fraîche — rien à faire ici.
    }
}

function releverMaintenant() {
    clearTimeout(minuteur);
    debutAttente = 0;
    surveillerUrl();
    relever();
}

// Le report d'inactivité protège des rafales de mutations, mais il ne doit
// jamais affamer le relevé : chaque saisie relance le minuteur, et la
// dernière survient au moment précis où l'on clique sur « Suivant ».
// Sans plafond, le relevé du formulaire rempli serait perdu à chaque fois.
function planifier() {
    if (!debutAttente) {
        debutAttente = Date.now();
    }

    if (Date.now() - debutAttente >= ATTENTE_MAX) {
        releverMaintenant();
        return;
    }

    clearTimeout(minuteur);
    minuteur = setTimeout(releverMaintenant, DELAI_OBSERVATION);
}


// ---------------------------------------------------------------------------
//  DÉMARRAGE
//
//  La sonde reste inerte tant que le domaine n'a pas été explicitement
//  activé depuis le panneau. Aucune observation par défaut.
// ---------------------------------------------------------------------------

function demarrer() {
    // Le script vient de s'initialiser : la page a été chargée entièrement.
    signaux.add("chargement-complet");

    new MutationObserver(planifier).observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["required", "disabled", "hidden", "style", "class"]
    });

    // Une saisie peut faire apparaître un champ conditionnel sans mutation
    // structurelle immédiate : on redonne sa chance au relevé.
    document.addEventListener("change", planifier, true);

    // Le formulaire rempli est le relevé le plus précieux, et c'est celui
    // qu'on est sur le point de perdre : la page va changer. On relève
    // immédiatement, avant que la navigation n'emporte tout.
    //
    // Ces écouteurs OBSERVENT le départ ; ils ne déclenchent rien, n'annulent
    // rien et ne cliquent sur rien.
    document.addEventListener("submit", releverMaintenant, true);
    window.addEventListener("pagehide", releverMaintenant);

    document.addEventListener("click", (evenement) => {
        const cible = evenement.target;

        if (cible && typeof cible.closest === "function"
            && cible.closest("button, input[type='submit'], input[type='button'], a")) {
            releverMaintenant();
        }
    }, true);

    planifier();
}

chrome.storage.local.get({ domaines: [] }).then(({ domaines }) => {
    if (domaines.includes(siteDe(location.href))) {
        demarrer();
    }
});
