// ---------------------------------------------------------------------------
//  Consultation de l'ontologie.
//
//  Trois questions qu'on lui pose sans arrêt — et qu'il vaut mieux ne pas
//  reposer différemment à trois endroits :
//
//    - « quel champ porte cette clé »        résolution d'une recette
//    - « comment ce champ peut s'écrire »    génération des variantes (S3-2)
//    - « quel champ porte ce libellé »       dictionnaire de libellés (S5-2)
// ---------------------------------------------------------------------------

import { normaliserLibelle } from "../texte/normaliser.ts";
import type { ChampCanonique, Ontologie } from "./ontologie.ts";

export function champParCle(ontologie: Ontologie): ReadonlyMap<string, ChampCanonique> {
    return new Map(ontologie.fields.map((champ) => [champ.key, champ]));
}

export function champsDeSection(
    ontologie: Ontologie,
    section: string
): readonly ChampCanonique[] {
    return ontologie.fields.filter((champ) => champ.section === section);
}

/**
 * Les écritures possibles d'un champ. Le champ décide s'il le dit ; sinon
 * c'est le défaut de son type — et le défaut n'est pas tout le catalogue :
 * un SIRET s'écrit « 812 345 678 00023 », un nom de famille non.
 */
export function formatsDe(ontologie: Ontologie, champ: ChampCanonique): readonly string[] {
    if (champ.formats !== undefined) {
        return champ.formats;
    }

    const catalogue = ontologie.types[champ.type];

    return catalogue.defaut ?? catalogue.formats;
}

/**
 * Libellé normalisé → clé canonique. C'est l'amorce du dictionnaire : ce
 * que l'ontologie sait avant d'avoir vu la moindre recette.
 *
 * Le validateur garantit qu'aucun libellé n'est revendiqué deux fois ;
 * cet index ne peut donc pas perdre d'entrée en chemin.
 */
export function indexDesLibelles(ontologie: Ontologie): ReadonlyMap<string, string> {
    const index = new Map<string, string>();

    for (const champ of ontologie.fields) {
        for (const texte of [champ.label, ...champ.synonyms]) {
            index.set(normaliserLibelle(texte), champ.key);
        }
    }

    return index;
}

/** Les champs qui se calculent — jamais demandés au courtier. */
export function champsDerives(ontologie: Ontologie): readonly ChampCanonique[] {
    return ontologie.fields.filter((champ) => champ.derived !== undefined);
}
