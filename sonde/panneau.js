// ---------------------------------------------------------------------------
//  SONDE — panneau
//
//  Active l'observation d'un site, affiche les réponses aux six questions
//  et exporte le rapport de reconnaissance.
// ---------------------------------------------------------------------------

const $url = document.getElementById("url");
const $basculer = document.getElementById("basculer");
const $cadre = document.getElementById("cadre");
const $resultats = document.getElementById("resultats");
const $exporter = document.getElementById("exporter");
const $vider = document.getElementById("vider");

let origineCourante = "";


// ---------------------------------------------------------------------------
//  LECTURE DES SIX QUESTIONS
// ---------------------------------------------------------------------------

// Q1 — combien de formulaires distincts ont été vus sur ce site
function etapes(entrees) {
    const empreintes = new Set(entrees.map((entree) => entree.empreinte));

    return {
        valeur: `${empreintes.size} formulaire${empreintes.size > 1 ? "s" : ""}`,
        niveau: "idle"
    };
}

// Q2 — comment la page suivante se charge
function mecanisme(entrees) {
    const signaux = new Set(entrees.flatMap((entree) => entree.signaux || []));
    const chemins = new Set(entrees.map((entree) => entree.chemin));
    const empreintes = new Set(entrees.map((entree) => entree.empreinte));

    if (signaux.has("route-interne")) {
        return { valeur: "route interne (SPA)", niveau: "warn", code: "route-spa" };
    }

    if (empreintes.size > 1 && chemins.size === 1) {
        return { valeur: "remplacement partiel", niveau: "warn", code: "ajax-partiel" };
    }

    if (empreintes.size > 1 && chemins.size > 1) {
        return { valeur: "rechargement complet", niveau: "ok", code: "rechargement-complet" };
    }

    return { valeur: "une seule page vue", niveau: "idle", code: "indetermine" };
}

// Q3 — les sélecteurs sont-ils stables d'une visite à l'autre
function stabilite(entrees) {
    const cumul = {
        identifiant: { identiques: 0, total: 0 },
        nom: { identiques: 0, total: 0 },
        libelle: { identiques: 0, total: 0 }
    };

    entrees.forEach((entree) => {
        if (!entree.stabilite) {
            return;
        }

        ["identifiant", "nom", "libelle"].forEach((champ) => {
            cumul[champ].identiques += entree.stabilite[champ].identiques;
            cumul[champ].total += entree.stabilite[champ].total;
        });
    });

    if (cumul.libelle.total === 0 && cumul.nom.total === 0) {
        return {
            valeur: "à confirmer — revenez après un 2ᵉ passage",
            niveau: "idle",
            detail: cumul
        };
    }

    const taux = (champ) =>
        cumul[champ].total === 0 ? null : cumul[champ].identiques / cumul[champ].total;

    const parts = [];
    let niveau = "ok";

    ["identifiant", "nom", "libelle"].forEach((champ) => {
        const valeur = taux(champ);

        if (valeur === null) {
            return;
        }

        const pourcent = Math.round(valeur * 100);
        parts.push(`${champ.slice(0, 3)} ${pourcent}%`);

        if (champ !== "libelle" && valeur < 0.9) {
            niveau = "warn";
        }
    });

    const idStable = (taux("identifiant") ?? 1) >= 0.9;
    const nomStable = (taux("nom") ?? 1) >= 0.9;

    if (!idStable && !nomStable) {
        niveau = "stop";
    }

    return { valeur: parts.join(" · "), niveau, detail: cumul, idStable, nomStable };
}

// Q4 — quel cadre applicatif
function cadres(entrees) {
    const dom = new Set(entrees.flatMap((entree) => entree.cadresApplicatifs || []));
    const page = entrees.find((entree) => entree.cadresPage)?.cadresPage;

    if (page) {
        Object.entries(page).forEach(([nom, present]) => {
            if (present) {
                dom.add(nom);
            }
        });
    }

    if (dom.size === 0) {
        return { valeur: "non détecté", niveau: "idle", liste: [] };
    }

    return { valeur: Array.from(dom).join(", "), niveau: "ok", liste: Array.from(dom) };
}

// Q5 — champs conditionnels
function conditionnels(entrees) {
    const total = entrees.reduce(
        (somme, entree) => somme + (entree.conditionnels || 0),
        0
    );

    if (total === 0) {
        return { valeur: "aucun observé", niveau: "ok", total };
    }

    return { valeur: `${total} champ${total > 1 ? "s" : ""}`, niveau: "warn", total };
}

