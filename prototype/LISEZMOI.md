# Prototype — archivé

Première version de l'extension de remplissage, écrite avant le sprint −1.
**Ne pas installer dans Chrome** : son manifeste déclare `"matches": ["<all_urls>"]`
et elle **écrit dans les champs de tous les sites**.

Conservée uniquement comme référence pour le sprint 4.

---

## Ce qui sera repris

| Dans `content.js` | Deviendra | Sprint |
|---|---|---|
| `ecrireChamp`, `remplirSelect`, `remplirRadio` | `dom/fill` | 4 |
| `notifier` — dispatch `input` + `change` | stratégie d'écriture | 4 |
| `surligner` | `dom/highlight` | 4 |
| `versFormatDate`, `versFormatLisible` | `core/transform` | 3 |
| `correspondance`, `meilleureCorrespondance`, `equivalents` | `core/matching` | 3 |
| `signature`, `cleFormulaire` | remplacés par `core/fingerprint` de la sonde | 0 |

---

## Le défaut connu, à corriger avant reprise

`content.js`, dans `ecrireChamp()` :

```js
champ.value = valeur;   // affectation directe
```

Une affectation directe de `.value` est **ignorée par React** : le cadre conserve son
état interne et le formulaire part vide au serveur, alors que le champ paraît rempli
à l'écran.

Il faut passer par le setter natif :

```js
const proto = champ instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;

Object.getOwnPropertyDescriptor(proto, "value").set.call(champ, valeur);
```

C'est exactement ce que vérifie le test **P-9** du sprint −1 — voir `sonde/LISEZMOI.md`.
Ne pas reprendre ce code sans appliquer d'abord la correction validée par P-9 sur les
extranets réels.
