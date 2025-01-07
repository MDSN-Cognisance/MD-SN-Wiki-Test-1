const chokidar = require('chokidar');
const { spawn } = require('child_process');

let isSyncing = false; // Prevent overlapping sync-triggered builds
let syncDebounceTimeout; // Debounce multiple file changes during a single sync

// Watch the "tiddlers" folder for changes caused by TidGi syncs
const watcher = chokidar.watch('./tiddlers', {
    persistent: true,
    ignoreInitial: true, // Don't trigger events for existing files on startup
    awaitWriteFinish: {
        stabilityThreshold: 500, // Wait for file changes to stabilize
        pollInterval: 100,
    },
});

console.log('Watching for TidGi sync activity...');

watcher.on('all', (event, path) => {
    console.log(`${event} detected in ${path}.`);
    
    // Debounce to prevent triggering multiple times during a single sync
    clearTimeout(syncDebounceTimeout);
    syncDebounceTimeout = setTimeout(() => {
        if (isSyncing) return;
        isSyncing = true;

        console.log('TidGi sync detected. Starting rebuild process...');

        // Run the TiddlyWiki build command
        const buildProcess = spawn('tiddlywiki', ['.', '--build', 'index'], {
            detached: true,
            stdio: 'ignore', // Suppress output
        });

        buildProcess.on('close', (code) => {
            console.log(`Build process completed with code ${code}.`);

            // Push changes to GitHub
            const gitProcess = spawn('git', ['add', '.', '&&', 'git', 'commit', '-m', '"Auto-update index.html"', '&&', 'git', 'push'], {
                shell: true,
                detached: true,
                stdio: 'ignore', // Suppress output
            });

            gitProcess.on('close', (gitCode) => {
                console.log(`Git process completed with code ${gitCode}.`);
                isSyncing = false; // Allow the next sync-triggered build
            });
        });
    }, 2000); // Debounce period: wait 2 seconds after last file change
});
