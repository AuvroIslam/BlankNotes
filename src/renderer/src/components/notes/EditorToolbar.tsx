import React from 'react'
import type { Editor } from '@tiptap/react'

interface Props {
  editor: Editor
  onInsertImage?: () => void
}

const TEXT_COLORS = [
  { label: 'Black', value: '#1a1a1a' },
  { label: 'Blue', value: '#1a56db' },
  { label: 'Green', value: '#057a55' }
]

const HIGHLIGHT_COLORS = [
  { label: 'None', value: null },
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Pink', value: '#fbb6ce' }
]

const FONT_SIZES = [
  { label: 'S', value: '13px' },
  { label: 'M', value: '16px' },
  { label: 'L', value: '20px' }
]

const FONTS = [
  { label: 'Inter', value: 'Inter' },
  { label: 'IBM Plex', value: 'IBM Plex Sans' },
  { label: 'Source', value: 'Source Sans 3' }
]

function ToolbarDivider(): React.ReactElement {
  return <div style={{ width: 1, height: 20, background: '#e9ecef', margin: '0 4px' }} />
}

function ToolBtn({
  active,
  onClick,
  title,
  children
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 28,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? '#eff6ff' : 'transparent',
        color: active ? '#2563eb' : '#495057',
        fontSize: 13,
        fontWeight: 600,
        border: active ? '1px solid #bfdbfe' : '1px solid transparent'
      }}
    >
      {children}
    </button>
  )
}

export function EditorToolbar({ editor, onInsertImage }: Props): React.ReactElement {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      padding: '4px 8px',
      borderBottom: '1px solid #e9ecef',
      background: '#fff',
      flexWrap: 'wrap',
      minHeight: 40
    }}>
      {/* Bold */}
      <ToolBtn
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        B
      </ToolBtn>

      <ToolbarDivider />

      {/* Text color */}
      {TEXT_COLORS.map((c) => (
        <button
          key={c.value}
          title={`${c.label} text`}
          onClick={() => editor.chain().focus().setColor(c.value).run()}
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: c.value,
            border: editor.isActive('textStyle', { color: c.value })
              ? '2px solid #2563eb'
              : '2px solid transparent',
            cursor: 'pointer',
            flexShrink: 0
          }}
        />
      ))}

      <ToolbarDivider />

      {/* Highlight */}
      {HIGHLIGHT_COLORS.map((c) => (
        <button
          key={c.value ?? 'none'}
          title={`${c.label} highlight`}
          onClick={() => {
            if (c.value === null) {
              editor.chain().focus().unsetHighlight().run()
            } else {
              editor.chain().focus().setHighlight({ color: c.value }).run()
            }
          }}
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background: c.value ?? '#fff',
            border: c.value === null
              ? '1px solid #dee2e6'
              : editor.isActive('highlight', { color: c.value })
                ? '2px solid #2563eb'
                : '1px solid #dee2e6',
            cursor: 'pointer',
            flexShrink: 0,
            fontSize: c.value === null ? 10 : 0,
            color: '#868e96'
          }}
        >
          {c.value === null ? '×' : ''}
        </button>
      ))}

      <ToolbarDivider />

      {/* Font size */}
      {FONT_SIZES.map((s) => (
        <ToolBtn
          key={s.value}
          active={editor.isActive('textStyle', { fontSize: s.value })}
          onClick={() => editor.chain().focus().setMark('textStyle', { fontSize: s.value }).run()}
          title={`${s.label} text`}
        >
          {s.label}
        </ToolBtn>
      ))}

      <ToolbarDivider />

      {/* Font family */}
      <select
        value={
          FONTS.find((f) => editor.isActive('textStyle', { fontFamily: f.value }))?.value ||
          'Inter'
        }
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        style={{
          fontSize: 11,
          border: '1px solid #dee2e6',
          borderRadius: 4,
          padding: '2px 4px',
          background: '#fff',
          color: '#495057',
          cursor: 'pointer',
          height: 24
        }}
      >
        {FONTS.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>

      <ToolbarDivider />

      {/* Bullet list */}
      <ToolBtn
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        ≡
      </ToolBtn>

      <ToolbarDivider />

      {/* Insert image */}
      {onInsertImage && (
        <button
          onClick={onInsertImage}
          title="Insert image (also: paste from clipboard or drag a file)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 4,
            background: 'transparent',
            color: '#495057',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            border: '1px solid #dee2e6'
          }}
        >
          <span style={{ fontSize: 13 }}>🖼</span>
          <span>Image</span>
        </button>
      )}
    </div>
  )
}
