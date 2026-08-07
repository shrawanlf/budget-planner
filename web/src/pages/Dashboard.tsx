import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch } from '../util/xhr'
import { OnboardingModal } from '../components/OnboardingModal'
import { HistoricalData } from '../components/historical-data/HistoricalData'
import { CenterPanel } from '../components/central-panel/CenterPanel'
import { BudgetOverview } from '../components/BudgetOverview'
import { ProfileModal } from '../components/ProfileModal'
import { NotificationsPanel } from '../components/NotificationsPanel'

interface User {
  Id: string
  Email: string
  Name?: string
  Phone?: string
}

interface Notification {
  id: string
  title: string
  message: string
  time: number
  read?: boolean
}

export function Dashboard() {
  const navigate = useNavigate()
  const [checkingBudget, setCheckingBudget] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [budgetVersion, setBudgetVersion] = useState(0)
  const [user, setUser] = useState<User | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [transactionRefreshKey, setTransactionRefreshKey] = useState(0)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (err) {
        console.error('Failed to parse user data', err)
      }
    }

    const loadNotifications = async () => {
      try {
        const response = await authFetch('/notifications/')
        if (response.ok) {
          const data = await response.json()
          if (data.data && Array.isArray(data.data)) {
            setNotifications(data.data)
          }
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
      }
    }

    loadNotifications()
  }, [])

  useEffect(() => {
    const checkBudget = async () => {
      try {
        const response = await authFetch('/budget/active')
        setNeedsOnboarding(!response.ok)
      } catch (err) {
        console.error(err)
      } finally {
        setCheckingBudget(false)
      }
    }

    checkBudget()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('notifications')
    navigate('/')
  }

  return (
    <div className="h-screen flex flex-col font-mono text-black bg-slate-100 overflow-hidden">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-900 px-4 py-2 flex items-center justify-between bg-slate-800 shadow-md shrink-0">
        <h1 className="text-sm font-bold text-white tracking-wide">
          Budget Planner <span className="text-slate-400">::</span> Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="px-3 py-1 border border-slate-500 text-xs font-bold text-slate-100 bg-slate-700 hover:bg-white hover:text-black relative transition-colors"
            >
              [ Notifications{notifications.length > 0 ? ` ${notifications.length}` : ''} ]
            </button>
            <NotificationsPanel
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              notifications={notifications}
            />
          </div>

          <button
            onClick={() => setShowProfile(true)}
            className="px-3 py-1 border border-slate-500 text-xs font-bold text-slate-100 bg-slate-700 hover:bg-white hover:text-black transition-colors"
            title={user?.Email || 'Profile'}
          >
            [ {user?.Name || 'Profile'} ]
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1 border border-rose-400 text-xs font-bold text-rose-300 bg-slate-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors"
          >
            [ Logout ]
          </button>
        </div>
      </header>

      <ProfileModal
        user={user}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />

      {/* ── Three-column layout ─────────────────────────────────────────────── */}
      <main className="flex-1 grid grid-cols-[30%_40%_30%] overflow-hidden min-h-0">
        {/* Left — All Transactions */}
        <section className="p-3 min-w-0 h-full flex flex-col overflow-hidden bg-white">
          <h2 className="text-base font-bold text-slate-600 pb-1.5 mb-3 shrink-0 border-b-2 border-slate-700 uppercase tracking-widest">
            All Transactions
          </h2>
          <div className="flex-1 min-h-0 overflow-hidden">
            <HistoricalData />
          </div>
        </section>

        {/* Middle — Budget & Add Transaction */}
        <section className="p-3 min-w-0 h-full flex flex-col overflow-hidden bg-white">
          <h2 className="text-base font-bold text-indigo-700 pb-1.5 mb-3 shrink-0 border-b-2  uppercase tracking-widest">
            Budget for Month
          </h2>
          <div className="flex-1 min-h-0 overflow-hidden">
            <CenterPanel
              budgetRefreshKey={budgetVersion}
              transactionRefreshKey={transactionRefreshKey}
              onTransactionCreated={() =>
                setTransactionRefreshKey((prev) => prev + 1)
              }
            />
          </div>
        </section>

        {/* Right — Overview */}
        <section className="p-3 min-w-0 h-full flex flex-col overflow-hidden bg-slate-50">
          <h2 className="text-base font-bold text-emerald-700 pb-1.5 mb-3 shrink-0 border-b-2 uppercase tracking-widest">
            Overview
          </h2>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <BudgetOverview refreshKey={budgetVersion + transactionRefreshKey} />
          </div>
        </section>
      </main>

      {!checkingBudget && needsOnboarding && (
        <OnboardingModal
          onComplete={() => {
            setNeedsOnboarding(false)
            setBudgetVersion((v) => v + 1)
          }}
        />
      )}
    </div>
  )
}
