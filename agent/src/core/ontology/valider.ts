// ---------------------------------------------------------------------------
//  Validateur de cohérence de l'ontologie.
//
//  Il reçoit du JSON déjà analysé — donc du `unknown` — et rend la liste des
//  incohérences. Pas d'exception, pas de log : une liste, que l'appelant
//  affiche ou fait échouer.
//
//  Ce qu'il protège vraiment, c'est le dictionnaire de libellés : si deux
//  champs revendiquaient « date de naissance », le rapprochement cesserait
//  d'être déterministe et l'agent devinerait. On refuse plutôt que deviner
//  (règle S5).
// ---------------------------------------------------------------------------

import { normaliserLibelle } from "../texte/normaliser.ts";
import {
    TYPES_CANONIQUES,
    TYPES_AVEC_UNITE,
    UNITES,
    type Ontologie,
    type TypeCanonique
} from "./ontologie.ts";

export interface Anomalie {
    /** Où : une clé de champ, ou un chemin dans le document. */
    readonly ou: string;
    readonly probleme: string;
}

type Signaler = (ou: string, probleme: string) => void;

const MOTIF_VERSION = /^\d+\.\d+\.\d+$/;
const MOTIF_CLE = /^[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)+$/;
const MOTIF_PREFIXE = /^[a-z][a-zA-Z0-9]*\.$/;
const MOTIF_VALEUR_ENUM = /^[A-Z][A-Z0-9_]*$/;
const MOTIF_CALCUL = /^[a-z][a-zA-Z0-9]*$/;
const MOTIF_IDENTIFIANT = /^[a-z][a-zA-Z0-9]*$/;

/**
 * Ce qu'un exemple doit ressembler, type par type. L'exemple est écrit dans
 * la forme canonique française — celle que le courtier lit — pas dans toutes
 * les variantes acceptées.
 */
const MOTIF_EXEMPLE: Readonly<Record<TypeCanonique, RegExp>> = {
    texte: /\S/,
    date: /^\d{2}\/\d{2}\/\d{4}$/,
    entier: /^-?\d+$/,
    decimal: /^-?\d+(?:,\d+)?$/,
    booleen: /^(?:Oui|Non)$/,
    enum: MOTIF_VALEUR_ENUM,
    telephone: /^0\d{9}$/,
    email: /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/,
    codePostal: /^(?:\d{5}|2[AB]\d{3})$/,
    iban: /^FR\d{2}[0-9A-Z]{23}$/,
    immatriculation: /^[A-Z]{2}-\d{3}-[A-Z]{2}$/
};

const CLES_CHAMP = new Set([
    "key", "section", "label", "type", "synonyms", "example",
    "values", "derived", "unit", "formats", "note"
]);
const CLES_SECTION = new Set(["id", "label", "prefixes"]);
const CLES_VALEUR = new Set(["value", "label", "synonyms"]);
const CLES_DERIVE = new Set(["from", "computation", "formula"]);
const CLES_RACINE = new Set(["version", "types", "sections", "fields"]);

// --- petites vérifications de forme ----------------------------------------

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
    return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
}

function estTexteNonVide(valeur: unknown): valeur is string {
    return typeof valeur === "string" && valeur.trim() !== "";
}

function estListeDeTextes(valeur: unknown): valeur is readonly string[] {
    return Array.isArray(valeur) && valeur.length > 0 && valeur.every(estTexteNonVide);
}

function premierDoublon(valeurs: readonly string[]): string | null {
    const vus = new Set<string>();

    for (const valeur of valeurs) {
        if (vus.has(valeur)) {
            return valeur;
        }
        vus.add(valeur);
    }

    return null;
}

function clesInattendues(objet: Record<string, unknown>, connues: ReadonlySet<string>): string[] {
    return Object.keys(objet).filter((cle) => !connues.has(cle));
}

// --- catalogues de formats --------------------------------------------------

interface Catalogue {
    readonly formats: ReadonlySet<string>;
    readonly defaut: readonly string[];
}

type Catalogues = ReadonlyMap<string, Catalogue>;

