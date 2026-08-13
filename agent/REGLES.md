# RÈGLES — Agent de remplissage · Phase 1

Ces règles sont posées **avant** la première ligne de code métier. Une règle
d'architecture ajoutée au sprint 4 ne corrige pas le code des sprints 1 à 3 :
elle ne fait que documenter la dette.

**Elles sont outillées.** `npm run architecture` échoue le build en cas de violation —
un interdit qu'aucun outil ne vérifie sera violé, pas par mauvaise volonté, mais un
vendredi soir de sprint 4.

---

## Architecture

**A1 — Tout pointe vers `core`, `core` ne pointe vers rien.**
Aucun import de `chrome.*`, `document`, `window` ou `firebase` dans `core/`.
C'est ce qui rend le cœur testable en une milliseconde, sans navigateur.

**A2 — Une seule couche touche le DOM.**
Si un fichier hors de `dom/` contient `document.querySelector`, c'est un bug
d'architecture, pas un raccourci.

**A3 — Une seule couche touche Firestore.**
Tout accès passe par un repository de `data/`. Aucune requête ailleurs.

**A4 — Le service worker ne touche jamais au DOM.**
Il orchestre par messages. S'il a besoin de la page, il demande au content script.

**A5 — Le panel ne parle qu'au background.**
Jamais directement à `dom/` ni à `data/`. Un seul chemin, donc un seul endroit à déboguer.

**A6 — Les règles sont outillées, pas documentées.**
`outils/verifier-architecture.mjs`, bloquant en CI.

### Sens des dépendances

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

| Depuis | Peut importer |
|---|---|
| `core` | `core` |
| `dom` | `core`, `dom` |
| `data` | `core`, `data` |
| `background` | `core`, `dom`, `data`, `background` |
| `content` | `core`, `dom`, `content` |
| `panel` | `core`, `panel` |

---

## Données

**D1 — Aucune donnée client n'est jamais persistée par l'extension.**
Ni `storage.local`, ni `storage.sync`, ni IndexedDB, ni log. Le dossier vit en
mémoire le temps de la session, puis disparaît.

**D2 — Une recette est anonyme par construction.**
Sélecteurs, noms canoniques, formats. Rien d'autre.

**D3 — Le journal est append-only.**
`allow update, delete: if false` dans les règles Firestore. Un audit qu'on peut
réécrire n'est pas un audit.

**D4 — Seuls des identifiants traversent les frontières.**
Le CRM envoie `dossierId`, pas le dossier. Le service worker le charge lui-même,
sous l'identité du courtier.

**D5 — L'ontologie est un fichier versionné, pas une collection.**
Elle change deux fois par an ; elle appartient au dépôt et suit les revues de code.

---

## Sécurité

**S1 — L'extension ne soumet JAMAIS un formulaire.**
Aucun `.submit()`, aucun `requestSubmit()`, aucun clic sur un bouton de soumission.
Vérifié par le script d'architecture, sur toutes les couches sans exception.
**C'est la seule règle qui ne se négocie jamais.**

**S2 — Aucun identifiant assureur n'est lu, saisi ni stocké.**
La connexion aux extranets appartient au courtier.

**S3 — `host_permissions` est une liste explicite.**
Jamais `<all_urls>`. Chaque ajout d'extranet est une modification de manifeste,
donc une revue.

**S4 — Extraction du DOM par liste blanche d'attributs.**
On énumère ce qu'on lit. Une liste noire finit toujours par laisser passer un
`value` contenant une donnée personnelle.

**S5 — Refuser plutôt que deviner.**
Pas de dossier actif, empreinte inconnue, sélecteur introuvable → on s'arrête et
on le dit. Un remplissage manuel est une gêne ; un devis faux se découvre au sinistre.

**S6 — Aucun secret dans le paquet de l'extension.**
Une extension est un dossier lisible par tous.

**S7 — Toute écriture porte l'identité réelle du courtier.**
Pas de compte technique partagé.

---

## Code

**C1 — TypeScript strict, et pas d'`any` sur une donnée de formulaire.**
C'est précisément là que les erreurs silencieuses se logent.

**C2 — `core/` est couvert par des tests unitaires.**
Rapprochement, transformations et empreinte se testent sans navigateur.

**C3 — Un sélecteur CSS est un dernier recours.**
Ordre imposé : libellé accessible → `name` → `id` → CSS. Un libellé survit à une
refonte de styles ; une classe générée non.

**C4 — Toute écriture de valeur passe par `dom/fill`.**
Un seul endroit connaît la façon correcte de déclencher les événements du cadre
applicatif. Le jour où un extranet change, il n'y a qu'un fichier à corriger.

**C5 — Un échec est visible.**
Aucun `catch` silencieux sur le chemin du remplissage.

---

## Définition de « terminé » pour un ticket

- [ ] `npm run verifier` passe (architecture + typage + tests)
- [ ] Le comportement est vérifié sur un cas réel, pas seulement en test
- [ ] Aucune règle ci-dessus n'a été contournée « temporairement »

---

## Vérifier

```bash
npm run verifier       # tout
npm run architecture   # A1–A5 et S1
npm run types          # C1
npm run test           # C2
```
