import { registerDocumentHandlers } from './document.handlers'
import { registerNoteHandlers } from './note.handlers'
import { registerAnnotationHandlers } from './annotation.handlers'
import { registerAttachmentHandlers } from './attachment.handlers'
import { registerExportHandlers } from './export.handlers'
import { registerSettingsHandlers } from './settings.handlers'

export function registerAllHandlers(): void {
  registerDocumentHandlers()
  registerNoteHandlers()
  registerAnnotationHandlers()
  registerAttachmentHandlers()
  registerExportHandlers()
  registerSettingsHandlers()
}
