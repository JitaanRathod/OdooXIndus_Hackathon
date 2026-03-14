import Sidebar from './Sidebar'

export default function Layout({ children, title }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {title && (
            <h1 className="text-xl font-bold text-gray-900 mb-6">{title}</h1>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}