import { lazy, Suspense } from 'react'

import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom'

import { AuthProvider, useAuth } from './context/AuthContext'

import { ThemeProvider } from './context/ThemeContext'

import { ToastProvider, useToast } from './components/Toast'

import {

  postLoginPath,

  isSuperUserOnlyUser,

  isSuperUserShellPath,

} from './util/loginHelpers'

import { moduleGuard, isModuleEnabled } from './config/moduleRegistry'

import { COMPANY } from './config/companyBrand'



const Login            = lazy(() => import('./pages/Login'))

const Dashboard        = lazy(() => import('./pages/Dashboard'))

const PolicySearch     = lazy(() => import('./pages/PolicySearch'))

const ClaimSearch      = lazy(() => import('./pages/ClaimSearch'))

const Registration     = lazy(() => import('./pages/Registration/index'))

const ClaimView        = lazy(() => import('./pages/ClaimView'))

const PoolSelection    = lazy(() => import('./pages/PoolSelection'))

const MyTask           = lazy(() => import('./pages/MyTask'))

const AddScreen        = lazy(() => import('./pages/AddScreen'))


const AdminOverview    = lazy(() => import('./pages/AdminOverview'))

const AdminClaimSearch = lazy(() => import('./pages/AdminClaimSearch'))

const AdminWorkloadList = lazy(() => import('./pages/AdminWorkloadList'))

const AdminAuditLog    = lazy(() => import('./pages/AdminAuditLog'))

const AccessControl    = lazy(() => import('./pages/AccessControl'))

const Branding         = lazy(() => import('./pages/Branding'))

const FormFields       = lazy(() => import('./pages/FormFields'))

const IntegrationHealth = lazy(() => import('./pages/IntegrationHealth'))

const ITAdminSettings  = lazy(() => import('./pages/ITAdminSettings'))

const CaseDetails      = lazy(() => import('./pages/CaseDetails'))

const Profile          = lazy(() => import('./pages/Profile'))



/** Legacy /claim-view/:id → canonical workspace URL (Section D7). */

function ClaimViewRedirect() {

  const { claimId } = useParams()

  return <Navigate to="/registration-fetch" replace state={{ claimId: String(claimId || ''), from: 'legacyUrl' }} />

}

/** Legacy /registration-fetch/:claimId → non-PII URL. */
function ClaimWorkspaceLegacyRedirect() {
  const { claimId } = useParams()
  return <Navigate to="/registration-fetch" replace state={{ claimId: String(claimId || ''), from: 'legacyUrl' }} />

}

/** Legacy /case/:id → non-PII ADD case workspace URL. */
function AddCaseLegacyRedirect() {
  const { id } = useParams()
  return <Navigate to="/add-case" replace state={{ caseId: String(id || ''), from: 'legacyUrl' }} />
}

function RegistrationLegacyRedirect() {
  const { claimId } = useParams()
  return <Navigate to="/registration" replace state={{ claimId: String(claimId || ''), from: 'legacyUrl' }} />
}

function SuperuserClaimSearchRoute() {
  const [params] = useSearchParams()
  const view = params.get('view')
  if (view && view !== 'openByRole') {
    return <Navigate to={`/superuser/workload?view=${encodeURIComponent(view)}`} replace />
  }
  return (
    <ProtectedRoute {...moduleGuard('superuser-claims')}>
      <AdminClaimSearch />
    </ProtectedRoute>
  )
}

function AuthLoadingScreen() {

  return (

    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontFamily:'Inter,sans-serif', color:'#64748B', flexDirection:'column', gap:'12px' }}>

      <div style={{ width:'32px', height:'32px', border:'3px solid #E2E8F0', borderTopColor:'#1D4ED8', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />

      <span style={{ fontSize:'13px', fontWeight:600 }}>Loading…</span>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

    </div>

  )

}



