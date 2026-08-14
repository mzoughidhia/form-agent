// Champs dont la valeur se lit via .value.
const CLES = [
    "civilite",
    "nom",
    "prenom",
    "email",
    "telephone",
    "adresse",
    "codePostal",
    "ville",
    "pays",
    "dateNaissance"
];

const newsletter = document.getElementById("newsletter");
const message = document.getElementById("message");
const zoneEtat = document.getElementById("etat");

const compteurAppris = document.getElementById("compteurAppris");
const listeAppris = document.getElementById("listeAppris");
const compteurStructure = document.getElementById("compteurStructure");
const listeStructure = document.getElementById("listeStructure");

// Clés d'empreinte présentes sur la page ouverte.
let clesPage = [];

function afficher(texte, erreur) {
    message.textContent = texte;
    message.className = erreur ? "erreur" : "";
}

function peindreListe(element, entrees) {
    element.textContent = "";

    entrees.forEach(([cle, valeur]) => {
        const ligne = document.createElement("li");

        const gauche = document.createElement("span");
        gauche.className = "cle";
        gauche.textContent = cle;
        gauche.title = cle;

        const droite = document.createElement("span");
        droite.className = "valeur";
        droite.textContent = valeur;
        droite.title = valeur;

        ligne.append(gauche, droite);
        element.append(ligne);
    });
}

function peindreProfil(profil) {
    CLES.forEach((cle) => {
        document.getElementById(cle).value = profil[cle] || "";
    });

    newsletter.checked = profil.newsletter === "oui";
}

function peindreAppris(appris) {
    const entrees = Object.entries(appris);

    compteurAppris.textContent = entrees.length === 1
        ? "1 champ appris"
        : `${entrees.length} champs appris`;

    peindreListe(listeAppris, entrees);
}

// Empreintes de la page courante : état + détail des champs mémorisés.
function peindreEtat(formulaires) {

    const connues = clesPage
        .map((cle) => formulaires[cle])
        .filter(Boolean);

    if (connues.length === 0) {
        zoneEtat.className = "";
        zoneEtat.textContent =
            "Ce formulaire n'a pas encore été observé. Remplis-le une fois : " +
            "l'enregistrement se fait tout seul.";

        compteurStructure.textContent = "Structure enregistrée";
        listeStructure.textContent = "";
        return;
    }

    const champs = connues.flatMap((empreinte) => empreinte.champs);
    const renseignes = champs.filter((fiche) => fiche.valeur);
    const date = new Date(Math.max(...connues.map((e) => e.miseAJour)));

    zoneEtat.className = "connu";
    zoneEtat.textContent = "";

    const titre = document.createElement("b");
    titre.textContent = "Formulaire mémorisé";

    const detail = document.createTextNode(
        `${champs.length} champs relevés, ${renseignes.length} avec une valeur. ` +
        `Dernière observation : ${date.toLocaleString("fr-FR")}.`
    );

    const oublier = document.createElement("button");
    oublier.className = "lien";
    oublier.textContent = "Oublier ce formulaire";
    oublier.addEventListener("click", oublierFormulaire);

    zoneEtat.append(titre, detail, document.createElement("br"), oublier);

    compteurStructure.textContent =
        `Structure enregistrée (${champs.length} champs)`;

    peindreListe(
        listeStructure,
        champs.map((fiche) => [
            fiche.libelle || fiche.selecteur,
            fiche.protege ? "(protégé)" : (fiche.valeur || "—")
        ])
    );
}

// Le parcours vaut trente minutes : le temps d'un dossier, pas davantage.
const PARCOURS_DUREE = 30 * 60 * 1000;