function validerTypes(brut: unknown, signaler: Signaler): Catalogues {
    const catalogues = new Map<string, Catalogue>();

    if (!estObjet(brut)) {
        signaler("types", "bloc « types » absent ou mal formé");
        return catalogues;
    }

    for (const cle of clesInattendues(brut, new Set<string>(TYPES_CANONIQUES))) {
        signaler(`types.${cle}`, `type inconnu — les types sont : ${TYPES_CANONIQUES.join(", ")}`);
    }

    for (const type of TYPES_CANONIQUES) {
        const entree = brut[type];

        if (!estObjet(entree)) {
            signaler(`types.${type}`, "catalogue de formats absent");
            continue;
        }

        const formats = entree["formats"];

        if (!estListeDeTextes(formats)) {
            signaler(`types.${type}.formats`, "liste de formats absente ou vide");
            continue;
        }

        const doublon = premierDoublon(formats);

        if (doublon !== null) {
            signaler(`types.${type}.formats`, `format déclaré deux fois : « ${doublon} »`);
        }

        const connus = new Set(formats);
        let defaut: readonly string[] = formats;
        const brutDefaut = entree["defaut"];

        if (brutDefaut !== undefined) {
            if (!estListeDeTextes(brutDefaut)) {
                signaler(`types.${type}.defaut`, "liste de formats par défaut vide ou mal formée");
            } else {
                const intrus = brutDefaut.filter((format) => !connus.has(format));

                if (intrus.length > 0) {
                    signaler(`types.${type}.defaut`, `hors catalogue : ${intrus.join(", ")}`);
                }

                defaut = brutDefaut;
            }
        }

        catalogues.set(type, { formats: connus, defaut });
    }

    return catalogues;
}

// --- sections ---------------------------------------------------------------

/** Identifiant de section → préfixes de clé qu'elle possède. */
type Sections = ReadonlyMap<string, readonly string[]>;

function validerSections(brut: unknown, signaler: Signaler): Sections {
    const sections = new Map<string, readonly string[]>();

    if (!Array.isArray(brut) || brut.length === 0) {
        signaler("sections", "liste des sections absente ou vide");
        return sections;
    }

    brut.forEach((section: unknown, rang: number) => {
        const ou = estObjet(section) && estTexteNonVide(section["id"])
            ? `sections.${section["id"]}`
            : `sections[${rang}]`;

        if (!estObjet(section)) {
            signaler(ou, "section mal formée");
            return;
        }

        for (const cle of clesInattendues(section, CLES_SECTION)) {
            signaler(ou, `clé inattendue « ${cle} »`);
        }

        const id = section["id"];

        if (!estTexteNonVide(id) || !MOTIF_IDENTIFIANT.test(id)) {
            signaler(ou, "identifiant de section absent ou hors camelCase");
            return;
        }

        if (sections.has(id)) {
            signaler(ou, "section déclarée deux fois");
            return;
        }

        if (!estTexteNonVide(section["label"])) {
            signaler(ou, "libellé de section absent");
        }

        const prefixes = section["prefixes"];

        if (!estListeDeTextes(prefixes)) {
            signaler(ou, "liste de préfixes absente ou vide");
            return;
        }

        for (const prefixe of prefixes) {
            if (!MOTIF_PREFIXE.test(prefixe)) {
                signaler(ou, `préfixe « ${prefixe} » — attendu « quelquechose. »`);
            }
        }

        sections.set(id, prefixes);
    });

    return sections;
}

// --- champs -----------------------------------------------------------------

interface ContexteChamps {
    readonly catalogues: Catalogues;
    readonly sections: Sections;
    readonly signaler: Signaler;
}

