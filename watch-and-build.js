const chokidar = require('chokidar');
const { exec } = require('child_process');

// Watch the 'tiddlers' folder for changes
const watcher = chokidar.watch('./tiddlers', {
    persistent: true,
    ignoreInitial: true
});

console.log('Watching for changes in the tiddlers folder...');

// Trigger rebuild when a change is detected
watcher.on('all', (event, path) => {
    console.log(`${event} detected in ${path}. Rebuilding index...`);
    exec('tiddlywiki . --build index', (err, stdout, stderr) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Build Output: ${stdout}`);
    });
});
