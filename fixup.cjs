const fs = require('fs');

function apply(path, ops) {
  let s = fs.readFileSync(path, 'utf8');
  for (const op of ops) {
    if (op.type === 'after') {
      const idx = s.indexOf(op.marker);
      if (idx === -1) { console.log('MISS after', path, op.marker); process.exitCode = 1; continue; }
      const at = idx + op.marker.length;
      s = s.slice(0, at) + op.insert + s.slice(at);
    } else if (op.type === 'replace') {
      if (!s.includes(op.from)) { console.log('MISS replace', path, op.from); process.exitCode = 1; continue; }
      s = s.split(op.from).join(op.to);
    }
    console.log('OK', path, op.type);
  }
  fs.writeFileSync(path, s);
}

apply('src/core/gating.ts', [
  { type: 'after', marker: "from './types.ts';", insert: "\r\nexport type { GatingCondition, GatingAtom } from './types.ts';" },
]);
apply('src/core/accusationEngine.ts', [
  { type: 'after', marker: "from './types.ts';", insert: "\r\nexport type { Accusation, AccusationDimension } from './types.ts';" },
]);
apply('src/ui/store.ts', [
  { type: 'replace', from: 'engineAsk(cf, s, characterId, questionId);', to: 'engineAsk(cf, s, characterId, questionId).state;' },
]);
