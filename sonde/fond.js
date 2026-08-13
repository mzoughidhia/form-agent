// ---------------------------------------------------------------------------
//  SONDE — agrégation
//
//  Reçoit les relevés des pages observées et les consolide. C'est ici que
//  se construisent les réponses aux six questions, en comparant ce qui est
//  observé aujourd'hui à ce qui l'a été aux visites précédentes.
// ---------------------------------------------------------------------------

// Les relevés de plusieurs cadres d'une même page arrivent en parallèle.
// Sans file d'attente, deux écritures simultanées s'écrasent l'une l'autre.
let file = Promise.resolve();

function enFile(travail) {
    file = file.then(travail).catch((erreur) => {
        console.error("[sonde]", erreur);
    });

    return file;
}

function cleDe(page, formulaire) {
    return `${page.origine}${page.chemin}::${formulaire.empreinte}`;
}


// ---------------------------------------------------------------------------
//  Q3 · STABILITÉ DES SÉLECTEURS
//
//  On compare champ par champ, à la même position, ce qui a été observé
//  cette fois-ci et ce qui l'avait été avant. Un identifiant qui change
//  d'une visite à l'autre rend tout sélecteur CSS inutilisable, et c'est
//  la découverte qui coûte le plus cher si on la fait au sprint 4.
// ---------------------------------------------------------------------------

function comparer(ancien, nouveau) {
    const resultat = {
        identifiant: { identiques: 0, total: 0 },
        nom: { identiques: 0, total: 0 },
        libelle: { identiques: 0, total: 0 }
    };

    nouveau.forEach((fiche, position) => {
        const reference = ancien[position];

        if (!reference) {
            return;
        }

        if (reference.identifiant || fiche.identifiant) {
            resultat.identifiant.total += 1;
            if (reference.identifiant === fiche.identifiant) {
                resultat.identifiant.identiques += 1;
            }
        }

        if (reference.nom || fiche.nom) {
            resultat.nom.total += 1;
            if (reference.nom === fiche.nom) {
                resultat.nom.identiques += 1;
            }
        }

        if (reference.libelle || fiche.libelle) {
            resultat.libelle.total += 1;
            if (reference.libelle === fiche.libelle) {
                resultat.libelle.identiques += 1;
            }
        }
    });

    return resultat;
}

function cumuler(cumul, ajout) {
    const base = cumul || {
        identifiant: { identiques: 0, total: 0 },
        nom: { identiques: 0, total: 0 },
        libelle: { identiques: 0, total: 0 }
    };

    ["identifiant", "nom", "libelle"].forEach((champ) => {
        base[champ].identiques += ajout[champ].identiques;
        base[champ].total += ajout[champ].total;
    });

    return base;
}

function unir(ancien, ajout) {
    return Array.from(new Set([...(ancien || []), ...(ajout || [])]));
}


// ---------------------------------------------------------------------------
//  ENREGISTREMENT
// ---------------------------------------------------------------------------

function integrer(page, formulaire, observations) {
    const cle = cleDe(page, formulaire);
    const connu = observations[cle];
    const maintenant = Date.now();

    if (!connu) {
        observations[cle] = {
            cle,
            origine: page.origine,
            chemin: page.chemin,
            empreinte: formulaire.empreinte,
            titre: formulaire.titre,
            nomDonne: "",
            vues: 1,
            premiereVue: maintenant,
            derniereVue: maintenant,
            dansUnCadre: page.dansUnCadre,
            nombreChamps: formulaire.nombreChamps,
            champs: formulaire.champs,
            cadresApplicatifs: page.cadresApplicatifs,
            cadresPage: null,
            signaux: page.signaux,
            conditionnels: page.conditionnels,
            obstacles: page.obstacles,
            stabilite: null
        };

        return;
    }

    // Deux relevés successifs dans la même page ne prouvent rien sur la
    // stabilité : on ne compare que d'un chargement à l'autre.
    if (page.premierReleve) {
        connu.vues += 1;
        connu.stabilite = cumuler(connu.stabilite, comparer(connu.champs, formulaire.champs));
    }

    connu.derniereVue = maintenant;
    connu.champs = formulaire.champs;
    connu.nombreChamps = formulaire.nombreChamps;
    connu.titre = formulaire.titre || connu.titre;
    connu.cadresApplicatifs = unir(connu.cadresApplicatifs, page.cadresApplicatifs);
    connu.signaux = unir(connu.signaux, page.signaux);
    connu.conditionnels = Math.max(connu.conditionnels || 0, page.conditionnels || 0);
    connu.obstacles = page.obstacles;
}

chrome.runtime.onMessage.addListener((message, expediteur, repondre) => {

    if (message.type === "sonde.releve") {
        enFile(async () => {
            const { observations } = await chrome.storage.local.get({ observations: {} });

            message.formulaires.forEach((formulaire) => {
                integrer(message.page, formulaire, observations);
            });

            await chrome.storage.local.set({ observations });
        });

        return false;
    }

    if (message.type === "sonde.cadresPage") {
        enFile(async () => {
            const { observations } = await chrome.storage.local.get({ observations: {} });

            Object.values(observations)
                .filter((entree) => entree.origine === message.origine)
                .forEach((entree) => {
                    entree.cadresPage = message.cadres;
                });

            await chrome.storage.local.set({ observations });
            repondre({ ok: true });
        });

        return true;
    }

    return false;
});
