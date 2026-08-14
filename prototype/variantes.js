// ---------------------------------------------------------------------------
//  LES VARIANTES D'ÉCRITURE — le coeur de l'apprentissage.
//
//  Une même donnée s'écrit de dix façons selon la compagnie :
//
//      client.birthDate = 07/03/1985
//          → 07/03/1985 · 07-03-1985 · 07031985 · 1985-03-07 · 7/3/1985 …
//
//  Deux usages, une seule fonction :
//
//   1. APPRENDRE — le courtier tape « 1985-03-07 » dans un champ. On génère
//      les variantes de chaque donnée de la fiche client ; une seule colle.
//      On apprend d'un coup QUEL champ c'est ET DANS QUEL FORMAT il l'écrit.
//
//   2. REMPLIR — la recette dit « ce champ, c'est client.birthDate au format
//      AAAA-MM-JJ ». On régénère la variante voulue.
//
//  Les codes de format viennent du catalogue de l'ontologie : le code EST le
//  motif, « JJ/MM/AAAA » se lit sans documentation.
// ---------------------------------------------------------------------------

const MOIS_FR = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
];

const Variantes = (function () {
    "use strict";

    const champs = new Map(ONTOLOGIE.fields.map((champ) => [champ.key, champ]));

    function champDe(cle) {
        return champs.get(cle) || null;
    }

    // Les chiffres seuls : sert à comparer « 06 12 34 56 78 » et « 0612345678 ».
    function compacter(texte) {
        return String(texte || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
    }

    function nettoyer(texte) {
        return String(texte || "").trim().toLowerCase();
    }

    // --- un générateur par type -------------------------------------------

    function pourDate(valeur) {
        const morceaux = String(valeur).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

        if (!morceaux) {
            return [{ format: "JJ/MM/AAAA", texte: valeur }];
        }

        const [, jour, mois, annee] = morceaux;
        const moisLettre = MOIS_FR[Number(mois) - 1] || mois;

        return [
            { format: "JJ/MM/AAAA", texte: `${jour}/${mois}/${annee}` },
            { format: "JJ-MM-AAAA", texte: `${jour}-${mois}-${annee}` },
            { format: "JJ.MM.AAAA", texte: `${jour}.${mois}.${annee}` },
            { format: "JJMMAAAA", texte: `${jour}${mois}${annee}` },
            { format: "AAAA-MM-JJ", texte: `${annee}-${mois}-${jour}` },
            { format: "J/M/AAAA", texte: `${Number(jour)}/${Number(mois)}/${annee}` },
            { format: "JJ/MM/AA", texte: `${jour}/${mois}/${annee.slice(2)}` },
            { format: "JJ mois AAAA", texte: `${Number(jour)} ${moisLettre} ${annee}` }
        ];
    }

    function pourTelephone(valeur) {
        const chiffres = compacter(valeur).replace(/^(0033|33)/, "0");

        if (chiffres.length !== 10) {
            return [{ format: "0XXXXXXXXX", texte: valeur }];
        }

        const paires = chiffres.match(/\d{2}/g);
        const sansZero = chiffres.slice(1);

        return [
            { format: "0XXXXXXXXX", texte: chiffres },
            { format: "0X XX XX XX XX", texte: paires.join(" ") },
            { format: "0X.XX.XX.XX.XX", texte: paires.join(".") },
            { format: "0X-XX-XX-XX-XX", texte: paires.join("-") },
            { format: "+33XXXXXXXXX", texte: `+33${sansZero}` },
            { format: "+33 X XX XX XX XX", texte: `+33 ${sansZero[0]} ${sansZero.slice(1).match(/\d{2}/g).join(" ")}` },
            { format: "0033XXXXXXXXX", texte: `0033${sansZero}` }
        ];
    }

    function pourDecimal(valeur) {
        const normal = String(valeur).replace(/\s/g, "").replace(",", ".");
        const nombre = Number(normal);

        if (Number.isNaN(nombre)) {
            return [{ format: "1234,56", texte: valeur }];
        }

        const virgule = String(valeur).replace(".", ",");
        const entier = String(Math.round(nombre));

        return [
            { format: "1234,56", texte: virgule },
            { format: "1234.56", texte: normal },
            { format: "1 234,56", texte: virgule.replace(/\B(?=(\d{3})+(?!\d))/, " ") },
            { format: "1234", texte: entier }
        ];
    }

    function pourEntier(valeur) {
        const brut = compacter(valeur);

        return [
            { format: "123", texte: brut },
            { format: "1 234", texte: brut.replace(/\B(?=(\d{3})+(?!\d))/g, " ") }
        ];
    }

    function pourTexte(valeur) {
        return [
            { format: "Texte", texte: String(valeur) },
            { format: "TEXTE", texte: String(valeur).toUpperCase() },
            { format: "texte", texte: String(valeur).toLowerCase() }
        ];
    }

    function pourEmail(valeur) {
        return [
            { format: "nom@domaine.fr", texte: String(valeur).toLowerCase() },
            { format: "NOM@DOMAINE.FR", texte: String(valeur).toUpperCase() }
        ];
    }

    function pourBooleen(valeur) {
        const oui = /^(oui|o|true|1)$/i.test(String(valeur).trim());

        return [
            { format: "Oui/Non", texte: oui ? "Oui" : "Non" },
            { format: "OUI/NON", texte: oui ? "OUI" : "NON" },
            { format: "O/N", texte: oui ? "O" : "N" },
            { format: "true/false", texte: oui ? "true" : "false" },
            { format: "1/0", texte: oui ? "1" : "0" },
            { format: "coché", texte: oui ? "coché" : "" }
        ];
    }

    // Un enum a deux écritures : la valeur canonique (MARIE) et tout ce que
    // les compagnies affichent (« Marié(e) », « Marié », « M »).
    function pourEnum(champ, valeur) {
        const declaree = (champ.values || []).find((option) => option.value === valeur);

        if (!declaree) {
            return [{ format: "VALEUR", texte: String(valeur) }];
        }

        const sorties = [
            { format: "VALEUR", texte: declaree.value },
            { format: "Libellé", texte: declaree.label },
            { format: "LIBELLÉ", texte: declaree.label.toUpperCase() },
            { format: "libellé", texte: declaree.label.toLowerCase() }
        ];

        // Les synonymes ne sont pas des formats : ils servent seulement à
        // reconnaître ce qui est affiché. On les rend sous le format Libellé.
        declaree.synonyms.forEach((synonyme) => {
            sorties.push({ format: "Libellé", texte: synonyme });
        });

        return sorties;
    }

    function pourImmatriculation(valeur) {
        const brut = compacter(valeur).toUpperCase();
        const moderne = brut.match(/^([A-Z]{2})(\d{3})([A-Z]{2})$/);

        if (!moderne) {
            return [{ format: "AA-123-AA", texte: valeur }];
        }

        const [, avant, chiffres, apres] = moderne;

        return [
            { format: "AA-123-AA", texte: `${avant}-${chiffres}-${apres}` },
            { format: "AA123AA", texte: `${avant}${chiffres}${apres}` },
            { format: "AA 123 AA", texte: `${avant} ${chiffres} ${apres}` }
        ];
    }

    function pourIban(valeur) {
        const brut = compacter(valeur).toUpperCase();

        return [
            { format: "FRXXXXXXXXXXXXXXXXXXXXXXXXX", texte: brut },
            {
                format: "FRXX XXXX XXXX XXXX XXXX XXXX XXX",
                texte: brut.match(/.{1,4}/g).join(" ")
            }
        ];
    }

    // --- l'aiguillage ------------------------------------------------------

    function de(cle, valeur) {
        const champ = champDe(cle);

        if (!champ || valeur === undefined || valeur === null || valeur === "") {
            return [];
        }

        switch (champ.type) {
            case "date": return pourDate(valeur);
            case "telephone": return pourTelephone(valeur);
            case "decimal": return pourDecimal(valeur);
            case "entier": return pourEntier(valeur);
            case "email": return pourEmail(valeur);
            case "booleen": return pourBooleen(valeur);
            case "enum": return pourEnum(champ, valeur);
            case "immatriculation": return pourImmatriculation(valeur);
            case "iban": return pourIban(valeur);
            case "codePostal": return [{ format: "XXXXX", texte: String(valeur) }];
            default: return pourTexte(valeur);
        }
    }

    // Régénère l'écriture exacte qu'attend ce formulaire.
    function formater(cle, valeur, format) {
        const toutes = de(cle, valeur);
        const voulue = toutes.find((variante) => variante.format === format);

        return voulue ? voulue.texte : String(valeur);
    }

    /**
     * LE RAPPROCHEMENT PAR VALEUR.
     *
     * Le courtier a tapé quelque chose. Quelle donnée de la fiche pouvait
     * produire ça, et sous quel format ? Rend tous les candidats — c'est
     * l'appelant qui tranche s'il y en a plusieurs.
     */
    function rapprocher(saisie, fiche) {
        const cherche = nettoyer(saisie);
        const compacte = compacter(saisie);

        if (cherche === "") {
            return [];
        }

        const candidats = [];

        Object.entries(fiche || {}).forEach(([cle, valeur]) => {
            de(cle, valeur).forEach((variante) => {
                const texte = nettoyer(variante.texte);

                if (texte === "") {
                    return;
                }

                // Égalité stricte, ou une fois la ponctuation retirée :
                // « 06 12 34 56 78 » et « 0612345678 » sont le même numéro.
                const exact = texte === cherche;
                const relache = compacter(variante.texte) === compacte && compacte.length >= 4;

                if (exact || relache) {
                    candidats.push({ cle, format: variante.format, exact });
                }
            });
        });

        // Un candidat exact vaut mieux qu'un relâché ; et on ne garde qu'une
        // entrée par clé canonique.
        const parCle = new Map();

        candidats
            .sort((a, b) => Number(b.exact) - Number(a.exact))
            .forEach((candidat) => {
                if (!parCle.has(candidat.cle)) {
                    parCle.set(candidat.cle, candidat);
                }
            });

        return Array.from(parCle.values());
    }

    return { de, formater, rapprocher, champDe, compacter, nettoyer };
}());