function peindreParcours(parcours) {
    const zone = document.getElementById("parcours");

    zone.textContent = "";

    if (!parcours || parcours.jusqua <= Date.now()) {
        return;
    }

    const minutes = Math.ceil((parcours.jusqua - Date.now()) / 60000);
    const site = parcours.origine.replace(/^https?:\/\//, "");

    const texte = document.createElement("span");
    texte.textContent = `Parcours en cours sur ${site} — encore ${minutes} min. `;

    const arret = document.createElement("button");
    arret.className = "lien";
    arret.textContent = "Arrêter";
    arret.addEventListener("click", () => {
        chrome.storage.local.remove("parcours", () => {
            rafraichir();
            afficher("Parcours arrêté.");
        });
    });

    zone.append(texte, arret);
}

function rafraichir() {
    chrome.storage.local.get(
        [
            "profil", "appris", "formulaires", "parcours", "continuer",
            "clientActif", "recettes", "derniereLecon", "strict"
        ],
        (etat) => {
            peindreProfil(etat.profil || {});
            peindreAppris(etat.appris || {});
            peindreEtat(etat.formulaires || {});
            peindreParcours(etat.parcours);
            peindreRecette(etat.recettes || {});
            peindreRecettes(etat.recettes || {});
            peindreLecon(etat.derniereLecon);

            if (etat.clientActif) {
                champIdentifiant.value = etat.clientActif.id;
                peindreClient(etat.clientActif, false);
            } else {
                peindreClient(null, true);
            }

            // L'ancienne mémoire par valeurs n'a plus de sens dès qu'un
            // client est actif : la montrer inviterait à comparer deux
            // choses qui ne se comparent pas.
            document.getElementById("memoireHistorique").style.display =
                etat.clientActif ? "none" : "";

            // DÉCOCHÉ par défaut : sinon chaque F5 reremplit la page, et
            // l'entraînement devient impossible — on ne peut plus repartir
            // d'un formulaire vide.
            document.getElementById("continuer").checked = Boolean(etat.continuer);
            document.getElementById("strict").checked = Boolean(etat.strict);
        }
    );
}

document.getElementById("continuer").addEventListener("change", (evenement) => {
    chrome.storage.local.set({ continuer: evenement.target.checked });
});

// Mode strict : rien d'autre que la recette de CE formulaire. Un formulaire
// jamais entraîné reste entièrement vide — c'est le mode d'épreuve.
document.getElementById("strict").addEventListener("change", (evenement) => {
    const actif = evenement.target.checked;

    chrome.storage.local.set({ strict: actif }, () => {
        afficher(actif
            ? "Mode « ce formulaire seulement » : un formulaire non entraîné restera vide."
            : "Mode normal : le dictionnaire de libellés reprend la main.");
    });
});

// Le clic sur « Remplir » vaut consentement pour la suite du parcours, mais
// seulement sur ce site, et seulement pour trente minutes.
function armerLeParcours(url) {
    if (!document.getElementById("continuer").checked) {
        return;
    }

    let origine;

    try {
        origine = new URL(url).origin;
    } catch (erreur) {
        return;
    }

    chrome.storage.local.set({
        parcours: { origine, jusqua: Date.now() + PARCOURS_DUREE }
    }, rafraichir);
}

// Envoie un message au content script de l'onglet actif.
async function versLaPage(charge, suite) {
    const [onglet] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    chrome.tabs.sendMessage(onglet.id, charge, (reponse) => {

        // Arrive si le content script n'est pas présent : page chrome://,
        // Web Store, ou onglet ouvert avant le rechargement de l'extension.
        if (chrome.runtime.lastError) {
            afficher("Impossible d'agir sur cette page. Recharge-la (F5).", true);
            return;
        }

        suite(reponse, onglet);
    });
}

// L'identité du formulaire ouvert. C'est elle qui décide QUELLE recette
// s'applique : une par couple hôte + chemin, jamais partagée entre deux
// formulaires différents.
let identiteCourante = null;

// ---------------------------------------------------------------------------
//  Ce que l'extension sait de CE formulaire-ci
// ---------------------------------------------------------------------------
function peindreRecette(recettes) {
    const zone = document.getElementById("recette");

    zone.textContent = "";

    if (!identiteCourante) {
        zone.className = "";
        return;
    }

    const recette = (recettes || {})[identiteCourante.cle];

    if (!recette) {
        zone.className = "inconnue";
        zone.textContent =
            "Formulaire jamais vu. Choisis un client, remplis-le une fois à la main : " +
            "l'extension comprendra à quoi sert chaque champ.";
        return;
    }

    zone.className = "connue";

    const titre = document.createElement("b");
    titre.textContent = `Formulaire appris — ${recette.champs.length} champ(s) compris`;

    const detail = document.createElement("details");
    const resume = document.createElement("summary");
    resume.textContent = "Voir les correspondances";
    detail.append(resume);

    recette.champs.forEach((entree) => {
        const ligne = document.createElement("span");
        ligne.className = "paire";
        ligne.textContent =
            `${entree.libelle || entree.selecteur} → ${entree.cle}` +
            (entree.format ? `  [${entree.format}]` : "");
        detail.append(ligne);
    });

    const oublier = document.createElement("button");
    oublier.className = "lien";
    oublier.textContent = "Oublier ce formulaire";
    oublier.addEventListener("click", () => {
        chrome.storage.local.get("recettes", (etat) => {
            const restantes = etat.recettes || {};

            delete restantes[identiteCourante.cle];

            chrome.storage.local.set({ recettes: restantes }, () => {
                rafraichir();
                afficher("Recette de ce formulaire supprimée.");
            });
        });
    });

    zone.append(titre, detail, oublier);
}

// ---------------------------------------------------------------------------
//  LE MIROIR — le popup prend la forme du formulaire qu'il a devant lui
//
//  Une ligne par champ de la page, dans l'ordre du formulaire. Chacune
//  montre ce qui sera écrit. Une case vide et rouge = une donnée qui manque
//  à la fiche : le courtier la saisit ici, une fois, et elle est reprise.
// ---------------------------------------------------------------------------
let champsPage = [];

function valeurPour(cle, format, donnees) {
    const brute = donnees[cle];

    if (brute === undefined || brute === "") {
        return "";
    }

    return format
        ? Variantes.formater(cle, brute, format)
        : (Variantes.de(cle, brute)[0] || { texte: brute }).texte;
}

function peindreMiroir(fiche, complements) {
    const bloc = document.getElementById("miroir");
    const liste = document.getElementById("listeMiroir");

    liste.textContent = "";

    if (!fiche || champsPage.length === 0) {
        bloc.className = "";
        return;
    }

    bloc.className = "visible";

    const donnees = {
        ...fiche.donnees,
        ...((complements || {})[fiche.id] || {})
    };

    let manquants = 0;

    champsPage.forEach((champ) => {
        const rangee = document.createElement("div");
        const etiquette = document.createElement("span");
        const saisie = document.createElement("input");
        const marque = document.createElement("span");

        etiquette.className = "quoi";
        etiquette.textContent = champ.libelle;
        etiquette.title = champ.cle || "champ non reconnu";

        saisie.className = "valeur";
        marque.className = "marque";

        if (champ.consentement) {
            rangee.className = "rangee inconnu";
            saisie.value = "";
            saisie.placeholder = "consentement — jamais rempli";
            saisie.disabled = true;
            marque.textContent = "protégé";
        } else if (!champ.cle) {
            rangee.className = "rangee inconnu";
            saisie.placeholder = "non reconnu";
            saisie.disabled = true;
            marque.textContent = "—";
        } else {
            const valeur = valeurPour(champ.cle, champ.format, donnees);

            saisie.value = valeur;
            saisie.dataset.cle = champ.cle;
            rangee.className = valeur === "" ? "rangee manque" : "rangee";
            marque.textContent = champ.origine === "recette" ? "appris" : "dico";

            if (valeur === "") {
                manquants += 1;
                saisie.placeholder = "à compléter";
            }
        }

        rangee.append(etiquette, saisie, marque);
        liste.append(rangee);
    });

    document.getElementById("compteurMiroir").textContent =
        manquants === 0
            ? `${champsPage.length} champs`
            : `${champsPage.length} champs · ${manquants} à compléter`;
}

// Les compléments s'ajoutent à la fiche du client, sans la réécrire.
document.getElementById("enregistrerComplements").addEventListener("click", () => {
    chrome.storage.local.get(["clientActif", "complements"], (etat) => {

        if (!etat.clientActif) {
            afficher("Aucun client actif.", true);
            return;
        }

        const complements = etat.complements || {};
        const pourCeClient = { ...(complements[etat.clientActif.id] || {}) };
        let ajouts = 0;

        document.querySelectorAll("#listeMiroir input[data-cle]").forEach((saisie) => {
            const valeur = saisie.value.trim();

            if (valeur === "") {
                return;
            }

            if (etat.clientActif.donnees[saisie.dataset.cle] === undefined) {
                pourCeClient[saisie.dataset.cle] = valeur;
                ajouts += 1;
            }
        });

        complements[etat.clientActif.id] = pourCeClient;

        chrome.storage.local.set({ complements }, () => {
            rafraichir();
            afficher(ajouts === 0
                ? "Rien à ajouter."
                : `${ajouts} donnée(s) ajoutée(s) à la fiche de ${etat.clientActif.nom}.`);
        });
    });
});

// Le compte rendu du dernier apprentissage. Sans lui, un entraînement qui
// n'a rien retenu passe inaperçu — et on croit à un bug de remplissage.
function peindreLecon(lecon) {
    const zone = document.getElementById("lecon");

    zone.textContent = "";

    if (!lecon) {
        zone.className = "";
        return;
    }

    const perdus = lecon.nonReconnus.length + lecon.hesitations.length;

    zone.className = lecon.compris === 0 ? "rate" : (perdus > 0 ? "partiel" : "reussi");

    const titre = document.createElement("b");
    titre.textContent = lecon.compris === 0
        ? "Dernier entraînement : rien n'a été compris"
        : `Dernier entraînement : ${lecon.compris} champ(s) compris`;
    zone.append(titre);

    const detail = document.createElement("span");
    detail.textContent = `client ${lecon.client} · ${lecon.nomClient}`;
    zone.append(detail);

    if (lecon.nonReconnus.length > 0) {
        const alerte = document.createElement("span");
        alerte.textContent =
            `${lecon.nonReconnus.length} champ(s) non reconnus : ` +
            lecon.nonReconnus.slice(0, 6).join(", ") +
            ". Les valeurs tapées ne sont pas dans la fiche de ce client.";
        zone.append(alerte);
    }

    if (lecon.hesitations.length > 0) {
        const doute = document.createElement("span");
        doute.textContent =
            `${lecon.hesitations.length} champ(s) ambigus : ` +
            lecon.hesitations.join(", ") + ". Deux données possibles, aucun libellé pour trancher.";
        zone.append(doute);
    }
}

// La liste de tous les formulaires appris : c'est l'avancement de
// l'entraînement, formulaire par formulaire.
function peindreRecettes(recettes) {
    const entrees = Object.entries(recettes || {});

    document.getElementById("compteurRecettes").textContent =
        entrees.length === 1
            ? "1 formulaire appris"
            : `${entrees.length} formulaires appris`;

    peindreListe(
        document.getElementById("listeRecettes"),
        entrees.map(([cle, recette]) => [
            (recette.compagnie || recette.hote || cle) +
                (recette.service ? ` · ${recette.service}` : ""),
            `${recette.champs.length} champs`
        ])
    );
}

// ---------------------------------------------------------------------------
//  La compagnie — lue dans l'adresse de la page
// ---------------------------------------------------------------------------
function peindreCompagnie(identite) {
    const zone = document.getElementById("compagnie");

    if (!identite) {
        zone.className = "compagnie inconnue";
        zone.textContent = "Page illisible";
        return;
    }

    if (!identite.compagnie) {
        zone.className = "compagnie inconnue";
        zone.textContent = `Compagnie inconnue — ${identite.hote}`;
        return;
    }

    zone.className = "compagnie";
    zone.textContent = identite.compagnie +
        (identite.service ? ` · ${identite.service}` : "");
}

// ---------------------------------------------------------------------------
//  Le client actif — saisi par son identifiant
// ---------------------------------------------------------------------------
const champIdentifiant = document.getElementById("idClient");

function peindreClient(fiche, saisieVide) {
    const zone = document.getElementById("nomClient");

    if (fiche) {
        const nombre = Object.keys(fiche.donnees).length;
        zone.className = "nomClient";
        zone.textContent = `${fiche.nom} — ${nombre} données`;
        return;
    }

    zone.className = saisieVide ? "nomClient" : "nomClient absent";
    zone.textContent = saisieVide
        ? `Aucun client actif — identifiants : ${Clients.liste().map((c) => c.id).join(", ")}`
        : "Aucun client à cet identifiant";
}

function choisirClient(identifiant) {
    const fiche = Clients.parIdentifiant(identifiant);

    peindreClient(fiche, String(identifiant || "").trim() === "");

    document.getElementById("memoireHistorique").style.display = fiche ? "none" : "";

    if (fiche) {
        chrome.storage.local.set({ clientActif: fiche });
    } else {
        chrome.storage.local.remove("clientActif");
    }
}

champIdentifiant.addEventListener("input", (evenement) => {
    choisirClient(evenement.target.value);
});

// ---------------------------------------------------------------------------
//  Ce qui manque dans la fiche — la liste qui partira au CRM
// ---------------------------------------------------------------------------
function peindreManquants(manquants) {
    const zone = document.getElementById("manquants");

    zone.textContent = "";

    if (!manquants || manquants.length === 0) {
        return;
    }

    const titre = document.createElement("b");
    titre.textContent = `${manquants.length} donnée(s) à compléter dans le CRM :`;

    const liste = document.createElement("ul");

    manquants.forEach((manque) => {
        const ligne = document.createElement("li");
        ligne.textContent = manque.libelle;
        ligne.title = manque.cle;
        liste.append(ligne);
    });

    zone.append(titre, liste);
}

// Démarrage : demander à la page quelles empreintes la concernent.
versLaPage({ action: "etat" }, (reponse) => {
    clesPage = (reponse.formulaires || []).map((entree) => entree.cle);
    identiteCourante = reponse.identite || null;
    peindreCompagnie(identiteCourante);
    rafraichir();
});

// « Aucun champ reconnu » ne dit rien d'utile : il y a quatre raisons de ne
// rien écrire, et elles n'appellent pas la même action.
function pourquoiRien(etat) {
    const recette = identiteCourante
        ? (etat.recettes || {})[identiteCourante.cle]
        : null;

    if (!etat.clientActif) {
        return "Aucun client sélectionné : tape son numéro ci-dessus (42, 77, 18), " +
            "puis reclique.";
    }

    if (!recette && etat.strict) {
        return "Ce formulaire n'a jamais été entraîné, et le mode test n'autorise " +
            "que sa propre recette. Remplis-le une fois à la main.";
    }

    if (!recette) {
        return "Ce formulaire n'a jamais été entraîné, et aucun de ses libellés " +
            "n'est reconnu. Remplis-le une fois à la main.";
    }

    return "Formulaire connu, mais aucune donnée de ce client ne correspond à ses champs.";
}

// ---------------------------------------------------------------------------
// Remplir
// ---------------------------------------------------------------------------
document.getElementById("fill").addEventListener("click", () => {

    chrome.storage.local.get(
        [
            "profil", "appris", "formulaires", "recettes", "clientActif",
            "complements", "strict"
        ],
        (etat) => {

        versLaPage(
            {
                action: "remplir",
                profil: etat.profil || {},
                appris: etat.appris || {},
                formulaires: etat.formulaires || {},
                recettes: etat.recettes || {},
                clientActif: etat.clientActif || null,
                // Sans eux, la case « ce formulaire seulement » et les
                // valeurs complétées à la main n'atteignaient jamais le
                // moteur : le popup les gardait pour lui.
                complements: etat.complements || {},
                strict: Boolean(etat.strict)
            },
            (reponse, onglet) => {
                // Le parcours s'arme même si cette page-ci n'a rien donné :
                // la page suivante est peut-être celle qu'on connaît.
                armerLeParcours(onglet.url);
                peindreManquants(reponse ? reponse.manquants : []);

                if (!reponse || reponse.remplis === 0) {
                    afficher(pourquoiRien(etat), true);
                    return;
                }

                afficher(
                    `${reponse.remplis} champ(s) rempli(s).` +
                    (document.getElementById("continuer").checked
                        ? " Les pages suivantes se rempliront toutes seules."
                        : "")
                );
            }
        );
    });
});

// ---------------------------------------------------------------------------
// Enregistrer : corrections manuelles des données connues.
// ---------------------------------------------------------------------------
document.getElementById("save").addEventListener("click", () => {

    const profil = {};

    CLES.forEach((cle) => {
        profil[cle] = document.getElementById(cle).value.trim();
    });

    // Stocké en texte : content.js compare des étiquettes, pas des booléens.
    profil.newsletter = newsletter.checked ? "oui" : "non";

    chrome.storage.local.set({ profil }, () => {
        afficher("Corrections enregistrées.");
    });
});

// ---------------------------------------------------------------------------
// Oublis
// ---------------------------------------------------------------------------
function oublierFormulaire() {
    chrome.storage.local.get("formulaires", (etat) => {
        const formulaires = etat.formulaires || {};

        clesPage.forEach((cle) => delete formulaires[cle]);

        chrome.storage.local.set({ formulaires }, () => {
            rafraichir();
            afficher("Empreinte de ce formulaire supprimée.");
        });
    });
}

document.getElementById("oublierAppris").addEventListener("click", () => {
    chrome.storage.local.set({ appris: {} }, () => {
        rafraichir();
        afficher("Mémoire apprise vidée.");
    });
});

// ---------------------------------------------------------------------------
//  Tout effacer — en deux temps, parce qu'un entraînement se perd vite
// ---------------------------------------------------------------------------
const boutonEffacer = document.getElementById("toutEffacer");
let effacementArme = false;

boutonEffacer.addEventListener("click", () => {

    if (!effacementArme) {
        effacementArme = true;
        boutonEffacer.textContent = "Confirmer : tout effacer";
        boutonEffacer.className = "danger confirme";

        // Sans retour en arrière, un clic distrait coûterait tout
        // l'entraînement.
        setTimeout(() => {
            effacementArme = false;
            boutonEffacer.textContent = "Tout effacer";
            boutonEffacer.className = "danger";
        }, 4000);

        return;
    }

    chrome.storage.local.clear(() => {
        effacementArme = false;
        boutonEffacer.textContent = "Tout effacer";
        boutonEffacer.className = "danger";

        champIdentifiant.value = "";
        clesPage = [];

        rafraichir();
        peindreManquants([]);
        afficher("Mémoire entièrement vidée.");
    });
});
