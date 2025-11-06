import { NextRequest, NextResponse } from 'next/server'
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const connectDB = require('@/lib/mongodb')
const User = require('@/server/models/User')

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const { name, email, password } = await request.json()

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    })

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
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    )
  }
}
