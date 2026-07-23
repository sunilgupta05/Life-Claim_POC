import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useToast } from '../../Toast'
import documentService, { FORBIDDEN_DOC_MSG } from '../../../services/documentService'
import fileUploadService from '../../../services/FileUploadService'
import { openDocumentPreview, openPreviewLoadingTab } from '../../../services/documentPreviewService'
import { useTheme } from '../../../context/ThemeContext'
import { useWorkspaceTokens } from './workspaceUi'
import { validateUploadFile, UPLOAD_ACCEPT } from '../../../util/validateUploadFile'

function mapDocType(row) {
  const type = row.documentType || row.DOCUMENT_TYPE || row.name || ''
  return {
    id: row.documentListId ?? row.id ?? type,
    type: String(type).trim(),
  }
}

function mapUploaded(row) {
  return {
    fileName: row.fileName || row.FILE_NAME || 'Document',
    documentType: row.documentType || row.DOCUMENT_TYPE || 'Supporting Document',
    alfrescoFileId: row.AlfrescoFileId || row.alfrescoFileId || row.nodeId,
    uploadedOn: (row.uploadedOn || row.UPLOADED_ON || '').toString().split('T')[0] || '',
  }
}

function groupUploaded(uploaded, masterTypes) {
  const groups = {}
  masterTypes.forEach(({ type }) => {
    if (type) groups[type] = []
  })
  uploaded.forEach((doc) => {
    const key = doc.documentType || 'Other'
    if (!groups[key]) groups[key] = []
    groups[key].push(doc)
  })
  return groups
}

