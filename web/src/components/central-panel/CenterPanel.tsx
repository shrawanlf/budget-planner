import { BudgetSummary } from './BudgetSummary'
import { TransactionForm } from './TransactionForm'
import { RecentTransactions } from './RecentTransactions'

interface CenterPanelProps {
  budgetRefreshKey?: number
  transactionRefreshKey?: number
  onTransactionCreated?: () => void
}

export function CenterPanel({
  budgetRefreshKey,
  transactionRefreshKey = 0,
  onTransactionCreated,
}: CenterPanelProps) {
  return (
    <div className="flex flex-col gap-4 h-full min-h-0 min-w-0">
      <div className="shrink-0">
        <BudgetSummary refreshKey={budgetRefreshKey} />
        <TransactionForm onCreated={onTransactionCreated} />
      </div>
      <div className="flex-1 min-h-0">
        <RecentTransactions refreshKey={transactionRefreshKey} />
      </div>
    </div>
  )
}
