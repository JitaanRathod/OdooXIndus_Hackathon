import { Toaster } from 'react-hot-toast'

export default function Toast() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#fff',
                    color: '#111827',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.07), 0 4px 6px -2px rgba(0,0,0,0.04)',
                    maxWidth: '380px',
                },
                success: {
                    iconTheme: { primary: '#10b981', secondary: '#fff' },
                    style: { borderLeft: '3px solid #10b981' },
                },
                error: {
                    iconTheme: { primary: '#ef4444', secondary: '#fff' },
                    style: { borderLeft: '3px solid #ef4444' },
                    duration: 6000,
                },
                loading: {
                    iconTheme: { primary: '#6366f1', secondary: '#fff' },
                    style: { borderLeft: '3px solid #6366f1' },
                },
            }}
        />
    )
}
