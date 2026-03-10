const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('page.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      if (content.includes("from '@tanstack/react-table'")) {
        // Fix import
        if (
          content.includes('createColumnHelper }') &&
          !content.includes('ColumnDef')
        ) {
          content = content.replace(
            'createColumnHelper }',
            'createColumnHelper, ColumnDef }',
          );
          changed = true;
        }

        // Fix columns as any
        if (content.includes('columns={columns as any}')) {
          content = content.replace(
            /columns=\{columns as any\}/g,
            'columns={columns}',
          );
          changed = true;
        }

        // Fix useMemo
        if (content.includes('const columns = useMemo(')) {
          // Extract the type from columnHelper if possible, else use any
          const match = content.match(/createColumnHelper<([^>]+)>/);
          const typeName = match ? match[1] : 'any';
          content = content.replace(
            'const columns = useMemo(',
            `const columns = useMemo<ColumnDef<${typeName}, any>[]>(`,
          );
          changed = true;
        }

        // Fix columnHelper?.display
        if (content.includes('columnHelper?.display(')) {
          content = content.replace(
            /columnHelper\?\.display\(/g,
            'columnHelper.display(',
          );
          changed = true;
        }

        if (changed) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Fixed: ${fullPath}`);
        }
      }
    }
  }
}

try {
  processDir(path.join(__dirname, 'src/app/(dashboard)'));
  processDir(path.join(__dirname, 'src/components'));
  console.log('Done fixing.');
} catch (e) {
  console.error(e);
}
