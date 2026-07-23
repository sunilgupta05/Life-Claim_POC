import React, { useState, useMemo } from 'react'
import { SubTabNav, Btn, useRegTokens } from './shared'
import { useToast } from '../../components/Toast'
import { validateRequirements, showValidationToast } from '../../util/registrationValidation'
import { REGISTRATION_REQUIREMENTS } from '../../config/registrationCatalog'
import { buildRequirementTableRows } from '../../util/buildRegistrationPayload'
import { statusPillStyle, fieldInputStyle, alertBannerStyle, metricTileStyle, metricCardTokens, toneControlStyle } from '../../ui/pageTokens'

const REQ_DOCS = REGISTRATION_REQUIREMENTS

export default function RequirementsTab({ data, update, userRole, onComplete }) {
  const T = useRegTokens()
  const toast = useToast()
  const [subTab, setSubTab] = useState('Requirements')
  const showCommTab = userRole && userRole !== 'Pre Assessor'

  const reqStatus = data.reqStatus || {}
  const reqRemarks = data.reqRemarks || {}
  const reqReceivedDates = data.reqReceivedDates || {}
  const reqTriggerDates = data.reqTriggerDates || {}
  const today = new Date().toISOString().split('T')[0]
  const defaultTrigger = data.intimationDate || data.initiationDate || today

  const allDocs = useMemo(() => REQ_DOCS, [])

  const setStatus = (id, val) => {
    const dates = { ...reqReceivedDates }
    const remarks = { ...reqRemarks }
    if (val === 'Received' && !dates[id]) dates[id] = today
    if (val !== 'Received') delete dates[id]
    if (val === 'Waived' && !remarks[id]) remarks[id] = 'Waived'
    update({ reqStatus: { ...reqStatus, [id]: val }, reqReceivedDates: dates, reqRemarks: remarks })
  }
  const setReceivedDate = (id, val) =>
    update({ reqReceivedDates: { ...reqReceivedDates, [id]: val } })
  const setTriggerDate = (id, val) =>
    update({ reqTriggerDates: { ...reqTriggerDates, [id]: val } })

  const markAllReceived = () => {
    const updated = { ...reqStatus }
    const dates = { ...reqReceivedDates }
    const triggers = { ...reqTriggerDates }
    allDocs.forEach((d) => {
      updated[d.id] = 'Received'
      if (!dates[d.id]) dates[d.id] = today
      if (!triggers[d.id]) triggers[d.id] = defaultTrigger
    })
    update({ reqStatus: updated, reqReceivedDates: dates, reqTriggerDates: triggers })
    toast('success', 'Updated', 'All requirements marked as Received.')
  }

  const received = allDocs.filter((d) => reqStatus[d.id] === 'Received').length
  const mandatoryDocs = allDocs.filter((d) => d.required)
  const mandatoryReceived = mandatoryDocs.filter((d) => reqStatus[d.id] === 'Received').length
  const requirementsComplete = validateRequirements(data, { allDocs }).valid

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: '12px',
          marginBottom: '20px' }}
      >
        {[
          { label: 'Total Requirements', value: allDocs.length, tone: 'info' },
          { label: 'Received', value: received, tone: 'success' },
          {
            label: 'Mandatory Received',
            value: `${mandatoryReceived}/${mandatoryDocs.length}`,
            tone: mandatoryReceived === mandatoryDocs.length ? 'success' : 'warn' },
        ].map((s) => {
          const tok = metricCardTokens(T, s.tone)
          return (
          <div
            key={s.label}
            style={metricTileStyle(T, s.tone)}
          >
            <div style={{ fontSize: '24px', fontWeight: 900, color: tok.color }}>{s.value}</div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: tok.color,
                opacity: 0.85,
                marginTop: '3px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em' }}
            >
              {s.label}
            </div>
          </div>
        )})}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px' }}
      >
        <SubTabNav
          tabs={showCommTab ? ['Requirements', 'Communication'] : ['Requirements']}
          active={subTab}
          onChange={setSubTab}
        />
        {subTab === 'Requirements' && (
          <Btn variant="secondary" size="sm" onClick={markAllReceived}>
            ✓ Mark All Received
          </Btn>
        )}
      </div>

      {subTab === 'Requirements' && (
        <div className="premium-grid" style={{ borderRadius: '10px' }}>
          <div className="premium-grid__scroll">
          <table style={{ minWidth: '1100px' }}>
            <thead>
              <tr>
                {[
                  '#',
                  'Requirement Name',
                  'Requirement Doc Type',
                  'Source',
                  'Status',
                  'Triggered By',
                  'Trigger Date',
                  'Receipt Date',
                ].map((h) => (
                  <th
                    key={h}
                    style={{ whiteSpace: h.includes('Date') ? 'nowrap' : undefined }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allDocs.map((doc, i) => {
                const s = reqStatus[doc.id] || 'Pending'
                const triggerDate = reqTriggerDates[doc.id] || defaultTrigger
                return (
                  <tr key={doc.id}>
                    <td
                      style={{
                        padding: '12px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: T.textSubtle,
                        verticalAlign: 'top' }}
                    >
                      {i + 1}
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: T.textSecondary,
                        lineHeight: 1.5,
                        maxWidth: '360px',
                        verticalAlign: 'top' }}
                    >
                      {doc.name}
                    </td>
                    <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                      <span style={statusPillStyle(T, doc.docType === 'Mandatory' ? 'danger' : 'warn', { fontSize: '11px', padding: '3px 10px' })}>
                        {doc.docType}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: T.textMuted,
                        verticalAlign: 'top',
                        whiteSpace: 'nowrap' }}
                    >
                      {doc.source}
                    </td>
                    <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                      <select
                        value={s}
                        onChange={(e) => setStatus(doc.id, e.target.value)}
                        style={toneControlStyle(T, s === 'Received' ? 'success' : s === 'Waived' ? 'info' : s === 'NA' ? 'neutral' : 'warn')}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Received">Received</option>
                        <option value="Waived">Waived</option>
                        <option value="NA">N/A</option>
                      </select>
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: T.textMuted,
                        verticalAlign: 'top' }}
                    >
                      System
                    </td>
                    <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                      <input
                        type="date"
                        value={triggerDate}
                        onChange={(e) => setTriggerDate(doc.id, e.target.value)}
                        style={fieldInputStyle(T, {
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          outline: 'none',
                          minWidth: '130px',
                        })}
                      />
                    </td>
                    <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                      <input
                        type="date"
                        value={reqReceivedDates[doc.id] || ''}
                        onChange={(e) => setReceivedDate(doc.id, e.target.value)}
                        disabled={s !== 'Received'}
                        placeholder="dd-mm-yyyy"
                        style={fieldInputStyle(T, {
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          outline: 'none',
                          background: s === 'Received' ? T.inputBg : T.inputBgReadonly,
                          cursor: s === 'Received' ? 'pointer' : 'not-allowed',
                          minWidth: '130px',
                        })}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {subTab === 'Communication' && showCommTab && (
        <div style={{ padding: '4px 0 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              {
                key: 'commEmailSent',
                label: 'Email Sent to Claimant',
                type: 'select',
                opts: ['Yes', 'No', 'Pending'] },
              { key: 'commEmailDate', label: 'Email Sent Date', type: 'date' },
              {
                key: 'commSmsSent',
                label: 'SMS Sent to Claimant',
                type: 'select',
                opts: ['Yes', 'No', 'Pending'] },
              { key: 'commSmsDate', label: 'SMS Sent Date', type: 'date' },
              {
                key: 'commLetterSent',
                label: 'Letter Dispatched',
                type: 'select',
                opts: ['Yes', 'No', 'Pending'] },
              { key: 'commLetterDate', label: 'Letter Dispatch Date', type: 'date' },
              {
                key: 'commWhatsapp',
                label: 'WhatsApp Notified',
                type: 'select',
                opts: ['Yes', 'No', 'NA'] },
            ].map((f) => (
              <div key={f.key}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: T.textSecondary,
                    marginBottom: '5px' }}
                >
                  {f.label}
                </label>
                {f.type === 'select' ? (
                  <select
                    value={data[f.key] || ''}
                    onChange={(e) => update({ [f.key]: e.target.value })}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 10px',
                      border: `1.5px solid ${T.border}`,
                      borderRadius: '7px',
                      background: T.inputBg,
                      fontSize: '13px',
                      fontFamily: 'Inter,sans-serif',
                      outline: 'none',
                      cursor: 'pointer' }}
                  >
                    <option value="">-- Select --</option>
                    {f.opts.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type}
                    value={data[f.key] || ''}
                    onChange={(e) => update({ [f.key]: e.target.value })}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 10px',
                      border: `1.5px solid ${T.border}`,
                      borderRadius: '7px',
                      background: T.inputBgReadonly,
                      fontSize: '13px',
                      fontFamily: 'Inter,sans-serif',
                      outline: 'none',
                      boxSizing: 'border-box' }}
                  />
                )}
              </div>
            ))}
            <div style={{ gridColumn: '1/-1' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '5px' }}
              >
                Communication Remarks
              </label>
              <textarea
                value={data.commRemarks || ''}
                onChange={(e) => update({ commRemarks: e.target.value })}
                rows={3}
                placeholder="Enter communication details..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1.5px solid ${T.border}`,
                  borderRadius: '7px',
                  background: T.inputBg,
                  fontSize: '13px',
                  fontFamily: 'Inter,sans-serif',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: `1px solid ${T.border}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px' }}
      >
        {mandatoryReceived < mandatoryDocs.length && subTab === 'Requirements' && (
          <div
            style={{
              marginRight: 'auto',
              fontSize: '12px',
              fontWeight: 600,
              ...alertBannerStyle(T, 'warn'),
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              lineHeight: 1.5,
            }}
          >
            ⚠️ {mandatoryDocs.length - mandatoryReceived} mandatory requirement(s) still pending
          </div>
        )}
        <Btn
          variant="success"
          disabled={!requirementsComplete}
          onClick={() => {
            const { valid, missing } = validateRequirements(data, { allDocs })
            if (!valid) {
              showValidationToast(toast, missing, 'Requirements incomplete')
              return
            }
            update({ _requirementsComplete: true, requirementTable: buildRequirementTableRows(data) })
            onComplete()
          }}
        >
          ✓ Complete Requirements →
        </Btn>
      </div>
    </div>
  )
}

