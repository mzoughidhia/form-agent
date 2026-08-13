# Agent de remplissage — extension Chrome MV3

L'extension définitive du projet. Une seule, à terme : la sonde du sprint −1 est un
instrument de mesure temporaire, et le dossier `prototype/` est une archive.

**Avant de coder quoi que ce soit, lire [REGLES.md](REGLES.md).**

---

## Démarrer

```bash
npm install
npm run verifier      # architecture + typage + tests
```

| Commande | Ce qu'elle vérifie |
|---|---|
| `npm run architecture` | Le sens des dépendances (A1–A5) et la règle « ne jamais soumettre » (S1) |
| `npm run types` | TypeScript strict (C1) |
| `npm test` | Les tests unitaires (C2) |
| `npm run build` | Regroupe les points d'entrée dans `extension/` |
| `npm run verifier` | Les trois premiers, dans l'ordre |

`npm run verifier` est ce que la CI exécute. Si ça passe en local, ça passe en CI.

---

## Les modules

```
src/
├── core/         LOGIQUE PURE — zéro dépendance externe, testable sans navigateur
│   ├── modele/       les types partagés
│   ├── texte/        normalisation des libellés
│   ├── fingerprint/  empreinte de formulaire
│   ├── ontology/     les champs canoniques : types, validateur, consultation
│   ├── matching/     rapprochement par valeur + dictionnaire   (sprint 3)
│   ├── transform/    dates, téléphones, options de select      (sprint 3)
│   └── recipe/       modèle de recette, versionnement          (sprint 2)
│
├── dom/          SEULE COUCHE QUI CONNAÎT LE DOM
│   ├── extract/      lecture de structure
│   ├── snapshot/     instantané des valeurs saisies            (sprint 3)
│   ├── fill/         écriture + événements du cadre applicatif (sprint 4)
│   └── highlight/    surlignage vert / jaune                   (sprint 4)
│
├── data/         SEULE COUCHE QUI CONNAÎT FIRESTORE            (sprint 1)
├── background/   SERVICE WORKER — orchestration                (sprint 1)
├── content/      CONTENT SCRIPTS                               (sprint 1)
└── panel/        SIDE PANEL ANGULAR                            (sprint 1)
```

La règle qui tient l'ensemble : **tout pointe vers `core`, et `core` ne pointe vers rien.**
Elle n'est pas une convention, elle est vérifiée à chaque build.

---

## Voir le code travailler

L'extension n'existe pas encore — le premier élément chargeable arrive au sprint 1.
En attendant, `essai/` est une page qui charge le **vrai** code de `src/` et montre ce
qu'il produit sur un formulaire réel :

```bash
npm run essai        # regroupe les deux pages d'essai
```

puis ouvrir l'une des deux pages dans un navigateur.

**`essai/index.html` — extraction et empreinte (sprint 0).** Trois boutons :

| Bouton | Ce qu'il éprouve |
|---|---|
| **Relire le formulaire** | l'extraction : libellés, clés normalisées, options, exclusions |
| **Regénérer les identifiants** | le cas D — les `id` changent, **l'empreinte ne doit pas bouger** |
| **Champ conditionnel** | l'empreinte change, mais le recouvrement dit « même formulaire » |

**`essai/ontologie.html` — l'ontologie (sprint 1).** Trois panneaux, dans l'ordre des trois
usages du fichier :

| Panneau | Ce qu'il montre |
|---|---|
| **Le dictionnaire** | un libellé lu sur un extranet → clé normalisée → champ canonique |
| **La liste** | les 92 champs par section, filtrables — c'est l'écran de relecture du ticket S1-3 |
| **Le validateur** | le vrai fichier cassé sur un seul point, et l'anomalie que ça produit |

Ce n'est pas l'extension : c'est une vitrine des modules, sans Chrome ni manifeste.

---

## État — sprint 1 en cours

| Ticket | | |
|---|---|---|
| S0-1 à S0-4 | Dépôt, règles, CI, `core/fingerprint` et `dom/extract` | ✅ |
| S0-5 | Relever les 5 couples compagnie + service les plus utilisés | ⬜ à faire par le cabinet |
| S1-1 | `ontology.json` — 92 champs canoniques, 10 sections | ✅ |
| S1-2 | `core/ontology` — types + validateur de cohérence | ✅ |
| S1-3 | Relecture métier par un courtier | ⬜ |

**61 tests.** Ce qui est déjà porté et couvert :

- `core/texte` — normalisation des libellés, la clé du dictionnaire partagé
- `core/fingerprint` — empreinte stable même si les `id` sont regénérés à chaque session
- `core/ontology` — 92 champs, 333 libellés, 20 énumérations, 6 champs dérivés
- `dom/extract` — les quatre façons d'écrire un libellé, groupes radio, exclusions

---

## L'ontologie

`ontology.json` vit à la racine du paquet, pas dans `src/` : c'est une donnée versionnée,
pas du code (règle D5). `core/` ne la lit donc jamais lui-même — le vérificateur
d'architecture interdit tout import hors de `src/`. Le fichier est analysé par la couche
appelante, puis passé à `ontologieValidee()`, seul endroit où du JSON devient une
`Ontologie`.

| Fichier | |
|---|---|
| `ontologie.ts` | les types, les 11 types canoniques, les unités |
| `valider.ts` | le validateur de cohérence, et `ontologieValidee()` qui échoue bruyamment |
| `consulter.ts` | `champParCle`, `formatsDe`, `indexDesLibelles`, `champsDerives` |

---

## Prochaine étape

**S1-3 — relecture métier.** L'ontologie tient debout techniquement ; reste à faire
valider par un courtier les libellés, les valeurs d'énumération et les manques.
Puis **S1-4** : le squelette MV3.
