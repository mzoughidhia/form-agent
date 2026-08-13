// ---------------------------------------------------------------------------
//  Essai visuel des modules du sprint 0.
//
//  Ce n'est pas l'extension : c'est une page qui charge le VRAI code de
//  src/core et src/dom et montre ce qu'il produit sur un formulaire réel.
//  Elle sert à voir travailler ce qui existe, avant que l'extension
//  n'existe (sprint 1).
// ---------------------------------------------------------------------------

import { fichesDe, racinesDeFormulaire } from "../src/dom/extract/extraire.ts";
import { empreinteDe, cleChamp, memeFormulaire } from "../src/core/fingerprint/empreinte.ts";
import { normaliserLibelle } from "../src/core/texte/normaliser.ts";
import type { FicheChamp } from "../src/core/modele/champ.ts";

const $empreinte = document.getElementById("empreinte") as HTMLElement;
const $compteur = document.getElementById("compteur") as HTMLElement;
const $corps = document.getElementById("corps") as HTMLElement;
const $journal = document.getElementById("journal") as HTMLElement;

let empreintePrecedente = "";
let clesPrecedentes = new Set<string>();

function tracer(texte: string, ton: "info" | "ok" | "attention" = "info"): void {
    const ligne = document.createElement("div");
    ligne.className = `ligne ${ton}`;
    ligne.textContent = texte;
    $journal.prepend(ligne);
}

function cellule(contenu: string, classe = ""): HTMLTableCellElement {
    const td = document.createElement("td");
    td.textContent = contenu;

    if (classe !== "") {
        td.className = classe;
    }

    return td;
}

function afficher(fiches: readonly FicheChamp[]): void {
    $corps.replaceChildren();

    for (const fiche of fiches) {
        const tr = document.createElement("tr");

        tr.append(
            cellule(String(fiche.position), "num"),
            cellule(fiche.type, "mono"),
            cellule(fiche.libelle || "—"),
            cellule(normaliserLibelle(fiche.libelle) || "—", "mono cle"),
            cellule(fiche.identifiant || "—", "mono pale"),
            cellule(fiche.requis ? "oui" : "", "num"),
            cellule(fiche.options === undefined ? "" : String(fiche.options.length), "num")
        );

        $corps.append(tr);
    }
}

function relever(origine: string): void {
    const racines = racinesDeFormulaire(document);

    if (racines.length === 0) {
        tracer("Aucun formulaire trouvé.", "attention");
        return;
    }

    const fiches = fichesDe(racines[0]!);
    const empreinte = empreinteDe(fiches);
    const cles = new Set(fiches.map(cleChamp));

    afficher(fiches);
    $empreinte.textContent = empreinte;
    $compteur.textContent = String(fiches.length);

    if (empreintePrecedente === "") {
        tracer(`${origine} — premier relevé · empreinte ${empreinte}`, "info");
    } else if (empreinte === empreintePrecedente) {
        tracer(`${origine} — empreinte INCHANGÉE (${empreinte}) : même formulaire`, "ok");
    } else {
        const memeChose = memeFormulaire(clesPrecedentes, cles);

        tracer(
            `${origine} — empreinte ${empreintePrecedente} → ${empreinte} · ` +
            (memeChose
                ? "recouvrement élevé : même formulaire, des champs sont apparus"
                : "recouvrement faible : c'est une autre étape"),
            "attention"
        );
    }

    empreintePrecedente = empreinte;
    clesPrecedentes = cles;
}

// --- Les trois démonstrations -------------------------------------------

document.getElementById("relire")!.addEventListener("click", () => {
    relever("Relecture");
});

// Le cas D du banc d'essai : un portail qui recalcule ses identifiants.
document.getElementById("regenerer")!.addEventListener("click", () => {
    const graine = Math.random().toString(36).slice(2, 8);

    document.querySelectorAll<HTMLElement>("#devis input, #devis select").forEach((champ, i) => {
        const ancien = champ.id;
        champ.id = `ctl00_${graine}_${i}`;

        if (ancien !== "") {
            const etiquette = document.querySelector(`label[for="${ancien}"]`);
            etiquette?.setAttribute("for", champ.id);
        }
    });

    relever(`Identifiants regénérés (${graine})`);
});

// Un vrai champ conditionnel : la structure change.
document.getElementById("ajouter")!.addEventListener("click", () => {
    const bloc = document.getElementById("conditionnel")!;

    bloc.innerHTML = bloc.innerHTML === ""
        ? `<div class="champ"><label for="bailleur">Nom du bailleur</label>
             <input type="text" id="bailleur" name="bailleur"></div>`
        : "";

    relever(bloc.innerHTML === "" ? "Champ conditionnel retiré" : "Champ conditionnel apparu");
});

relever("Chargement");
