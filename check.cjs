const cp = require('child_process');
const fs = require('fs');
try {
  const result = cp.execSync('npx tsc --noEmit', { encoding: 'utf8' });
  fs.writeFileSync('ts_out.txt', result);
} catch (err) {
  fs.writeFileSync('ts_out.txt', err.stdout || err.message);
}
