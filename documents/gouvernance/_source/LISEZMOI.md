# Sources des documents de gouvernance

Les fichiers Word de `../word/` sont générés à partir de ces scripts (bibliothèque `docx`), puis convertis en PDF par Word.
Une fois un document adopté, on le modifie directement dans Word : régénérer écraserait ces modifications.

```bash
npm install --no-save docx@9 jszip
node documents/gouvernance/_source/build.js documents/gouvernance/word          # tous les documents
node documents/gouvernance/_source/build.js documents/gouvernance/word ri       # un seul (filtre sur le nom du fichier doc_*.js)
```

Conversion PDF (Windows, Word installé) :

```powershell
./documents/gouvernance/_source/topdf.ps1 -In documents/gouvernance/word -Out documents/gouvernance/pdf
```

Le logo utilisé est `logo-symbole.png` à la racine du dépôt.
