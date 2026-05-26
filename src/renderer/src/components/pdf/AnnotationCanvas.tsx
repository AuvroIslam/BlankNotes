import React, { useEffect, useRef } from 'react'
import { useAnnotationStore } from '../../stores/annotation.store'
import { useWorkspaceStore } from '../../stores/workspace.store'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  documentId: string
  pageNumber: number
  width: number
  height: number
}

export function AnnotationCanvas({
  documentId,
  pageNumber,
  width,
  height
}: Props): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<import('fabric').Canvas | null>(null)
  const activeTool = useWorkspaceStore((s) => s.activeTool)
  const activeColor = useWorkspaceStore((s) => s.activeHighlightColor)
  const { annotations, upsertAnnotation, deleteAnnotation } = useAnnotationStore()

  // Keep refs to the latest tool/color so handlers always see fresh values
  // (Fabric handlers persist across renders).
  const activeToolRef = useRef(activeTool)
  const activeColorRef = useRef(activeColor)
  useEffect(() => {
    activeToolRef.current = activeTool
    activeColorRef.current = activeColor
  }, [activeTool, activeColor])

  const pageAnnotations = annotations[pageNumber] || []

  // Initialize Fabric canvas + wire up event handlers once per page.
  useEffect(() => {
    if (!canvasRef.current) return
    let cancelled = false

    const init = async (): Promise<void> => {
      const { Canvas, Rect, IText } = await import('fabric')
      if (cancelled) return

      if (fabricRef.current) {
        fabricRef.current.dispose()
        fabricRef.current = null
      }

      const fc = new Canvas(canvasRef.current!, {
        width,
        height,
        selection: true,
        preserveObjectStacking: true,
        backgroundColor: 'transparent'
      })
      fabricRef.current = fc

      // Load existing annotations for the page
      for (const ann of pageAnnotations) {
        try {
          const objData = JSON.parse(ann.fabricJson)
          if (ann.type === 'highlight') {
            const rect = new Rect({ ...objData, selectable: true, evented: true })
            ;(rect as unknown as Record<string, unknown>).id = ann.id
            ;(rect as unknown as Record<string, unknown>).annotationType = 'highlight'
            fc.add(rect)
          } else if (ann.type === 'text-note') {
            const itext = new IText(ann.text || '', {
              ...objData,
              selectable: true,
              evented: true
            })
            ;(itext as unknown as Record<string, unknown>).id = ann.id
            ;(itext as unknown as Record<string, unknown>).annotationType = 'text-note'
            fc.add(itext)
          }
        } catch {
          // Skip malformed annotation data
        }
      }
      fc.renderAll()

      // === Drawing state for click-and-drag highlights ===
      let drawing = false
      let startX = 0
      let startY = 0
      let previewRect: import('fabric').Rect | null = null

      fc.on('mouse:down', async (e) => {
        const tool = activeToolRef.current
        const color = activeColorRef.current
        if (tool === 'pointer') return
        if (e.target) return // clicked on an existing object

        const pointer = fc.getPointer(e.e)

        if (tool === 'highlight') {
          drawing = true
          startX = pointer.x
          startY = pointer.y
          previewRect = new Rect({
            left: startX,
            top: startY,
            width: 1,
            height: 1,
            fill: color,
            opacity: 1,
            strokeWidth: 0,
            selectable: false,
            evented: false
          })
          fc.add(previewRect)
        } else if (tool === 'text-note') {
          const id = uuidv4()
          const color = activeColorRef.current
          const itext = new IText('Note', {
            left: pointer.x,
            top: pointer.y,
            fontSize: 13,
            fill: '#1a1a2e',
            backgroundColor: color,
            padding: 6,
            selectable: true,
            editable: true
          })
          ;(itext as unknown as Record<string, unknown>).id = id
          ;(itext as unknown as Record<string, unknown>).annotationType = 'text-note'
          fc.add(itext)
          fc.setActiveObject(itext)
          itext.enterEditing()
          itext.selectAll()
          fc.renderAll()

          const bounds = itext.getBoundingRect()
          await upsertAnnotation({
            id,
            documentId,
            pageNumber,
            type: 'text-note',
            fabricJson: JSON.stringify(itext.toObject(['id', 'annotationType'])),
            normX: bounds.left / fc.width!,
            normY: bounds.top / fc.height!,
            normWidth: bounds.width / fc.width!,
            normHeight: bounds.height / fc.height!,
            color: color,
            text: 'Note'
          })
        }
      })

      fc.on('mouse:move', (e) => {
        if (!drawing || !previewRect) return
        const pointer = fc.getPointer(e.e)
        previewRect.set({
          left: Math.min(startX, pointer.x),
          top: Math.min(startY, pointer.y),
          width: Math.abs(pointer.x - startX),
          height: Math.abs(pointer.y - startY)
        })
        fc.renderAll()
      })

      fc.on('mouse:up', async () => {
        if (!drawing || !previewRect) return
        drawing = false
        const w = previewRect.width || 0
        const h = previewRect.height || 0
        // Discard tiny accidental clicks; require a real drag
        if (w < 6 || h < 4) {
          fc.remove(previewRect)
          previewRect = null
          return
        }
        previewRect.set({ selectable: true, evented: true })
        const id = uuidv4()
        ;(previewRect as unknown as Record<string, unknown>).id = id
        ;(previewRect as unknown as Record<string, unknown>).annotationType = 'highlight'
        fc.renderAll()

        const bounds = previewRect.getBoundingRect()
        await upsertAnnotation({
          id,
          documentId,
          pageNumber,
          type: 'highlight',
          fabricJson: JSON.stringify(previewRect.toObject(['id', 'annotationType'])),
          normX: bounds.left / fc.width!,
          normY: bounds.top / fc.height!,
          normWidth: bounds.width / fc.width!,
          normHeight: bounds.height / fc.height!,
          color: (previewRect.fill as string) || activeColorRef.current,
          text: null
        })
        previewRect = null
      })

      // Persist edits to existing annotations (move / resize / re-text)
      fc.on('object:modified', async (e) => {
        const obj = e.target
        if (!obj) return
        const id = (obj as unknown as Record<string, unknown>).id as string | undefined
        if (!id) return
        const annType = (obj as unknown as Record<string, unknown>).annotationType as string
        const bounds = obj.getBoundingRect()
        await upsertAnnotation({
          id,
          documentId,
          pageNumber,
          type: annType === 'text-note' ? 'text-note' : 'highlight',
          fabricJson: JSON.stringify(obj.toObject(['id', 'annotationType'])),
          normX: bounds.left / fc.width!,
          normY: bounds.top / fc.height!,
          normWidth: bounds.width / fc.width!,
          normHeight: bounds.height / fc.height!,
          color: ((obj as unknown as Record<string, unknown>).fill as string) || activeColorRef.current,
          text:
            annType === 'text-note' ? (obj as unknown as { text?: string }).text || null : null
        })
      })
    }

    init()
    return () => {
      cancelled = true
      if (fabricRef.current) {
        fabricRef.current.dispose()
        fabricRef.current = null
      }
    }
  }, [pageNumber, documentId, width, height])

  // Delete selected annotation with Delete/Backspace key
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent): Promise<void> => {
      if (!(e.key === 'Delete' || e.key === 'Backspace')) return
      if (!fabricRef.current) return
      const active = fabricRef.current.getActiveObject()
      if (!active) return
      // Don't fight with editing context
      const el = document.activeElement
      if (
        el?.tagName === 'INPUT' ||
        el?.tagName === 'TEXTAREA' ||
        el?.closest?.('.ProseMirror')
      )
        return
      const id = (active as unknown as Record<string, unknown>).id as string | undefined
      if (!id) return
      await deleteAnnotation(id, pageNumber)
      fabricRef.current.remove(active)
      fabricRef.current.renderAll()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteAnnotation, pageNumber])

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: activeTool === 'pointer' ? 'auto' : 'all',
        cursor:
          activeTool === 'highlight'
            ? 'crosshair'
            : activeTool === 'text-note'
              ? 'text'
              : 'default'
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  )
}
