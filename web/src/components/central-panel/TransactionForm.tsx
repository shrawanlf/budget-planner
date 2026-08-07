import { useEffect, useState } from 'react'
import { authFetch } from '../../util/xhr'

interface Category {
  type: string
  name: string
}

interface TransactionFormProps {
  onCreated?: () => void
}

export function TransactionForm({ onCreated }: TransactionFormProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryType, setCategoryType] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [amount, setAmount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
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

  const types = Array.from(new Set(categories.map((c) => c.type)))
  const names = categories
    .filter((c) => c.type === categoryType)
    .map((c) => c.name)

  const handleTypeChange = (value: string) => {
    setCategoryType(value)
    setCategoryName('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!categoryType || !categoryName) {
      setError('Select a category type and name')
      return
    }

    const amountValue = Number(amount)
    if (!amount || amountValue <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    setSubmitting(true)
    try {
      const response = await authFetch('/transaction/', {
        method: 'POST',
        body: JSON.stringify({
          categoryType,
          categoryName,
          amount: amountValue,
          remarks: remarks || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.message || 'Failed to add transaction')
        return
      }

      setSuccess('Transaction added successfully')
      setCategoryType('')
      setCategoryName('')
      setAmount('')
      setRemarks('')
      onCreated?.()
    } catch (err) {
      console.error(err)
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="border border-black mb-4 text-xs shadow-sm">
      <div className="border-b border-black bg-slate-700 text-white px-2 py-1.5 font-bold tracking-wide">
        ADD TRANSACTION
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-3 bg-white">
        <div className="flex items-center gap-2">
          <label className="w-16 font-bold text-slate-600">Type:</label>
          <select
            value={categoryType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="flex-1 border border-black px-1 py-0.5 bg-white focus:outline-none focus:bg-indigo-50"
          >
            <option value="">--</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="w-16 font-bold text-slate-600">Name:</label>
          <select
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            disabled={!categoryType}
            className="flex-1 border border-black px-1 py-0.5 bg-white focus:outline-none focus:bg-indigo-50 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">--</option>
            {names.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="w-16 font-bold text-slate-600">Amount:</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 border border-black px-1 py-0.5 focus:outline-none focus:bg-indigo-50"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="w-16 font-bold text-slate-600">Remarks:</label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="optional"
            className="flex-1 border border-black px-1 py-0.5 focus:outline-none focus:bg-indigo-50"
          />
        </div>

        {error && (
          <div className="border border-rose-300 bg-rose-50 px-2 py-1 text-rose-700">
            ⚠ {error}
          </div>
        )}
        {success && (
          <div className="border border-emerald-300 bg-emerald-50 px-2 py-1 text-emerald-700">
            ✓ {success}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 border border-slate-800 bg-slate-600 text-white font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {submitting ? '> Adding...' : '> Add Transaction'}
        </button>
      </form>
    </div>
  )
}
