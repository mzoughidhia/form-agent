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
        ["profil", "appris", "formulaires", "parcours", "continuer"],
        (etat) => {
            peindreProfil(etat.profil || {});
            peindreAppris(etat.appris || {});
            peindreEtat(etat.formulaires || {});
            peindreParcours(etat.parcours);

            // Coché par défaut : c'est le comportement attendu d'un tunnel.
            document.getElementById("continuer").checked = etat.continuer !== false;
        }
    );
}

document.getElementById("continuer").addEventListener("change", (evenement) => {
    chrome.storage.local.set({ continuer: evenement.target.checked });
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

// Démarrage : demander à la page quelles empreintes la concernent.
versLaPage({ action: "etat" }, (reponse) => {
    clesPage = (reponse.formulaires || []).map((entree) => entree.cle);
    rafraichir();
});

// ---------------------------------------------------------------------------
// Remplir
// ---------------------------------------------------------------------------
document.getElementById("fill").addEventListener("click", () => {

    chrome.storage.local.get(["profil", "appris", "formulaires"], (etat) => {

        versLaPage(
            {
                action: "remplir",
                profil: etat.profil || {},
                appris: etat.appris || {},
                formulaires: etat.formulaires || {}
            },
            (reponse, onglet) => {
                // Le parcours s'arme même si cette page-ci n'a rien donné :
                // la page suivante est peut-être celle qu'on connaît.
                armerLeParcours(onglet.url);

                if (!reponse || reponse.remplis === 0) {
                    afficher("Aucun champ reconnu sur cette page.", true);
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
