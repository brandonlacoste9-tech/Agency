'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface Campaign {
  _id: string
  name: string
  product: string
  targetAudience: string
  platform: string
  createdAt: string
  ads: any[]
}

export default function Dashboard() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchUserData(token)
    fetchCampaigns(token)
  }, [router])

  const fetchUserData = async (token: string) => {
    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data)
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      localStorage.removeItem('token')
      router.push('/login')
    }
  }

  const fetchCampaigns = async (token: string) => {
    try {
      const response = await axios.get('/api/campaigns', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCampaigns(response.data)
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  const deleteCampaign = async (id: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      await axios.delete(`/api/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCampaigns(campaigns.filter(c => c._id !== id))
    } catch (error) {
      console.error('Failed to delete campaign:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">AdGenXAI</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My Campaigns</h2>
          <button
            onClick={() => router.push('/campaign/new')}
            className="bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
          >
            + New Campaign
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Loading campaigns...</div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-xl text-gray-600 mb-4">No campaigns yet</div>
            <p className="text-gray-500 mb-6">Create your first AI-powered ad campaign</p>
            <button
              onClick={() => router.push('/campaign/new')}
              className="bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign._id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition duration-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{campaign.name}</h3>
                <p className="text-gray-600 mb-2">Product: {campaign.product}</p>
                <p className="text-gray-600 mb-2">Platform: {campaign.platform}</p>
                <p className="text-sm text-gray-500 mb-4">
                  {new Date(campaign.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/campaign/${campaign._id}`)}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200"
                  >
                    View
                  </button>
                  <button
                    onClick={() => deleteCampaign(campaign._id)}
                    className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
