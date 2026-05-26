import { ipcMain } from 'electron'
import {
  listAnnotations,
  listAllAnnotationsForDocument,
  upsertAnnotation,
  deleteAnnotation
} from '../db/annotation.repo'
import type { Annotation } from '../../shared/types'

export function registerAnnotationHandlers(): void {
  ipcMain.handle(
    'blanknotes:annotation:list',
    async (_, documentId: string, pageNumber: number) => {
      return listAnnotations(documentId, pageNumber)
    }
  )

  ipcMain.handle('blanknotes:annotation:list-all', async (_, documentId: string) => {
    return listAllAnnotationsForDocument(documentId)
  })

  ipcMain.handle(
    'blanknotes:annotation:upsert',
    async (_, annotation: Omit<Annotation, 'createdAt' | 'updatedAt'>) => {
      return upsertAnnotation(annotation)
    }
  )

  ipcMain.handle('blanknotes:annotation:delete', async (_, id: string) => {
    deleteAnnotation(id)
    return { success: true }
  })
}
