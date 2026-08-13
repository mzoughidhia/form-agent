"use strict";
(() => {
  // src/core/texte/normaliser.ts
  var LONGUEUR_LIBELLE = 120;
  function normaliser(texte) {
    return (texte ?? "").replace(/\s+/g, " ").trim().slice(0, LONGUEUR_LIBELLE);
  }
  function normaliserLibelle(texte) {
    return normaliser(texte).toLowerCase().normalize("NFD").replace(new RegExp("\\p{Mn}", "gu"), "").replace(/[^a-z0-9]+/g, " ").trim();
  }

  // src/dom/extract/libelle.ts
  var SELECTEUR_CHAMPS = "input, select, textarea";
  function groupeRadio(champ) {
    if (!(champ instanceof HTMLInputElement) || champ.type !== "radio" || !champ.name) {
      return [];
    }
    const portee = champ.form ?? champ.ownerDocument;
    return Array.from(
      portee.querySelectorAll(
        `input[type="radio"][name="${CSS.escape(champ.name)}"]`
      )
    );
  }
  function ancetreCommun(elements) {
    let noeud = elements[0]?.parentElement ?? null;
    while (noeud !== null && !elements.every((element) => noeud.contains(element))) {
      noeud = noeud.parentElement;
    }
    return noeud;
  }
  function libelleDeGroupe(champ) {
    const groupe = groupeRadio(champ);
    if (groupe.length < 2) {
      return "";
    }
    const ancetre = ancetreCommun(groupe);
    if (ancetre === null) {
      return "";
    }
    const interne = Array.from(ancetre.children).find(
      (enfant) => enfant.tagName !== "INPUT" && enfant.querySelector(SELECTEUR_CHAMPS) === null && normaliser(enfant.textContent) !== ""
    );
    if (interne !== void 0) {
      return normaliser(interne.textContent);
    }
    const precedent = ancetre.previousElementSibling;
    if (precedent !== null && precedent.querySelector(SELECTEUR_CHAMPS) === null) {
      return normaliser(precedent.textContent);
    }
    return "";
  }
  function libelleDe(champ) {
    const duGroupe = libelleDeGroupe(champ);
    if (duGroupe !== "") {
      return duGroupe;
    }
    const document2 = champ.ownerDocument;
    if (champ.id !== "") {
      const associe = document2.querySelector(`label[for="${CSS.escape(champ.id)}"]`);
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
      const cible = document2.getElementById(parAria);
      if (cible !== null) {
        return normaliser(cible.textContent);
      }
    }
    const precedent = champ.previousElementSibling;
    if (precedent !== null && precedent.querySelector(SELECTEUR_CHAMPS) === null) {
      return normaliser(precedent.textContent);
    }
    return "";
  }
  function sectionDe(champ) {
    const groupe = champ.closest("fieldset");
    const legende = groupe?.querySelector("legend") ?? null;
    return legende === null ? "" : normaliser(legende.textContent);
  }

  // src/dom/extract/extraire.ts
  var TYPES_IGNORES = ["hidden", "submit", "button", "reset", "image", "file"];
  function estObservable(champ) {
    const type = champ.type?.toLowerCase() ?? "text";
    return !TYPES_IGNORES.includes(type) && type !== "password";
  }
  function sansDoublonsRadio(champs) {
    const groupesVus = /* @__PURE__ */ new Set();
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
  function optionsDe(champ) {
    if (champ instanceof HTMLSelectElement) {
      return Array.from(champ.options).slice(0, 40).map((option) => ({
        texte: normaliser(option.textContent),
        valeur: option.value
      }));
    }
    if (champ instanceof HTMLInputElement && champ.type === "radio") {
      return groupeRadio(champ).slice(0, 40).map((bouton) => ({
        texte: normaliser(
          bouton.closest("label")?.textContent ?? bouton.getAttribute("aria-label")
        ),
        valeur: bouton.value
      }));
    }
    return void 0;
  }
  function ficheChamp(champ, position) {
    const longueurMax = champ instanceof HTMLSelectElement ? -1 : champ.maxLength;
    const options = optionsDe(champ);
    const fiche = {
      position,
      balise: champ.tagName.toLowerCase(),
      type: champ instanceof HTMLSelectElement ? "select" : champ.type || "text",
      nom: champ.name,
      identifiant: champ.id,
      libelle: libelleDe(champ),
      section: sectionDe(champ),
      indice: normaliser(champ.getAttribute("placeholder")),
      requis: champ.required,
      longueurMax: longueurMax > 0 ? longueurMax : null,
      motif: champ.getAttribute("pattern") ?? "",
      autocompletion: champ.getAttribute("autocomplete") ?? "",
      ...options === void 0 ? {} : { options }
    };
    return fiche;
  }
  function racinesDeFormulaire(document2) {
    const avecBalise = Array.from(document2.forms).filter(
      (formulaire) => formulaire.querySelector(SELECTEUR_CHAMPS) !== null
    );
    if (avecBalise.length > 0) {
      return avecBalise;
    }
    return document2.querySelector(SELECTEUR_CHAMPS) === null ? [] : [document2.body];
  }
  function fichesDe(racine) {
    const bruts = Array.from(
      racine.querySelectorAll(SELECTEUR_CHAMPS)
    ).filter(estObservable);
    return sansDoublonsRadio(bruts).map((champ, position) => ficheChamp(champ, position));
  }

  // src/core/fingerprint/empreinte.ts
  function condenser(texte) {
    let valeur = 5381;
    for (let i = 0; i < texte.length; i += 1) {
      valeur = (valeur * 33 ^ texte.charCodeAt(i)) >>> 0;
    }
    return valeur.toString(16).padStart(8, "0");
  }
  function empreinteDe(fiches) {
    const structure = fiches.map((fiche) => `${fiche.type}|${fiche.libelle}|${fiche.requis ? 1 : 0}`).join("\n");
    return condenser(structure);
  }
  function cleChamp(fiche) {
    return `${fiche.type}|${fiche.libelle || fiche.nom || String(fiche.position)}`;
  }
  var RECOUVREMENT_MEME_FORMULAIRE = 0.5;
  function memeFormulaire(connues, relevees) {
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

  // essai/essai.ts
  var $empreinte = document.getElementById("empreinte");
  var $compteur = document.getElementById("compteur");
  var $corps = document.getElementById("corps");
  var $journal = document.getElementById("journal");
  var empreintePrecedente = "";
  var clesPrecedentes = /* @__PURE__ */ new Set();
  function tracer(texte, ton = "info") {
    const ligne = document.createElement("div");
    ligne.className = `ligne ${ton}`;
    ligne.textContent = texte;
    $journal.prepend(ligne);
  }
  function cellule(contenu, classe = "") {
    const td = document.createElement("td");
    td.textContent = contenu;
    if (classe !== "") {
      td.className = classe;
    }
    return td;
  }
  function afficher(fiches) {
    $corps.replaceChildren();
    for (const fiche of fiches) {
      const tr = document.createElement("tr");
      tr.append(
        cellule(String(fiche.position), "num"),
        cellule(fiche.type, "mono"),
        cellule(fiche.libelle || "\u2014"),
        cellule(normaliserLibelle(fiche.libelle) || "\u2014", "mono cle"),
        cellule(fiche.identifiant || "\u2014", "mono pale"),
        cellule(fiche.requis ? "oui" : "", "num"),
        cellule(fiche.options === void 0 ? "" : String(fiche.options.length), "num")
      );
      $corps.append(tr);
    }
  }
  function relever(origine) {
    const racines = racinesDeFormulaire(document);
    if (racines.length === 0) {
      tracer("Aucun formulaire trouv\xE9.", "attention");
      return;
    }
    const fiches = fichesDe(racines[0]);
    const empreinte = empreinteDe(fiches);
    const cles = new Set(fiches.map(cleChamp));
    afficher(fiches);
    $empreinte.textContent = empreinte;
    $compteur.textContent = String(fiches.length);
    if (empreintePrecedente === "") {
      tracer(`${origine} \u2014 premier relev\xE9 \xB7 empreinte ${empreinte}`, "info");
    } else if (empreinte === empreintePrecedente) {
      tracer(`${origine} \u2014 empreinte INCHANG\xC9E (${empreinte}) : m\xEAme formulaire`, "ok");
    } else {
      const memeChose = memeFormulaire(clesPrecedentes, cles);
      tracer(
        `${origine} \u2014 empreinte ${empreintePrecedente} \u2192 ${empreinte} \xB7 ` + (memeChose ? "recouvrement \xE9lev\xE9 : m\xEAme formulaire, des champs sont apparus" : "recouvrement faible : c'est une autre \xE9tape"),
        "attention"
      );
    }
    empreintePrecedente = empreinte;
    clesPrecedentes = cles;
  }
  document.getElementById("relire").addEventListener("click", () => {
    relever("Relecture");
  });
  document.getElementById("regenerer").addEventListener("click", () => {
    const graine = Math.random().toString(36).slice(2, 8);
    document.querySelectorAll("#devis input, #devis select").forEach((champ, i) => {
      const ancien = champ.id;
      champ.id = `ctl00_${graine}_${i}`;
      if (ancien !== "") {
        const etiquette = document.querySelector(`label[for="${ancien}"]`);
        etiquette?.setAttribute("for", champ.id);
      }
    });
    relever(`Identifiants reg\xE9n\xE9r\xE9s (${graine})`);
  });
  document.getElementById("ajouter").addEventListener("click", () => {
    const bloc = document.getElementById("conditionnel");
    bloc.innerHTML = bloc.innerHTML === "" ? `<div class="champ"><label for="bailleur">Nom du bailleur</label>
             <input type="text" id="bailleur" name="bailleur"></div>` : "";
    relever(bloc.innerHTML === "" ? "Champ conditionnel retir\xE9" : "Champ conditionnel apparu");
  });
  relever("Chargement");
})();