function validerChamps(brut: unknown, contexte: ContexteChamps): void {
    const { catalogues, sections, signaler } = contexte;

    if (!Array.isArray(brut) || brut.length === 0) {
        signaler("fields", "liste des champs absente ou vide");
        return;
    }

    const cles = new Set<string>();
    const libelles = new Map<string, string>();
    const sectionsUtilisees = new Set<string>();
    const prefixesUtilises = new Set<string>();
    const derives = new Map<string, readonly string[]>();

    brut.forEach((champ: unknown, rang: number) => {
        const cle = estObjet(champ) ? champ["key"] : undefined;
        const ou = estTexteNonVide(cle) ? cle : `fields[${rang}]`;

        if (!estObjet(champ)) {
            signaler(ou, "champ mal formé");
            return;
        }

        for (const inattendue of clesInattendues(champ, CLES_CHAMP)) {
            signaler(ou, `clé inattendue « ${inattendue} »`);
        }

        // --- clé ---
        if (!estTexteNonVide(cle) || !MOTIF_CLE.test(cle)) {
            signaler(ou, "clé absente ou hors camelCase pointée (attendu « client.birthDate »)");
            return;
        }

        if (cles.has(cle)) {
            signaler(ou, "clé déclarée deux fois");
            return;
        }

        cles.add(cle);

        // --- section et préfixe ---
        const section = champ["section"];
        const prefixe = `${cle.slice(0, cle.indexOf("."))}.`;

        if (!estTexteNonVide(section)) {
            signaler(ou, "section absente");
        } else if (!sections.has(section)) {
            signaler(ou, `section inconnue « ${section} »`);
        } else {
            const prefixesDeLaSection = sections.get(section) ?? [];

            if (!prefixesDeLaSection.includes(prefixe)) {
                signaler(
                    ou,
                    `le préfixe « ${prefixe} » n'appartient pas à la section « ${section} » ` +
                    `(elle déclare : ${prefixesDeLaSection.join(", ")})`
                );
            } else {
                prefixesUtilises.add(`${section}|${prefixe}`);
            }

            sectionsUtilisees.add(section);
        }

        // --- type ---
        const type = champ["type"];
        const typeCanonique: TypeCanonique | null =
            estTexteNonVide(type) && (TYPES_CANONIQUES as readonly string[]).includes(type)
                ? (type as TypeCanonique)
                : null;

        if (typeCanonique === null) {
            signaler(ou, `type inconnu — les types sont : ${TYPES_CANONIQUES.join(", ")}`);
        }

        // --- libellé et synonymes ---
        const libelle = champ["label"];
        const synonymes = champ["synonyms"];

        if (!estTexteNonVide(libelle)) {
            signaler(ou, "libellé absent");
        }

        if (!estListeDeTextes(synonymes)) {
            signaler(ou, "au moins un synonyme est attendu");
        }

        const candidats = [
            ...(estTexteNonVide(libelle) ? [libelle] : []),
            ...(estListeDeTextes(synonymes) ? synonymes : [])
        ];
        const dejaVus = new Set<string>();

        for (const candidat of candidats) {
            const normalise = normaliserLibelle(candidat);

            if (normalise === "") {
                signaler(ou, `« ${candidat} » ne laisse rien une fois normalisé`);
                continue;
            }

            if (dejaVus.has(normalise)) {
                signaler(ou, `libellé répété dans le champ : « ${candidat} »`);
                continue;
            }

            dejaVus.add(normalise);

            const proprietaire = libelles.get(normalise);

            if (proprietaire !== undefined && proprietaire !== cle) {
                signaler(
                    ou,
                    `« ${candidat} » est déjà revendiqué par ${proprietaire} — ` +
                    "le dictionnaire de libellés ne saurait pas trancher"
                );
                continue;
            }

            libelles.set(normalise, cle);
        }

        // --- valeurs d'énumération ---
        const valeurs = champ["values"];

        if (typeCanonique === "enum") {
            validerValeursEnum(valeurs, ou, signaler);
        } else if (valeurs !== undefined) {
            signaler(ou, "seul un champ de type « enum » porte des valeurs");
        }

        // --- exemple ---
        const exemple = champ["example"];

        if (!estTexteNonVide(exemple)) {
            signaler(ou, "exemple absent");
        } else if (typeCanonique !== null) {
            const motif = MOTIF_EXEMPLE[typeCanonique];

            if (!motif.test(exemple)) {
                signaler(ou, `l'exemple « ${exemple} » ne correspond pas au type « ${typeCanonique} »`);
            } else if (typeCanonique === "enum" && Array.isArray(valeurs)) {
                const declarees = valeurs
                    .filter(estObjet)
                    .map((valeur) => valeur["value"]);

                if (!declarees.includes(exemple)) {
                    signaler(ou, `l'exemple « ${exemple} » ne fait pas partie des valeurs déclarées`);
                }
            }
        }

        // --- unité ---
        const unite = champ["unit"];

        if (unite !== undefined) {
            if (!estTexteNonVide(unite) || !(UNITES as readonly string[]).includes(unite)) {
                signaler(ou, `unité inconnue — les unités sont : ${UNITES.join(", ")}`);
            } else if (typeCanonique !== null && !TYPES_AVEC_UNITE.includes(typeCanonique)) {
                signaler(ou, `un champ de type « ${typeCanonique} » ne porte pas d'unité`);
            }
        }

        // --- formats ---
        const formats = champ["formats"];

        if (formats !== undefined) {
            if (!estListeDeTextes(formats)) {
                signaler(ou, "liste de formats vide ou mal formée");
            } else if (typeCanonique !== null) {
                const catalogue = catalogues.get(typeCanonique);
                const doublon = premierDoublon(formats);

                if (doublon !== null) {
                    signaler(ou, `format déclaré deux fois : « ${doublon} »`);
                }

                if (catalogue !== undefined) {
                    const intrus = formats.filter((format) => !catalogue.formats.has(format));

                    if (intrus.length > 0) {
                        signaler(
                            ou,
                            `format hors du catalogue de « ${typeCanonique} » : ${intrus.join(", ")}`
                        );
                    }
                }
            }
        }

        // --- champ dérivé ---
        const derive = champ["derived"];

        if (derive !== undefined) {
            const sources = validerDerive(derive, ou, signaler);

            if (sources !== null) {
                derives.set(cle, sources);
            }
        }

        // --- note ---
        const note = champ["note"];

        if (note !== undefined && !estTexteNonVide(note)) {
            signaler(ou, "note vide — l'omettre plutôt");
        }
    });

    validerReferencesDerivees(derives, cles, signaler);

    for (const [id, prefixes] of sections) {
        if (!sectionsUtilisees.has(id)) {
            signaler(`sections.${id}`, "section déclarée mais aucun champ ne s'y range");
            continue;
        }

        for (const prefixe of prefixes) {
            if (!prefixesUtilises.has(`${id}|${prefixe}`)) {
                signaler(`sections.${id}`, `préfixe « ${prefixe} » déclaré mais jamais utilisé`);
            }
        }
    }
}

