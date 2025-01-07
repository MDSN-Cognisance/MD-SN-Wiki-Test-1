const chokidar = require('chokidar');
const { exec } = require('child_process');

// Watch the Git logs for changes
const watcher = chokidar.watch('./.git/logs/HEAD', {
  persistent: true,
  ignoreInitial: true,
});

console.log('Watching for Git commits in .git/logs/HEAD...');

watcher.on('change', (path) => {
  console.log(`Git commit detected at: ${path}`);
  
  // Rebuild your index.html
  exec('tiddlywiki . --build index', (err) => {
    if (err) {
      console.error(`Build Error: ${err.message}`);
      return;
    }
    console.log('Build completed.');

    // Then do the usual git add & push if you want
    exec('git add index.html && git commit -m "Auto-update index.html" && git push', (gitErr) => {
      if (gitErr) {
        console.error(`Git Error: ${gitErr.message}`);
        return;
      }
      console.log('Changes pushed to GitHub.');
    });
  });
});
