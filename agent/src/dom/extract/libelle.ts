// ---------------------------------------------------------------------------
//  Extraction du libellé d'un champ.
//
//  Porté de la sonde du sprint −1, où les quatre façons d'écrire un libellé
//  ont été validées sur le banc d'essai. Sur les extranets assureurs, un
//  champ sur trois n'a aucun <label> propre.
// ---------------------------------------------------------------------------

import { normaliser } from "../../core/texte/normaliser.ts";

export const SELECTEUR_CHAMPS = "input, select, textarea";

/** Les boutons d'un même groupe radio. */
export function groupeRadio(champ: Element): HTMLInputElement[] {
    if (!(champ instanceof HTMLInputElement) || champ.type !== "radio" || !champ.name) {
        return [];
    }

    const portee: ParentNode = champ.form ?? champ.ownerDocument;

    return Array.from(
        portee.querySelectorAll<HTMLInputElement>(
            `input[type="radio"][name="${CSS.escape(champ.name)}"]`
        )
    );
}

function ancetreCommun(elements: readonly Element[]): Element | null {
    let noeud = elements[0]?.parentElement ?? null;

    while (noeud !== null && !elements.every((element) => noeud!.contains(element))) {
        noeud = noeud.parentElement;
    }

    return noeud;
}

/**
 * Pour un groupe radio, le <label> englobant porte le texte de l'OPTION
 * (« Homme »), pas celui du champ (« Sexe »). L'intitulé du groupe est
 * presque toujours le premier bloc de texte du conteneur commun.
 */
export function libelleDeGroupe(champ: Element): string {
    const groupe = groupeRadio(champ);

    if (groupe.length < 2) {
        return "";
    }

    const ancetre = ancetreCommun(groupe);

    if (ancetre === null) {
        return "";
    }

    const interne = Array.from(ancetre.children).find(
        (enfant) =>
            enfant.tagName !== "INPUT" &&
            enfant.querySelector(SELECTEUR_CHAMPS) === null &&
            normaliser(enfant.textContent) !== ""
    );

    if (interne !== undefined) {
        return normaliser(interne.textContent);
    }

    const precedent = ancetre.previousElementSibling;

    if (precedent !== null && precedent.querySelector(SELECTEUR_CHAMPS) === null) {
        return normaliser(precedent.textContent);
    }

    return "";
}

/** Les quatre façons d'écrire un libellé, dans l'ordre de fiabilité. */
export function libelleDe(champ: Element): string {
    const duGroupe = libelleDeGroupe(champ);

    if (duGroupe !== "") {
        return duGroupe;
    }

    const document = champ.ownerDocument;

    if (champ.id !== "") {
        const associe = document.querySelector(`label[for="${CSS.escape(champ.id)}"]`);

        if (associe !== null) {
            return normaliser(associe.textContent);
        }
    }

    const englobant = champ.closest("label");

    if (englobant !== null) {
        return normaliser(englobant.textContent);
    }

    const aria = champ.getAttribute("aria-label");

    if (aria !== null && aria !== "") {
        return normaliser(aria);
    }

    const parAria = champ.getAttribute("aria-labelledby");

    if (parAria !== null && parAria !== "") {
        const cible = document.getElementById(parAria);

        if (cible !== null) {
            return normaliser(cible.textContent);
        }
    }

    // Dernier recours : le texte qui précède immédiatement le champ. C'est
    // souvent le seul indice sur les portails sans <label>.
    const precedent = champ.previousElementSibling;

    if (precedent !== null && precedent.querySelector(SELECTEUR_CHAMPS) === null) {
        return normaliser(precedent.textContent);
    }

    return "";
}

/** L'intitulé du <fieldset> englobant, s'il y en a un. */
export function sectionDe(champ: Element): string {
    const groupe = champ.closest("fieldset");
    const legende = groupe?.querySelector("legend") ?? null;

    return legende === null ? "" : normaliser(legende.textContent);
}
