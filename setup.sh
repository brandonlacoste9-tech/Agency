#!/bin/bash

echo "🚀 AdGenXAI - Project Setup Script"
echo "===================================="
echo ""

# Create directory structure
echo "📁 Creating directories..."
mkdir -p pages/api
mkdir -p pages/auth
mkdir -p styles
mkdir -p lib

# Create package.json
echo "📦 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "adgenxai",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3"
  }
}
EOF

# Create next.config.js
echo "⚙️  Creating next.config.js..."
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
EOF

# Create tsconfig.json
echo "📘 Creating tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
EOF

# Create tailwind.config.js
echo "🎨 Creating tailwind.config.js..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B5CF6',
        secondary: '#06B6D4',
      },
    },
  },
  plugins: [],
}
EOF

# Create postcss.config.js
echo "🔧 Creating postcss.config.js..."
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create .gitignore
echo "🚫 Creating .gitignore..."
cat > .gitignore << 'EOF'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
EOF

# Create styles/globals.css
echo "💅 Creating styles/globals.css..."
cat > styles/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gradient-to-br from-purple-900 via-purple-800 to-cyan-900 min-h-screen text-white;
}
EOF

# Create lib/supabase.ts
echo "🔑 Creating lib/supabase.ts..."
cat > lib/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
EOF

# Create pages/_app.tsx
echo "📄 Creating pages/_app.tsx..."
cat > pages/_app.tsx << 'EOF'
import '../styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
EOF

# Create pages/index.tsx
echo "📄 Creating pages/index.tsx..."
cat > pages/index.tsx << 'MAINEOF'
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
MAINEOF

# Create pages/auth/callback.tsx
echo "🔐 Creating pages/auth/callback.tsx..."
cat > pages/auth/callback.tsx << 'EOF'
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
EOF

# Create pages/api/generate.ts
echo "⚡ Creating pages/api/generate.ts..."
cat > pages/api/generate.ts << 'EOF'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { campaignId, brandName } = req.body
    console.log('Campaign generation started:', { campaignId, brandName })
    
    // TODO: Call Modal.com or AI backend here
    
    res.status(200).json({ 
      success: true,
      message: 'Campaign generation started',
      campaignId
    })
  } catch (error) {
    console.error('Generation error:', error)
    res.status(500).json({ error: 'Generation failed' })
  }
}
EOF

# Create README
echo "📖 Creating README.md..."
cat > README.md << 'EOF'
# AdGenXAI - AI-Powered Advertising Platform

Complete Next.js dashboard with Supabase authentication.

## Quick Start
```bash
npm install
npm run dev
```

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_KEY=your-service-key
```

## Deploy to Vercel
```bash
vercel --prod
```

Add environment variables in Vercel dashboard.
EOF

echo ""
echo "✅ All files created!"
echo ""