// Q6 — obstacles
function obstacles(entrees) {
    const captcha = entrees.some((entree) => entree.obstacles?.captcha);
    const bloquants = entrees.flatMap(
        (entree) => (entree.obstacles?.cadres || []).filter((cadre) => !cadre.accessible)
    );

    if (captcha) {
        return { valeur: "captcha", niveau: "stop", captcha, bloquants: bloquants.length };
    }

    if (bloquants.length > 0) {
        return {
            valeur: `${bloquants.length} cadre(s) inaccessible(s)`,
            niveau: "warn",
            captcha,
            bloquants: bloquants.length
        };
    }

    return { valeur: "aucun", niveau: "ok", captcha, bloquants: 0 };
}

function verdict(analyse) {
    if (analyse.q6.captcha) {
        return { valeur: "hors périmètre", niveau: "stop" };
    }

    if (analyse.q3.idStable === false && analyse.q3.nomStable === false) {
        return { valeur: "difficile — libellés seuls", niveau: "warn" };
    }

    if (analyse.q6.bloquants > 0 || analyse.q5.total > 8) {
        return { valeur: "difficile", niveau: "warn" };
    }

    return { valeur: "faisable", niveau: "ok" };
}

function analyser(entrees) {
    const analyse = {
        q1: etapes(entrees),
        q2: mecanisme(entrees),
        q3: stabilite(entrees),
        q4: cadres(entrees),
        q5: conditionnels(entrees),
        q6: obstacles(entrees)
    };

    analyse.verdict = verdict(analyse);
    return analyse;
}


// ---------------------------------------------------------------------------
//  AFFICHAGE
// ---------------------------------------------------------------------------

const QUESTIONS = [
    ["Q1", "Étapes", "q1"],
    ["Q2", "Chargement des pages", "q2"],
    ["Q3", "Stabilité des sélecteurs", "q3"],
    ["Q4", "Cadre applicatif", "q4"],
    ["Q5", "Champs conditionnels", "q5"],
    ["Q6", "Obstacles", "q6"]
];

function ligne(code, libelle, reponse) {
    const $q = document.createElement("div");
    $q.className = "q";

    const $code = document.createElement("span");
    $code.className = "code";
    $code.textContent = code;

    const $lib = document.createElement("span");
    $lib.className = "lib";
    $lib.textContent = libelle;

    const $val = document.createElement("span");
    $val.className = "val";

    const $etiquette = document.createElement("span");
    $etiquette.className = `etiquette ${reponse.niveau}`;
    $etiquette.textContent = reponse.valeur;
    $val.append($etiquette);

    $q.append($code, $lib, $val);
    return $q;
}

function grouper(observations) {
    const groupes = new Map();

    Object.values(observations).forEach((entree) => {
        if (!groupes.has(entree.origine)) {
            groupes.set(entree.origine, []);
        }

        groupes.get(entree.origine).push(entree);
    });

    return groupes;
}

async function afficher() {
    const { observations } = await chrome.storage.local.get({ observations: {} });
    const groupes = grouper(observations);

    $resultats.replaceChildren();

    if (groupes.size === 0) {
        const { domaines } = await chrome.storage.local.get({ domaines: [] });
        const $vide = document.createElement("p");
        $vide.className = "vide";

        // Le cas piégeux : le site est bien activé, mais la sonde ne démarre
        // qu'au chargement d'une page. Sans rechargement, rien n'arrive —
        // et « activez un site » ne serait pas le bon conseil.
        $vide.textContent = domaines.includes(origineCourante)
            ? "Site activé, mais aucun relevé reçu. Rechargez la page (F5) : la sonde ne démarre qu'au chargement."
            : "Aucune observation. Activez un site, puis ouvrez un formulaire.";

        $resultats.append($vide);
        return;
    }

    groupes.forEach((entrees, origine) => {
        const analyse = analyser(entrees);
        const vues = entrees.reduce((somme, entree) => somme + entree.vues, 0);

        const $site = document.createElement("div");
        $site.className = "site";

        const $titre = document.createElement("h2");

        const $hote = document.createElement("span");
        $hote.className = "hote";
        $hote.textContent = nomDeSite(origine);

        const $verdict = document.createElement("span");
        $verdict.className = `etiquette ${analyse.verdict.niveau}`;
        $verdict.textContent = analyse.verdict.valeur;

        $titre.append($hote, $verdict);

        const $reponses = document.createElement("div");
        $reponses.className = "reponses";

        QUESTIONS.forEach(([code, libelle, cle]) => {
            $reponses.append(ligne(code, libelle, analyse[cle]));
        });

        $reponses.append(
            ligne("—", "Passages observés", { valeur: String(vues), niveau: "idle" })
        );

        $site.append($titre, $reponses);
        $resultats.append($site);
    });
}


