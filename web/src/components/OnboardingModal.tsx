import { useEffect, useState } from 'react'
import { authFetch } from '../util/xhr'

interface Category {
  type: string
  name: string
}

interface SelectedCategory {
  type: string
  name: string
  amount: string
}

interface OnboardingModalProps {
  onComplete: () => void
}

// Header color per category type
const typeHeaderClass: Record<string, string> = {
  Income: 'bg-emerald-700 text-white',
  Expense: 'bg-rose-700 text-white',
}

function getTypeHeaderClass(type: string): string {
  return typeHeaderClass[type] ?? 'bg-slate-700 text-white'
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selected, setSelected] = useState<Record<string, SelectedCategory>>({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await authFetch('/budget/categories')
        if (!response.ok) return
        const data = await response.json()
        setCategories(data.data || [])
      } catch (err) {
        console.error(err)
      }
    }
    loadCategories()
  }, [])

  // Group categories by type
  const grouped = categories.reduce<Record<string, string[]>>((acc, c) => {
    if (!acc[c.type]) acc[c.type] = []
    acc[c.type].push(c.name)
    return acc
  }, {})

  const toggleCategory = (type: string, name: string) => {
    const key = `${type}::${name}`
    setSelected((prev) => {
      if (prev[key]) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: { type, name, amount: '' } }
    })
  }

  const setAmount = (type: string, name: string, amount: string) => {
    const key = `${type}::${name}`
    setSelected((prev) => ({
      ...prev,
      [key]: { ...prev[key], amount },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const entries = Object.values(selected)

    if (entries.length === 0) {
      setError('Select at least one category and enter an amount')
      return
    }

    const missing = entries.filter((e) => !e.amount || Number(e.amount) <= 0)
    if (missing.length > 0) {
      setError(
        `Enter a valid amount for: ${missing.map((e) => e.name).join(', ')}`,
      )
      return
    }

    setSubmitting(true)
    try {
      const payload = entries.map((entry) => ({
        type: entry.type,
        name: entry.name,
        amount: Number(entry.amount),
      }))

      const response = await authFetch('/budget/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.message || 'Failed to save budget')
        setSubmitting(false)
        return
      }

      onComplete()
    } catch (err) {
      console.error(err)
      setError('An error occurred. Please try again.')
      setSubmitting(false)
    }
  }

  const selectedCount = Object.keys(selected).length

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 font-mono z-50">
      <div className="w-full max-w-xl border border-slate-300 bg-white text-black max-h-[90vh] flex flex-col shadow-2xl">
        {/* Modal header */}
        <div className="border-b border-slate-800 px-4 py-3 bg-slate-800 shrink-0">
          <h1 className="text-sm font-bold text-white tracking-wide">
            SETUP REQUIRED — Configure Your Budget
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Select categories and set a monthly budget amount for each.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {Object.keys(grouped).length === 0 && (
              <p className="text-xs text-slate-400">Loading categories...</p>
            )}

            {Object.entries(grouped).map(([type, names]) => (
              <div key={type} className="border border-black shadow-sm">
                {/* Type header */}
                <div className={`px-3 py-2 border-b border-black text-xs font-bold uppercase tracking-widest ${getTypeHeaderClass(type)}`}>
                  {type}
                </div>

                {/* Category rows */}
                <div className="bg-white">
                  {names.map((name) => {
                    const key = `${type}::${name}`
                    const isSelected = !!selected[key]
                    const isIncome = type.toLowerCase() === 'income'
                    const selectedBg = isIncome ? 'bg-emerald-50' : 'bg-rose-50'

                    return (
                      <div
                        key={name}
                        className={`border-b border-slate-100 last:border-b-0 transition-colors ${isSelected ? selectedBg : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-2 px-3 py-2">
                          {/* Checkbox-style toggle */}
                          <button
                            type="button"
                            onClick={() => toggleCategory(type, name)}
                            className={`shrink-0 w-5 h-5 border text-xs font-bold flex items-center justify-center transition-colors ${
                              isSelected
                                ? isIncome
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : 'bg-rose-600 text-white border-rose-700'
                                : 'bg-white border-black hover:bg-slate-100'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </button>

                          {/* Category name */}
                          <span
                            className={`flex-1 text-xs font-bold cursor-pointer select-none ${
                              isSelected
                                ? isIncome ? 'text-emerald-700' : 'text-rose-700'
                                : 'text-slate-500'
                            }`}
                            onClick={() => toggleCategory(type, name)}
                          >
                            {name}
                          </span>

                          {/* Amount input — shown only when selected */}
                          {isSelected && (
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs text-slate-400">$</span>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={selected[key].amount}
                                onChange={(e) =>
                                  setAmount(type, name, e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                                placeholder="0.00"
                                autoFocus
                                className={`w-28 border border-black px-2 py-0.5 text-xs focus:outline-none text-right ${
                                  isIncome ? 'focus:bg-emerald-50' : 'focus:bg-rose-50'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-4 py-3 bg-slate-100 shrink-0 space-y-2">
            {selectedCount > 0 && (
              <p className="text-xs text-slate-500">
                {selectedCount} categor{selectedCount === 1 ? 'y' : 'ies'} selected
              </p>
            )}

            {error && (
              <div className="border border-rose-300 bg-rose-50 px-2 py-1.5 text-xs text-rose-700">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || selectedCount === 0}
              className="w-full py-2 border border-indigo-700 bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? '> Saving...' : `> Save Budget (${selectedCount})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
