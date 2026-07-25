const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Update createClient() to await createClient()
    if (content.includes('createClient()') && !filePath.includes('supabase/server.ts') && !filePath.includes('supabase/client.ts')) {
      content = content.replace(/const supabase = createClient\(\)/g, 'const supabase = await createClient()');
      
      // If it's a component or function, make sure it's async
      // This is basic, might need manual touchups for some client components
      
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});

