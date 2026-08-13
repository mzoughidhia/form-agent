// ---------------------------------------------------------------------------
//  Empreinte de formulaire.
//
//  Porté de la sonde du sprint −1 (ticket S0-4), où le calcul a été validé
//  sur le banc d'essai — notamment le cas D, un portail qui regénère ses
//  identifiants à chaque session.
//
//  L'empreinte est calculée SANS les identifiants ni les noms : s'ils
//  changent d'une visite à l'autre, le formulaire doit rester reconnu.
//  Leur stabilité se mesure ailleurs, c'est une autre question.
// ---------------------------------------------------------------------------

import type { FicheChamp } from "../modele/champ.ts";

/**
 * Condensé djb2. Ce n'est pas une empreinte cryptographique et n'a pas à
 * l'être : elle sert à reconnaître un formulaire, pas à résister à une
 * attaque.
 */
export function condenser(texte: string): string {
    let valeur = 5381;

    for (let i = 0; i < texte.length; i += 1) {
        valeur = ((valeur * 33) ^ texte.charCodeAt(i)) >>> 0;
    }

    return valeur.toString(16).padStart(8, "0");
}

/** Signature structurelle : type, libellé, obligatoire — dans l'ordre du document. */
export function empreinteDe(fiches: readonly FicheChamp[]): string {
    const structure = fiches
        .map((fiche) => `${fiche.type}|${fiche.libelle}|${fiche.requis ? 1 : 0}`)
        .join("\n");

    return condenser(structure);
}

/**
 * Clé d'un champ, indépendante de sa position. Sert à repérer l'apparition
 * d'un champ conditionnel entre deux relevés.
 */
export function cleChamp(fiche: FicheChamp): string {
    return `${fiche.type}|${fiche.libelle || fiche.nom || String(fiche.position)}`;
}

/** En deçà de ce recouvrement, ce n'est plus le même formulaire mais l'étape suivante. */
export const RECOUVREMENT_MEME_FORMULAIRE = 0.5;

/**
 * Deux relevés décrivent-ils le même formulaire ?
 *
 * Sans cette distinction, chaque changement d'étape compterait tous ses
 * champs comme des apparitions conditionnelles — le faux positif trouvé au
 * sprint −1 sur les formulaires à étapes.
 */
export function memeFormulaire(
    connues: ReadonlySet<string>,
    relevees: ReadonlySet<string>
): boolean {
    const plusPetit = Math.min(connues.size, relevees.size);

    if (plusPetit === 0) {
        return false;
    }

    let communs = 0;

    for (const cle of relevees) {
        if (connues.has(cle)) {
            communs += 1;
        }
    }

    return communs / plusPetit >= RECOUVREMENT_MEME_FORMULAIRE;
}
