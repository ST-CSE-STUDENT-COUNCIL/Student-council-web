import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export type Toast = {
    id: string
    type: ToastType
    message: string
}

type ToastContainerProps = {
    toasts: Toast[]
    onRemove: (id: string) => void
}

const ICONS = {
    success: <CheckCircle size={20} className="text-emerald-500" />,
    error: <XCircle size={20} className="text-red-500" />,
    info: <AlertCircle size={20} className="text-blue-500" />
}

const STYLES = {
    success: 'border-emerald-200 bg-emerald-50',
    error: 'border-red-200 bg-red-50',
    info: 'border-blue-200 bg-blue-50'
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onRemove, 4000)
        return () => clearTimeout(timer)
    }, [onRemove])

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-right fade-in duration-300 ${STYLES[toast.type]}`}
        >
            {ICONS[toast.type]}
            <p className="text-sm font-medium text-gray-800 flex-1">{toast.message}</p>
            <button
                onClick={onRemove}
                className="p-1 rounded-full hover:bg-white/50 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    )
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    if (toasts.length === 0) return null

    return createPortal(
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 min-w-[320px] max-w-[420px]">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
            ))}
        </div>,
        document.body
    )
}

// Hook for managing toasts
export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
        setToasts(prev => [...prev, { id, type, message }])
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const success = useCallback((message: string) => addToast('success', message), [addToast])
    const error = useCallback((message: string) => addToast('error', message), [addToast])
    const info = useCallback((message: string) => addToast('info', message), [addToast])

    return { toasts, removeToast, success, error, info }
}
