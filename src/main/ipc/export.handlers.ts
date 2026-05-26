import { ipcMain, dialog, BrowserWindow } from 'electron'
import { runExport } from '../services/export.service'

export function registerExportHandlers(): void {
  ipcMain.handle('blanknotes:export:choose-path', async (_, suggestedName: string) => {
    const result = await dialog.showSaveDialog({
      title: 'Export Study Document',
      defaultPath: suggestedName,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    })
    return { filePath: result.filePath ?? null }
  })

  ipcMain.handle(
    'blanknotes:export:start',
    async (event, documentId: string, outputPath: string) => {
      const win = BrowserWindow.fromWebContents(event.sender)

      try {
        await runExport(documentId, outputPath, (progress) => {
          win?.webContents.send('blanknotes:export:progress', progress)
        })

        win?.webContents.send('blanknotes:export:complete', {
          success: true,
          outputPath
        })
        return { success: true, outputPath }
      } catch (err) {
        const message = (err as Error).message
        win?.webContents.send('blanknotes:export:complete', {
          success: false,
          error: message
        })
        return { success: false, outputPath: '' }
      }
    }
  )
}