function UploadModal({ open, onClose, docTypes, claimId, onUploaded }) {
  const WS = useWorkspaceTokens()
  const toast = useToast()
  const inputRef = useRef(null)
  const [selectedType, setSelectedType] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!open) return
    const first = docTypes[0]?.type || ''
    setSelectedType(first)
    setFile(null)
  }, [open, docTypes])

  if (!open) return null

  const pickFile = (files) => {
    const f = files?.[0]
    if (!f) return
    const check = validateUploadFile(f)
    if (!check.valid) {
      toast('warning', 'Invalid file', check.message)
      return
    }
    setFile(f)
  }

  const handleUpload = async () => {
    if (!claimId) {
      toast('warning', 'Missing claim', 'Claim number is required before uploading documents.')
      return
    }
    if (!selectedType) {
      toast('warning', 'Document type', 'Select a document type.')
      return
    }
    if (!file) {
      toast('warning', 'No file', 'Choose one file to upload.')
      return
    }
    const fileCheck = validateUploadFile(file)
    if (!fileCheck.valid) {
      toast('warning', 'Invalid file', fileCheck.message)
      return
    }
    setUploading(true)
    try {
      const res = await fileUploadService.fileUpload({
        claimNo: claimId,
        documentType: selectedType,
        documentId: String(docTypes.find((d) => d.type === selectedType)?.id ?? selectedType),
        files: [file],
      })
      toast('success', 'Uploaded', res?.message || `${file.name} uploaded.`)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      onUploaded()
      onClose()
    } catch (e) {
      const msg = e?.message || 'Upload failed.'
      if (e?.status === 409 || msg.toLowerCase().includes('already exists')) {
        toast('error', 'Duplicate file', 'A file with this name already exists for this claim.')
      } else if (e?.status === 403) {
        toast('error', 'Access denied', 'You are not allowed to upload documents for this claim.')
      } else if (e?.status === 400) {
        toast('error', 'Upload rejected', msg)
      } else {
        toast('error', 'Upload failed', msg)
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 320, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <div
        style={{ background: WS.card, borderRadius: '14px', width: 'min(480px, 100%)', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${WS.border}` }}>
          <div style={{ fontWeight: 800, fontSize: '15px' }}>Select the document to upload</div>
          <div style={{ fontSize: '12px', color: WS.textMuted, marginTop: '4px' }}>Claim {claimId} · one file per upload</div>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: WS.textSubtle, textTransform: 'uppercase', marginBottom: '10px' }}>Document type</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
            {docTypes.length === 0 ? (
              <div style={{ fontSize: '12px', color: WS.textMuted }}>No types in DocumentList master.</div>
            ) : (
              docTypes.map(({ type, id }) => (
                <label key={id || type} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${selectedType === type ? WS.primary : WS.border}`, background: selectedType === type ? WS.primaryLight : WS.surfaceSubtle }}>
                  <input type="radio" name="docType" checked={selectedType === type} onChange={() => setSelectedType(type)} />
                  <span style={{ fontWeight: 600, color: WS.textSecondary }}>{type}</span>
                </label>
              ))
            )}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: WS.textSubtle, textTransform: 'uppercase', marginBottom: '8px' }}>File</div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `2px dashed ${WS.border}`, background: WS.surfaceSubtle, fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', color: WS.textMuted }}
          >
            {file ? file.name : 'Browse…'}
          </button>
          <input ref={inputRef} type="file" accept={UPLOAD_ACCEPT} style={{ display: 'none' }} onChange={(e) => pickFile(e.target.files)} />
          <p style={{ fontSize: '11px', color: WS.textSubtle, marginTop: '8px' }}>PDF, images, Office, CSV, ZIP · max 10 MB</p>
        </div>
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${WS.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', border: `1px solid ${WS.border}`, background: WS.hoverBg, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !file || !selectedType}
            style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: uploading ? '#94A3B8' : WS.primary, color: '#fff', fontWeight: 700, cursor: uploading ? 'wait' : 'pointer', fontFamily: 'Inter,sans-serif' }}
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DocumentSideSlider({ open, onClose, claimId, readOnly }) {
  const WS = useWorkspaceTokens()
  const { tokens: T } = useTheme()
  const toast = useToast()
  const [docTypes, setDocTypes] = useState([])
  const [uploaded, setUploaded] = useState([])
  const [loading, setLoading] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [previewing, setPreviewing] = useState(null)

  const refreshDocuments = useCallback(async () => {
    if (!claimId) return
    setLoading(true)
    setForbidden(false)
    try {
      const [types, ups] = await Promise.all([
        documentService.getDocumentList(),
        documentService.getUploadedDocumentList(claimId),
      ])
      const mappedTypes = (types || []).map(mapDocType).filter((t) => t.type)
      const mappedUps = (ups || []).map(mapUploaded)
      setDocTypes(mappedTypes)
      setUploaded(mappedUps)
      const groups = groupUploaded(mappedUps, mappedTypes)
      setExpanded((prev) => {
        const next = { ...prev }
        Object.keys(groups).forEach((k) => {
          if (groups[k].length > 0) next[k] = true
        })
        return next
      })
    } catch (e) {
      if (e?.message === FORBIDDEN_DOC_MSG) {
        setForbidden(true)
        toast('error', 'Access denied', FORBIDDEN_DOC_MSG)
      } else {
        toast('error', 'Documents', e?.message || 'Could not load documents.')
      }
    } finally {
      setLoading(false)
    }
  }, [claimId, toast])

  useEffect(() => {
    if (open && claimId) refreshDocuments()
  }, [open, claimId, refreshDocuments])

  const grouped = useMemo(() => groupUploaded(uploaded, docTypes), [uploaded, docTypes])
  const typeOrder = useMemo(() => {
    const keys = docTypes.map((t) => t.type).filter(Boolean)
    Object.keys(grouped).forEach((k) => {
      if (!keys.includes(k)) keys.push(k)
    })
    return keys
  }, [docTypes, grouped])

  const toggleSection = (type) => setExpanded((p) => ({ ...p, [type]: !p[type] }))

  const handlePreview = (nodeId, fileName) => {
    setPreviewing(nodeId)
    const previewWin = openPreviewLoadingTab()
    openDocumentPreview(nodeId, { previewWin })
      .catch((e) => {
        if (previewWin && !previewWin.closed) {
          try {
            previewWin.close()
          } catch {
            /* ignore */
          }
        }
        toast('error', 'Preview', e?.message || `Could not open ${fileName}.`)
      })
      .finally(() => setPreviewing(null))
  }

  if (!open) return null

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 280, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.35)' }} onClick={onClose} role="presentation" />
        <div
          style={{
            width: 'min(460px, 100vw)',
            background: WS.card,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
            fontFamily: 'Inter,sans-serif',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${WS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>Documents</div>
              <div style={{ fontSize: '12px', color: WS.textMuted, marginTop: '2px' }}>{claimId} · Alfresco DMS</div>
            </div>
            <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }} aria-label="Close">
              ×
            </button>
          </div>

          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${WS.borderSubtle}`, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {!readOnly && !forbidden && (
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: WS.primary, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Browse…
              </button>
            )}
            <button
              type="button"
              onClick={refreshDocuments}
              disabled={loading || forbidden}
              style={{ padding: '9px 14px', borderRadius: '8px', border: `1px solid ${WS.border}`, background: WS.hoverBg, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Refresh
            </button>
          </div>

          {readOnly && (
            <div style={{ margin: '12px 20px 0', padding: '10px 14px', background: T.info.bg, borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: T.info.color }}>
              Browse mode — upload disabled. Open from My Task to add documents.
            </div>
          )}

          <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
            {loading && <div style={{ fontSize: '13px', color: WS.textMuted }}>Loading document list…</div>}
            {forbidden && !loading && (
              <div style={{ fontSize: '13px', color: '#991B1B', fontWeight: 600 }}>{FORBIDDEN_DOC_MSG}</div>
            )}
            {!loading && !forbidden && typeOrder.length === 0 && uploaded.length === 0 && (
              <div style={{ fontSize: '13px', color: WS.textMuted }}>No document types configured. Upload after master list is populated.</div>
            )}
            {!loading &&
              !forbidden &&
              typeOrder.map((type) => {
                const files = grouped[type] || []
                const isOpen = expanded[type]
                return (
                  <div key={type} style={{ marginBottom: '10px', border: `1px solid ${WS.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => toggleSection(type)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        border: 'none',
                        background: WS.surfaceSubtle,
                        cursor: 'pointer',
                        fontFamily: 'Inter,sans-serif',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: WS.textSecondary,
                      }}
                    >
                      <span>{type}</span>
                      <span style={{ fontSize: '12px', color: WS.textMuted }}>-({files.length}) {isOpen ? '▾' : '▸'}</span>
                    </button>
                    {isOpen && (
                      <ul style={{ margin: 0, padding: '8px 14px 12px', listStyle: 'none' }}>
                        {files.length === 0 ? (
                          <li style={{ fontSize: '12px', color: WS.textMuted }}>No files for this type.</li>
                        ) : (
                          files.map((doc, i) => (
                            <li key={`${doc.alfrescoFileId}-${i}`} style={{ padding: '8px 0', borderTop: i ? `1px solid ${WS.borderSubtle}` : 'none', fontSize: '12px' }}>
                              <div style={{ fontWeight: 600, color: WS.textPrimary, marginBottom: '4px' }}>{doc.fileName}</div>
                              {doc.uploadedOn && <div style={{ fontSize: '11px', color: WS.textSubtle, marginBottom: '6px' }}>{doc.uploadedOn}</div>}
                              {doc.alfrescoFileId ? (
                                <button
                                  type="button"
                                  onClick={() => handlePreview(doc.alfrescoFileId, doc.fileName)}
                                  disabled={previewing === doc.alfrescoFileId}
                                  style={{ border: 'none', background: 'none', padding: 0, color: WS.primary, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                                >
                                  {previewing === doc.alfrescoFileId ? 'Opening…' : 'Preview'}
                                </button>
                              ) : (
                                <span style={{ color: WS.textMuted }}>No preview id</span>
                              )}
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
                )
              })}
          </div>

          <div style={{ padding: '12px 20px', borderTop: `1px solid ${WS.border}`, fontSize: '11px', color: WS.textSubtle, lineHeight: 1.5 }}>
            Files stored in Alfresco per claim folder; metadata in UploadedDocuments. Preview uses authenticated API (not a raw new-tab URL).
          </div>
        </div>
      </div>

      <UploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        docTypes={docTypes}
        claimId={claimId}
        onUploaded={refreshDocuments}
      />
    </>
  )
}
