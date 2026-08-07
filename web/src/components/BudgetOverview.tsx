import { useEffect, useMemo, useState } from 'react'
import { authFetch } from '../util/xhr'

interface BudgetEntry {
  type: string
  name: string
  amount: number
  amountSpent: number
}

interface Transaction {
  UserId: string
  Time: string
  CategoryType: string
  CategoryName: string
  Amount: number
  Remarks: string | null
}

interface BudgetOverviewProps {
  refreshKey?: number
}

// Build list of last 6 months + current, most-recent first.
function buildMonthOptions() {
  const options: { label: string; value: string }[] = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 2)
    const value = d.toISOString().slice(0, 7) // "YYYY-MM"
    const label = d.toLocaleString('default', { month: 'short', year: 'numeric' })
    options.push({ label, value })
  }
  return options
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

// Return "YYYY-MM-01" and "YYYY-MM-DD" (last day) for a given "YYYY-MM" string
function monthDateRange(month: string): { startDate: string; endDate: string } {
  const [year, mon] = month.split('-').map(Number)
  const lastDay = new Date(year, mon, 0).getDate()
  return {
    startDate: `${month}-01`,
    endDate: `${month}-${String(lastDay).padStart(2, '0')}`,
  }
}

function formatTime(epochSeconds: string) {
  const ms = Number(epochSeconds) * 1000
  if (Number.isNaN(ms)) return epochSeconds
  return new Date(ms).toLocaleString()
}

// ── Drill-down modal ──────────────────────────────────────────────────────────

interface DrillDownModalProps {
  categoryName: string
  month: string
  monthLabel: string
  onClose: () => void
}

