// ---------------------------------------------------------------------------
//  LA TABLE DES COMPAGNIES — comprendre le lien.
//
//  Chaque formulaire vit à une adresse. Trois niveaux à en tirer, du plus
//  stable au plus fragile :
//
//      https://courtier.axa.fr/devis/auto/8827/etape-2?jeton=a9f3
//      └──────┬──────┘└───┬───┘└─┬─┘        └──┬──┘
//         compagnie    service  identifiant  à jeter
//
//  L'identifiant de devis change à chaque dossier : s'il restait dans la
//  clé, chaque devis créerait une recette neuve et l'extension
//  n'apprendrait jamais rien. On le remplace par un caractère générique.
// ---------------------------------------------------------------------------

const COMPAGNIES = [
    {
        nom: "AXA",
        domaines: ["axa.fr", "courtier.axa.fr", "espaceclient.axa.fr"],
        services: [
            { motif: /\/auto\b/, nom: "Auto" },
            { motif: /\/habitation\b/, nom: "Habitation" },
            { motif: /\/sante\b/, nom: "Santé" }
        ]
    },
    {
        nom: "Allianz",
        domaines: ["allianz.fr", "pro.allianz.fr"],
        services: [
            { motif: /\/auto\b/, nom: "Auto" },
            { motif: /\/mrh\b/, nom: "Habitation" }
        ]
    },
    {
        nom: "Generali",
        domaines: ["generali.fr", "extranet.generali.fr"],
        services: []
    },
    {
        // Le banc local : c'est lui qui sert aux essais.
        nom: "Compagnie d'essai",
        domaines: ["localhost", "127.0.0.1"],
        services: [
            { motif: /1-tous-les-champs/, nom: "Tous les champs" },
            { motif: /2-piege/, nom: "Formulaire piégé" },
            { motif: /3-etapes/, nom: "Tunnel à étapes" },
            { motif: /4-page/, nom: "Parcours en 3 pages" },
            { motif: /5-boutons/, nom: "Boutons" },
            { motif: /prototype\/test/, nom: "Test d'origine" }
        ]
    }
];

const Compagnies = (function () {
    "use strict";

    // Un segment de chemin qui ressemble à un identifiant : chiffres, ou
    // longue suite hexadécimale. Il ne décrit pas le formulaire, il décrit
    // le dossier.
    function estIdentifiant(segment) {
        return /^\d+$/.test(segment) ||
            /^[0-9a-f]{8,}$/i.test(segment) ||
            /^[0-9a-f-]{20,}$/i.test(segment);
    }

    function normaliserChemin(chemin) {
        return chemin
            .split("/")
            .map((segment) => (estIdentifiant(segment) ? "*" : segment))
            .join("/");
    }

    /**
     * Rend l'identité du formulaire courant :
     *   { compagnie, service, hote, chemin, cle }
     *
     * `cle` est ce sous quoi la recette est rangée. Deux dossiers différents
     * chez la même compagnie donnent la MÊME clé — c'est tout l'intérêt.
     */
    function identifier(adresse) {
        let url;

        try {
            url = new URL(adresse);
        } catch (erreur) {
            return null;
        }

        const hote = url.hostname.replace(/^www\./, "");
        const chemin = normaliserChemin(url.pathname);

        const trouvee = COMPAGNIES.find((compagnie) =>
            compagnie.domaines.some(
                (domaine) => hote === domaine || hote.endsWith(`.${domaine}`)
            )
        );

        const service = trouvee
            ? (trouvee.services.find((candidat) => candidat.motif.test(chemin)) || null)
            : null;

        return {
            compagnie: trouvee ? trouvee.nom : null,
            service: service ? service.nom : null,
            hote,
            chemin,
            // La query est exclue : elle change à chaque envoi en GET.
            cle: `${hote}${chemin}`
        };
    }

    return { identifier, normaliserChemin };
}());
