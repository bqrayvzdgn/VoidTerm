// Launch Electron with ELECTRON_RUN_AS_NODE cleared.
// VSCode sets ELECTRON_RUN_AS_NODE=1 which prevents Electron from
// initializing its browser process APIs (app, BrowserWindow, etc.).
const { spawn } = require('child_process')
const electronPath = require('electron')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const child = spawn(electronPath, ['.'], { stdio: 'inherit', env })
child.on('close', (code) => process.exit(code ?? 1))
