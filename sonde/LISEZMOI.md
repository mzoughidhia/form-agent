# Sonde — reconnaissance de formulaires

Sprint −1 du projet d'agent de remplissage.

Cette extension **lit, et rien d'autre**. Elle n'écrit dans aucun champ, ne clique
sur aucun bouton, ne soumet aucun formulaire, et ne relève **aucune valeur saisie**.
Elle observe la structure des formulaires et la façon dont les pages s'enchaînent,
puis publie un rapport.

C'est ce qui permet de la déployer sur les postes des courtiers sans risque et sans
changer leurs habitudes : ils travaillent, elle observe.

---

## Installation

1. Chrome → `chrome://extensions`
2. Activer **Mode développeur** (en haut à droite)
3. **Charger l'extension non empaquetée** → choisir le dossier `sonde/`
4. Pour essayer sur les pages de test locales : ouvrir **Détails** sur la sonde
   et activer **« Autoriser l'accès aux URL de fichier »**

> L'extension existante à la racine de `form-agent` reste installable séparément.
> Ce sont deux extensions distinctes : celle-là écrit dans les formulaires, la sonde non.

---

## Le rapport est vide ?

`"sites": []` veut dire qu'aucun relevé n'est arrivé. Dans l'ordre :

| Vérifier | Comment |
|---|---|
| **Le site est-il activé ?** | Le bouton du panneau doit afficher « Ne plus observer ce site ». Sinon la sonde reste inerte — c'est voulu. |
| **La page a-t-elle été rechargée après activation ?** | L'activation recharge la page une fois. Si elle ne l'a pas fait, recharger à la main. |
| **Page en `file://` ?** | Il faut cocher **Autoriser l'accès aux URL de fichier** (étape 4 ci-dessus). |
| **L'extension a-t-elle été rechargée après une modification ?** | `chrome://extensions` → bouton ↻ sur la carte de la sonde. |
| **Y a-t-il une erreur ?** | `chrome://extensions` → **Erreurs**, et la console de la page (F12). |

---

## Utilisation

