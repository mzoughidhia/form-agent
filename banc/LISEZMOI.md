# Banc d'essai — extension « Form Agent Test »

Cinq pages qui mettent `prototype/content.js` à l'épreuve, **sans avoir à installer
l'extension dans Chrome**.

## Lancer

```bash
node --input-type=commonjs -e "const h=require('http'),f=require('fs'),p=require('path');const r=p.resolve('.');h.createServer((q,s)=>{const u=decodeURIComponent(q.url.split('?')[0]);const n=u==='/'?'/banc/index.html':u;const c=p.join(r,n);if(!c.startsWith(r)||!f.existsSync(c)||f.statSync(c).isDirectory()){s.writeHead(404);return s.end('404');}const e=p.extname(c);const t=e==='.js'?'text/javascript':e==='.html'?'text/html; charset=utf-8':e==='.css'?'text/css':'text/plain';s.writeHead(200,{'content-type':t});s.end(f.readFileSync(c));}).listen(4173,()=>console.log('http://localhost:4173'));"
```

puis ouvrir <http://localhost:4173>. Chaque page se lance toute seule et affiche son verdict.

> Le serveur est nécessaire : `history.pushState` et les `iframe` ne se comportent pas
> pareil en `file://`.

## Comment le harnais s'y prend

`harnais.js` fournit à `content.js` un faux `chrome` — `storage.local` en mémoire,
`runtime.onMessage` capté — puis joue le cycle réel de l'extension :

```
saisir  →  attendre l'enregistrement  →  vider  →  remplir  →  comparer
```

**La saisie passe par le setter natif du prototype**, comme une frappe humaine. C'est le
point qui rend le banc honnête : une affectation directe (`champ.value = x`) tromperait
les cadres applicatifs et le banc conclurait à tort en faveur de l'extension.

Le vidage, lui, est silencieux — aucun événement — sinon l'extension réenregistrerait un
formulaire vide et écraserait ce qu'elle vient d'apprendre.

## Les cinq cas

| | Ce qu'il éprouve |
|---|---|
| 1 · champs | tous les types, plus `password`, `disabled`, `readonly`, `hidden`, case de consentement |
| 2 · libellés | `label[for]`, label parent, `aria-label`, `aria-labelledby`, `placeholder`, texte voisin, `name` seul, aucun libellé |
| 3 · étapes | trois écrans, une seule URL — le cas des formulaires paginés |
| 4 · chargement | champs injectés après coup, navigation par `history.pushState` |
| 5 · cadre | champ contrôlé façon React, valeur réelle d'un `select`, `iframe` |

## Ce que le banc ne peut pas dire

Pas d'authentification, pas de champs conditionnels pilotés par le serveur, pas de
captcha, pas de Shadow DOM, pas de `contenteditable`. Il éprouve le **moteur**, pas la
compagnie. Le test `P-9` sur de vrais extranets reste à faire.
