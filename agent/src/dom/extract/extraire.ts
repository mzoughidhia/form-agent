// ---------------------------------------------------------------------------
//  Extraction de la structure d'un formulaire.
//
//  LISTE BLANCHE : on énumère ce qu'on lit (règle S4). Une liste noire
//  finirait par laisser passer un attribut contenant une donnée personnelle.
//
//  Aucune valeur saisie n'est jamais relevée (règle D1).
// ---------------------------------------------------------------------------

import type { FicheChamp, OptionChamp } from "../../core/modele/champ.ts";
import { normaliser } from "../../core/texte/normaliser.ts";
import { libelleDe, sectionDe, groupeRadio, SELECTEUR_CHAMPS } from "./libelle.ts";

type ChampSaisissable = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const TYPES_IGNORES = ["hidden", "submit", "button", "reset", "image", "file"];

/** Un champ de mot de passe n'est jamais décrit, pas même sa structure. */
export function estObservable(champ: ChampSaisissable): boolean {
    const type = (champ as HTMLInputElement).type?.toLowerCase() ?? "text";

    return !TYPES_IGNORES.includes(type) && type !== "password";
}

/**
 * Un groupe de boutons radio décrit UN choix, pas cinq champs. Sans ce
 * regroupement, l'empreinte et le nombre de champs seraient gonflés.
 */
export function sansDoublonsRadio(champs: readonly ChampSaisissable[]): ChampSaisissable[] {
    const groupesVus = new Set<string>();

    return champs.filter((champ) => {
        const radio = champ instanceof HTMLInputElement && champ.type === "radio";

        if (!radio || champ.name === "") {
            return true;
        }

        if (groupesVus.has(champ.name)) {
            return false;
        }

        groupesVus.add(champ.name);
        return true;
    });
}

function optionsDe(champ: ChampSaisissable): readonly OptionChamp[] | undefined {
    if (champ instanceof HTMLSelectElement) {
        // Le texte est pour l'humain, la valeur est ce qui part au serveur.
        // C'est la valeur qui compte pour le remplissage.
        return Array.from(champ.options)
            .slice(0, 40)
            .map((option) => ({
                texte: normaliser(option.textContent),
                valeur: option.value
            }));
    }

    if (champ instanceof HTMLInputElement && champ.type === "radio") {
        return groupeRadio(champ)
            .slice(0, 40)
            .map((bouton) => ({
                texte: normaliser(
                    bouton.closest("label")?.textContent ?? bouton.getAttribute("aria-label")
                ),
                valeur: bouton.value
            }));
    }

    return undefined;
}

export function ficheChamp(champ: ChampSaisissable, position: number): FicheChamp {
    const longueurMax = champ instanceof HTMLSelectElement ? -1 : champ.maxLength;
    const options = optionsDe(champ);

    const fiche: FicheChamp = {
        position,
        balise: champ.tagName.toLowerCase(),
        type: champ instanceof HTMLSelectElement ? "select" : (champ.type || "text"),
        nom: champ.name,
        identifiant: champ.id,
        libelle: libelleDe(champ),
        section: sectionDe(champ),
        indice: normaliser(champ.getAttribute("placeholder")),
        requis: champ.required,
        longueurMax: longueurMax > 0 ? longueurMax : null,
        motif: champ.getAttribute("pattern") ?? "",
        autocompletion: champ.getAttribute("autocomplete") ?? "",
        ...(options === undefined ? {} : { options })
    };

    return fiche;
}

/**
 * Les racines de formulaire de la page.
 *
 * Beaucoup d'extranets modernes n'utilisent plus de balise <form> : les
 * champs flottent dans la page et un bouton envoie en AJAX. Le cas H du
 * banc d'essai.
 */
export function racinesDeFormulaire(document: Document): Element[] {
    const avecBalise = Array.from(document.forms).filter(
        (formulaire) => formulaire.querySelector(SELECTEUR_CHAMPS) !== null
    );

    if (avecBalise.length > 0) {
        return avecBalise;
    }

    return document.querySelector(SELECTEUR_CHAMPS) === null ? [] : [document.body];
}

/** Les fiches d'une racine, dédoublonnées et filtrées. */
export function fichesDe(racine: Element): FicheChamp[] {
    const bruts = Array.from(
        racine.querySelectorAll<ChampSaisissable>(SELECTEUR_CHAMPS)
    ).filter(estObservable);

    return sansDoublonsRadio(bruts).map((champ, position) => ficheChamp(champ, position));
}
