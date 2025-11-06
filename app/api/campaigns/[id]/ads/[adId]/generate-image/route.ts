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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; adId: string }> }
) {
  try {
    await connectDB()
    const userId = getUserIdFromToken(request)
    const { prompt } = await request.json()
    const { id, adId } = await params

    const campaign = await Campaign.findOne({ _id: id, userId })
    if (!campaign) {
      return NextResponse.json(
        { message: 'Campaign not found' },
        { status: 404 }
      )
    }

    const adIndex = campaign.ads.findIndex(
      (ad: any) => ad._id.toString() === adId
    )

    if (adIndex === -1) {
      return NextResponse.json(
        { message: 'Ad not found' },
        { status: 404 }
      )
    }

    // Lazy load OpenAI to avoid build-time initialization
    const OpenAI = require('openai')
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Generate image using DALL-E
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    })

    const imageUrl = response.data[0].url

    campaign.ads[adIndex].imageUrl = imageUrl
    await campaign.save()

    return NextResponse.json({ imageUrl })
  } catch (error: any) {
    console.error('Generate image error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to generate image' },
      { status: 500 }
    )
  }
}
