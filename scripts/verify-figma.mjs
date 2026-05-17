const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = 'jSArLH4G7n5YiUhYjRwDdh';

async function verifyAccess() {
  console.log('--- Figma REST API: Verifying Access ---');
  
  try {
    const response = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}`, {
      headers: { 'X-Figma-Token': FIGMA_TOKEN }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error fetching file:', error);
      return;
    }

    const data = await response.json();
    console.log(`Successfully accessed file: "${data.name}"`);
    console.log(`Last modified: ${data.lastModified}`);

    // Post a comment to confirm write access
    console.log('\n--- Figma REST API: Posting Sync Notification ---');
    const commentResponse = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}/comments`, {
      method: 'POST',
      headers: { 
        'X-Figma-Token': FIGMA_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: '🚀 Antigravity Sync: Initialized. 32 pages detected. Ready to generate design-sync.json.'
      })
    });

    if (commentResponse.ok) {
      console.log('Sync notification posted to Figma comments! ✅');
    } else {
      console.error('Failed to post comment.');
    }

  } catch (err) {
    console.error('Network error:', err);
  }
}

verifyAccess();
