# Agent de remplissage — plan de projet

Extension Chrome pour un cabinet de courtage en assurance. Elle remplit les formulaires
des extranets assureurs à partir des dossiers clients du CRM Firebase.

**Ce fichier est la référence du projet.** Toute session de travail commence par le lire,
avec `agent/REGLES.md`.

---

## 1. Le produit en une page

Le courtier est déjà connecté à son CRM **et** à l'extranet de la compagnie. Il navigue
lui-même jusqu'au formulaire, puis lance l'extension. Un seul point de décision :

```
        il clique sur l'extension
                  │
   identify()  =  domaine + motif d'URL + empreinte du formulaire
                  │
   ├─ recette absente ──────►  ENTRAÎNEMENT
   │                            il remplit à la main, on apprend
   │
   ├─ empreinte changée ────►  DÉRIVE
   │                            on refuse de remplir, on réapprend
   │
   └─ recette trouvée ──────►  REMPLISSAGE
                                on remplit, il relit
                                       │
                                       ▼
                            SUBMIT PAR LE COURTIER
```

### Comment il apprend, sans IA

Deux mécanismes déterministes, complémentaires :

1. **Rapprochement par valeur** — le courtier tape `07/03/1985` ; le dossier contient
   `client.birthDate = 1985-03-07` ; donc ce champ *est* la date de naissance, et son
   format est `JJ/MM/AAAA`. Apprend le mapping **et** le format d'un coup. Marche même
   sur les champs sans libellé.

2. **Dictionnaire de libellés** — index calculé à partir des recettes existantes :
   `libellé normalisé → champ canonique`. Partagé entre toutes les compagnies, donc la
   40ᵉ compagnie s'apprend beaucoup plus vite que la 1ʳᵉ.

---

## 2. Décisions actées — ne pas les rouvrir

| Décision | Raison |
|---|---|
| **Pas d'IA** | Le dictionnaire de signatures produit l'effet d'échelle ; l'IA ne traitait que le résidu. La supprimer élimine la clé API, le backend, et la question RGPD. |
| **Pas de backend** | Sans clé secrète à protéger, l'extension parle directement à Firestore avec le jeton Firebase du courtier. |
| **L'ontologie est un fichier, pas une collection** | Elle change deux fois par an ; elle appartient au dépôt et suit les revues de code. |
| **Le dictionnaire est un index calculé, pas une collection** | Dérivé des recettes au démarrage : zéro synchronisation, cohérent par construction. |
| **Une recette est un dictionnaire de formulaires indexé par empreinte** | Pas une séquence à rejouer. Le courtier avance d'une étape à l'autre ; l'agent reconnaît ce qui apparaît. Robuste aux changements de navigation. |
| **L'empreinte exclut `id` et `name`** | Certains portails les regénèrent à chaque session. Validé sur le banc d'essai, cas D. |
| **La connexion à l'extranet reste au courtier** | Aucun identifiant assureur n'est lu, saisi ni stocké. |
| **L'agent ne soumet jamais** | Un devis engage le cabinet. Règle S1, non négociable. |

---

## 3. Architecture

```
                    ┌──────────────────┐
                    │      core        │   pur · testable · zéro import externe
                    └────────▲─────────┘
                             │
        ┌────────────┬───────┴───────┬────────────┐
        │            │               │            │
    ┌───┴───┐   ┌────┴───┐    ┌──────┴─────┐  ┌───┴───┐
    │  dom  │   │  data  │    │ background │  │ panel │
    └───────┘   └────────┘    └────────────┘  └───────┘
```

**Tout pointe vers `core`, et `core` ne pointe vers rien.** Vérifié à chaque build par
`npm run architecture`. Détail des 23 règles dans `agent/REGLES.md`.

| Module | Rôle | Sprint |
|---|---|---|
| `core/modele` | les types partagés | 0 ✅ |
| `core/texte` | normalisation des libellés | 0 ✅ |
| `core/fingerprint` | empreinte de formulaire | 0 ✅ |
| `core/ontology` | les champs canoniques | 1 |
| `core/recipe` | modèle de recette, versionnement | 2 |
| `core/matching` | rapprochement par valeur + dictionnaire | 3 |
| `core/transform` | dates, téléphones, options de select | 3 |
| `dom/extract` | lecture de structure | 0 ✅ |
| `dom/snapshot` | instantané des valeurs saisies | 3 |
| `dom/fill` | écriture + événements du cadre applicatif | 4 |
| `dom/highlight` | surlignage vert / jaune | 4 |
| `data` | repositories Firestore | 1 |
| `background` | orchestration, le `if`, dossier actif | 1–2 |
| `content` | scripts injectés (agent + CRM) | 1–2 |
| `panel` | side panel Angular | 1 |

