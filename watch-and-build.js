const chokidar = require('chokidar');
const { exec } = require('child_process');

// Variables to handle sync and debounce logic
let syncInProgress = false;
let debounceTimer = null;

// Watch the tiddlers folder for file changes
const watcher = chokidar.watch('./tiddlers', {
    persistent: true,
    ignoreInitial: true, // Don't trigger on initial load
    awaitWriteFinish: {
        stabilityThreshold: 2000, // Wait 2 seconds after the last file change
        pollInterval: 100,
    },
});

console.log('Watching for TidGi sync events...');

// Rebuild function
function rebuildWiki() {
    if (syncInProgress) return; // Prevent overlapping builds
    syncInProgress = true;

    console.log('TidGi sync detected. Rebuilding index...');

    // Run the TiddlyWiki build command
    exec('tiddlywiki . --build index', (err, stdout, stderr) => {
        if (err) {
            console.error(`Build Error: ${err.message}`);
            syncInProgress = false;
            return;
        }
        console.log('Build completed.');

        // Push changes to GitHub
        exec('git add . && git commit -m "Auto-update index.html" && git push', (gitErr, gitStdout, gitStderr) => {
            if (gitErr) {
                console.error(`Git Error: ${gitErr.message}`);
                syncInProgress = false;
                return;
            }
            console.log('Changes pushed to GitHub.');
            syncInProgress = false; // Allow new sync-triggered builds
        });
    });
}

// Watcher event handler
watcher.on('all', (event, path) => {
    console.log(`${event} detected at ${path}`);
    clearTimeout(debounceTimer); // Reset debounce timer
    debounceTimer = setTimeout(() => {
        rebuildWiki();
    }, 3000); // Wait 3 seconds after the last file change before triggering
});
