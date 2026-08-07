import { useCallback, useEffect, useState } from 'react'
import { authFetch } from '../../util/xhr'

interface Transaction {
  UserId: string
  Time: string
  CategoryType: string
  CategoryName: string
  Amount: number
  Remarks: string | null
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatTime(epochSeconds: string) {
  const ms = Number(epochSeconds) * 1000
  if (Number.isNaN(ms)) return epochSeconds
  return new Date(ms).toLocaleString()
}

interface RecentTransactionsProps {
  refreshKey?: number
}

export function RecentTransactions({ refreshKey }: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadTransactions = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 7)

      const params = new URLSearchParams({
        startDate: formatDateInput(start),
        endDate: formatDateInput(end),
      })

      const response = await authFetch(`/transaction/?${params.toString()}`)

      if (!response.ok) {
        const data = await response.json()
        setError(data.message || 'Failed to fetch transactions')
        setTransactions([])
        return
      }

      const data = await response.json()
      const all: Transaction[] = data.data || []
      // Sort newest first, keep last 10
      const recent = all
        .sort((a, b) => Number(b.Time) - Number(a.Time))
        .slice(0, 10)
      setTransactions(recent)
    } catch (err) {
      console.error(err)
      setError('An error occurred while fetching transactions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions, refreshKey])

  return (
    <div className="text-xs h-full flex flex-col min-h-0 min-w-0 shadow-sm">
      <div className="border border-black border-b-0 bg-slate-700 text-white px-2 py-1.5 font-bold tracking-wide shrink-0">
        RECENT TRANSACTIONS
        <span className="font-normal text-slate-400 ml-2">(last 10)</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden border border-black bg-white">
        {loading && <p className="px-2 py-2 text-slate-400">Loading...</p>}

        {error && (
          <div className="border-b border-rose-200 bg-rose-50 px-2 py-1.5 text-rose-700">
            ⚠ {error}
          </div>
        )}

        {!loading && !error && transactions.length === 0 && (
          <p className="px-2 py-2 text-slate-400">No transactions in the last 7 days.</p>
        )}

        {!loading &&
          transactions.map((t, index) => {
            const isIncome = t.CategoryType.toLowerCase() === 'income'
            const borderColor = isIncome
              ? 'border-l-4 border-l-emerald-500'
              : 'border-l-4 border-l-rose-500'
            const amountColor = isIncome ? 'text-emerald-600' : 'text-rose-600'
            const bgHover = isIncome ? 'hover:bg-emerald-50' : 'hover:bg-rose-50'

            return (
              <div
                key={`${t.UserId}-${t.Time}-${index}`}
                className={`border-b border-slate-100 last:border-b-0 px-2 py-1.5 ${borderColor} ${bgHover}`}
              >
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700">
                    {t.CategoryType} <span className="text-slate-400">/</span> {t.CategoryName}
                  </span>
                  <span className={`${amountColor} font-bold`}>
                    {isIncome ? '+' : '-'}{t.Amount.toFixed(2)}
                  </span>
                </div>
                <div className="text-slate-400 mt-0.5">{formatTime(t.Time)}</div>
                {t.Remarks && (
                  <div className="italic text-slate-500 mt-0.5">"{t.Remarks}"</div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}
