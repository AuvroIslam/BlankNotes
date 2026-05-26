import React, { useRef } from 'react'
import { Image as TiptapImage } from '@tiptap/extension-image'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps): React.ReactElement {
  const imgRef = useRef<HTMLImageElement>(null)

  const handleResizeStart = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = imgRef.current?.offsetWidth || 200

    const handleMove = (ev: MouseEvent): void => {
      const delta = ev.clientX - startX
      const newWidth = Math.max(60, startWidth + delta)
      updateAttributes({ width: Math.round(newWidth) })
    }

    const handleUp = (): void => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  const width = node.attrs.width as number | null

  return (
    <NodeViewWrapper
      as="div"
      data-drag-handle
      style={{
        display: 'inline-block',
        position: 'relative',
        margin: '6px 0',
        maxWidth: '100%',
        outline: selected ? '2px solid #2563eb' : '2px solid transparent',
        borderRadius: 4,
        verticalAlign: 'middle'
      }}
    >
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        title={node.attrs.title || ''}
        draggable={false}
        style={{
          width: width ? `${width}px` : 'auto',
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          borderRadius: 2,
          userSelect: 'none'
        }}
      />
      {selected && (
        <div
          onMouseDown={handleResizeStart}
          title="Drag to resize"
          style={{
            position: 'absolute',
            right: -7,
            bottom: -7,
            width: 14,
            height: 14,
            background: '#2563eb',
            border: '2px solid white',
            borderRadius: '50%',
            cursor: 'nwse-resize',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)'
          }}
        />
      )}
    </NodeViewWrapper>
  )
}

export const ResizableImage = TiptapImage.extend({
  name: 'image',
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const w = el.getAttribute('width') || el.style.width
          if (!w) return null
          const num = parseInt(String(w).replace('px', ''), 10)
          return Number.isFinite(num) ? num : null
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          return {
            width: attributes.width,
            style: `width: ${attributes.width}px`
          }
        }
      }
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView)
  }
})
