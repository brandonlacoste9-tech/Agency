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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; adId: string }> }
) {
  try {
    await connectDB()
    const userId = getUserIdFromToken(request)
    const data = await request.json()
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

    campaign.ads[adIndex] = { ...campaign.ads[adIndex].toObject(), ...data }
    await campaign.save()

    return NextResponse.json(campaign.ads[adIndex])
  } catch (error) {
    console.error('Update ad error:', error)
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    )
  }
}
