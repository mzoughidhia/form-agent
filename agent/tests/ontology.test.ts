import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { valider, ontologieValidee } from "../src/core/ontology/valider.ts";
import {
    champParCle,
    champsDeSection,
    champsDerives,
    formatsDe,
    indexDesLibelles
} from "../src/core/ontology/consulter.ts";
import {
    TYPES_CANONIQUES,
    type ChampCanonique,
    type Ontologie,
    type Unite
} from "../src/core/ontology/ontologie.ts";

// ---------------------------------------------------------------------------
//  L'ontologie livrée
// ---------------------------------------------------------------------------

const LIVREE: unknown = JSON.parse(
    readFileSync(new URL("../ontology.json", import.meta.url), "utf8")
);

const anomaliesLivrees = valider(LIVREE);

test("l'ontologie livrée est cohérente", () => {
    assert.deepEqual(
        anomaliesLivrees,
        [],
        `anomalies :\n${anomaliesLivrees.map((a) => `  ${a.ou} : ${a.probleme}`).join("\n")}`
    );
});

// Le test ci-dessus garde cette conversion : si le fichier était incohérent,
// il échouerait avant que quoi que ce soit s'en serve.
const ONTOLOGIE = LIVREE as Ontologie;

test("elle décrit l'ordre de grandeur attendu : environ 80 champs", () => {
    assert.ok(
        ONTOLOGIE.fields.length >= 70 && ONTOLOGIE.fields.length <= 110,
        `${ONTOLOGIE.fields.length} champs — hors de l'ordre de grandeur prévu`
    );
});

test("chaque section porte au moins trois champs", () => {
    for (const section of ONTOLOGIE.sections) {
        assert.ok(
            champsDeSection(ONTOLOGIE, section.id).length >= 3,
            `section « ${section.id} » trop maigre`
        );
    }
});

test("chaque type canonique a un catalogue de formats", () => {
    for (const type of TYPES_CANONIQUES) {
        assert.ok(ONTOLOGIE.types[type].formats.length > 0, `type « ${type} » sans format`);
    }
});

test("les champs dérivés citent leurs sources dans leur formule", () => {
    const derives = champsDerives(ONTOLOGIE);

    assert.ok(derives.length > 0, "aucun champ dérivé — l'âge se calcule pourtant");

    for (const champ of derives) {
        const derive = champ.derived;

        assert.ok(derive !== undefined);

        for (const source of derive.from) {
            assert.ok(
                derive.formula.includes(source),
                `${champ.key} : la formule ne dit pas ce qu'elle fait de ${source}`
            );
        }
    }
});

test("aucun champ dérivé ne serait demandé au courtier deux fois", () => {
    // Un dérivé qui serait aussi la source d'un autre dérivé est permis ;
    // un dérivé sans aucune source ne l'est pas — le validateur le refuse.
    for (const champ of champsDerives(ONTOLOGIE)) {
        assert.ok((champ.derived?.from.length ?? 0) > 0, `${champ.key} : dérivé de rien`);
    }
});

// ---------------------------------------------------------------------------
//  Consultation
// ---------------------------------------------------------------------------

test("formatsDe rend le défaut du type quand le champ se tait", () => {
    const nom = champ(ONTOLOGIE, "client.lastName");
    const defaut = ONTOLOGIE.types.texte.defaut ?? [];

    assert.deepEqual(formatsDe(ONTOLOGIE, nom), defaut);
    assert.ok(
        !formatsDe(ONTOLOGIE, nom).includes("XXX XXX XXX XXXXX"),
        "un nom de famille ne s'écrit pas comme un SIRET"
    );
});

test("formatsDe rend les formats du champ quand il en déclare", () => {
    const siret = champ(ONTOLOGIE, "business.siret");

    assert.deepEqual(formatsDe(ONTOLOGIE, siret), ["XXX XXX XXX XXXXX", "XXXXXXXXXXXXXX"]);
});

test("le dictionnaire mène du libellé comme du synonyme à la même clé", () => {
    const index = indexDesLibelles(ONTOLOGIE);

    assert.equal(index.get("date de naissance"), "client.birthDate");
    assert.equal(index.get("date de naissance du conjoint"), "spouse.birthDate");

    // « Né(e) le » et « Né le » ne donnent pas la même clé normalisée —
    // la parenthèse laisse un « e » isolé. Les deux écritures existent sur
    // les extranets, l'ontologie porte donc les deux.
    assert.equal(index.get("ne e le"), "client.birthDate");
    assert.equal(index.get("ne le"), "client.birthDate");
});

