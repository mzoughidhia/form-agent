// ---------------------------------------------------------------------------
//  Le champ relevé — structure d'un champ de formulaire.
//
//  Aucune valeur saisie n'y figure, jamais : cette structure décrit le
//  formulaire, pas le dossier client (règle D1).
// ---------------------------------------------------------------------------

export interface OptionChamp {
    /** Le texte affiché à l'utilisateur : « Marié(e) ». */
    readonly texte: string;
    /** La valeur réellement envoyée au serveur : « 2 ». C'est elle qui compte. */
    readonly valeur: string;
}

export interface FicheChamp {
    readonly position: number;
    readonly balise: string;
    readonly type: string;
    readonly nom: string;
    readonly identifiant: string;
    readonly libelle: string;
    readonly section: string;
    readonly indice: string;
    readonly requis: boolean;
    readonly longueurMax: number | null;
    readonly motif: string;
    readonly autocompletion: string;
    readonly options?: readonly OptionChamp[];
}
