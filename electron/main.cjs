const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow = null
let pendingFile = null

// ── Single instance ──────────────────────────────────────────────

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
  return
}

// ── File from CLI args ───────────────────────────────────────────

function getFileFromArgs(args) {
  for (const arg of args) {
    if (/\.(refile|repic|revid|remusic)$/i.test(arg)) {
      return arg
    }
  }
  return null
}

pendingFile = getFileFromArgs(process.argv.slice(1))

app.on('second-instance', (_event, args) => {
  const file = getFileFromArgs(args.slice(1))
  if (file && mainWindow) {
    mainWindow.webContents.send('open-file', file)
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

// ── Window ───────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 400,
    minHeight: 300,
    frame: false,
    backgroundColor: '#09090b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  if (pendingFile) {
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('open-file', pendingFile)
      pendingFile = null
    })
  }
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())

// ── IPC: Read pointer file ───────────────────────────────────────

ipcMain.handle('read-pointer', async (_event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(content)

    // Normalize to consistent shape (handles v1 + v2 + legacy)
    const pointer = {
      v: data.v ?? 1,
      type: data.type ?? 'refile',
      mime: data.mime ?? 'application/octet-stream',
      url: data.url,
      hash: data.hash ?? '',
      size: data.size ?? 0,
      name: data.name ?? path.basename(filePath),
      createdAt: data.createdAt ?? Date.now(),
      backend: data.backend,
      meta: data.meta,
    }

    return { success: true, data: pointer, path: filePath }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ── IPC: Open file dialog ────────────────────────────────────────

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [
      { name: 'Virtual Files', extensions: ['refile', 'repic', 'revid', 'remusic'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  })
  return result.canceled ? null : result.filePaths[0]
})

// ── IPC: Open URL in browser ─────────────────────────────────────

ipcMain.handle('open-external', async (_event, url) => {
  if (typeof url !== 'string') return
  await shell.openExternal(url)
})

// ── IPC: Download / save file ────────────────────────────────────

ipcMain.handle('save-file', async (_event, { url, defaultName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
  })
  if (result.canceled) return { success: false }

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(result.filePath, buffer)
    return { success: true, path: result.filePath }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ── IPC: Window controls ─────────────────────────────────────────

ipcMain.handle('window-minimize', () => mainWindow?.minimize())
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.handle('window-close', () => mainWindow?.close())
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false)
