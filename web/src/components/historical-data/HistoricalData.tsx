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

interface Category {
  type: string
  name: string
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function defaultStartDate() {
  const d = new Date()
  d.setDate(1)
  return formatDateInput(d)
}

function defaultEndDate() {
  return formatDateInput(new Date())
}

function formatTime(epochSeconds: string) {
  const ms = Number(epochSeconds) * 1000
  if (Number.isNaN(ms)) return epochSeconds
  return new Date(ms).toLocaleString()
}

export function HistoricalData() {
  const [startDate, setStartDate] = useState(defaultStartDate())
  const [endDate, setEndDate] = useState(defaultEndDate())
  const [categoryType, setCategoryType] = useState('')
  const [categoryTypes, setCategoryTypes] = useState<string[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCategoryTypes = async () => {
      try {
        const response = await authFetch('/budget/categories')
        if (!response.ok) return
        const data = await response.json()
        const categories: Category[] = data.data || []
        setCategoryTypes(Array.from(new Set(categories.map((c) => c.type))))
      } catch (err) {
        console.error(err)
      }
    }
    loadCategoryTypes()
  }, [])

  const loadTransactions = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate, endDate })
      const response = await authFetch(`/transaction/?${params.toString()}`)

      if (!response.ok) {
        const data = await response.json()
        setError(data.message || 'Failed to fetch transactions')
        setTransactions([])
        return
      }

      const data = await response.json()
      setTransactions(data.data || [])
    } catch (err) {
      console.error(err)
      setError('An error occurred while fetching transactions')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const filteredTransactions = categoryType
    ? transactions.filter((t) => t.CategoryType === categoryType)
    : transactions

  return (
    <div className="text-xs h-full flex flex-col min-h-0 min-w-0">
      {/* Filter controls */}
      <div className="space-y-2 mb-3 border border-black p-2 bg-slate-50 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <label className="w-12 font-bold text-slate-600">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1 border border-black px-1 py-0.5 focus:outline-none focus:bg-indigo-50 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-12 font-bold text-slate-600">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex-1 border border-black px-1 py-0.5 focus:outline-none focus:bg-indigo-50 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-12 font-bold text-slate-600">Type:</label>
          <select
            value={categoryType}
            onChange={(e) => setCategoryType(e.target.value)}
            className="flex-1 border border-black px-1 py-0.5 bg-white focus:outline-none focus:bg-indigo-50"
          >
            <option value="">All</option>
            {categoryTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={loadTransactions}
          className="w-full py-1.5 border border-slate-700 bg-slate-600 text-white font-bold hover:bg-slate-700 transition-colors"
        >
          [ Apply Filters ]
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {loading && <p className="text-slate-400 py-1">Loading...</p>}

        {error && (
          <div className="border border-rose-300 bg-rose-50 px-2 py-1.5 mb-2 text-rose-700">
            ⚠ {error}
          </div>
        )}

        {!loading && !error && filteredTransactions.length === 0 && (
          <p className="text-slate-400 py-1">No transactions found.</p>
        )}

        {!loading && filteredTransactions.length > 0 && (
          <div className="shadow-sm">
            <div className="border-b border-slate-800 bg-slate-700 text-white px-2 py-1.5 font-bold tracking-wide sticky top-0">
              TRANSACTIONS
              <span className="font-normal text-slate-400 ml-2">({filteredTransactions.length})</span>
            </div>
            <div className="border border-black border-t-0 bg-white">
              {filteredTransactions.map((t, index) => {
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
        )}
      </div>
    </div>
  )
}
