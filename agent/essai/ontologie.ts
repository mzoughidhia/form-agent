// ---------------------------------------------------------------------------
//  Essai visuel de l'ontologie (sprint 1).
//
//  Comme essai.ts, cette page charge le VRAI code de src/core et le vrai
//  ontology.json — rien n'est simulé. Elle montre les trois usages de
//  l'ontologie, dans l'ordre où ils comptent :
//
//    1. le dictionnaire  — un libellé lu sur un extranet mène à un champ
//    2. la liste         — ce qu'un courtier relit au ticket S1-3
//    3. le validateur    — ce qui arrive quand on casse le fichier
//
//  C'est essai/ et non src/ : le vérificateur d'architecture interdit à
//  core/ d'importer un fichier hors de src/. Ici, c'est la couche appelante
//  qui lit le JSON — exactement ce que fera data/ au sprint 1.
// ---------------------------------------------------------------------------

import ontologieBrute from "../ontology.json";

import { valider, ontologieValidee, type Anomalie } from "../src/core/ontology/valider.ts";
import {
    champsDeSection,
    formatsDe,
    indexDesLibelles
} from "../src/core/ontology/consulter.ts";
import { normaliserLibelle } from "../src/core/texte/normaliser.ts";
import type { ChampCanonique, Ontologie } from "../src/core/ontology/ontologie.ts";

const ONTOLOGIE = ontologieValidee(ontologieBrute);
const INDEX = indexDesLibelles(ONTOLOGIE);
const PAR_CLE = new Map(ONTOLOGIE.fields.map((champ) => [champ.key, champ]));

const $ = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;

// ---------------------------------------------------------------------------
//  1. Le dictionnaire de libellés
// ---------------------------------------------------------------------------

function chercherLibelle(saisi: string): void {
    const normalise = normaliserLibelle(saisi);
    const cle = INDEX.get(normalise);

    $("normalise").textContent = normalise === "" ? "—" : normalise;

    if (saisi.trim() === "") {
        $("resultat").className = "resultat vide";
        $("resultat").textContent = "Tapez un libellé, ou choisissez-en un ci-dessus.";
        return;
    }

    if (cle === undefined) {
        $("resultat").className = "resultat inconnu";
        $("resultat").replaceChildren(
            texte("strong", "Aucun champ canonique."),
            texte("div", "L'agent refuserait de remplir plutôt que de deviner (règle S5). " +
                "Au sprint 3, c'est là que le courtier tranche une fois, et que la recette apprend.")
        );
        return;
    }

    const champ = PAR_CLE.get(cle);

    if (champ === undefined) {
        return;
    }

    $("resultat").className = "resultat trouve";
    $("resultat").replaceChildren(
        texte("div", champ.key, "cle-trouvee"),
        texte("div", `${champ.label} · ${sectionDe(champ)} · type ${champ.type}` +
            (champ.unit === undefined ? "" : ` · en ${champ.unit}`)),
        texte("div", `écritures acceptées : ${formatsDe(ONTOLOGIE, champ).join("  ·  ")}`, "pale"),
        ...(champ.derived === undefined
            ? []
            : [texte("div", `calculé : ${champ.derived.formula}`, "pale")]),
        ...(champ.values === undefined
            ? []
            : [texte("div",
                `valeurs : ${champ.values.map((valeur) => valeur.value).join(", ")}`, "pale")])
    );
}

function texte(balise: string, contenu: string, classe = ""): HTMLElement {
    const element = document.createElement(balise);

    element.textContent = contenu;

    if (classe !== "") {
        element.className = classe;
    }

    return element;
}

function sectionDe(champ: ChampCanonique): string {
    return ONTOLOGIE.sections.find((section) => section.id === champ.section)?.label ?? champ.section;
}

// ---------------------------------------------------------------------------
//  2. La liste, telle qu'un courtier la relit
// ---------------------------------------------------------------------------

