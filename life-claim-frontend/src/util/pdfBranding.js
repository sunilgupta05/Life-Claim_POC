import { COMPANY } from '../config/companyBrand'

export const MARGIN = 12
export const FOOTER_H = 14
export const ROW_H = 5.4
export const LABEL_W = 48

export const C = {
  navy: [15, 23, 42],
  blue: [29, 78, 216],
  blueLight: [239, 246, 255],
  slate: [51, 65, 85],
  muted: [100, 116, 139],
  border: [226, 232, 240],
  rowAlt: [248, 250, 252],
  white: [255, 255, 255],
  accent: [139, 26, 43],
  amber: [146, 64, 14],
  amberBg: [255, 251, 235],
  green: [6, 95, 70],
  greenBg: [236, 253, 245],
}

export function setFill(doc, [r, g, b]) {
  doc.setFillColor(r, g, b)
}

export function setDraw(doc, [r, g, b]) {
  doc.setDrawColor(r, g, b)
}

export function setText(doc, [r, g, b]) {
  doc.setTextColor(r, g, b)
}

/** Match claim summary PDF — e.g. 22 June 2026 */
export function formatPdfDate(value) {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).split('T')[0] || '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function formatPdfDateTime(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export function addCalendarDays(value, days) {
  const d = value instanceof Date ? new Date(value) : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  d.setDate(d.getDate() + days)
  return formatPdfDate(d)
}

export async function loadLogoDataUrl() {
  try {
    const res = await fetch(COMPANY.logoPath)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function measureLogoSize(dataUrl, maxW, maxH) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight
      let w = maxW
      let h = w / ratio
      if (h > maxH) {
        h = maxH
        w = h * ratio
      }
      resolve({ w, h })
    }
    img.onerror = () => resolve({ w: maxW, h: maxH * 0.35 })
    img.src = dataUrl
  })
}

export function drawFooter(doc, generatedAt) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const barY = pageHeight - FOOTER_H

  setFill(doc, C.navy)
  doc.rect(0, barY, pageWidth, FOOTER_H, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setText(doc, C.white)
  doc.text(`${COMPANY.name}  ·  ${COMPANY.product}`, MARGIN, barY + 5)
  doc.text(`Generated ${formatPdfDateTime(generatedAt)}`, pageWidth / 2, barY + 5, { align: 'center' })
  doc.text('Confidential · Page 1 of 1', pageWidth - MARGIN, barY + 5, { align: 'right' })

  doc.setFontSize(6)
  setText(doc, [148, 163, 184])
  doc.text(`${COMPANY.email}  ·  ${COMPANY.phone}  ·  ${COMPANY.website}`, pageWidth / 2, barY + 10.5, { align: 'center' })
}