function ProtectedRoute({ children, requiredRole, blockSuperUserOnly, module }) {

  const { authenticated, loading, hasRole, user } = useAuth()

  const toast = useToast()

  const location = useLocation()



  if (loading) return <AuthLoadingScreen />

  if (!authenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />



  // Module gating (roadmap 1.3): if this route's feature module is disabled for
  // the org (COMPANY.enabledModules), it's unreachable. Redirect to /profile
  // (always available, no module) to avoid any redirect loop.
  if (module && !isModuleEnabled(module, COMPANY.enabledModules) && location.pathname !== '/profile') {
    toast('warning', 'Module unavailable', 'This module is not enabled for your organization.')
    return <Navigate to="/profile" replace />
  }

  if (blockSuperUserOnly && isSuperUserOnlyUser(user?.roles, user?.username) && !isSuperUserShellPath(location.pathname)) {

    return <Navigate to={postLoginPath(user?.roles, user?.username)} replace />

  }



  if (requiredRole && !hasRole(requiredRole)) {

    toast('warning', 'Access denied', 'You do not have permission to view this page.')

    return <Navigate to={isSuperUserOnlyUser(user?.roles, user?.username) ? postLoginPath(user?.roles, user?.username) : '/dashboard'} replace />

  }



  return children

}



function PublicRoute({ children }) {

  const { authenticated, loading, user } = useAuth()

  if (loading) return <AuthLoadingScreen />

  if (authenticated) return <Navigate to={postLoginPath(user?.roles, user?.username)} replace />

  return children

}



function HomeRedirect() {

  const { authenticated, loading, user } = useAuth()

  if (loading) return <AuthLoadingScreen />

  if (!authenticated) return <Navigate to="/login" replace />

  return <Navigate to={postLoginPath(user?.roles, user?.username)} replace />

}



function IdleWarningBanner() {

  const { idleWarning, extendSession } = useAuth()

  if (!idleWarning) return null

  return (

    <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:9999, background:'#92400E', color:'#FEF3C7', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'Inter,sans-serif', boxShadow:'0 4px 12px rgba(0,0,0,0.3)' }}>

      <span style={{ fontSize:'13px', fontWeight:600 }}>Your session will expire in 1 minute due to inactivity.</span>

      <button type="button" onClick={extendSession} style={{ padding:'6px 16px', borderRadius:'6px', border:'1px solid #FDE68A', background:'rgba(255,255,255,0.15)', color:'#FEF3C7', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>

        Keep me signed in

      </button>

    </div>

  )

}



// Route guards now come from the module registry via moduleGuard(id)
// (roadmap 1.3) — operational/blockSuperUserOnly + requiredRole live there.



export default function App() {

  return (

    <AuthProvider>

      <ThemeProvider>

      <ToastProvider>

        <BrowserRouter>

          <IdleWarningBanner />

          <Suspense fallback={<AuthLoadingScreen />}>

            <Routes>

              <Route path="/login" element={<PublicRoute><Login/></PublicRoute>} />



              <Route path="/dashboard" element={<ProtectedRoute {...moduleGuard('dashboard')}><Dashboard/></ProtectedRoute>} />

              <Route path="/policy-search" element={<ProtectedRoute {...moduleGuard('policy')}><PolicySearch/></ProtectedRoute>} />

              <Route path="/claim-search" element={<ProtectedRoute {...moduleGuard('claims')}><ClaimSearch/></ProtectedRoute>} />

              <Route path="/registration" element={<ProtectedRoute {...moduleGuard('policy')}><Registration/></ProtectedRoute>} />

              <Route path="/registration/:claimId" element={<ProtectedRoute {...moduleGuard('policy')}><RegistrationLegacyRedirect/></ProtectedRoute>} />

              <Route path="/claim-view/:claimId" element={<ProtectedRoute {...moduleGuard('claims')}><ClaimViewRedirect/></ProtectedRoute>} />

              <Route path="/registration-fetch" element={<ProtectedRoute {...moduleGuard('claims')}><ClaimView/></ProtectedRoute>} />
              <Route path="/registration-fetch/:claimId" element={<ProtectedRoute {...moduleGuard('claims')}><ClaimWorkspaceLegacyRedirect/></ProtectedRoute>} />

              <Route path="/pool-selection" element={<ProtectedRoute {...moduleGuard('pool')}><PoolSelection/></ProtectedRoute>} />

              <Route path="/my-task" element={<ProtectedRoute {...moduleGuard('tasks')}><MyTask/></ProtectedRoute>} />

              <Route path="/add-screen" element={<ProtectedRoute {...moduleGuard('add')}><AddScreen/></ProtectedRoute>} />

              <Route path="/add-case" element={<ProtectedRoute {...moduleGuard('add')}><CaseDetails/></ProtectedRoute>} />
              <Route path="/case/:id" element={<ProtectedRoute {...moduleGuard('add')}><AddCaseLegacyRedirect/></ProtectedRoute>} />



              <Route path="/audit-log" element={<ProtectedRoute {...moduleGuard('audit-log')}><AdminAuditLog/></ProtectedRoute>} />

              <Route path="/superuser" element={<ProtectedRoute {...moduleGuard('superuser-overview')}><AdminOverview/></ProtectedRoute>} />

              <Route path="/superuser/claim-search" element={<SuperuserClaimSearchRoute />} />

              <Route path="/superuser/workload" element={<ProtectedRoute {...moduleGuard('superuser-overview')}><AdminWorkloadList/></ProtectedRoute>} />

              <Route path="/superuser/access" element={<ProtectedRoute {...moduleGuard('access-control')}><AccessControl/></ProtectedRoute>} />

              <Route path="/superuser/branding" element={<ProtectedRoute {...moduleGuard('branding')}><Branding/></ProtectedRoute>} />

              <Route path="/superuser/forms" element={<ProtectedRoute {...moduleGuard('form-fields')}><FormFields/></ProtectedRoute>} />

              <Route path="/superuser/health" element={<ProtectedRoute {...moduleGuard('integration-health')}><IntegrationHealth/></ProtectedRoute>} />

              <Route path="/superuser/settings" element={<ProtectedRoute {...moduleGuard('it-admin')}><ITAdminSettings/></ProtectedRoute>} />

              <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>} />



              {/* Legacy /admin URLs → superuser */}

              <Route path="/admin" element={<Navigate to="/superuser" replace />} />

              <Route path="/admin/claim-search" element={<Navigate to="/superuser/claim-search" replace />} />

              <Route path="/admin-reports" element={<Navigate to="/superuser" replace />} />

              <Route path="/admin/audit" element={<Navigate to="/audit-log" replace />} />

              <Route path="/admin/users" element={<Navigate to="/superuser" replace />} />
              <Route path="/user-management" element={<Navigate to="/superuser" replace />} />
              <Route path="/user-manager" element={<Navigate to="/superuser" replace />} />

              <Route path="/admin/reports" element={<Navigate to="/superuser" replace />} />



              {/* v1 URL aliases */}

              <Route path="/assessor-pool" element={<Navigate to="/pool-selection" replace />} />

              <Route path="/" element={<HomeRedirect />} />

              <Route path="*" element={<HomeRedirect />} />

            </Routes>

          </Suspense>

        </BrowserRouter>

      </ToastProvider>

      </ThemeProvider>

    </AuthProvider>

  )

}


