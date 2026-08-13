import { test, before } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { fichesDe, racinesDeFormulaire } from "../src/dom/extract/extraire.ts";
import { empreinteDe } from "../src/core/fingerprint/empreinte.ts";
import type { FicheChamp } from "../src/core/modele/champ.ts";

const PAGE = `
<form id="devis">
  <fieldset><legend>Conducteur principal</legend>

    <div><label for="nom">Nom de naissance</label>
      <input type="text" id="nom" name="conducteur_nom" required maxlength="40"></div>

    <div><label>Prénom
      <input type="text" id="prenom" name="conducteur_prenom" required></label></div>

    <div><input type="text" id="dtNaiss" name="date_naissance"
                aria-label="Date de naissance" placeholder="JJ/MM/AAAA"
                pattern="\\d{2}/\\d{2}/\\d{4}" required></div>

    <div><div class="txt">Date d'obtention du permis</div>
      <input type="text" id="ctl00_dtPermis" name="permis_date" placeholder="JJ/MM/AAAA"></div>

    <div><label for="situation">Situation familiale</label>
      <select id="situation" name="situation_familiale">
        <option value="">-- Choisir --</option>
        <option value="1">Célibataire</option>
        <option value="2">Marié(e)</option>
      </select></div>

    <div><div class="txt">Sexe</div>
      <label><input type="radio" name="sexe" value="M"> Homme</label>
      <label><input type="radio" name="sexe" value="F"> Femme</label>
      <label><input type="radio" name="sexe" value="A"> Autre</label></div>
  </fieldset>

  <input type="hidden" name="__VIEWSTATE" value="doit être ignoré">
  <label for="mdp">Mot de passe</label>
  <input type="password" id="mdp" name="motdepasse">
</form>`;

let fiches: FicheChamp[];
let parNom: Record<string, FicheChamp>;

before(() => {
    const { window } = new JSDOM(`<!doctype html><body>${PAGE}</body>`);

    // jsdom n'implémente pas CSS.escape ; l'extraction s'en sert.
    const css = window.CSS as { escape?: (valeur: string) => string } | undefined;

    if (css !== undefined && css.escape === undefined) {
        css.escape = (valeur: string) => valeur.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
    }

    globalThis.HTMLInputElement = window.HTMLInputElement;
    globalThis.HTMLSelectElement = window.HTMLSelectElement;
    globalThis.HTMLTextAreaElement = window.HTMLTextAreaElement;
    globalThis.CSS = window.CSS;

    const racines = racinesDeFormulaire(window.document);
    assert.equal(racines.length, 1, "un seul formulaire attendu");

    fiches = fichesDe(racines[0]!);
    parNom = Object.fromEntries(fiches.map((fiche) => [fiche.nom, fiche]));
});

test("les quatre façons d'écrire un libellé sont lues", () => {
    assert.equal(parNom["conducteur_nom"]?.libelle, "Nom de naissance");
    assert.equal(parNom["conducteur_prenom"]?.libelle, "Prénom");
    assert.equal(parNom["date_naissance"]?.libelle, "Date de naissance");
    assert.equal(parNom["permis_date"]?.libelle, "Date d'obtention du permis");
});

test("la section vient du <legend>", () => {
    assert.equal(parNom["conducteur_nom"]?.section, "Conducteur principal");
});

test("les contraintes structurelles sont relevées", () => {
    assert.equal(parNom["conducteur_nom"]?.requis, true);
    assert.equal(parNom["conducteur_nom"]?.longueurMax, 40);
    assert.equal(parNom["date_naissance"]?.motif, "\\d{2}/\\d{2}/\\d{4}");
    assert.equal(parNom["permis_date"]?.indice, "JJ/MM/AAAA");
});

test("un select conserve la valeur réelle du DOM, pas seulement le texte", () => {
    const options = parNom["situation_familiale"]?.options;

    assert.equal(options?.length, 3);
    assert.deepEqual(
        options?.find((option) => option.texte === "Marié(e)"),
        { texte: "Marié(e)", valeur: "2" }
    );
});

test("un groupe radio compte pour un seul champ, avec l'intitulé du groupe", () => {
    const radios = fiches.filter((fiche) => fiche.type === "radio");

    assert.equal(radios.length, 1);
    assert.equal(radios[0]?.libelle, "Sexe");
    assert.equal(radios[0]?.options?.length, 3);
});

test("mot de passe et champ caché sont exclus", () => {
    assert.equal(fiches.some((fiche) => fiche.type === "password"), false);
    assert.equal(fiches.some((fiche) => fiche.nom === "__VIEWSTATE"), false);
});

test("aucune valeur saisie n'apparaît dans la fiche", () => {
    // Règle D1 : la structure décrit le formulaire, jamais le dossier client.
    const serialise = JSON.stringify(fiches);

    assert.equal(serialise.includes("doit être ignoré"), false);
    assert.equal(Object.keys(fiches[0]!).includes("valeur"), false);
});

test("l'extraction alimente une empreinte stable", () => {
    assert.match(empreinteDe(fiches), /^[0-9a-f]{8}$/);
    assert.equal(empreinteDe(fiches), empreinteDe(fiches));
});
