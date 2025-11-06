import { NextRequest, NextResponse } from 'next/server'
const jwt = require('jsonwebtoken')
const connectDB = require('@/lib/mongodb')
const User = require('@/server/models/User')

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      )
    }

    const JWT_SECRET = process.env.JWT_SECRET
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set')
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET)

    const user = await User.findById(decoded.userId).select('-password')
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { message: 'Invalid token' },
      { status: 401 }
    )
  }
}
