import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/')
      } else {
        router.push('/?error=auth_failed')
      }
    })
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-2xl">Completing sign in...</div>
    </div>
  )
}