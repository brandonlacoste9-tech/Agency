import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Campaign {
  id: string
  brand_name: string
  status: string
  created_at: string
  video_url?: string
}

interface UserCredits {
  credits_remaining: number
  plan: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<UserCredits | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [formData, setFormData] = useState({
    brandName: '',
    brandDescription: '',
    campaignGoal: '',
    targetAudience: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      loadUserCredits()
      loadCampaigns()
    }
  }, [user])

  const loadUserCredits = async () => {
    const { data } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user!.id)
      .single()

    if (data) setCredits(data)
  }

  const loadCampaigns = async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) setCampaigns(data)
  }

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!credits || credits.credits_remaining < 1) {
      alert('Insufficient credits!')
      return
    }

    setIsSubmitting(true)

    try {
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user!.id,
          brand_name: formData.brandName,
          brand_description: formData.brandDescription,
          campaign_goal: formData.campaignGoal,
          target_audience: formData.targetAudience,
          status: 'queued',
        })
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('user_credits')
        .update({ credits_remaining: credits.credits_remaining - 1 })
        .eq('user_id', user!.id)

      await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id, ...formData })
      })

      alert('Campaign created!')
      setFormData({ brandName: '', brandDescription: '', campaignGoal: '', targetAudience: '' })
      loadUserCredits()
      loadCampaigns()
    } catch (error) {
      alert('Error creating campaign')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-2xl">Loading...</div></div>
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 shadow-2xl max-w-md">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">AdGenXAI</h1>
          <p className="text-xl mb-8 text-gray-300">AI-Powered Advertising Platform</p>
          <button onClick={handleSignIn} className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg">Sign in with Google</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">AdGenXAI Dashboard</h1>
          <div className="flex items-center gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl px-6 py-3">
              <span className="text-sm text-gray-300">Credits:</span>
              <span className="ml-2 text-2xl font-bold">{credits?.credits_remaining ?? 0}</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">{user.email}</p>
              <button onClick={handleSignOut} className="text-sm text-purple-400 hover:text-purple-300">Sign out</button>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6">Create New Campaign</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Brand Name</label>
              <input type="text" required value={formData.brandName} onChange={(e) => setFormData({ ...formData, brandName: e.target.value })} className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Enter your brand name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Brand Description</label>
              <textarea required value={formData.brandDescription} onChange={(e) => setFormData({ ...formData, brandDescription: e.target.value })} className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Describe your brand" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Campaign Goal</label>
              <input type="text" required value={formData.campaignGoal} onChange={(e) => setFormData({ ...formData, campaignGoal: e.target.value })} className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g., Increase brand awareness" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Target Audience</label>
              <input type="text" required value={formData.targetAudience} onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })} className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g., Young professionals" />
            </div>
            <button type="submit" disabled={isSubmitting || (credits?.credits_remaining ?? 0) < 1} className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:scale-100 disabled:cursor-not-allowed">{isSubmitting ? 'Creating...' : 'Generate Campaign (1 Credit)'}</button>
          </form>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6">Your Campaigns</h2>
          {campaigns.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No campaigns yet. Create your first one above!</p>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{campaign.brand_name}</h3>
                      <p className="text-sm text-gray-400">Created: {new Date(campaign.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${campaign.status === 'completed' ? 'bg-green-500/20 text-green-400' : campaign.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>{campaign.status}</span>
                  </div>
                  {campaign.video_url && <div className="mt-4"><a href={campaign.video_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">View Generated Video →</a></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}