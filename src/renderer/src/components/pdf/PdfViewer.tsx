import React, { useState } from 'react'
import { Document, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { PdfPage } from './PdfPage'
import { useWorkspaceStore } from '../../stores/workspace.store'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { toAssetUrl } from '../../lib/api'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

interface Props {
  pdfPath: string
  documentId: string
}

export function PdfViewer({ pdfPath, documentId }: Props): React.ReactElement {
  const currentPage = useWorkspaceStore((s) => s.currentPage)
  const zoomScale = useWorkspaceStore((s) => s.zoomScale)
  const setTotalPages = useWorkspaceStore((s) => s.setTotalPages)
  const [loadError, setLoadError] = useState<string | null>(null)

  const fileUrl = toAssetUrl(pdfPath)

  return (
    <Document
      file={fileUrl}
      loading={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <LoadingSpinner message="Loading PDF..." />
        </div>
      }
      error={
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 8,
          color: '#dc2626'
        }}>
          <span style={{ fontSize: 24 }}>⚠</span>
          <span style={{ fontSize: 13 }}>Failed to load PDF</span>
          {loadError && <span style={{ fontSize: 11, color: '#868e96' }}>{loadError}</span>}
        </div>
      }
      onLoadSuccess={({ numPages }) => {
        setTotalPages(numPages)
        setLoadError(null)
      }}
      onLoadError={(err) => setLoadError(err.message)}
    >
      <PdfPage
        documentId={documentId}
        pageNumber={currentPage}
        scale={zoomScale}
      />
    </Document>
  )
}
