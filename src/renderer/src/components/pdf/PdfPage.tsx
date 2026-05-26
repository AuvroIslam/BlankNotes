import React, { useState } from 'react'
import { Page } from 'react-pdf'
import { AnnotationCanvas } from './AnnotationCanvas'

interface Props {
  documentId: string
  pageNumber: number
  scale: number
}

export function PdfPage({ documentId, pageNumber, scale }: Props): React.ReactElement {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        borderRadius: 2
      }}
    >
      <Page
        pageNumber={pageNumber}
        scale={scale}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        onRenderSuccess={(page) => {
          const vp = page.getViewport({ scale })
          setDimensions({ width: vp.width, height: vp.height })
        }}
      />
      {dimensions && (
        <AnnotationCanvas
          documentId={documentId}
          pageNumber={pageNumber}
          width={dimensions.width}
          height={dimensions.height}
        />
      )}
    </div>
  )
}
