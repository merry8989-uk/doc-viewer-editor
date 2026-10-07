// DocForge desktop wrapper (Electron).
// Run with:  npm install   then   npm start
// Package an installer with:  npm run dist   (needs electron-builder)
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f1117',
    title: 'DocForge',
    autoHideMenuBar: true,
    webPreferences: {
      // the app is pure client-side; keep the renderer sandboxed
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, '..', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
