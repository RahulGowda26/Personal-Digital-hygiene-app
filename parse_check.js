const fs = require('fs');
const ts = require('typescript');
const code = fs.readFileSync('src/screens/SecurityHabitsScreen.tsx', 'utf8');
const sf = ts.createSourceFile('test.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
console.log(sf.parseDiagnostics);
