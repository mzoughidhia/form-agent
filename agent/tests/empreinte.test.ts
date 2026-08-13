import { test } from "node:test";
import assert from "node:assert/strict";

import {
    condenser,
    empreinteDe,
    cleChamp,
    memeFormulaire
} from "../src/core/fingerprint/empreinte.ts";
import type { FicheChamp } from "../src/core/modele/champ.ts";

function champ(partiel: Partial<FicheChamp>): FicheChamp {
    return {
        position: 0,
        balise: "input",
        type: "text",
        nom: "",
        identifiant: "",
        libelle: "",
        section: "",
        indice: "",
        requis: false,
        longueurMax: null,
        motif: "",
        autocompletion: "",
        ...partiel
    };
}

const FORMULAIRE: readonly FicheChamp[] = [
    champ({ position: 0, libelle: "Nom de naissance", nom: "nom", identifiant: "nom", requis: true }),
    champ({ position: 1, libelle: "Date de naissance", nom: "dtn", identifiant: "dtn", type: "date" }),
    champ({ position: 2, libelle: "Situation familiale", nom: "sit", identifiant: "sit", type: "select" })
];

test("le condensé est stable et fait 8 caractères hexadécimaux", () => {
    assert.match(condenser("abc"), /^[0-9a-f]{8}$/);
    assert.equal(condenser("abc"), condenser("abc"));
    assert.notEqual(condenser("abc"), condenser("abd"));
});

test("le condensé d'une chaîne vide reste valide", () => {
    assert.match(condenser(""), /^[0-9a-f]{8}$/);
});

test("l'empreinte survit à des identifiants regénérés", () => {
    // Le cas D du banc d'essai : un portail ASP.NET qui recalcule ses id et
    // ses name à chaque session. Le formulaire doit rester reconnu.
    const apresNouvelleSession = FORMULAIRE.map((fiche, i) =>
        champ({ ...fiche, identifiant: `ctl00_x9f2_${i}`, nom: `champ$9f2$${i}` })
    );

    assert.equal(empreinteDe(apresNouvelleSession), empreinteDe(FORMULAIRE));
});

test("l'empreinte change si un champ apparaît", () => {
    const avecUnChampDePlus = [
        ...FORMULAIRE,
        champ({ position: 3, libelle: "Nom du bailleur", nom: "bailleur" })
    ];

    assert.notEqual(empreinteDe(avecUnChampDePlus), empreinteDe(FORMULAIRE));
});

test("l'empreinte change si un libellé change", () => {
    const renomme = FORMULAIRE.map((fiche, i) =>
        i === 0 ? champ({ ...fiche, libelle: "Nom de jeune fille" }) : fiche
    );

    assert.notEqual(empreinteDe(renomme), empreinteDe(FORMULAIRE));
});

test("l'empreinte change si l'ordre des champs change", () => {
    const inverse = [...FORMULAIRE].reverse();

    assert.notEqual(empreinteDe(inverse), empreinteDe(FORMULAIRE));
});

test("la clé d'un champ retombe sur le nom puis la position quand le libellé manque", () => {
    assert.equal(cleChamp(champ({ libelle: "Prénom", nom: "pre" })), "text|Prénom");
    assert.equal(cleChamp(champ({ libelle: "", nom: "pre" })), "text|pre");
    assert.equal(cleChamp(champ({ libelle: "", nom: "", position: 7 })), "text|7");
});

test("un champ conditionnel n'est pas confondu avec un changement d'étape", () => {
    const etape = new Set(["text|Nom", "text|Prénom", "select|Situation", "date|Naissance"]);

    // Même formulaire, un champ de plus : recouvrement total.
    const avecConditionnel = new Set([...etape, "text|Nom du bailleur"]);
    assert.equal(memeFormulaire(etape, avecConditionnel), true);

    // Étape suivante : plus rien en commun.
    const etapeSuivante = new Set(["text|Immatriculation", "text|Marque", "select|Énergie"]);
    assert.equal(memeFormulaire(etape, etapeSuivante), false);
});

test("un relevé vide n'est jamais considéré comme le même formulaire", () => {
    assert.equal(memeFormulaire(new Set(), new Set(["text|Nom"])), false);
    assert.equal(memeFormulaire(new Set(["text|Nom"]), new Set()), false);
});