test("champParCle retrouve un champ par sa clé", () => {
    assert.equal(champParCle(ONTOLOGIE).get("vehicle.registration")?.type, "immatriculation");
    assert.equal(champParCle(ONTOLOGIE).get("client.inexistant"), undefined);
});

// ---------------------------------------------------------------------------
//  Le validateur — ce qu'il refuse
//
//  Chaque cas part de l'ontologie livrée et casse une seule chose : c'est
//  exactement ce qui arriverait le jour où quelqu'un l'édite à la main.
// ---------------------------------------------------------------------------

test("une clé déclarée deux fois est refusée", () => {
    refuse(variante((o) => {
        o.fields[1]!.key = o.fields[0]!.key;
    }), "deux fois");
});

test("une clé hors camelCase pointée est refusée", () => {
    refuse(variante((o) => {
        o.fields[0]!.key = "client_birth_date";
    }), "camelCase pointée");
});

test("un champ rangé dans une section qui ne déclare pas son préfixe est refusé", () => {
    refuse(variante((o) => {
        champMutable(o, "client.birthDate").section = "vehicle";
    }), "n'appartient pas à la section");
});

test("une section inconnue est refusée", () => {
    refuse(variante((o) => {
        champMutable(o, "client.birthDate").section = "inconnue";
    }), "section inconnue");
});

test("une section déclarée mais vide est refusée", () => {
    refuse(variante((o) => {
        o.sections.push({ id: "fantome", label: "Fantôme", prefixes: ["ghost."] });
    }), "aucun champ ne s'y range");
});

test("un type inconnu est refusé", () => {
    refuse(variante((o) => {
        champMutable(o, "client.lastName").type = "chaine" as ChampCanonique["type"];
    }), "type inconnu");
});

test("deux champs qui revendiquent le même libellé sont refusés", () => {
    refuse(variante((o) => {
        // La collision est ce qui rendrait le dictionnaire indécidable :
        // « NÉ(E) LE : » mènerait à deux champs différents.
        champMutable(o, "spouse.birthDate").synonyms.push("Né(e) le");
    }), "déjà revendiqué");
});

test("un libellé répété à l'intérieur d'un champ est refusé", () => {
    refuse(variante((o) => {
        champMutable(o, "client.birthDate").synonyms.push("DATE DE NAISSANCE :");
    }), "libellé répété");
});

test("un champ sans synonyme est refusé", () => {
    refuse(variante((o) => {
        champMutable(o, "client.lastName").synonyms = [];
    }), "au moins un synonyme");
});

test("un champ enum sans valeurs est refusé", () => {
    refuse(variante((o) => {
        delete champMutable(o, "client.civility").values;
    }), "déclare ses valeurs canoniques");
});

test("des valeurs sur un champ qui n'est pas un enum sont refusées", () => {
    refuse(variante((o) => {
        champMutable(o, "client.lastName").values = [
            { value: "DUPONT", label: "Dupont", synonyms: [] }
        ];
    }), "seul un champ de type « enum »");
});

test("une valeur d'enum qui n'est pas en MAJUSCULES est refusée", () => {
    refuse(variante((o) => {
        champMutable(o, "client.maritalStatus").values![0]!.value = "celibataire";
    }), "MAJUSCULES");
});

test("deux options d'un même champ au même libellé sont refusées", () => {
    refuse(variante((o) => {
        const valeurs = champMutable(o, "client.maritalStatus").values!;

        valeurs[1]!.synonyms.push(valeurs[0]!.label);
    }), "même libellé");
});

test("un exemple incohérent avec le type est refusé", () => {
    refuse(variante((o) => {
        champMutable(o, "client.birthDate").example = "7 mars 1985";
    }), "ne correspond pas au type");
});

test("un exemple d'enum hors des valeurs déclarées est refusé", () => {
    refuse(variante((o) => {
        champMutable(o, "client.maritalStatus").example = "FIANCE";
    }), "ne fait pas partie des valeurs");
});