function afficherOntologie(filtre: string): void {
    const cherche = normaliserLibelle(filtre);
    const corps = $("corps");
    let visibles = 0;

    corps.replaceChildren();

    for (const section of ONTOLOGIE.sections) {
        const champs = champsDeSection(ONTOLOGIE, section.id).filter((champ) => retient(champ, cherche));

        if (champs.length === 0) {
            continue;
        }

        visibles += champs.length;

        const entete = document.createElement("tr");
        const cellule = document.createElement("td");

        cellule.colSpan = 5;
        cellule.className = "section";
        cellule.textContent = `${section.label} — ${champs.length}`;
        entete.append(cellule);
        corps.append(entete);

        for (const champ of champs) {
            corps.append(ligneDe(champ));
        }
    }

    $("compteur").textContent = `${visibles} / ${ONTOLOGIE.fields.length}`;
}

function retient(champ: ChampCanonique, cherche: string): boolean {
    if (cherche === "") {
        return true;
    }

    const matiere = [champ.key, champ.label, ...champ.synonyms]
        .map(normaliserLibelle)
        .join(" ");

    return matiere.includes(cherche);
}

function ligneDe(champ: ChampCanonique): HTMLTableRowElement {
    const ligne = document.createElement("tr");

    const type = champ.type + (champ.unit === undefined ? "" : ` (${champ.unit})`);
    const details = champ.values !== undefined
        ? champ.values.map((valeur) => valeur.value).join(" · ")
        : formatsDe(ONTOLOGIE, champ).join(" · ");

    ligne.append(
        cellule(champ.key, "mono cle"),
        cellule(champ.label + (champ.derived === undefined ? "" : "  ↩ calculé")),
        cellule(String(champ.synonyms.length), "num"),
        cellule(type, "mono pale"),
        cellule(champ.derived === undefined ? details : champ.derived.formula, "mono pale petit")
    );

    return ligne;
}

function cellule(contenu: string, classe = ""): HTMLTableCellElement {
    const td = document.createElement("td");

    td.textContent = contenu;

    if (classe !== "") {
        td.className = classe;
    }

    return td;
}

// ---------------------------------------------------------------------------
//  3. Le validateur — casser le fichier sur un seul point
// ---------------------------------------------------------------------------

type ProfondementMutable<T> =
    T extends readonly (infer Element)[] ? ProfondementMutable<Element>[]
    : T extends object ? { -readonly [Cle in keyof T]: ProfondementMutable<T[Cle]> }
    : T;

type OntologieMutable = ProfondementMutable<Ontologie>;

function casser(modifier: (ontologie: OntologieMutable) => void): unknown {
    const copie = structuredClone(ONTOLOGIE) as OntologieMutable;

    modifier(copie);

    return copie;
}

function champMutable(ontologie: OntologieMutable, cle: string): ProfondementMutable<ChampCanonique> {
    const trouve = ontologie.fields.find((champ) => champ.key === cle);

    if (trouve === undefined) {
        throw new Error(`champ « ${cle} » absent`);
    }

    return trouve;
}

