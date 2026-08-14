// ---------------------------------------------------------------------------
//  La fiche de saisie affichée en tête de chaque terrain.
//
//  Sans elle, impossible de s'entraîner sérieusement : le rapprochement par
//  valeur ne fonctionne QUE si ce qu'on tape correspond vraiment à la fiche
//  du client sélectionné. Taper « azerty » n'apprend rien.
// ---------------------------------------------------------------------------

const Fiche = (function () {
    "use strict";

    function element(balise, classe, texte) {
        const noeud = document.createElement(balise);

        if (classe) {
            noeud.className = classe;
        }

        if (texte !== undefined) {
            noeud.textContent = texte;
        }

        return noeud;
    }

    function ligne(champ, valeur, note) {
        const tr = document.createElement("tr");
        const vide = /laisser vide|ne pas/i.test(valeur);

        tr.append(
            element("td", "quoi", champ),
            element("td", vide ? "valeur vide" : "valeur", valeur),
            element("td", "pourquoi", note || "")
        );

        return tr;
    }

    function afficher(config) {
        const bloc = element("details", "fiche");
        bloc.open = true;

        const titre = element("summary");
        titre.append(
            element("span", "titre", config.titre || "Marche à suivre"),
            element("span", "client", `client ${config.client}`)
        );

        if (config.lien) {
            const ouvrir = document.createElement("a");
            ouvrir.href = config.lien;
            ouvrir.className = "ouvrir";
            ouvrir.textContent = "ouvrir le formulaire →";
            titre.append(ouvrir);
        }

        bloc.append(titre);

        const etapes = element("ol", "demarche");
        config.demarche.forEach((texte) => {
            const li = document.createElement("li");
            li.innerHTML = texte;
            etapes.append(li);
        });
        bloc.append(etapes);

        if (config.saisie && config.saisie.length > 0) {
            const table = element("table", "saisie");
            const entete = document.createElement("tr");

            entete.append(
                element("th", null, "Champ"),
                element("th", null, "À saisir"),
                element("th", null, "")
            );
            table.append(entete);

            config.saisie.forEach(([champ, valeur, note]) =>
                table.append(ligne(champ, valeur, note))
            );

            bloc.append(table);
        }

        // Page de référence : toutes les fiches s'empilent dans le conteneur.
        // Page de formulaire : la fiche se glisse sous le mode d'emploi.
        const conteneur = document.getElementById("fiches");
        const ancre = document.querySelector(".mode");

        if (conteneur) {
            conteneur.append(bloc);
        } else if (ancre) {
            ancre.after(bloc);
        } else {
            document.body.prepend(bloc);
        }
    }

    return { afficher };
}());
