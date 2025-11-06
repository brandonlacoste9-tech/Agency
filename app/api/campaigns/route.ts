import { NextRequest, NextResponse } from 'next/server'
const jwt = require('jsonwebtoken')
const connectDB = require('@/lib/mongodb')
const Campaign = require('@/server/models/Campaign')

function getUserIdFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided')
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
  return decoded.userId
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const userId = getUserIdFromToken(request)

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
    const userId = getUserIdFromToken(request)
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