const DEMONSTRATIONS: readonly {
    readonly libelle: string;
    readonly explication: string;
    readonly produire: () => unknown;
}[] = [
    {
        libelle: "Telle qu'elle est livrée",
        explication: "Le fichier du dépôt, tel quel.",
        produire: () => ONTOLOGIE
    },
    {
        libelle: "Deux champs revendiquent « Né(e) le »",
        explication: "En voyant ce libellé, l'agent ne saurait pas s'il s'agit de l'assuré " +
            "ou du conjoint. Il devinerait — c'est exactement ce que le validateur empêche.",
        produire: () => casser((ontologie) => {
            champMutable(ontologie, "spouse.birthDate").synonyms.push("Né(e) le");
        })
    },
    {
        libelle: "Une valeur d'énumération en minuscules",
        explication: "Les valeurs canoniques sont en MAJUSCULES. « celibataire » et " +
            "« CELIBATAIRE » finiraient par cohabiter dans les recettes.",
        produire: () => casser((ontologie) => {
            const valeurs = champMutable(ontologie, "client.maritalStatus").values;

            if (valeurs !== undefined && valeurs[0] !== undefined) {
                valeurs[0].value = "celibataire";
            }
        })
    },
    {
        libelle: "Un champ calculé pointe une clé inexistante",
        explication: "L'âge se calcule depuis « client.dateDeNaissance », qui n'existe pas. " +
            "Rien ne planterait au chargement : l'âge serait simplement vide, un jour, chez un client.",
        produire: () => casser((ontologie) => {
            champMutable(ontologie, "client.age").derived = {
                from: ["client.dateDeNaissance"],
                computation: "ageEnAnneesRevolues",
                formula: "années révolues depuis client.dateDeNaissance"
            };
        })
    },
    {
        libelle: "Un cycle entre champs calculés",
        explication: "L'âge se calcule depuis la date de naissance… qui se calculerait depuis " +
            "l'âge. Aucun des deux n'est calculable.",
        produire: () => casser((ontologie) => {
            champMutable(ontologie, "client.birthDate").derived = {
                from: ["client.age"],
                computation: "naissanceDepuisAge",
                formula: "date du jour moins client.age années"
            };
        })
    },
    {
        libelle: "Un format inventé",
        explication: "« le 7 mars » n'est pas dans le catalogue du type date. Le générateur " +
            "de variantes du sprint 3 ne saurait pas le produire.",
        produire: () => casser((ontologie) => {
            champMutable(ontologie, "client.birthDate").formats = ["JJ/MM/AAAA", "le 7 mars"];
        })
    }
];

function eprouver(demonstration: (typeof DEMONSTRATIONS)[number]): void {
    const anomalies = valider(demonstration.produire());

    $("explication").textContent = demonstration.explication;
    $("anomalies").replaceChildren(
        anomalies.length === 0
            ? texte("div", "Aucune anomalie — le build passe.", "ligne ok")
            : texte("div", `${anomalies.length} anomalie(s) — le build échoue.`, "ligne attention"),
        ...anomalies.map((anomalie: Anomalie) =>
            texte("div", `${anomalie.ou}\n    ${anomalie.probleme}`, "ligne anomalie"))
    );
}

// ---------------------------------------------------------------------------
//  Câblage
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
    "Date de naissance",
    "DATE DE NAISSANCE :",
    "Né le",
    "Né(e) le",
    "Coefficient bonus-malus",
    "N° SIRET",
    "Superficie",
    "Quotité",
    "Fractionnement",
    "Nom du chien"
];

const $saisie = $("libelle") as HTMLInputElement;

for (const suggestion of SUGGESTIONS) {
    const bouton = document.createElement("button");

    bouton.textContent = suggestion;
    bouton.className = "suggestion";
    bouton.addEventListener("click", () => {
        $saisie.value = suggestion;
        chercherLibelle(suggestion);
    });

    $("suggestions").append(bouton);
}

$saisie.addEventListener("input", () => {
    chercherLibelle($saisie.value);
});

const $filtre = $("filtre") as HTMLInputElement;

$filtre.addEventListener("input", () => {
    afficherOntologie($filtre.value);
});

const boutons: HTMLButtonElement[] = [];

for (const demonstration of DEMONSTRATIONS) {
    const bouton = document.createElement("button");

    bouton.textContent = demonstration.libelle;
    bouton.addEventListener("click", () => {
        for (const autre of boutons) {
            autre.className = "";
        }

        bouton.className = "fort";
        eprouver(demonstration);
    });

    boutons.push(bouton);
    $("demonstrations").append(bouton);
}

boutons[0]!.className = "fort";

$("version").textContent = ONTOLOGIE.version;
$("total").textContent = String(ONTOLOGIE.fields.length);
$("libelles").textContent = String(INDEX.size);

chercherLibelle("");
afficherOntologie("");
eprouver(DEMONSTRATIONS[0]!);
