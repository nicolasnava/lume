import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/components/ui/ConfirmDialog.tsx', import.meta.url), 'utf8')
assert.match(source, /<h3 className="flex items-center gap-2\.5 pr-6 text-base font-extrabold text-\[#4A3F5C\]">\s*<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-\[#B8A9D9\]\/20 text-\[#8675A9\]">\s*\{inlineIcon \|\| <AlertTriangle className="h-5 w-5" \/>\}\s*<\/span>\s*<span>\{title\}<\/span>/)
console.log('Confirmation icon header placement check passed.')
