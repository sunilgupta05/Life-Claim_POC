import { useState, useEffect } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useToast } from '../components/Toast'
import { getMails, getMailsCount, getMailById, getAttachments, patchAttachments } from '../services/mailService'
import { Mail, ChevronLeft, ChevronRight, Paperclip } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'


function field(row, key, fallback = '—') {
  if (!row || !key) return fallback
  const v = row[key] ?? row[key.toUpperCase()] ?? row[key.toLowerCase()]
  return v != null && v !== '' ? String(v) : fallback
}

export default function InwardMail() {
  const { tokens: T } = useTheme()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [mails, setMails] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [attLoading, setAttLoading] = useState(false)

  const load = async (p = page) => {
    setLoading(true)
    try {
      const [list, countRes] = await Promise.all([
        getMails(p, true),
        getMailsCount().catch(() => ({ no_of_mails: 0 })),
      ])
      setMails(list)
      setTotal(Number(countRes?.no_of_mails || countRes?.NO_OF_MAILS || list.length) || 0)
    } catch (e) {
      toast('error', 'Load failed', e.message)
      setMails([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(page)
  }, [page])

  const selectMail = async (mail) => {
    const id = mail.inward_id ?? mail.INWARD_ID ?? mail.id
    if (!id) return
    setAttLoading(true)
    try {
      const [detail, att] = await Promise.all([
        getMailById(id).catch(() => mail),
        getAttachments(id),
      ])
      setSelected(detail || mail)
      setAttachments(att)
    } catch {
      setSelected(mail)
      setAttachments([])
      toast('warning', 'Attachments', 'No attachments for this mail.')
    } finally {
      setAttLoading(false)
    }
  }

  const handleDocTypeChange = async (fileId, documentType) => {
    if (!selected) return
    const mailId = selected.inward_id ?? selected.INWARD_ID
    try {
      await patchAttachments(mailId, { [fileId]: documentType })
      toast('success', 'Updated', 'Attachment document type saved.')
      selectMail(selected)
    } catch (e) {
      toast('error', 'Update failed', e.message)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 10))

  return (
    <AppLayout pageTitle="Inward Mail" pageSubtitle="Legacy inbox">
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.2fr)', gap: '16px', minHeight: '520px' }}>
          <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: T.textPrimary }}>
                <Mail size={16} /> Inbox
              </div>
              <span style={{ fontSize: '12px', color: T.textMuted }}>{total} total</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: T.textMuted, fontSize: '13px' }}>Loading…</div>
              ) : mails.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: T.textMuted, fontSize: '13px' }}>No mail records.</div>
              ) : (
                mails.map((m) => {
                  const id = m.inward_id ?? m.INWARD_ID
                  const active = selected && (selected.inward_id ?? selected.INWARD_ID) === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => selectMail(m)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 16px',
                        border: 'none',
                        borderBottom: `1px solid ${T.border}`,
                        background: active ? T.primaryLight : 'transparent',
                        cursor: 'pointer',
                        fontFamily: 'Inter,sans-serif',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700, color: T.primary }}>#{id}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: T.textPrimary, marginTop: '4px' }}>
                        {field(m, 'subject') || field(m, 'mail_subject') || 'No subject'}
                      </div>
                      <div style={{ fontSize: '11px', color: T.textMuted, marginTop: '2px' }}>
                        {field(m, 'from_email') || field(m, 'sender')} · {field(m, 'received_date') || field(m, 'created_at')}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
            <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${T.border}`, background: T.inputBg, cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600 }}>
                <ChevronLeft size={14} /> Prev
              </button>
              <span style={{ fontSize: '12px', color: T.textMuted }}>Page {page} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${T.border}`, background: T.inputBg, cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600 }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '20px', overflowY: 'auto' }}>
            {!selected ? (
              <div style={{ color: T.textMuted, fontSize: '13px', textAlign: 'center', paddingTop: '80px' }}>Select a mail to view details and attachments.</div>
            ) : (
              <>
                <div style={{ fontWeight: 800, fontSize: '16px', color: T.textPrimary, marginBottom: '12px' }}>
                  {field(selected, 'subject') || field(selected, 'mail_subject') || 'Mail detail'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  {[
                    ['From', field(selected, 'from_email') || field(selected, 'sender')],
                    ['To', field(selected, 'to_email') || field(selected, 'recipient')],
                    ['Date', field(selected, 'received_date') || field(selected, 'created_at')],
                    ['Status', field(selected, 'status')],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase' }}>{k}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: T.textPrimary, marginTop: '4px' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: T.textPrimary, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Paperclip size={14} /> Attachments
                </div>
                {attLoading ? (
                  <div style={{ color: T.textMuted, fontSize: '12px' }}>Loading attachments…</div>
                ) : attachments.length === 0 ? (
                  <div style={{ color: T.textMuted, fontSize: '12px' }}>No attachments.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {attachments.map((a) => {
                      const fileId = a.file_id ?? a.FILE_ID ?? a.id
                      return (
                        <div key={fileId} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${T.border}`, background: T.inputBg }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>{field(a, 'file_name') || field(a, 'filename') || `File ${fileId}`}</div>
                          <input
                            defaultValue={field(a, 'document_type', '')}
                            placeholder="Document type"
                            onBlur={(e) => handleDocTypeChange(fileId, e.target.value)}
                            style={{ width: '100%', height: '32px', padding: '0 8px', borderRadius: '6px', border: `1px solid ${T.border}`, fontSize: '12px', fontFamily: 'Inter,sans-serif' }}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
