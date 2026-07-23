import { API_URL } from '../util/config'

const baseUrl = `${API_URL || ''}/api`

function showLoadingTab(win) {
  if (!win || win.closed) return
  try {
    win.document.title = 'Loading preview…'
    win.document.body.innerHTML =
      '<p style="font-family:Inter,sans-serif;padding:24px;color:#334155;">Loading preview…</p>'
  } catch {
    /* cross-origin or already navigated */
  }
}

function openBlobInNewTab(blobUrl, existingWin = null) {
  const previewWin =
    existingWin && !existingWin.closed ? existingWin : window.open('about:blank', '_blank')

  if (previewWin && !previewWin.closed) {
    try {
      previewWin.location.href = blobUrl
      return
    } catch {
      try {
        previewWin.close()
      } catch {
        /* ignore */
      }
    }
  }

  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

/**
 * Open Alfresco-backed preview with JWT (avoids 401 on plain new-tab links).
 * Pass previewWin from the click handler so the tab opens synchronously (pop-up safe).
 */
export async function openDocumentPreview(nodeId, { previewWin = null } = {}) {
  if (!nodeId) throw new Error('Missing document node id')

  const res = await fetch(`${baseUrl}/document/preview/${encodeURIComponent(nodeId)}`, {
    credentials: 'include',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (res.status === 403) {
      throw new Error('You are not allowed to preview this document.')
    }
    throw new Error(text || `Preview failed (${res.status})`)
  }

  const blob = await res.blob()
  const contentType = res.headers.get('content-type') || blob.type || 'application/octet-stream'
  const typedBlob = blob.type ? blob : new Blob([blob], { type: contentType })
  const url = URL.createObjectURL(typedBlob)

  try {
    openBlobInNewTab(url, previewWin)
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 120000)
  }
}

/** Call synchronously from a click handler before awaiting openDocumentPreview. */
export function openPreviewLoadingTab() {
  const win = window.open('about:blank', '_blank')
  showLoadingTab(win)
  return win
}
