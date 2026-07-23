import { useState } from 'react'

import AppLayout from '../layouts/AppLayout'

import { useAuth } from '../context/AuthContext'

import { resolveDisplayRole } from '../util/superuserRole'

import { User, Mail, Phone, Key, Save } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { roleBadgeTokens } from '../ui/pageTokens'






const PROFILE_EDIT_ENABLED = false



const inp = (T, focused, readOnly = false) => ({

  width:'100%', height:'42px', padding:'0 12px',

  border:`1.5px solid ${readOnly ? T.border : focused ? T.primary : T.border}`,

  borderRadius:'8px', background: readOnly ? T.inputBgReadonly : focused ? T.inputBgFocus : T.inputBg,

  fontSize:'13px', fontWeight:500, color: readOnly ? T.textMuted : T.textPrimary,

  fontFamily:'Inter,sans-serif', outline:'none',

  boxShadow: readOnly ? 'none' : focused ? '0 0 0 3px rgba(29,78,216,0.1)' : '0 1px 2px rgba(0,0,0,0.04)',

  transition:'all 0.15s', boxSizing:'border-box',

  cursor: readOnly ? 'not-allowed' : 'text',

})



const disabledBtn = (T, bg) => ({

  display:'flex', alignItems:'center', gap:'7px', padding:'9px 22px', borderRadius:'8px', border:'none',

  background: bg, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'not-allowed', fontFamily:'Inter,sans-serif',

  opacity: 0.55,

})



function Field({ label, children, icon: Icon }) {
  const { tokens: T } = useTheme()
  return (
    <div>

      <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', fontWeight:600, color:T.textSecondary, marginBottom:'6px' }}>

        {Icon && <Icon size={13} style={{ color:T.textMuted }}/>}

        {label}

      </label>

      {children}

    </div>

  )

}



export default function Profile() {
  const { tokens: T } = useTheme()

  const { user } = useAuth()



  const displayRole = resolveDisplayRole(user?.roles, user?.role) || '—'



  const [profileForm] = useState({

    firstName: user?.name?.split(' ')[0] || '',

    lastName:  user?.name?.split(' ').slice(1).join(' ') || '',

    email:     user?.email || '',

    phone:     '',

  })



  const [focus] = useState({})



  const rc = roleBadgeTokens(T, displayRole)



  return (

    <AppLayout>

      <div style={{ padding:'24px', fontFamily:'Inter,sans-serif' }}>

        <div style={{ marginBottom:'24px' }}>

          <h1 style={{ fontSize:'22px', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.02em', margin:'0 0 4px' }}>My Profile</h1>

          <p style={{ fontSize:'13px', color:T.textMuted, fontWeight:500 }}>View your account details. Contact your administrator to make changes.</p>

        </div>



        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'20px', alignItems:'start' }}>

          <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:'24px', textAlign:'center' }}>

            <div style={{ width:'80px', height:'80px', borderRadius:'20px', background:T.primary, color:'#fff', fontSize:'28px', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 8px 24px rgba(29,78,216,0.3)' }}>

              {user?.avatar}

            </div>

            <div style={{ fontWeight:800, fontSize:'16px', color:T.textPrimary }}>{user?.name}</div>

            <div style={{ fontSize:'13px', color:T.textMuted, marginTop:'4px' }}>@{user?.username}</div>

            {displayRole !== '—' && (
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background: rc.bg,
                  border: `1px solid ${rc.border}`,
                  color: rc.color,
                  lineHeight: 1.2,
                }}>
                  {displayRole}
                </span>
              </div>
            )}

            <div style={{ marginTop:'20px', paddingTop:'16px', borderTop:`1px solid ${T.borderSubtle}`, textAlign:'left' }}>

              <div style={{ fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'8px' }}>Account Info</div>

              {[

                ['Email',      user?.email || '—'],

                ['Last Login', user?.loginTime ? new Date(user.loginTime).toLocaleString('en-IN') : '—'],

              ].map(([k,v])=>(

                <div key={k} style={{ marginBottom:'8px' }}>

                  <div style={{ fontSize:'10px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.04em' }}>{k}</div>

                  <div style={{ fontSize:'12px', fontWeight:500, color:T.textSecondary, marginTop:'2px', wordBreak:'break-all' }}>{v}</div>

                </div>

              ))}

            </div>

          </div>



          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

            <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>

              <div style={{ padding:'16px 20px', borderBottom:`1px solid ${T.borderSubtle}`, display:'flex', alignItems:'center', gap:'10px' }}>

                <User size={16} style={{ color:T.primary }}/>

                <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary }}>Personal Details</div>

              </div>

              <div style={{ padding:'20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>

                <Field label="First Name" icon={User}>

                  <input value={profileForm.firstName} readOnly style={inp(T, focus.fn, true)}/>

                </Field>

                <Field label="Last Name">

                  <input value={profileForm.lastName} readOnly style={inp(T,focus.ln, true)}/>

                </Field>

                <Field label="Email Address" icon={Mail}>

                  <input type="email" value={profileForm.email} readOnly style={inp(T,focus.em, true)}/>

                </Field>

                <Field label="Phone Number" icon={Phone}>

                  <input value={profileForm.phone || '—'} readOnly style={inp(T,focus.ph, true)}/>

                </Field>

                <Field label="Username">

                  <input value={user?.username || ''} readOnly style={inp(T,false, true)}/>

                </Field>

                <Field label="Role">

                  <input value={displayRole} readOnly style={inp(T,false, true)}/>

                </Field>

              </div>

              <div style={{ padding:'14px 20px', borderTop:`1px solid ${T.borderSubtle}`, display:'flex', justifyContent:'flex-end' }}>

                <button type="button" disabled style={disabledBtn(T,T.primary)} title="Profile edits are managed by your administrator">

                  <Save size={14}/> Save Profile

                </button>

              </div>

            </div>



            <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>

              <div style={{ padding:'16px 20px', borderBottom:`1px solid ${T.borderSubtle}`, display:'flex', alignItems:'center', gap:'10px' }}>

                <Key size={16} style={{ color:'#D97706' }}/>

                <div>

                  <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary }}>Change Password</div>

                  <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'1px' }}>

                    Password changes are managed by your administrator.

                  </div>

                </div>

              </div>

              <div style={{ padding:'20px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px' }}>

                <Field label="Current Password">

                  <input type="password" value="••••••••" readOnly style={inp(T,false, true)}/>

                </Field>

                <Field label="New Password">

                  <input type="password" value="" readOnly placeholder="••••••••" style={inp(T,false, true)}/>

                </Field>

                <Field label="Confirm New Password">

                  <input type="password" value="" readOnly placeholder="••••••••" style={inp(T,false, true)}/>

                </Field>

              </div>

              <div style={{ padding:'14px 20px', borderTop:`1px solid ${T.borderSubtle}`, display:'flex', justifyContent:'flex-end' }}>

                <button type="button" disabled style={disabledBtn(T,'#CBD5E1')} title="Password changes are managed by your administrator">

                  <Key size={14}/> Change Password

                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

    </AppLayout>

  )

}