// ---------------------------------------------------------------------------
//  ACTIONS
// ---------------------------------------------------------------------------

async function ongletCourant() {
    const [onglet] = await chrome.tabs.query({ active: true, currentWindow: true });
    return onglet;
}

async function majBouton() {
    const { domaines } = await chrome.storage.local.get({ domaines: [] });
    const observe = domaines.includes(origineCourante);

    $basculer.textContent = observe ? "Ne plus observer ce site" : "Observer ce site";
    $basculer.classList.toggle("principal", !observe);
    $basculer.classList.toggle("arret", observe);
}

$basculer.addEventListener("click", async () => {
    if (!origineCourante) {
        return;
    }

    const { domaines } = await chrome.storage.local.get({ domaines: [] });
    const observe = domaines.includes(origineCourante);

    const suivant = observe
        ? domaines.filter((domaine) => domaine !== origineCourante)
        : [...domaines, origineCourante];

    await chrome.storage.local.set({ domaines: suivant });
    await majBouton();

    if (!observe) {
        const onglet = await ongletCourant();
        chrome.tabs.reload(onglet.id);
        window.close();
    }
});

// Les variables de page ne sont pas visibles depuis un script de contenu.
// Cette détection lit le contexte de la page — sans rien y écrire.
$cadre.addEventListener("click", async () => {
    const onglet = await ongletCourant();

    if (!onglet || !siteDe(onglet.url || "")) {
        return;
    }

    const [resultat] = await chrome.scripting.executeScript({
        target: { tabId: onglet.id },
        world: "MAIN",
        func: () => {
            const noeuds = Array.from(document.querySelectorAll("*")).slice(0, 300);
            const cles = noeuds.flatMap((noeud) => Object.keys(noeud));

            return {
                react: cles.some((cle) => cle.startsWith("__react")) || Boolean(window.React),
                vue: cles.some((cle) => cle.startsWith("__vue")) || Boolean(window.Vue),
                angular: Boolean(window.ng) || Boolean(document.querySelector("[ng-version]")),
                angularjs: Boolean(window.angular),
                jquery: Boolean(window.jQuery),
                "asp.net-webforms": Boolean(
                    document.querySelector("input[name='__VIEWSTATE']")
                )
            };
        }
    });

    await chrome.runtime.sendMessage({
        type: "sonde.cadresPage",
        origine: siteDe(onglet.url),
        cadres: resultat.result
    });

    await afficher();
});

$exporter.addEventListener("click", async () => {
    const { observations } = await chrome.storage.local.get({ observations: {} });
    const groupes = grouper(observations);

    const rapport = {
        genereLe: new Date().toISOString(),
        version: "0.1.0",
        sites: Array.from(groupes.entries()).map(([origine, entrees]) => {
            const analyse = analyser(entrees);

            return {
                origine,
                hote: nomDeSite(origine),
                verdict: analyse.verdict.valeur,
                reponses: {
                    q1_etapes: analyse.q1.valeur,
                    q2_pagination: analyse.q2.code,
                    q3_stabilite: analyse.q3.detail,
                    q4_cadres: analyse.q4.liste,
                    q5_conditionnels: analyse.q5.total,
                    q6_obstacles: {
                        captcha: analyse.q6.captcha,
                        cadresInaccessibles: analyse.q6.bloquants
                    }
                },
                formulaires: entrees.map((entree) => ({
                    chemin: entree.chemin,
                    empreinte: entree.empreinte,
                    titre: entree.titre,
                    vues: entree.vues,
                    nombreChamps: entree.nombreChamps,
                    dansUnCadre: entree.dansUnCadre,
                    champs: entree.champs
                }))
            };
        })
    };

    const blob = new Blob([JSON.stringify(rapport, null, 2)], {
        type: "application/json"
    });

    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(blob);
    lien.download = `sonde-${new Date().toISOString().slice(0, 10)}.json`;
    lien.click();
    URL.revokeObjectURL(lien.href);
});

$vider.addEventListener("click", async () => {
    await chrome.storage.local.set({ observations: {} });
    await afficher();
});


// ---------------------------------------------------------------------------
//  DÉMARRAGE
// ---------------------------------------------------------------------------

(async function () {
    const onglet = await ongletCourant();
    const site = siteDe(onglet ? onglet.url || "" : "");

    if (site) {
        origineCourante = site;
        $url.textContent = site === "file://" ? "fichiers locaux (file://)" : site;
    } else {
        origineCourante = "";
        $url.textContent = "Page non observable";
        $basculer.disabled = true;
        $cadre.disabled = true;
    }

    await majBouton();
    await afficher();
})();
