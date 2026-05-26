import React, { useCallback, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'
import { FontFamily } from '@tiptap/extension-font-family'
import { Extension } from '@tiptap/core'
import { useNoteStore } from '../../stores/note.store'
import { EditorToolbar } from './EditorToolbar'
import { ResizableImage } from './ResizableImage'
import { toAssetUrl } from '../../lib/api'
import '../../styles/editor.css'

// Custom extension for font size via textStyle
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            }
          }
        }
      }
    ]
  }
})

interface Props {
  documentId: string
  pageNumber: number
}

export function NoteEditor({ documentId, pageNumber }: Props): React.ReactElement {
  const { notes, loadNote, saveNote } = useNoteStore()
  const note = notes[pageNumber]
  const isLoaded = pageNumber in notes
  const prevPageRef = useRef<number | null>(null)

  // Refs that always hold the latest values for closure use inside editorProps
  const noteIdRef = useRef<string | undefined>(note?.id)
  const documentIdRef = useRef(documentId)
  const pageNumberRef = useRef(pageNumber)
  useEffect(() => { noteIdRef.current = note?.id }, [note?.id])
  useEffect(() => { documentIdRef.current = documentId }, [documentId])
  useEffect(() => { pageNumberRef.current = pageNumber }, [pageNumber])

  // We need a stable reference to "insert image file" usable inside ProseMirror handlers,
  // but the handler is built before `editor` exists. Use a ref that we update later.
  const insertImageFileRef = useRef<(file: File, pos?: number) => Promise<void>>(async () => {})

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, code: false, codeBlock: false, blockquote: false }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      FontSize,
      ResizableImage.configure({ inline: false, allowBase64: false })
    ],
    content: '',
    onUpdate: ({ editor: e }) => {
      const json = JSON.stringify(e.getJSON())
      saveNote(documentIdRef.current, pageNumberRef.current, json)
    },
    editorProps: {
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false
        const files: File[] = []
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            const f = item.getAsFile()
            if (f) files.push(f)
          }
        }
        if (files.length === 0) return false
        event.preventDefault()
        files.forEach((f) => {
          insertImageFileRef.current(f).catch(() => { /* swallow */ })
        })
        return true
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false
        const dragEvent = event as DragEvent
        const files = dragEvent.dataTransfer?.files
        if (!files || files.length === 0) return false
        const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
        if (imageFiles.length === 0) return false
        event.preventDefault()
        const dropPos = view.posAtCoords({ left: dragEvent.clientX, top: dragEvent.clientY })?.pos
        imageFiles.forEach((f) => {
          insertImageFileRef.current(f, dropPos).catch(() => { /* swallow */ })
        })
        return true
      }
    }
  })

  // Insert an image File into the editor at the given position (or at the current cursor)
  const insertImageFile = useCallback(
    async (file: File, pos?: number): Promise<void> => {
      if (!editor) return
      let resolvedNoteId = noteIdRef.current
      if (!resolvedNoteId) {
        const n = await window.api.upsertNote(documentIdRef.current, pageNumberRef.current, '{}')
        resolvedNoteId = n.id
        noteIdRef.current = n.id
      }
      const buffer = await file.arrayBuffer()
      const att = await window.api.addAttachmentBytes(
        resolvedNoteId,
        documentIdRef.current,
        pageNumberRef.current,
        new Uint8Array(buffer),
        file.name || `image-${Date.now()}.png`,
        file.type || 'image/png'
      )
      const url = toAssetUrl(att.storedPath)
      if (pos !== undefined) {
        editor
          .chain()
          .insertContentAt(pos, { type: 'image', attrs: { src: url, alt: att.fileName } })
          .focus()
          .run()
      } else {
        editor.chain().focus().setImage({ src: url, alt: att.fileName }).run()
      }
    },
    [editor]
  )

  // Keep the ref pointing to the latest insertImageFile so ProseMirror handlers can use it.
  useEffect(() => {
    insertImageFileRef.current = insertImageFile
  }, [insertImageFile])

  // Toolbar handler: open native file dialog, then insert each chosen image at cursor.
  const handleToolbarInsertImage = useCallback(async (): Promise<void> => {
    if (!editor) return
    let resolvedNoteId = noteIdRef.current
    if (!resolvedNoteId) {
      const n = await window.api.upsertNote(documentId, pageNumber, '{}')
      resolvedNoteId = n.id
      noteIdRef.current = n.id
    }
    const atts = await window.api.chooseAndSaveAttachment(resolvedNoteId, documentId, pageNumber)
    for (const att of atts) {
      const url = toAssetUrl(att.storedPath)
      editor.chain().focus().setImage({ src: url, alt: att.fileName }).run()
    }
  }, [editor, documentId, pageNumber])

  // Load note when page changes
  useEffect(() => {
    if (prevPageRef.current !== pageNumber) {
      prevPageRef.current = pageNumber
      loadNote(documentId, pageNumber)
    }
  }, [documentId, pageNumber, loadNote])

  // Sync note content into editor when loaded
  useEffect(() => {
    if (!editor || !isLoaded) return
    const contentJson = note?.contentJson
    if (!contentJson || contentJson === '{}') {
      editor.commands.setContent('')
      return
    }
    try {
      const parsed = JSON.parse(contentJson)
      const current = JSON.stringify(editor.getJSON())
      if (current !== contentJson) {
        editor.commands.setContent(parsed, false)
      }
    } catch {
      editor.commands.setContent('')
    }
  }, [note?.contentJson, isLoaded, editor])

  // Click anywhere in the scroll area to focus the editor at the end of the content
  const handleScrollAreaClick = (e: React.MouseEvent): void => {
    if (!editor) return
    if (e.target === e.currentTarget) {
      editor.commands.focus('end')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {editor && (
        <EditorToolbar editor={editor} onInsertImage={handleToolbarInsertImage} />
      )}
      <div
        className="editor-scroll-area"
        onClick={handleScrollAreaClick}
        style={{
          flex: 1,
          overflowY: 'auto',
          background: '#fff',
          position: 'relative',
          cursor: 'text'
        }}
      >
        <EditorContent editor={editor} />
        {!isLoaded && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <span style={{ fontSize: 12, color: '#868e96' }}>Loading...</span>
          </div>
        )}
      </div>
    </div>
  )
}