export function drawKpiChip(doc, x, y, w, label, value, highlight = false) {
  setFill(doc, highlight ? C.blueLight : C.white)
  setDraw(doc, C.border)
  doc.roundedRect(x, y, w, 14, 2, 2, highlight ? 'FD' : 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  setText(doc, C.muted)
  doc.text(label.toUpperCase(), x + 3, y + 4.5)

  doc.setFont('helvetica', highlight ? 'bold' : 'normal')
  doc.setFontSize(highlight ? 9.5 : 8.5)
  setText(doc, highlight ? C.navy : C.slate)
  const lines = doc.splitTextToSize(String(value || '—'), w - 6)
  doc.text(lines[0], x + 3, y + 10.5)
}

/**
 * Branded header shared by claim summary and SCN PDFs.
 * Returns Y position below the confidentiality strip.
 */
export async function drawBrandedHeader(doc, logoDataUrl, { title, subtitle, generatedAt, bannerText }) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentW = pageWidth - MARGIN * 2
  const headerH = 32

  setFill(doc, C.white)
  doc.rect(0, 0, pageWidth, headerH + 4, 'F')

  if (logoDataUrl) {
    const { w, h } = await measureLogoSize(logoDataUrl, 72, 24)
    doc.addImage(logoDataUrl, 'PNG', MARGIN, 6, w, h)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    setText(doc, C.navy)
    doc.text(COMPANY.name, MARGIN, 14)
  }

  const titleX = MARGIN + 78
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  setText(doc, C.navy)
  doc.text(title, titleX, 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  setText(doc, C.muted)
  doc.text(subtitle || COMPANY.product, titleX, 18.5)
  doc.text(`Report date: ${formatPdfDate(generatedAt)}`, titleX, 23.5)

  setDraw(doc, C.accent)
  doc.setLineWidth(0.8)
  doc.line(MARGIN, headerH, pageWidth - MARGIN, headerH)

  let y = headerH + 4

  setFill(doc, C.navy)
  doc.rect(0, y, pageWidth, 10, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  setText(doc, C.white)
  doc.text(bannerText || 'INTERNAL USE ONLY', pageWidth / 2, y + 6.5, { align: 'center' })
  y += 12

  setFill(doc, [254, 242, 242])
  setDraw(doc, [254, 202, 202])
  doc.roundedRect(MARGIN, y, contentW, 5.5, 1.5, 1.5, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  setText(doc, [153, 27, 27])
  doc.text(
    'CONFIDENTIAL — For authorised personnel only. Do not distribute outside the organisation.',
    pageWidth / 2,
    y + 3.8,
    { align: 'center' },
  )

  return y + 8
}

function sectionCardHeight(section, doc, colWidth) {
  let h = 9
  section.rows.forEach(({ value }) => {
    const lines = doc.splitTextToSize(String(value || '—'), colWidth - LABEL_W - 8)
    h += ROW_H + (Math.min(lines.length, 3) - 1) * 3
  })
  return h + 3
}

export function drawSectionCard(doc, section, x, y, colWidth) {
  const cardH = sectionCardHeight(section, doc, colWidth)

  setFill(doc, C.white)
  setDraw(doc, C.border)
  doc.roundedRect(x, y, colWidth, cardH, 2.5, 2.5, 'FD')

  setFill(doc, C.blueLight)
  doc.roundedRect(x, y, colWidth, 7.5, 2.5, 2.5, 'F')
  doc.rect(x, y + 4, colWidth, 4, 'F')

  setFill(doc, C.blue)
  doc.rect(x, y + 1.5, 2, 4.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  setText(doc, C.blue)
  doc.text(section.title.toUpperCase(), x + 5, y + 5.2)

  let ry = y + 10
  section.rows.forEach(({ label, value }, i) => {
    if (i % 2 === 0) {
      setFill(doc, C.rowAlt)
      doc.rect(x + 1.5, ry - 3.2, colWidth - 3, ROW_H, 'F')
    }

    const textY = ry
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    setText(doc, C.muted)
    doc.text(label, x + 4, textY)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    setText(doc, C.navy)
    const valueStr = String(value || '—')
    const maxW = colWidth - LABEL_W - 6
    const lines = doc.splitTextToSize(valueStr, maxW)
    const lineCount = Math.min(lines.length, 3)
    for (let li = 0; li < lineCount; li += 1) {
      doc.text(lines[li], x + LABEL_W, textY + li * 3)
    }

    ry += ROW_H + (lineCount > 1 ? (lineCount - 1) * 3 : 0)
  })

  return y + cardH + 4
}

export function drawCertificationBlock(doc, y, contentWidth, text) {
  const certH = 16
  setFill(doc, C.white)
  setDraw(doc, C.border)
  doc.roundedRect(MARGIN, y, contentWidth, certH, 2, 2, 'FD')

  setFill(doc, C.blue)
  doc.rect(MARGIN, y, 3, certH, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setText(doc, C.slate)
  doc.text('Document certification', MARGIN + 6, y + 5.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  setText(doc, C.muted)
  const cert = doc.splitTextToSize(text, contentWidth - 12)
  doc.text(cert, MARGIN + 6, y + 10)

  return y + certH + 3
}

export { COMPANY }