function validerValeursEnum(brut: unknown, ou: string, signaler: Signaler): void {
    if (!Array.isArray(brut) || brut.length === 0) {
        signaler(ou, "un champ « enum » déclare ses valeurs canoniques");
        return;
    }

    const valeursVues = new Set<string>();
    const libellesVus = new Set<string>();

    for (const valeur of brut) {
        if (!estObjet(valeur)) {
            signaler(ou, "valeur d'énumération mal formée");
            continue;
        }

        for (const cle of clesInattendues(valeur, CLES_VALEUR)) {
            signaler(ou, `clé inattendue dans une valeur : « ${cle} »`);
        }

        const canonique = valeur["value"];

        if (!estTexteNonVide(canonique) || !MOTIF_VALEUR_ENUM.test(canonique)) {
            signaler(ou, `valeur « ${String(canonique)} » — attendu des MAJUSCULES sans accent`);
        } else if (valeursVues.has(canonique)) {
            signaler(ou, `valeur déclarée deux fois : « ${canonique} »`);
        } else {
            valeursVues.add(canonique);
        }

        const libelle = valeur["label"];

        if (!estTexteNonVide(libelle)) {
            signaler(ou, `libellé absent pour la valeur « ${String(canonique)} »`);
        }

        const synonymes = valeur["synonyms"];

        if (!Array.isArray(synonymes) || !synonymes.every(estTexteNonVide)) {
            signaler(ou, `synonymes mal formés pour la valeur « ${String(canonique)} »`);
            continue;
        }

        // Les libellés d'options ne se disputent qu'à l'intérieur du champ :
        // « Autre » a le droit d'exister dans dix champs différents.
        for (const texte of [...(estTexteNonVide(libelle) ? [libelle] : []), ...synonymes]) {
            const normalise = normaliserLibelle(texte);

            if (normalise === "") {
                signaler(ou, `« ${texte} » ne laisse rien une fois normalisé`);
                continue;
            }

            if (libellesVus.has(normalise)) {
                signaler(ou, `deux valeurs répondent au même libellé : « ${texte} »`);
                continue;
            }

            libellesVus.add(normalise);
        }
    }
}

