import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../lib/api'

const EMPTY_WH = { name: '', address: '' }
const EMPTY_LOC = { name: '', zone: '' }

export default function Warehouses() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null)
  const [whForm, setWhForm]         = useState(EMPTY_WH)
  const [locForm, setLocForm]       = useState(EMPTY_LOC)
  const [selectedWh, setSelectedWh] = useState(null)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && user && user.role !== 'admin') router.push('/dashboard')
  }, [user, authLoading])

  const load = () => {
    setLoading(true)
    api.get('/warehouses').then(({ data }) => setWarehouses(data.data)).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { if (user) load() }, [user])

  const handleSaveWh = async () => {
    setSaving(true); setError('')
    try {
      if (selectedWh) await api.put(`/warehouses/${selectedWh.id}`, whForm)
      else            await api.post('/warehouses', whForm)
      setModal(null); load()
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleSaveLoc = async () => {
    setSaving(true); setError('')
    try {
      await api.post('/locations', { ...locForm, warehouse_id: selectedWh?.id })
      setModal(null); load()
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDeleteWh = async (wh) => {
    if (!confirm(`Delete warehouse "${wh.name}"?`)) return
    try { await api.delete(`/warehouses/${wh.id}`); load() }
    catch (err) { alert(err.response?.data?.message || 'Delete failed') }
  }

  if (loading) return <Layout><LoadingSpinner center /></Layout>

  return (
    <Layout title="Warehouses & Locations">
      <div className="flex justify-end mb-6">
        <button onClick={() => { setWhForm(EMPTY_WH); setSelectedWh(null); setError(''); setModal('warehouse') }}
          className="btn-primary">+ New Warehouse</button>
      </div>

      <div className="space-y-4">
        {warehouses.map((wh) => (
          <div key={wh.id} className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{wh.name}</h3>
                <p className="text-sm text-gray-500">{wh.address}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedWh(wh); setWhForm({ name: wh.name, address: wh.address }); setModal('warehouse') }}
                  className="btn-secondary text-xs py-1.5">Edit</button>
                <button onClick={() => { setSelectedWh(wh); setLocForm(EMPTY_LOC); setError(''); setModal('location') }}
                  className="btn-primary text-xs py-1.5">+ Location</button>
                <button onClick={() => handleDeleteWh(wh)} className="btn-danger text-xs py-1.5">Delete</button>
              </div>
            </div>
            {wh.locations?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {wh.locations.map((loc) => (
                  <div key={loc.id} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <p className="text-sm font-medium text-gray-800">{loc.name}</p>
                    <p className="text-xs text-gray-400">{loc.zone}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No locations yet</p>
            )}
          </div>
        ))}
        {warehouses.length === 0 && <p className="text-center text-gray-400 py-12">No warehouses yet</p>}
      </div>

      {modal === 'warehouse' && (
        <Modal title={selectedWh ? 'Edit Warehouse' : 'New Warehouse'} onClose={() => setModal(null)}
          onConfirm={handleSaveWh} confirmLabel="Save" loading={saving}>
          <div className="space-y-4">
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div>
              <label className="label">Warehouse Name</label>
              <input className="input" value={whForm.name} onChange={(e) => setWhForm({ ...whForm, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" value={whForm.address} onChange={(e) => setWhForm({ ...whForm, address: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}

      {modal === 'location' && (
        <Modal title={`Add Location to ${selectedWh?.name}`} onClose={() => setModal(null)}
          onConfirm={handleSaveLoc} confirmLabel="Add" loading={saving}>
          <div className="space-y-4">
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div>
              <label className="label">Location Name</label>
              <input className="input" value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} placeholder="e.g. Rack A" />
            </div>
            <div>
              <label className="label">Zone</label>
              <input className="input" value={locForm.zone} onChange={(e) => setLocForm({ ...locForm, zone: e.target.value })} placeholder="e.g. Storage, Production Floor" />
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  )
}