// ---------------------------------------------------------------------------
//  Harnais du banc d'essai.
//
//  Il place l'extension dans ses conditions réelles sans avoir à l'installer :
//
//    - un faux « chrome » : storage.local en mémoire, runtime.onMessage capté
//    - une saisie qui imite un humain : le setter NATIF du prototype, jamais
//      une affectation directe — sinon les cadres applicatifs ne verraient
//      rien, et le banc mentirait en faveur de l'extension
//    - un vidage silencieux : aucun événement, pour ne pas réenregistrer
//
//  Le scénario est toujours le même, c'est le cycle réel de l'extension :
//      saisir  →  attendre l'enregistrement  →  vider  →  remplir  →  comparer
// ---------------------------------------------------------------------------

(function () {
    "use strict";

    const ecouteurs = [];
    const stockage = {};

    window.chrome = {
        runtime: {
            // Présent dans un vrai content script ; disparaît quand
            // l'extension est rechargée. content.js s'en sert pour savoir
            // s'il est encore relié à quelque chose.
            id: "banc-essai",
            onMessage: {
                addListener: (fonction) => ecouteurs.push(fonction)
            },
            lastError: null
        },
        storage: {
            local: {
                get(cles, rappel) {
                    const demandees = Array.isArray(cles) ? cles : [cles];
                    const sortie = {};

                    demandees.forEach((cle) => {
                        if (stockage[cle] !== undefined) {
                            sortie[cle] = stockage[cle];
                        }
                    });

                    setTimeout(() => rappel(sortie), 0);
                },
                set(objet, rappel) {
                    Object.assign(stockage, objet);

                    if (rappel) {
                        setTimeout(rappel, 0);
                    }
                }
            }
        }
    };

    // Le setter du PROTOTYPE : c'est par là que passe une frappe réelle.
    function setterNatif(element) {
        const proto = element instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : element instanceof HTMLSelectElement
                ? HTMLSelectElement.prototype
                : HTMLInputElement.prototype;

        return Object.getOwnPropertyDescriptor(proto, "value").set;
    }

    function tous(selecteur, racine) {
        return Array.from((racine || document).querySelectorAll(selecteur));
    }

    function champs(racine) {
        return tous("input, select, textarea", racine);
    }

    // --- lecture d'une valeur, comme le ferait un relecteur humain ---------
    function lire(element) {
        if (!element) {
            return null;
        }

        if (element.type === "radio") {
            const groupe = tous(`input[type=radio][name="${CSS.escape(element.name)}"]`);
            const coche = groupe.find((bouton) => bouton.checked);

            if (!coche) {
                return "";
            }

            const etiquette = coche.closest("label") || document.querySelector(`label[for="${CSS.escape(coche.id)}"]`);

            return (etiquette ? etiquette.textContent : coche.value).replace(/\s+/g, " ").trim();
        }

        if (element.type === "checkbox") {
            return element.checked ? "oui" : "non";
        }

        if (element.tagName === "SELECT") {
            const option = element.selectedOptions[0];

            return option && option.value ? option.textContent.replace(/\s+/g, " ").trim() : "";
        }

        return element.value;
    }

    const Banc = {
        stockage,

        attendre(ms) {
            return new Promise((suite) => setTimeout(suite, ms));
        },

        // Une frappe : setter natif, puis les deux événements qu'émet le
        // navigateur. C'est ce que l'extension observe pour apprendre.
        saisir(selecteur, valeur, racine) {
            const champ = (racine || document).querySelector(selecteur);

            if (!champ) {
                throw new Error(`saisir : ${selecteur} introuvable`);
            }

            if (champ.tagName === "SELECT") {
                const option = Array.from(champ.options).find(
                    (candidate) => candidate.textContent.trim() === valeur || candidate.value === valeur
                );

                if (option) {
                    champ.selectedIndex = option.index;
                }
            } else if (champ.type === "checkbox" || champ.type === "radio") {
                champ.checked = valeur !== false && valeur !== "non";
            } else {
                setterNatif(champ).call(champ, valeur);
            }

            champ.dispatchEvent(new Event("input", { bubbles: true }));
            champ.dispatchEvent(new Event("change", { bubbles: true }));

            return champ;
        },

        // Vidage silencieux : aucun événement, donc aucun réenregistrement.
        // Les champs désactivés, en lecture seule ou cachés gardent leur
        // valeur : c'est justement ce que l'extension doit ne pas toucher.
        vider(racine) {
            champs(racine).forEach((champ) => {
                if (champ.disabled || champ.readOnly || champ.type === "hidden") {
                    return;
                }

                if (champ.type === "checkbox" || champ.type === "radio") {
                    champ.checked = false;
                } else if (champ.tagName === "SELECT") {
                    champ.selectedIndex = 0;
                } else if (champ.type !== "hidden") {
                    setterNatif(champ).call(champ, "");
                }
            });
        },

        // Le message que le popup envoie au content script.
        async remplir() {
            if (ecouteurs.length === 0) {
                throw new Error("content.js n'a enregistré aucun écouteur");
            }

            const etat = await new Promise((suite) => {
                chrome.storage.local.get(["profil", "appris", "formulaires"], suite);
            });

            return await new Promise((suite) => {
                ecouteurs[0](
                    {
                        action: "remplir",
                        profil: etat.profil || {},
                        appris: etat.appris || {},
                        formulaires: etat.formulaires || {}
                    },
                    {},
                    suite
                );
            });
        },

        lire,

        // --- verdict ------------------------------------------------------
        verifier(attendus, racine) {
            return attendus.map((ligne) => {
                const champ = (racine || document).querySelector(ligne.cible);
                const obtenu = champ ? lire(champ) : "(champ absent)";
                const attendu = ligne.attendu;
                const ok = normaliser(obtenu) === normaliser(attendu);

                return { ...ligne, obtenu, ok };
            });
        },

        rapport(lignes, cible) {
            const corps = document.getElementById(cible || "verdict");
            const reussis = lignes.filter((ligne) => ligne.ok).length;

            corps.replaceChildren();

            lignes.forEach((ligne) => {
                const tr = document.createElement("tr");

                tr.className = ligne.ok ? "ok" : "ko";
                tr.append(
                    cellule(ligne.ok ? "✔" : "✘", "marque"),
                    cellule(ligne.quoi),
                    cellule(ligne.attendu === "" ? "(vide)" : ligne.attendu, "mono"),
                    cellule(ligne.obtenu === "" ? "(vide)" : String(ligne.obtenu), "mono"),
                    cellule(ligne.note || "", "note")
                );

                corps.append(tr);
            });

            const total = document.getElementById("total");

            if (total) {
                total.textContent = `${reussis} / ${lignes.length}`;
                total.className = reussis === lignes.length ? "score ok" : "score ko";
            }

            return lignes;
        },

        journal(lignes, cible) {
            const zone = document.getElementById(cible || "journal");

            if (!zone) {
                return;
            }

            zone.textContent = lignes.length === 0
                ? "(l'extension n'a rien écrit)"
                : lignes.map((ligne) => `${ligne.champ}\n    ${ligne.origine}  ·  ${ligne.score}`).join("\n");
        }
    };

    function cellule(contenu, classe) {
        const td = document.createElement("td");

        td.textContent = contenu;

        if (classe) {
            td.className = classe;
        }

        return td;
    }

    function normaliser(texte) {
        return (texte === null || texte === undefined ? "" : String(texte))
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
    }

    window.Banc = Banc;
}());
