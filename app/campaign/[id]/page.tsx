'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import Image from 'next/image'

interface Ad {
  _id: string
  headline: string
  description: string
  callToAction: string
  imageUrl?: string
  imagePrompt?: string
}

interface Campaign {
  _id: string
  name: string
  product: string
  description: string
  targetAudience: string
  platform: string
  tone: string
  keywords: string
  ads: Ad[]
}

export default function CampaignView() {
  const router = useRouter()
  const params = useParams()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [editingAd, setEditingAd] = useState<string | null>(null)
  const [editedAd, setEditedAd] = useState<Partial<Ad>>({})

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchCampaign(token)
  }, [params.id, router])

  const fetchCampaign = async (token: string) => {
    try {
      const response = await axios.get(`/api/campaigns/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCampaign(response.data)
    } catch (error) {
      console.error('Failed to fetch campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAds = async () => {
    setGenerating(true)
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await axios.post(
        `/api/campaigns/${params.id}/generate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setCampaign(response.data)
    } catch (error) {
      console.error('Failed to generate ads:', error)
      alert('Failed to generate ads. Please check your API keys.')
    } finally {
      setGenerating(false)
    }
  }

  const generateImage = async (adId: string, prompt: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await axios.post(
        `/api/campaigns/${params.id}/ads/${adId}/generate-image`,
        { prompt },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      if (campaign) {
        const updatedAds = campaign.ads.map(ad =>
          ad._id === adId ? { ...ad, imageUrl: response.data.imageUrl } : ad
        )
        setCampaign({ ...campaign, ads: updatedAds })
      }
    } catch (error) {
      console.error('Failed to generate image:', error)
      alert('Failed to generate image. Please check your API keys.')
    }
  }

  const startEdit = (ad: Ad) => {
    setEditingAd(ad._id)
    setEditedAd({ ...ad })
  }

  const saveEdit = async () => {
    if (!editingAd || !campaign) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      await axios.put(
        `/api/campaigns/${params.id}/ads/${editingAd}`,
        editedAd,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      const updatedAds = campaign.ads.map(ad =>
        ad._id === editingAd ? { ...ad, ...editedAd } : ad
      )
      setCampaign({ ...campaign, ads: updatedAds })
      setEditingAd(null)
    } catch (error) {
      console.error('Failed to update ad:', error)
    }
  }

  const exportAd = (ad: Ad) => {
    const content = `
Campaign: ${campaign?.name}
Platform: ${campaign?.platform}
---
Headline: ${ad.headline}
Description: ${ad.description}
Call to Action: ${ad.callToAction}
${ad.imageUrl ? `Image: ${ad.imageUrl}` : ''}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaign?.name}_ad.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading campaign...</div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Campaign not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">AdGenXAI</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{campaign.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
            <div><strong>Product:</strong> {campaign.product}</div>
            <div><strong>Platform:</strong> {campaign.platform}</div>
            <div><strong>Target Audience:</strong> {campaign.targetAudience}</div>
            <div><strong>Tone:</strong> {campaign.tone}</div>
            <div className="col-span-2"><strong>Description:</strong> {campaign.description}</div>
          </div>

          {campaign.ads.length === 0 && (
            <div className="mt-6">
              <button
                onClick={generateAds}
                disabled={generating}
                className="bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
              >
                {generating ? 'Generating Ads...' : 'Generate AI Ads'}
              </button>
            </div>
          )}
        </div>

        {campaign.ads.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Generated Ads</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaign.ads.map((ad) => (
                <div key={ad._id} className="bg-white rounded-lg shadow-lg p-6">
                  {editingAd === ad._id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Headline
                        </label>
                        <input
                          type="text"
                          value={editedAd.headline || ''}
                          onChange={(e) => setEditedAd({ ...editedAd, headline: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={editedAd.description || ''}
                          onChange={(e) => setEditedAd({ ...editedAd, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Call to Action
                        </label>
                        <input
                          type="text"
                          value={editedAd.callToAction || ''}
                          onChange={(e) => setEditedAd({ ...editedAd, callToAction: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingAd(null)}
                          className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{ad.headline}</h4>
                      <p className="text-gray-700 mb-4">{ad.description}</p>
                      <p className="text-indigo-600 font-semibold mb-4">{ad.callToAction}</p>

                      {ad.imageUrl ? (
                        <div className="mb-4">
                          <img
                            src={ad.imageUrl}
                            alt={ad.headline}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        </div>
                      ) : ad.imagePrompt ? (
                        <div className="mb-4">
                          <button
                            onClick={() => generateImage(ad._id, ad.imagePrompt!)}
                            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
                          >
                            Generate Image
                          </button>
                        </div>
                      ) : null}

                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(ad)}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => exportAd(ad)}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                        >
                          Export
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