1. Ouvrir l'extranet d'une compagnie, se connecter normalement
2. Cliquer sur l'icône de la sonde → **Observer ce site**
   (la page se recharge une fois, pour activer l'observation)
3. Travailler normalement : ouvrir un dossier, remplir un formulaire, passer les étapes
4. Revenir sur l'icône quand on veut : les six réponses s'affichent
5. **Exporter le rapport** quand la campagne est finie

La sonde reste **inerte** sur tous les sites non activés. Aucune observation par défaut.

### Pour répondre à Q3, il faut deux passages

La stabilité des sélecteurs se mesure en comparant une visite à la suivante.
Tant qu'un seul chargement a été observé, Q3 affiche *« à confirmer »*.
**Repasser sur le même formulaire un autre jour, idéalement avec un autre dossier.**

---

## Les six questions

| | Question | Pourquoi elle compte |
|---|---|---|
| **Q1** | Combien d'étapes, dans quel ordre | Si des branches dépendent des réponses, la recette doit enregistrer les conditions |
| **Q2** | Comment la page suivante se charge | **Structurant.** Rechargement complet et route SPA donnent deux moteurs différents |
| **Q3** | Les sélecteurs sont-ils stables | **Structurant.** Si les `id` changent à chaque session, seuls les libellés fonctionnent |
| **Q4** | Quel cadre applicatif | Détermine les événements à déclencher à l'écriture |
| **Q5** | Y a-t-il des champs conditionnels | Si oui, l'ordre de remplissage compte |
| **Q6** | Quels obstacles | Un cadre d'une autre origine est un mur : le couple sort du périmètre |

### Verdict

- **faisable** — rien ne s'oppose au moteur prévu
- **difficile** — réalisable, mais avec une contrainte forte (libellés seuls, cadres, beaucoup de conditionnels)
- **hors périmètre** — captcha : on ne contourne pas, on rend la main

---

## P-9 · Test d'écriture manuel

**Ce test n'est pas dans la sonde**, et c'est volontaire : la sonde n'écrit jamais.
Il se fait à la main, une fois par extranet, sur un dossier de test.

C'est le test le plus important du sprint. Beaucoup d'extranets sont des applications
React ou Angular : écrire une valeur ne suffit pas, le cadre ne « voit » pas le
changement et le formulaire part vide malgré un champ visuellement rempli.

### Mode d'emploi

1. Ouvrir le formulaire, faire un clic droit sur un champ texte → **Inspecter**
2. Dans la console, remplacer le sélecteur ci-dessous et exécuter :

```js
(() => {
    const champ = document.querySelector("#REMPLACER_PAR_LE_SELECTEUR");
    const valeur = "TEST123";

    // Passer par le setter natif : une affectation directe de .value est
    // ignorée par React, qui garde son propre état interne.
    const proto = champ instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;

    Object.getOwnPropertyDescriptor(proto, "value").set.call(champ, valeur);

    champ.dispatchEvent(new Event("input",  { bubbles: true }));
    champ.dispatchEvent(new Event("change", { bubbles: true }));

    console.log("écrit :", champ.value);
})();
```

3. **Cliquer sur « Suivant » ou « Valider »** et vérifier que la valeur est bien arrivée

### Consigner le résultat

| Résultat | Ce que ça veut dire |
|---|---|
| La valeur passe | ✅ `dispatch-input-then-change` suffit |
| La valeur est perdue | Essayer d'ajouter `blur`, ou `keydown`/`keyup` |
| Le champ se vide tout seul | Le cadre réécrit son état : il faut trouver son point d'entrée |
| Rien ne marche | Noter le couple compagnie + service comme **hors périmètre** |

Noter pour chaque extranet la combinaison qui fonctionne : c'est elle qui sera
implémentée dans `dom/fill` au sprint 4, à un seul endroit.

---

## Banc d'essai

`banc/index.html` réunit sept formulaires qui reproduisent chacun une difficulté des vrais
extranets. À parcourir **avant** de sortir la sonde en conditions réelles.

| Cas | Reproduit | Réponse attendue |
|---|---|---|
| **A** | Rechargement complet, deux pages | Q2 = rechargement complet |
| **B** | Route interne (SPA), l'URL change sans recharger | Q2 = route interne |
| **C** | Remplacement partiel, l'URL ne bouge pas | Q2 = remplacement partiel |
| **D** | Identifiants regénérés à chaque chargement | Q3 = ide 0% · lib 100% |
| **F** | Formulaire dans un `<iframe>` | Q6 signale le cadre |
| **G** | Captcha | Q6 = captcha · hors périmètre |
| **H** | Sans `<form>` + champs conditionnels | Q5 = 3 champs |

**B et D sont les deux cas qui comptent** : ce sont les seules réponses capables de changer
l'architecture du moteur de remplissage.

---

## Tests

### Pages de test

`test-formulaire.html` reproduit un formulaire d'extranet représentatif : les quatre
façons d'écrire un libellé, un `<select>` à valeurs opaques, un groupe radio, un champ
mot de passe et un champ caché à exclure, et un champ conditionnel inséré après un choix.
**« Suivant » mène à `test-formulaire-2.html`**, par rechargement complet — de quoi
vérifier Q1 (nombre d'étapes) et Q2 (mécanisme de pagination) en local.

Ce sont des formulaires ordinaires : rien dedans ne connaît l'extension. C'est ce qui
permet de les utiliser pour essayer la vraie sonde dans Chrome.

### Test automatisé

`test-sonde.js` fait tourner les **vrais** `commun.js` et `sonde.js` sur la page de test
et vérifie ce qu'ils relèvent — extraction des libellés, sections, contraintes, options,
regroupement des radios, exclusions, empreinte stable face à des identifiants regénérés,
détection des champs conditionnels.

`test-banc.js` fait la même chose sur les sept cas du banc : route SPA, remplacement partiel,
identifiants regénérés, captcha, absence de `<form>`, champs conditionnels.

```bash
npm install jsdom      # dépendance de test uniquement
node test-sonde.js     # 30 vérifications — extraction
node test-banc.js      # 20 vérifications — types de formulaires et pagination
```

30 vérifications. Trois d'entre elles ont déjà attrapé de vrais défauts :

- un comptage de champs conditionnels qui partait à 8 au lieu de 0 ;
- un groupe radio libellé d'après son option (« Homme ») au lieu de son intitulé (« Sexe ») ;
- **le relevé du formulaire rempli perdu à chaque fois** : le report d'inactivité était
  relancé par la saisie du dernier champ, au moment exact où l'on clique sur « Suivant ».
  La sonde relève désormais immédiatement au `submit`, au clic sur un bouton et au départ
  de la page, et ne diffère jamais un relevé de plus de 3 secondes.

---

## Ce que la sonde ne fait pas

- ❌ écrire dans un champ
- ❌ cliquer sur un bouton
- ❌ soumettre un formulaire
- ❌ relever une valeur saisie
- ❌ lire un champ de mot de passe, même sa structure
- ❌ observer un site non activé explicitement

---

## Données conservées

Uniquement de la **structure** : libellés, noms, identifiants, types, options des
listes déroulantes, contraintes (`required`, `maxlength`, `pattern`).

Tout reste dans `chrome.storage.local`, sur le poste. Rien n'est envoyé nulle part.
**Tout effacer** vide le stockage.
