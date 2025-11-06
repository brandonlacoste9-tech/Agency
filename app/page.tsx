'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            AdGenXAI
          </h1>
          <p className="text-2xl text-gray-700 mb-8">
            AI-Powered Ad Copy & Image Generator
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
            Create professional digital ads for Google, Facebook, and other platforms with the power of AI.
            Generate compelling copy and stunning images in seconds.
          </p>
        </div>

        <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl p-8">
          <div className="space-y-4">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/register')}
              className="w-full bg-white text-indigo-600 border-2 border-indigo-600 py-3 px-6 rounded-lg font-semibold hover:bg-indigo-50 transition duration-200"
            >
              Register
            </button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-semibold mb-2">AI-Generated Copy</h3>
            <p className="text-gray-600">
              Create compelling ad copy using advanced GPT technology
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">AI-Generated Images</h3>
            <p className="text-gray-600">
              Generate stunning visuals for your ad campaigns
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">Multi-Platform</h3>
            <p className="text-gray-600">
              Export ads optimized for Google, Facebook, and more
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
