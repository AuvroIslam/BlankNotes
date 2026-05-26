import { app, BrowserWindow, shell, protocol, net } from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'
import { registerAllHandlers } from './ipc/index'
import { buildMenu } from './menu'
import { initDb, closeDb } from './db/index'

// Register a privileged custom protocol so the renderer can fetch local files
// from userData without hitting webSecurity / file:// origin restrictions.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'bn-file',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true
    }
  }
])

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#f8f9fa',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  // Initialize SQLite database before registering IPC handlers
  await initDb()

  // Serve files from userData (documents/, attachments/) via the bn-file:// scheme.
  // URL format: bn-file://documents/<uuid>.pdf or bn-file://attachments/<uuid>.<ext>
  protocol.handle('bn-file', (request) => {
    const rest = request.url.slice('bn-file://'.length)
    const cleaned = decodeURIComponent(rest.replace(/\?.*$/, ''))
    const filePath = path.join(app.getPath('userData'), cleaned)
    return net.fetch(pathToFileURL(filePath).toString())
  })

  registerAllHandlers()
  buildMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  closeDb()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
