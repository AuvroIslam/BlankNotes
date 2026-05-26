import React from 'react'
import { useNoteStore } from '../../stores/note.store'
import { toAssetUrl } from '../../lib/api'
import type { ImageAttachment } from '@shared/types'

interface Props {
  attachment: ImageAttachment
  pageNumber: number
}

export function AttachmentItem({ attachment, pageNumber }: Props): React.ReactElement {
  const removeAttachment = useNoteStore((s) => s.removeAttachment)

  const fileUrl = toAssetUrl(attachment.storedPath)

  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
      border: '1px solid #dee2e6',
      borderRadius: 6,
      overflow: 'hidden',
      background: '#f8f9fa'
    }}>
      <img
        src={fileUrl}
        alt={attachment.fileName}
        style={{
          maxWidth: '100%',
          maxHeight: 180,
          display: 'block',
          objectFit: 'contain'
        }}
      />
      <div style={{
        padding: '4px 8px',
        fontSize: 11,
        color: '#868e96',
        borderTop: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 160
        }}>
          {attachment.fileName}
        </span>
        <button
          onClick={() => removeAttachment(attachment.id, pageNumber)}
          style={{
            color: '#dc2626',
            fontSize: 13,
            padding: '0 4px',
            borderRadius: 3,
            flexShrink: 0
          }}
          title="Remove attachment"
        >
          ×
        </button>
      </div>
    </div>
  )
}
