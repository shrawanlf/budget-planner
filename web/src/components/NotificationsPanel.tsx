interface Notification {
  id: string
  title: string
  message: string
  time: number
}

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
  notifications: Notification[]
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString()
}

export function NotificationsPanel({
  isOpen,
  onClose,
  notifications,
}: NotificationsPanelProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Floating Panel */}
      <div className="fixed top-12 right-4 w-80 max-h-96 bg-white border border-slate-300 shadow-xl z-50 font-mono text-xs flex flex-col">
        <div className="border-b border-slate-800 px-3 py-2 bg-slate-700 text-white flex justify-between items-center shrink-0">
          <h3 className="font-bold tracking-wide">NOTIFICATIONS</h3>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-300 hover:bg-white hover:text-black px-2 py-0.5 border border-slate-500 transition-colors"
          >
            [ X ]
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {notifications.length === 0 ? (
            <div className="p-3 text-slate-400 text-center">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="border-b border-slate-100 p-2.5 hover:bg-indigo-50 transition-colors"
              >
                <div className="font-bold text-xs text-slate-700">{notification.title}</div>
                <div className="text-slate-500 mt-1 text-xs leading-snug">
                  {notification.message}
                </div>
                <div className="text-slate-400 mt-1 text-xs">
                  {formatTime(notification.time)}
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t border-slate-200 px-3 py-2 bg-slate-50 shrink-0">
            <button
              onClick={onClose}
              className="w-full px-2 py-1 border border-slate-400 text-xs font-bold bg-white text-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
            >
              [ Dismiss ]
            </button>
          </div>
        )}
      </div>
    </>
  )
}
