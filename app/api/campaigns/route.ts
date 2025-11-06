import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromToken } from '@/lib/auth'
const connectDB = require('@/lib/mongodb')
const Campaign = require('@/server/models/Campaign')

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const userId = getUserIdFromToken(request.headers.get('authorization'))

    const campaigns = await Campaign.find({ userId }).sort({ createdAt: -1 })
    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('Fetch campaigns error:', error)
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const userId = getUserIdFromToken(request.headers.get('authorization'))
    const data = await request.json()

    const campaign = await Campaign.create({
      userId,
      name: data.name,
      product: data.product,
      description: data.description,
      targetAudience: data.targetAudience,
      platform: data.platform,
      tone: data.tone,
      keywords: data.keywords,
      ads: [],
    })

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Create campaign error:', error)
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    )
  }
}
