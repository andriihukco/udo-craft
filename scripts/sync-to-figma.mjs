import fs from 'fs';
import path from 'path';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = 'jSArLH4G7n5YiUhYjRwDdh';
const PAGES_DIR = './apps/client/src/app';
const OUTPUT_FILE = './design-sync.json';

// Helper to crawl directory
function getAppPages(dir, route = '') {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(getAppPages(fullPath, `${route}/${file}`));
    } else if (file === 'page.tsx') {
      results.push({
        route: route || '/',
        filePath: fullPath,
        name: route.split('/').pop() || 'Home'
      });
    }
  });
  
  return results;
}

async function generateSyncArtifact() {
  console.log('🚀 Starting Master Design Sync...');
  
  const pages = getAppPages(PAGES_DIR);
  console.log(`Found ${pages.length} pages to sync.`);

  const syncData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    projectName: 'udocraft',
    pages: pages.map(p => ({
      name: p.name,
      route: p.route,
      source: fs.readFileSync(p.filePath, 'utf8'),
      // Add metadata for Figma import plugins
      meta: {
        platform: 'web',
        framework: 'nextjs',
        styling: 'tailwind'
      }
    }))
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(syncData, null, 2));
  console.log(`\n✅ Created ${OUTPUT_FILE}`);

  // Notify Figma via comment
  try {
    await fetch(`https://api.figma.com/v1/files/${FILE_KEY}/comments`, {
      method: 'POST',
      headers: { 'X-Figma-Token': FIGMA_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `🏁 Sync Complete! ${pages.length} pages exported to design-sync.json.\nUse the "Import JSON" feature in your Figma plugin to draw the canvas.`
      })
    });
    console.log('Figma notification sent! 🔔');
  } catch (err) {
    console.error('Failed to send final notification.');
  }

  console.log('\n--- NEXT STEPS ---');
  console.log('1. Open your Figma file.');
  console.log('2. Run a plugin like "html.to.design" or "Builder.io".');
  console.log('3. Select "Import JSON" and choose the "design-sync.json" file.');
}

generateSyncArtifact();
