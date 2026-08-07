import { useEffect, useState } from 'react'
import { authFetch } from '../../util/xhr'

interface BudgetEntry {
  type: string
  name: string
  amount: number
}

interface BudgetSummaryProps {
  refreshKey?: number
}

export function BudgetSummary({ refreshKey }: BudgetSummaryProps) {
  const [budget, setBudget] = useState<BudgetEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBudget = async () => {
      setLoading(true)
      try {
        const response = await authFetch('/budget/active')
        if (!response.ok) {
          setBudget([])
          return
        }
        const data = await response.json()
        setBudget(data.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadBudget()
  }, [refreshKey])

  const sumByType = (type: string) =>
    budget
      .filter((b) => b.type.toLowerCase() === type)
      .reduce((sum, b) => sum + b.amount, 0)

  const totalIncome = sumByType('income')
  const totalExpense = sumByType('expense')

  return (
    <div className="border border-black mb-4 text-xs shadow-sm">
      <div className="border-b border-black bg-slate-700 text-white px-2 py-1.5 font-bold tracking-wide">
        BUDGET SUMMARY
      </div>
      <div className="grid grid-cols-2">
        <div className="border-r border-black px-2 py-2.5 bg-emerald-50">
          <div className="font-bold text-emerald-700 text-xs uppercase tracking-wide mb-0.5">Income</div>
          <div className="text-lg font-bold text-emerald-600">
            {loading ? '...' : totalIncome.toFixed(2)}
          </div>
        </div>
        <div className="px-2 py-2.5 bg-rose-50">
          <div className="font-bold text-rose-700 text-xs uppercase tracking-wide mb-0.5">Expense</div>
          <div className="text-lg font-bold text-rose-600">
            {loading ? '...' : totalExpense.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}
