const fs = require('fs'); const path = require('path');
const { build } = require('./lib');
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const only = process.argv[3];
const files = fs.readdirSync(__dirname).filter((f) => /^doc_.*\.js$/.test(f) && (!only || f.includes(only)));
(async () => {
  for (const f of files) {
    const mod = require('./' + f);
    for (const doc of Array.isArray(mod) ? mod : [mod]) console.log(path.basename(await build(doc, OUT)));
  }
})().catch((e) => { console.error(e); process.exit(1); });