### Modèle de données

| Emplacement | Contenu |
|---|---|
| `clients/` · `dossiers/` | existant CRM, lecture seule pour l'agent |
| `ontology.json` | 92 champs canoniques, 10 sections — **fichier du dépôt** |
| `formRecipes/{recipeId}` | un couple compagnie X + service Y, versionné |
| `trainingRuns/` · `fillRuns/` | journal append-only |

---

## 4. Les sprints

### Sprint −1 · La sonde — ✅ terminé côté local

Extension de reconnaissance en lecture seule (`sonde/`). Répond à six questions dont
dépend l'architecture du moteur.

| | Question | État |
|---|---|---|
| Q1 | Combien d'étapes | ✅ validé sur banc |
| Q2 | **Comment la page suivante se charge** | ✅ 3 mécanismes distingués |
| Q3 | **Les sélecteurs sont-ils stables** | ✅ détecte les id regénérés |
| Q4 | Quel cadre applicatif | ✅ |
| Q5 | Champs conditionnels | ✅ |
| Q6 | Obstacles (cadres, captcha) | ✅ |

**Reste à faire, exige de vrais extranets :**
- `P-9` test d'écriture manuel — **bloque l'estimation du sprint 4**
- `P-11` vérifier si les compagnies exposent une API
- `P-12` campagne d'observation sur 5 couples compagnie + service

### Sprint 0 · Poser les règles — ✅ terminé

| | | |
|---|---|---|
| S0-1 | Dépôt, arborescence, TypeScript strict | ✅ |
| S0-2 | `REGLES.md` + garde-fou vérifié en échec | ✅ |
| S0-3 | CI bloquante | ✅ |
| S0-4 | `core/fingerprint` et `dom/extract` rapatriés de la sonde | ✅ |
| S0-5 | Relever les 5 couples compagnie + service les plus utilisés | ⬜ cabinet |

### Sprint 1 · Ontologie et squelette — ⬅ **en cours**

**Objectif : le bouton du CRM ouvre le side panel avec le bon dossier affiché.**

| | | |
|---|---|---|
| S1-1 | Rédiger `ontology.json` — 92 champs, types, formats, valeurs autorisées | ✅ |
| S1-2 | Types TypeScript + validateur au chargement | ✅ |
| S1-3 | Faire relire l'ontologie par un courtier et corriger | ⬅ |
| S1-4 | Squelette MV3 : manifest, service worker, side panel qui s'ouvre | |
| S1-5 | Réutiliser la session Firebase Auth du CRM | |
| S1-6 | Builder l'app Angular existante dans le side panel | |
| S1-7 | Bouton « Traiter ce dossier » dans le CRM → message `dossier.activate` | |
| S1-8 | Chargement du dossier + pièces jointes depuis Firestore, en mémoire | |
| S1-9 | Bandeau permanent « Dossier : DUPONT Jean » | |

**Fin de sprint :** je clique le bouton dans le CRM, le panel s'ouvre et affiche le nom
du bon client. Aucune donnée n'est écrite nulle part.

### Sprint 2 · Lire et reconnaître

**Objectif : l'extension sait dire « je connais ce formulaire » ou non, de façon fiable.**

| | |
|---|---|
| S2-1 | Content script agent injecté uniquement sur les domaines listés |
| S2-2 | Extraction par liste blanche d'attributs *(déjà porté au sprint 0)* |
| S2-3 | Empreinte de formulaire *(déjà porté au sprint 0)* |
| S2-4 | Normalisation d'URL et identification du couple compagnie + service |
| S2-5 | Repository recettes en lecture + cache local |
| S2-6 | Le routeur : le `if` à trois branches |
| S2-7 | Écran « formulaire reconnu / inconnu » dans le panel |

**Fin de sprint :** sur un formulaire réel, l'aiguillage est correct 5 fois de suite,
avec deux dossiers clients différents.

### Sprint 3 · Apprendre d'une saisie réelle

**Objectif : après une saisie manuelle, une recette exploitable existe en base.**

