#!/usr/bin/env node
// Generates src/data/mdiAllIconsData.json from @mdi/js.
// Run: node scripts/gen-mdi-icons.cjs
// Re-run after upgrading @mdi/js.

const mdi = require('../node_modules/@mdi/js/commonjs/mdi.js')
const fs = require('fs')
const path = require('path')

function keyToName(key) {
  return key
    .slice(3) // remove 'mdi' prefix
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
}

const keys = Object.keys(mdi).filter(k => k.startsWith('mdi')).sort()
const icons = keys.map(k => [keyToName(k), mdi[k]])

const out = path.join(__dirname, '../src/data/mdiAllIconsData.json')
fs.writeFileSync(out, JSON.stringify(icons))
console.log(`Generated ${icons.length} icons → ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`)