function validerDerive(brut: unknown, ou: string, signaler: Signaler): readonly string[] | null {
    if (!estObjet(brut)) {
        signaler(ou, "bloc « derived » mal formé");
        return null;
    }

    for (const cle of clesInattendues(brut, CLES_DERIVE)) {
        signaler(ou, `clé inattendue dans « derived » : « ${cle} »`);
    }

    const calcul = brut["computation"];

    if (!estTexteNonVide(calcul) || !MOTIF_CALCUL.test(calcul)) {
        signaler(ou, "identifiant de calcul absent ou hors camelCase");
    }

    if (!estTexteNonVide(brut["formula"])) {
        signaler(ou, "un champ dérivé énonce sa formule en français — c'est ce que relit le courtier");
    }

    const sources = brut["from"];

    if (!estListeDeTextes(sources)) {
        signaler(ou, "un champ dérivé cite au moins une source");
        return null;
    }

    return sources;
}

function validerReferencesDerivees(
    derives: ReadonlyMap<string, readonly string[]>,
    cles: ReadonlySet<string>,
    signaler: Signaler
): void {
    for (const [cle, sources] of derives) {
        for (const source of sources) {
            if (source === cle) {
                signaler(cle, "champ dérivé de lui-même");
            } else if (!cles.has(source)) {
                signaler(cle, `champ dérivé : source inconnue « ${source} »`);
            }
        }
    }

    for (const cle of derives.keys()) {
        if (meneA(cle, cle, derives, new Set())) {
            signaler(cle, "cycle entre champs dérivés — aucun ne pourrait être calculé");
        }
    }
}

function meneA(
    depart: string,
    courant: string,
    derives: ReadonlyMap<string, readonly string[]>,
    vus: Set<string>
): boolean {
    for (const source of derives.get(courant) ?? []) {
        if (source === depart) {
            return true;
        }

        if (!vus.has(source)) {
            vus.add(source);

            if (meneA(depart, source, derives, vus)) {
                return true;
            }
        }
    }

    return false;
}

// --- point d'entrée ---------------------------------------------------------

/** Rend la liste des incohérences. Une liste vide signifie « ontologie saine ». */
export function valider(donnees: unknown): readonly Anomalie[] {
    const anomalies: Anomalie[] = [];
    const signaler: Signaler = (ou, probleme) => {
        anomalies.push({ ou, probleme });
    };

    if (!estObjet(donnees)) {
        signaler("ontologie", "le document n'est pas un objet");
        return anomalies;
    }

    for (const cle of clesInattendues(donnees, CLES_RACINE)) {
        signaler("ontologie", `clé inattendue « ${cle} »`);
    }

    const version = donnees["version"];

    if (!estTexteNonVide(version) || !MOTIF_VERSION.test(version)) {
        signaler("version", "attendu « MAJEURE.MINEURE.CORRECTIF »");
    }

    const catalogues = validerTypes(donnees["types"], signaler);
    const sections = validerSections(donnees["sections"], signaler);

    validerChamps(donnees["fields"], { catalogues, sections, signaler });

    return anomalies;
}

/**
 * Le seul endroit où du JSON devient une `Ontologie`. Échoue bruyamment :
 * une ontologie incohérente ferait remplir de travers, et un devis faux se
 * découvre au sinistre (règle S5).
 */
export function ontologieValidee(donnees: unknown): Ontologie {
    const anomalies = valider(donnees);

    if (anomalies.length > 0) {
        const detail = anomalies
            .map((anomalie) => `  ${anomalie.ou} : ${anomalie.probleme}`)
            .join("\n");

        throw new Error(`Ontologie incohérente — ${anomalies.length} anomalie(s) :\n${detail}`);
    }

    return donnees as Ontologie;
}
