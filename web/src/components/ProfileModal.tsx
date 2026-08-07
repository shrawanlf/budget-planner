interface User {
  Id: string
  Email: string
  Name?: string
  Phone?: string
}

interface ProfileModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ user, isOpen, onClose }: ProfileModalProps) {
  if (!isOpen || !user) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Floating Panel */}
      <div className="fixed top-12 right-4 w-80 bg-white border border-slate-300 shadow-xl z-50 font-mono text-xs flex flex-col">
        <div className="border-b border-slate-800 px-3 py-2 bg-slate-700 text-white flex justify-between items-center shrink-0">
          <h3 className="font-bold tracking-wide">USER PROFILE</h3>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-300 hover:bg-white hover:text-black px-2 py-0.5 border border-slate-500 transition-colors"
          >
            [ X ]
          </button>
        </div>

        <div className="p-3 space-y-2 overflow-y-auto">
          <div className="border border-slate-200 px-2 py-1.5 bg-slate-50">
            <div className="font-bold text-slate-400 mb-0.5 text-xs uppercase tracking-wide">Email</div>
            <div className="text-slate-700">{user.Email}</div>
          </div>

          {user.Name && (
            <div className="border border-slate-200 px-2 py-1.5 bg-slate-50">
              <div className="font-bold text-slate-400 mb-0.5 text-xs uppercase tracking-wide">Name</div>
              <div className="text-slate-700">{user.Name}</div>
            </div>
          )}

          {user.Phone && (
            <div className="border border-slate-200 px-2 py-1.5 bg-slate-50">
              <div className="font-bold text-slate-400 mb-0.5 text-xs uppercase tracking-wide">Phone</div>
              <div className="text-slate-700">{user.Phone}</div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-3 py-2 bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            className="w-full px-2 py-1 border border-slate-400 text-xs font-bold bg-white text-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
          >
            [ Close ]
          </button>
        </div>
      </div>
    </>
  )
}