function DrillDownModal({ categoryName, month, monthLabel, onClose }: DrillDownModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const { startDate, endDate } = monthDateRange(month)
        const params = new URLSearchParams({
          startDate,
          endDate,
          categoryType: 'Expense',
          categoryName,
        })
        const res = await authFetch(`/transaction/?${params.toString()}`)
        if (!res.ok) {
          const data = await res.json()
          setError(data.message || 'Failed to fetch transactions')
          return
        }
        const data = await res.json()
        // Sort newest first
        const sorted = (data.data || []).sort(
          (a: Transaction, b: Transaction) => Number(b.Time) - Number(a.Time),
        )
        setTransactions(sorted)
      } catch (err) {
        console.error(err)
        setError('An error occurred')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [categoryName, month])

  const total = transactions.reduce((sum, t) => sum + t.Amount, 0)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md border border-slate-300 bg-white font-mono text-xs pointer-events-auto flex flex-col max-h-[80vh] shadow-2xl">
          {/* Header */}
          <div className="border-b border-slate-800 bg-rose-700 text-white px-3 py-2 flex items-center justify-between shrink-0">
            <div>
              <div className="font-bold text-sm">{categoryName}</div>
              <div className="text-rose-200 text-xs mt-0.5">
                Expense transactions · {monthLabel}
              </div>
            </div>
            <button
              onClick={onClose}
              className="border border-rose-400 px-2 py-0.5 text-white hover:bg-white hover:text-rose-700 transition-colors"
            >
              [ x ]
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {loading && (
              <p className="px-3 py-2 text-slate-400">Loading...</p>
            )}

            {!loading && error && (
              <div className="px-3 py-2 border-b border-rose-200 bg-rose-50 text-rose-700">
                ⚠ {error}
              </div>
            )}

            {!loading && !error && transactions.length === 0 && (
              <p className="px-3 py-2 text-slate-400">
                No transactions for {categoryName} in {monthLabel}.
              </p>
            )}

            {!loading && transactions.map((t, i) => (
              <div
                key={`${t.Time}-${i}`}
                className="border-b border-slate-100 last:border-b-0 px-3 py-2 border-l-4 border-l-rose-500 hover:bg-rose-50"
              >
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700">{t.CategoryName}</span>
                  <span className="text-rose-600">-{t.Amount.toFixed(2)}</span>
                </div>
                <div className="text-slate-400 mt-0.5">{formatTime(t.Time)}</div>
                {t.Remarks && (
                  <div className="italic text-slate-500 mt-0.5">"{t.Remarks}"</div>
                )}
              </div>
            ))}
          </div>

          {/* Footer — total */}
          {!loading && transactions.length > 0 && (
            <div className="border-t border-slate-200 bg-rose-50 px-3 py-2 flex justify-between font-bold shrink-0">
              <span className="text-slate-600">
                TOTAL ({transactions.length} txn{transactions.length !== 1 ? 's' : ''})
              </span>
              <span className="text-rose-600">-{total.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function BudgetOverview({ refreshKey }: BudgetOverviewProps) {
  const monthOptions = useMemo(() => buildMonthOptions(), [])
  const [selectedMonth, setSelectedMonth] = useState(currentMonth())
  const [budget, setBudget] = useState<BudgetEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [drillDown, setDrillDown] = useState<{ name: string } | null>(null)

  const isCurrentMonth = selectedMonth === currentMonth()

  useEffect(() => {
    const loadBudget = async () => {
      setLoading(true)
      try {
        let response: Response
        if (isCurrentMonth) {
          response = await authFetch('/budget/active')
          if (!response.ok) { setBudget([]); return }
          const data = await response.json()
          setBudget(data.data || [])
        } else {
          response = await authFetch(`/budget/expenses-by-date?date=${selectedMonth}`)
          if (!response.ok) { setBudget([]); return }
          const data = await response.json()
          setBudget(data.data?.Expenses || [])
        }
      } catch (err) {
        console.error(err)
        setBudget([])
      } finally {
        setLoading(false)
      }
    }
    loadBudget()
  }, [selectedMonth, refreshKey, isCurrentMonth])

  const expenses = budget.filter((b) => b.type.toLowerCase() === 'expense')
  const incomes = budget.filter((b) => b.type.toLowerCase() === 'income')

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalExpenseSpent = expenses.reduce((sum, e) => sum + e.amountSpent, 0)
  const totalExpensePercent =
    totalExpenseAmount > 0
      ? Math.min((totalExpenseSpent / totalExpenseAmount) * 100, 100)
      : 0

  let totalBarColor = 'bg-emerald-500'
  let totalStatusLabel = 'On Track'
  let totalStatusColor = 'text-emerald-600'
  if (totalExpensePercent >= 100) {
    totalBarColor = 'bg-rose-500'; totalStatusLabel = 'Over Budget'; totalStatusColor = 'text-rose-600'
  } else if (totalExpensePercent >= 80) {
    totalBarColor = 'bg-amber-500'; totalStatusLabel = 'Near Limit'; totalStatusColor = 'text-amber-600'
  }

  const selectedMonthLabel =
    monthOptions.find((o) => o.value === selectedMonth)?.label ?? selectedMonth

  return (
    <div className="space-y-3 min-w-0 text-xs">
      {/* Month selector */}
      <div className="border border-black shadow-sm">
        <div className="border-b border-black bg-slate-700 text-white px-2 py-1.5 font-bold tracking-wide flex items-center justify-between">
          <span>MONTH</span>
          {!isCurrentMonth && (
            <button
              onClick={() => setSelectedMonth(currentMonth())}
              className="text-xs border border-sky-400 px-1.5 py-0.5 text-sky-100 hover:bg-white hover:text-sky-700 font-normal transition-colors"
            >
              [ Today ]
            </button>
          )}
        </div>
        <div className="px-2 py-1.5 bg-white">
          <select
            value={selectedMonth}
            onChange={(e) => { setSelectedMonth(e.target.value); setDrillDown(null) }}
            className="w-full border border-black px-2 py-1 bg-white focus:outline-none focus:bg-sky-50 font-mono text-xs"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}{opt.value === currentMonth() ? ' (current)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="border border-black px-2 py-2 text-slate-400 bg-white shadow-sm">Loading...</p>
      ) : budget.length === 0 ? (
        <div className="border border-black px-2 py-2 text-slate-400 bg-white shadow-sm">
          No budget data for {selectedMonthLabel}.
        </div>
      ) : (
        <>
          {/* Total Expense Summary */}
          <div className="border border-black shadow-sm">
            <div className="border-b border-black bg-slate-700 text-white px-2 py-1.5 font-bold tracking-wide">
              TOTAL EXPENSE
            </div>
            {expenses.length === 0 ? (
              <p className="px-2 py-1.5 text-slate-400 bg-white">No expenses.</p>
            ) : (
              <div className="px-2 py-2 bg-white">
                <div className="flex justify-between font-bold mb-1.5">
                  <span className="text-slate-600">Total</span>
                  <span className={totalExpensePercent >= 100 ? 'text-rose-600' : 'text-slate-700'}>
                    {totalExpenseSpent.toFixed(2)} / {totalExpenseAmount.toFixed(2)}
                  </span>
                </div>
                <div className="h-2.5 border border-slate-200 bg-slate-100 mb-1.5 rounded-sm overflow-hidden">
                  <div
                    className={`h-full ${totalBarColor} transition-all`}
                    style={{ width: `${totalExpensePercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>{totalExpensePercent.toFixed(0)}% used</span>
                  <span className={totalStatusColor}>[{totalStatusLabel}]</span>
                </div>
              </div>
            )}
          </div>

          {/* Per-category expense bars — clickable for drill-down */}
          <div className="border border-black shadow-sm">
            <div className="border-b border-black bg-slate-700 text-white px-2 py-1.5 font-bold tracking-wide flex items-center justify-between">
              <span>EXPENSES</span>
              <span className="font-normal text-sky-200 text-xs">↓ click to drill down</span>
            </div>
            {expenses.length === 0 ? (
              <p className="px-2 py-1.5 text-slate-400 bg-white">No expense categories.</p>
            ) : (
              expenses.map((entry) => {
                const percent =
                  entry.amount > 0
                    ? Math.min((entry.amountSpent / entry.amount) * 100, 100)
                    : 0

                let barColor = 'bg-emerald-500'
                let statusLabel = 'On Track'
                let statusColor = 'text-emerald-600'
                if (percent >= 100) {
                  barColor = 'bg-rose-500'; statusLabel = 'Over Budget'; statusColor = 'text-rose-600'
                } else if (percent >= 80) {
                  barColor = 'bg-amber-500'; statusLabel = 'Near Limit'; statusColor = 'text-amber-600'
                }

                return (
                  <div
                    key={entry.name}
                    onClick={() => setDrillDown({ name: entry.name })}
                    className="border-b border-slate-100 last:border-b-0 px-2 py-2 cursor-pointer hover:bg-sky-50 group bg-white"
                  >
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-700 group-hover:text-sky-700 group-hover:underline">
                        {entry.name}
                      </span>
                      <span className={percent >= 100 ? 'text-rose-600' : 'text-slate-600'}>
                        {entry.amountSpent.toFixed(2)} / {entry.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 border border-slate-200 bg-slate-100 rounded-sm overflow-hidden">
                      <div className={`h-full ${barColor}`} style={{ width: `${percent}%` }} />
                    </div>
                    <div className="flex justify-between text-slate-400 mt-0.5">
                      <span>{percent.toFixed(0)}% used</span>
                      <span className={statusColor}>[{statusLabel}]</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Income list */}
          <div className="border border-black shadow-sm">
            <div className="border-b border-black bg-slate-700 text-white px-2 py-1.5 font-bold tracking-wide">
              INCOME
            </div>
            {incomes.length === 0 ? (
              <p className="px-2 py-1.5 text-slate-400 bg-white">No income categories.</p>
            ) : (
              incomes.map((entry) => (
                <div
                  key={entry.name}
                  className="flex justify-between border-b border-slate-100 last:border-b-0 px-2 py-2 bg-white hover:bg-emerald-50"
                >
                  <span className="font-bold text-slate-700">{entry.name}</span>
                  <span className="text-emerald-600 font-bold">{entry.amount.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Drill-down modal */}
      {drillDown && (
        <DrillDownModal
          categoryName={drillDown.name}
          month={selectedMonth}
          monthLabel={selectedMonthLabel}
          onClose={() => setDrillDown(null)}
        />
      )}
    </div>
  )
}
