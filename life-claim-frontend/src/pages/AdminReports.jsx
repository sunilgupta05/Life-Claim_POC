import { useState, useEffect } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useToast } from '../components/Toast'
import { getDashboardData } from '../services/dashboardService'
import { Download, FileText, BarChart3, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { useTheme } from '../context/ThemeContext'
import { metricCardTokens } from '../ui/pageTokens'


const MONTHLY_DATA = [
  { month:'Jan', registered:42, approved:31, rejected:8,  pending:3 },
  { month:'Feb', registered:38, approved:28, rejected:6,  pending:4 },
  { month:'Mar', registered:55, approved:41, rejected:9,  pending:5 },
  { month:'Apr', registered:61, approved:47, rejected:10, pending:4 },
  { month:'May', registered:49, approved:38, rejected:7,  pending:4 },
  { month:'Jun', registered:33, approved:25, rejected:5,  pending:3 },
]

const TYPE_DATA = [
  { name:'Death Claim',    value:142, color:'#1D4ED8' },
  { name:'Maturity Claim', value:68,  color:'#0891B2' },
  { name:'Rider Claim',    value:38,  color:'#7C3AED' },
]

const SLA_DATA = [
  { month:'Jan', met:91, missed:9 },
  { month:'Feb', met:88, missed:12 },
  { month:'Mar', met:93, missed:7 },
  { month:'Apr', met:95, missed:5 },
  { month:'May', met:94, missed:6 },
  { month:'Jun', met:92, missed:8 },
]

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#1E293B', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'12px 16px', fontSize:'12px', boxShadow:'0 8px 24px rgba(0,0,0,0.2)' }}>
      <p style={{ color:'#94A3B8', fontWeight:600, marginBottom:'8px' }}>{label}</p>
      {payload.map((p,i)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'4px' }}>
          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:p.fill||p.stroke, flexShrink:0 }}/>
          <span style={{ color:'#94A3B8' }}>{p.name}:</span>
          <span style={{ color:'#fff', fontWeight:700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

const REPORT_TYPES = [
  { id:'monthly',   label:'Monthly Claims Report',       icon:'📊', desc:'Registration, approval and rejection breakdown by month' },
  { id:'type',      label:'Claims by Type Report',       icon:'📋', desc:'Death, Maturity, Rider claim distribution' },
  { id:'sla',       label:'SLA Compliance Report',       icon:'⏱️', desc:'Turnaround time and SLA adherence metrics' },
  { id:'assessor',  label:'Assessor Performance Report', icon:'👤', desc:'Per-assessor claim volume and resolution rates' },
  { id:'fraud',     label:'Fraud Detection Report',      icon:'🛡️', desc:'Fraud flags, high-risk cases and rule triggers' },
]

export default function AdminReports() {
  const { tokens: T } = useTheme()
  const toast = useToast()
  const [metrics, setMetrics] = useState({ total:248, pending:87, approved:124, rejected:37 })
  const [generating, setGenerating] = useState(null)

  useEffect(() => {
    getDashboardData().then(d => { if (d.metrics) setMetrics(d.metrics) }).catch(() => {})
  }, [])

  const handleDownload = (reportId, label) => {
    setGenerating(reportId)
    setTimeout(() => {
      setGenerating(null)
      toast('success','Report Generated', `${label} downloaded as PDF.`)
    }, 1800)
  }

  const approval = metrics.total > 0 ? Math.round((metrics.approved / metrics.total) * 100) : 0
  const pdfHover = metricCardTokens(T, 'info')
  const xlsHover = metricCardTokens(T, 'success')

  return (
    <AppLayout>
      <div style={{ padding:'24px', fontFamily:'Inter,sans-serif' }}>
        <div style={{ marginBottom:'24px' }}>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.02em', margin:'0 0 4px' }}>Admin Reports</h1>
          <p style={{ fontSize:'13px', color:T.textMuted, fontWeight:500 }}>Comprehensive analytics and downloadable reports for claims operations.</p>
        </div>

        {/* KPI strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'12px', marginBottom:'20px' }}>
          {[
            { label:'Total Claims',     value:metrics.total,    color:'#1D4ED8' },
            { label:'Approved',         value:metrics.approved, color:'#059669' },
            { label:'Rejected',         value:metrics.rejected, color:'#DC2626' },
            { label:'Pending',          value:metrics.pending,  color:'#D97706' },
            { label:'Approval Rate',    value:`${approval}%`,   color:'#7C3AED' },
          ].map(s=>(
            <div key={s.label} style={{ background:T.card, borderRadius:'10px', padding:'16px', border:`1px solid ${T.border}`, textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:'26px', fontWeight:900, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:'11px', color:T.textMuted, marginTop:'4px', fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>
          {/* Monthly trend */}
          <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:'20px' }}>
            <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary, marginBottom:'4px' }}>Monthly Claims Trend</div>
            <div style={{ fontSize:'12px', color:T.textMuted, marginBottom:'16px' }}>Registrations vs Disposals — Last 6 months</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MONTHLY_DATA} barSize={10} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false}/>
                <XAxis dataKey="month" tick={{ fill:'#94A3B8', fontSize:11, fontWeight:500 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#94A3B8', fontSize:11, fontWeight:500 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTip/>} cursor={{ fill:'rgba(0,0,0,0.02)' }}/>
                <Bar dataKey="registered" name="Registered" fill="#1D4ED8" radius={[3,3,0,0]}/>
                <Bar dataKey="approved"   name="Approved"   fill="#059669" radius={[3,3,0,0]}/>
                <Bar dataKey="rejected"   name="Rejected"   fill="#DC2626" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* SLA compliance */}
          <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:'20px' }}>
            <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary, marginBottom:'4px' }}>SLA Compliance Trend</div>
            <div style={{ fontSize:'12px', color:T.textMuted, marginBottom:'16px' }}>% claims resolved within SLA target</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={SLA_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false}/>
                <XAxis dataKey="month" tick={{ fill:'#94A3B8', fontSize:11, fontWeight:500 }} axisLine={false} tickLine={false}/>
                <YAxis domain={[80,100]} tick={{ fill:'#94A3B8', fontSize:11, fontWeight:500 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTip/>}/>
                <Line type="monotone" dataKey="met" name="SLA Met %" stroke="#059669" strokeWidth={2.5} dot={{ fill:'#059669', strokeWidth:0, r:4 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Claim type breakdown + Download reports */}
        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'16px' }}>
          {/* Pie chart */}
          <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:'20px' }}>
            <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary, marginBottom:'4px' }}>Claims by Type</div>
            <div style={{ fontSize:'12px', color:T.textMuted, marginBottom:'12px' }}>Distribution breakdown</div>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={TYPE_DATA} cx="50%" cy="50%" innerRadius={44} outerRadius={64} paddingAngle={3} dataKey="value">
                  {TYPE_DATA.map((d,i)=><Cell key={i} fill={d.color} stroke="transparent"/>)}
                </Pie>
                <Tooltip content={<ChartTip/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop:'12px', display:'flex', flexDirection:'column', gap:'8px' }}>
              {TYPE_DATA.map(d=>(
                <div key={d.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:'9px', height:'9px', borderRadius:'2px', background:d.color }}/>
                    <span style={{ fontSize:'12px', color:T.textSecondary, fontWeight:500 }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize:'12px', fontWeight:800, color:T.textPrimary }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Downloadable reports */}
          <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:`1px solid ${T.borderSubtle}` }}>
              <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary }}>Download Reports</div>
              <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'2px' }}>Generate and download PDF/Excel reports</div>
            </div>
            <div style={{ padding:'12px' }}>
              {REPORT_TYPES.map(r=>(
                <div key={r.id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'12px 10px', borderRadius:'10px', marginBottom:'4px', transition:'background 0.1s', cursor:'default' }}
                  onMouseEnter={e=>e.currentTarget.style.background=T.hoverBg}
                  onMouseLeave={e=>e.currentTarget.style.background=''}>
                  <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:T.surfaceMuted, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>{r.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:T.textPrimary }}>{r.label}</div>
                    <div style={{ fontSize:'11px', color:T.textMuted, marginTop:'2px' }}>{r.desc}</div>
                  </div>
                  <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                    <button onClick={()=>handleDownload(r.id+'-pdf', r.label+' (PDF)')} disabled={!!generating}
                      style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 14px', borderRadius:'7px', border:`1px solid ${T.border}`, background: T.inputBg, color:T.textSecondary, fontSize:'12px', fontWeight:700, cursor:generating?'wait':'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}
                      onMouseEnter={e=>{ if(!generating){ e.currentTarget.style.background=pdfHover.bg; e.currentTarget.style.color=pdfHover.color }}}
                      onMouseLeave={e=>{ e.currentTarget.style.background=T.inputBg; e.currentTarget.style.color=T.textSecondary }}>
                      {generating===r.id+'-pdf' ? '⏳' : <><FileText size={11}/> PDF</>}
                    </button>
                    <button onClick={()=>handleDownload(r.id+'-xls', r.label+' (Excel)')} disabled={!!generating}
                      style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 14px', borderRadius:'7px', border:`1px solid ${T.border}`, background: T.inputBg, color:T.textSecondary, fontSize:'12px', fontWeight:700, cursor:generating?'wait':'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}
                      onMouseEnter={e=>{ if(!generating){ e.currentTarget.style.background=xlsHover.bg; e.currentTarget.style.color=xlsHover.color }}}
                      onMouseLeave={e=>{ e.currentTarget.style.background=T.inputBg; e.currentTarget.style.color=T.textSecondary }}>
                      {generating===r.id+'-xls' ? '⏳' : <><Download size={11}/> Excel</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