| | |
|---|---|
| S3-1 | Instantané complet du formulaire au clic sur « Suivant » / « Valider » |
| S3-2 | Générateur de variantes de valeurs (dates, téléphones, codes postaux, montants) |
| S3-3 | Moteur de rapprochement par valeur : 1 / plusieurs / aucune correspondance |
| S3-4 | Déduction du format à partir de la valeur observée |
| S3-5 | Écran de validation des champs ambigus, entièrement au clavier |
| S3-6 | Modes `IGNORE` / `MANUEL` / `CONSTANT` sur un champ |
| S3-7 | Nommage du couple compagnie + service par le courtier, une seule fois |
| S3-8 | Écriture de la recette versionnée + journal d'entraînement |

**Fin de sprint :** un courtier remplit un vrai formulaire ; une recette complète existe
dans Firestore, avec moins de 10 champs ayant demandé une intervention.

### Sprint 4 · Remplir — le sprint qui compte

**Objectif : le deuxième dossier sur le même formulaire se remplit tout seul.**

⚠️ **Non estimable tant que `P-9` n'a pas répondu sur deux extranets sur trois.**

| | |
|---|---|
| S4-1 | Résolution de sélecteur en cascade : libellé → `name` → CSS |
| S4-2 | Écriture de valeur avec les événements attendus par le cadre applicatif |
| S4-3 | Transformations à l'écriture : dates, téléphones, texte, montants |
| S4-4 | `<select>` : mapping vers la **valeur réelle du DOM**, jamais le texte affiché |
| S4-5 | Cases à cocher et boutons radio |
| S4-6 | Surlignage vert / jaune sur la page |
| S4-7 | Rapport de remplissage + journal `fillRuns` |
| S4-8 | **Garde-fou** : test automatisé prouvant qu'aucun bouton de soumission n'est cliqué |

**Fin de sprint :** ≥ 90 % des champs remplis, formats corrects, le courtier soumet.

> Le prototype archivé (`prototype/content.js`) contient un moteur d'écriture réutilisable
> — avec un défaut connu : `champ.value = valeur` est une affectation directe, **ignorée
> par React**. Voir `prototype/LISEZMOI.md`.

### Sprint 5 · Passer à l'échelle

| | |
|---|---|
| S5-1 | Normalisation de libellé *(déjà porté au sprint 0)* |
| S5-2 | Dictionnaire de libellés **dérivé** des recettes existantes, en mémoire |
| S5-3 | Pré-mapping par libellé avant même la saisie, pendant l'entraînement |
| S5-4 | Détection de dérive et statut `drift` sur la recette |
| S5-5 | Refus explicite de remplir sans dossier actif |
| S5-6 | Formulaires multi-pages : reconnaissance page par page |
| S5-7 | Écran « recettes connues » : compagnie, service, version, usages |

**Fin de sprint :** le 3ᵉ couple X + Y entraîné demande moins d'interventions que le 1ᵉʳ,
chiffres du journal à l'appui.

### Sprint 6 · Pilote

| | |
|---|---|
| S6-1 | Déploiement par policy d'entreprise (`ExtensionInstallForcelist`) |
| S6-2 | Écran d'anomalies |
| S6-3 | Export du journal |
| S6-4 | Guide d'usage d'une page pour les courtiers |
| S6-5 | Pilote : 2 courtiers, 3 couples X + Y, 2 semaines |
| S6-6 | Revue des critères et décision d'ouverture au cabinet |

---

## 5. Critères de fin de phase 1

- [ ] Un couple X + Y inconnu s'entraîne avec **moins de 15 minutes de surcoût**
- [ ] Au deuxième dossier, **≥ 90 % des champs** remplis automatiquement
- [ ] Formats corrects, **options de `select` par valeur réelle**
- [ ] Un formulaire multi-pages est reconnu et rempli page après page
- [ ] Une modification du formulaire déclenche un refus de remplir, visible
- [ ] Sans dossier actif, l'extension refuse de remplir
- [ ] Chaque entraînement et remplissage tracé avec l'identité du courtier
- [ ] **Zéro soumission automatique**
- [ ] **Zéro identifiant assureur** et **zéro donnée client** écrits par l'extension

---

## 6. Astuce de séquencement

Dès la fin du **sprint 3**, déployer l'extension en **mode apprentissage seul** sur tout
le cabinet. Pendant la construction des sprints 4 et 5, les recettes des compagnies les
plus utilisées se constituent déjà — trois semaines de collecte gagnées, sans aucun
risque : à ce stade l'extension ne remplit rien.

Répartition typique du volume : les 15 premières compagnies couvrent ~85 % des dossiers.
**Il ne s'agit jamais d'apprendre 100 compagnies**, mais les 15 qui font le travail.
