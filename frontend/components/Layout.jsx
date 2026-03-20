import Head from 'next/head'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Toast from './Toast'

export default function Layout({ children, title }) {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>{title ? `${title} — Stockify` : 'Stockify'}</title>
        <meta name="description" content="Stockify — Modern Inventory Management System" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />

        <main className="flex-1 md:ml-60 min-h-screen flex flex-col">
          {/* Top header bar */}
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 h-14 flex items-center px-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-900">Stockify</span>
              {title && (
                <>
                  <span className="text-gray-300">/</span>
                  <span className="text-primary-600 font-medium">{title}</span>
                </>
              )}
            </div>
          </header>

          {/* Page content — fast fade in, no blocking exit wait */}
          <AnimatePresence>
            <motion.div
              key={router.pathname}
              className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-7"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {title && (
                <h1 className="text-xl font-bold text-gray-900 mb-6">{title}</h1>
              )}
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global toast notifications */}
      <Toast />
    </>
  )
}