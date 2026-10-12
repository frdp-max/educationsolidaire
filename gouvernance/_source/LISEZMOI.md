# Sources des documents de gouvernance

Les fichiers Word de `../word/` sont générés à partir de ces scripts (bibliothèque `docx`), puis convertis en PDF par Word.
Une fois un document adopté, on le modifie directement dans Word : régénérer écraserait ces modifications.

```bash
npm install --no-save docx@9 jszip
node gouvernance/_source/build.js gouvernance/word          # tous les documents
node gouvernance/_source/build.js gouvernance/word ri       # un seul (filtre sur le nom du fichier doc_*.js)
```

Conversion PDF (Windows, Word installé) :

```powershell
./gouvernance/_source/topdf.ps1 -In gouvernance/word -Out gouvernance/pdf
```

Le logo utilisé est `logo-symbole.png` à la racine du dépôt.
