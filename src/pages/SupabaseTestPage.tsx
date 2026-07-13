import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function SupabaseTestPage() {
  const [status, setStatus] = useState('Testing connection...')

  useEffect(() => {
    async function testConnection() {
      const { error } = await supabase.auth.getSession()

      if (error) {
        setStatus(`Connection failed: ${error.message}`)
        return
      }

      setStatus('Supabase connection successful')
    }

    testConnection()
  }, [])

  return (
    <section className="section page-section">
      <div className="section-heading">
        <p className="eyebrow">System Test</p>
        <h1 className="page-title">Supabase connection</h1>
        <p>{status}</p>
      </div>
    </section>
  )
}

export default SupabaseTestPage