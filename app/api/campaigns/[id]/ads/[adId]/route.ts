import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromToken } from '@/lib/auth'
const connectDB = require('@/lib/mongodb')
const Campaign = require('@/server/models/Campaign')

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; adId: string }> }
) {
  try {
    await connectDB()
    const userId = getUserIdFromToken(request.headers.get('authorization'))
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
