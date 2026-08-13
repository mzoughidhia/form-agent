// ---------------------------------------------------------------------------
//  Normalisation de texte.
//
//  Deux niveaux, pour deux usages différents :
//    - normaliser()        nettoie un libellé pour l'afficher et le stocker
//    - normaliserLibelle() écrase les variations pour comparer deux libellés
// ---------------------------------------------------------------------------

/** Au-delà, ce n'est plus un libellé mais un paragraphe. */
export const LONGUEUR_LIBELLE = 120;

/** Espaces réduits, texte coupé. Conserve la casse et les accents. */
export function normaliser(texte: string | null | undefined): string {
    return (texte ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, LONGUEUR_LIBELLE);
}

/**
 * Clé de comparaison d'un libellé. « Date de naissance * » et
 * « DATE DE NAISSANCE : » doivent donner la même clé, sinon le dictionnaire
 * partagé entre compagnies ne reconnaîtrait jamais rien.
 *
 * NFD sépare « é » en « e » + accent combinant ; \p{Mn} retire ensuite ces
 * marques. Écrire la plage en clair mettrait des caractères invisibles dans
 * le fichier source.
 */
export function normaliserLibelle(texte: string | null | undefined): string {
    return normaliser(texte)
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Mn}/gu, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}
