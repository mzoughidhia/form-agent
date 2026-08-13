import { test } from "node:test";
import assert from "node:assert/strict";

import {
    normaliser,
    normaliserLibelle,
    LONGUEUR_LIBELLE
} from "../src/core/texte/normaliser.ts";

test("normaliser réduit les espaces et coupe les extrêmes", () => {
    assert.equal(normaliser("  trop   d'espaces \n ici "), "trop d'espaces ici");
});

test("normaliser accepte null et undefined", () => {
    assert.equal(normaliser(null), "");
    assert.equal(normaliser(undefined), "");
});

test("normaliser tronque un texte trop long", () => {
    assert.equal(normaliser("a".repeat(500)).length, LONGUEUR_LIBELLE);
});

test("normaliser conserve la casse et les accents", () => {
    assert.equal(normaliser("Date de Naissance"), "Date de Naissance");
});

test("les variations d'un même libellé donnent la même clé", () => {
    // C'est ce qui permet au dictionnaire de reconnaître un libellé déjà vu
    // chez une autre compagnie.
    const attendu = "date de naissance";

    assert.equal(normaliserLibelle("Date de naissance"), attendu);
    assert.equal(normaliserLibelle("DATE DE NAISSANCE :"), attendu);
    assert.equal(normaliserLibelle("  Date de naissance *  "), attendu);
    assert.equal(normaliserLibelle("Date de naissance…"), attendu);
});

test("les accents sont retirés de la clé", () => {
    assert.equal(normaliserLibelle("Ancienneté du contrat"), "anciennete du contrat");
    assert.equal(normaliserLibelle("Résiliation par l'assureur"), "resiliation par l assureur");
});

test("deux libellés différents gardent des clés différentes", () => {
    assert.notEqual(
        normaliserLibelle("Date de naissance"),
        normaliserLibelle("Date de naissance du conjoint")
    );
});

test("un libellé vide donne une clé vide", () => {
    assert.equal(normaliserLibelle("   *  :  "), "");
    assert.equal(normaliserLibelle(null), "");
});
