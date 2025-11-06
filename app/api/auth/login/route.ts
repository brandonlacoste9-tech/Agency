import { NextRequest, NextResponse } from 'next/server'
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const connectDB = require('@/lib/mongodb')
const User = require('@/server/models/User')

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const { email, password } = await request.json()

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const JWT_SECRET = process.env.JWT_SECRET
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set')
    }

    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({ token, user: { id: user._id, name: user.name, email: user.email } })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    )
  }
}
