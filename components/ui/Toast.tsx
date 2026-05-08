"use client"

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: number; message: string; type: ToastType }
interface ToastCtx { toast: (msg: string, type?: ToastType) => void }

const Ctx = createContext<ToastCtx>({ toast: () => {} })

export function useToast() { return useContext(Ctx) }

let _idCounter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current[id])
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++_idCounter
    setToasts(prev => [...prev.slice(-4), { id, message, type }])
    timers.current[id] = setTimeout(() => dismiss(id), 3500)
  }, [dismiss])

  const ICON = { success: CheckCircle2, error: XCircle, info: AlertCircle }
  const COLOR = {
    success: 'border-green-500/30 bg-green-500/10 text-green-400',
    error:   'border-red-500/30   bg-red-500/10   text-red-400',
    info:    'border-blue-500/30  bg-blue-500/10  text-blue-400',
  }

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(t => {
          const Icon = ICON[t.type]
          return (
            <div key={t.id}
              className={`pointer-events-auto flex items-center gap-2.5 pl-3.5 pr-2 py-2.5 bg-zinc-900 border rounded-xl shadow-xl shadow-black/40 text-sm font-medium animate-slide-up min-w-[220px] max-w-xs ${COLOR[t.type]}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-zinc-200">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors shrink-0">
                <X className="w-3 h-3 text-zinc-500" />
              </button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}