test("un format hors du catalogue de son type est refusé", () => {
    refuse(variante((o) => {
        champMutable(o, "client.birthDate").formats = ["JJ/MM/AAAA", "le 7 mars"];
    }), "hors du catalogue");
});

test("une unité inconnue est refusée", () => {
    refuse(variante((o) => {
        champMutable(o, "vehicle.annualMileage").unit = "MILES" as Unite;
    }), "unité inconnue");
});

test("une unité sur un champ texte est refusée", () => {
    refuse(variante((o) => {
        champMutable(o, "client.lastName").unit = "EUR";
    }), "ne porte pas d'unité");
});

test("un champ dérivé d'une clé inconnue est refusé", () => {
    refuse(variante((o) => {
        champMutable(o, "client.age").derived!.from = ["client.dateDeNaissance"];
    }), "source inconnue");
});

test("un champ dérivé sans formule en français est refusé", () => {
    refuse(variante((o) => {
        champMutable(o, "client.age").derived!.formula = "";
    }), "énonce sa formule");
});

test("un cycle entre champs dérivés est refusé", () => {
    refuse(variante((o) => {
        // L'âge se calcule depuis la date de naissance… qui se calculerait
        // depuis l'âge. Aucun des deux ne serait calculable.
        champMutable(o, "client.birthDate").derived = {
            from: ["client.age"],
            computation: "naissanceDepuisAge",
            formula: "date du jour moins client.age années"
        };
    }), "cycle");
});

test("une clé inattendue dans un champ est refusée", () => {
    refuse(variante((o) => {
        (champMutable(o, "client.lastName") as Record<string, unknown>)["synonymes"] = ["Nom"];
    }), "clé inattendue");
});

test("un catalogue de formats par défaut hors catalogue est refusé", () => {
    refuse(variante((o) => {
        o.types.texte.defaut = ["Cursive"];
    }), "hors catalogue");
});

test("une version mal formée est refusée", () => {
    refuse(variante((o) => {
        o.version = "1";
    }), "MAJEURE.MINEURE.CORRECTIF");
});

test("ce qui n'est pas un objet est refusé sans exploser", () => {
    assert.equal(valider(null).length, 1);
    assert.equal(valider("ontologie").length, 1);
    assert.equal(valider([]).length, 1);
});

test("ontologieValidee échoue bruyamment plutôt que de rendre une ontologie fausse", () => {
    assert.doesNotThrow(() => ontologieValidee(LIVREE));

    assert.throws(
        () => ontologieValidee(variante((o) => {
            o.fields[1]!.key = o.fields[0]!.key;
        })),
        /Ontologie incohérente/
    );
});

// ---------------------------------------------------------------------------
//  Outillage des tests
// ---------------------------------------------------------------------------

type ProfondementMutable<T> =
    T extends readonly (infer Element)[] ? ProfondementMutable<Element>[]
    : T extends object ? { -readonly [Cle in keyof T]: ProfondementMutable<T[Cle]> }
    : T;

type OntologieMutable = ProfondementMutable<Ontologie>;

/** Une copie de l'ontologie livrée, cassée sur un seul point. */
function variante(casser: (ontologie: OntologieMutable) => void): unknown {
    const copie = structuredClone(ONTOLOGIE) as OntologieMutable;

    casser(copie);

    return copie;
}

function champ(ontologie: Ontologie, cle: string): ChampCanonique {
    const trouve = ontologie.fields.find((candidat) => candidat.key === cle);

    assert.ok(trouve !== undefined, `champ « ${cle} » absent de l'ontologie`);

    return trouve;
}

function champMutable(
    ontologie: OntologieMutable,
    cle: string
): ProfondementMutable<ChampCanonique> {
    const trouve = ontologie.fields.find((candidat) => candidat.key === cle);

    assert.ok(trouve !== undefined, `champ « ${cle} » absent de l'ontologie`);

    return trouve;
}

function refuse(donnees: unknown, extrait: string): void {
    const anomalies = valider(donnees);

    assert.ok(
        anomalies.some((anomalie) => `${anomalie.ou} ${anomalie.probleme}`.includes(extrait)),
        `attendu une anomalie mentionnant « ${extrait} », obtenu :\n` +
        (anomalies.length === 0
            ? "  aucune anomalie"
            : anomalies.map((a) => `  ${a.ou} : ${a.probleme}`).join("\n"))
    );
}
