// ---------------------------------------------------------------------------
//  L'ontologie canonique — les types.
//
//  Le pivot de toute l'architecture : le rapprochement par valeur compare
//  contre elle, les recettes la référencent par clé, l'écran de validation
//  l'affiche. Le contenu vit dans agent/ontology.json, un fichier du dépôt
//  et non une collection Firestore (règle D5).
//
//  core/ ne lit aucun fichier : ces types décrivent une ontologie DÉJÀ
//  analysée, que data/ (ou un test) fournit. Voir valider.ts.
// ---------------------------------------------------------------------------

/** Les onze types canoniques. Une valeur de dossier est toujours l'un d'eux. */
export const TYPES_CANONIQUES = [
    "texte",
    "date",
    "entier",
    "decimal",
    "booleen",
    "enum",
    "telephone",
    "email",
    "codePostal",
    "iban",
    "immatriculation"
] as const;

export type TypeCanonique = (typeof TYPES_CANONIQUES)[number];

/** Unités de mesure. Elles qualifient un nombre, jamais un texte. */
export const UNITES = [
    "EUR",
    "POURCENT",
    "ANNEES",
    "MOIS",
    "KM",
    "M2",
    "CM",
    "KG",
    "CV",
    "PERSONNES"
] as const;

export type Unite = (typeof UNITES)[number];

/** Seuls les nombres portent une unité. « Nom » n'est pas en euros. */
export const TYPES_AVEC_UNITE: readonly TypeCanonique[] = ["entier", "decimal"];

/**
 * Une valeur d'un champ `enum`.
 *
 * `value` est la valeur canonique du dossier, en MAJUSCULES ; `label` et
 * `synonyms` sont les textes affichés par les extranets. C'est eux qu'on
 * rapproche du contenu d'un `<option>` — mais on écrit toujours la valeur
 * réelle du DOM, jamais le texte (règle S4-4).
 */
export interface ValeurEnum {
    readonly value: string;
    readonly label: string;
    readonly synonyms: readonly string[];
}

/**
 * Un champ dérivé n'est jamais saisi par le courtier : il se calcule.
 * `computation` est l'identifiant du calcul, implémenté en dur dans
 * core/transform ; `formula` dit la même chose en français, pour la revue
 * par un courtier.
 */
export interface ChampDerive {
    readonly from: readonly string[];
    readonly computation: string;
    readonly formula: string;
}

export interface ChampCanonique {
    /** Clé stable en camelCase pointée : `client.birthDate`. Elle ne change jamais. */
    readonly key: string;
    /** Identifiant de la section d'affichage. */
    readonly section: string;
    /** Libellé lisible, pour l'écran de validation. */
    readonly label: string;
    readonly type: TypeCanonique;
    /** Libellés rencontrés sur les extranets français — la matière du dictionnaire. */
    readonly synonyms: readonly string[];
    /** Une valeur plausible, jamais réelle. Sert aux tests et à l'affichage. */
    readonly example: string;
    /** Présent si et seulement si `type === "enum"`. */
    readonly values?: readonly ValeurEnum[];
    /** Présent si le champ se calcule au lieu d'être saisi. */
    readonly derived?: ChampDerive;
    readonly unit?: Unite;
    /** Restreint les formats du type. Absent = le défaut du type s'applique. */
    readonly formats?: readonly string[];
    /** Remarque à l'attention du courtier relecteur. */
    readonly note?: string;
}

export interface SectionCanonique {
    readonly id: string;
    readonly label: string;
    /** Les préfixes de clé que cette section possède : `client.`, `spouse.`… */
    readonly prefixes: readonly string[];
}

/**
 * Le catalogue d'écritures d'un type.
 *
 * `formats` énumère tout ce qu'un extranet peut écrire ; `defaut` ce qu'un
 * champ prend s'il ne dit rien. Les deux diffèrent pour `texte` : un SIRET
 * s'écrit « 812 345 678 00023 », un nom de famille non.
 */
export interface CatalogueType {
    readonly formats: readonly string[];
    readonly defaut?: readonly string[];
}

export interface Ontologie {
    readonly version: string;
    readonly types: Readonly<Record<TypeCanonique, CatalogueType>>;
    readonly sections: readonly SectionCanonique[];
    readonly fields: readonly ChampCanonique[];
}
