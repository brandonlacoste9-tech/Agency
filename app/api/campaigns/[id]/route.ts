import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromToken } from '@/lib/auth'
const connectDB = require('@/lib/mongodb')
const Campaign = require('@/server/models/Campaign')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const userId = getUserIdFromToken(request.headers.get('authorization'))
    const { id } = await params

    const campaign = await Campaign.findOne({ _id: id, userId })
    if (!campaign) {
      return NextResponse.json(
        { message: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Fetch campaign error:', error)
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const userId = getUserIdFromToken(request.headers.get('authorization'))
    const { id } = await params

    const campaign = await Campaign.findOneAndDelete({ _id: id, userId })
    if (!campaign) {
      return NextResponse.json(
        { message: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Campaign deleted' })
  } catch (error) {
    console.error('Delete campaign error:', error)
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const userId = getUserIdFromToken(request.headers.get('authorization'))
    const data = await request.json()
    const { id } = await params

    const campaign = await Campaign.findOneAndUpdate(
      { _id: id, userId },
      data,
      { new: true }
    )

    if (!campaign) {
      return NextResponse.json(
        { message: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Update campaign error:', error)
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    )
  }
}
