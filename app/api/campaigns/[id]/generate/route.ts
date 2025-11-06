import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromToken } from '@/lib/auth'
const connectDB = require('@/lib/mongodb')
const Campaign = require('@/server/models/Campaign')

export async function POST(
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

    // Lazy load OpenAI to avoid build-time initialization
    const OpenAI = require('openai')
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Generate ad copy using GPT
    const prompt = `You are an expert advertising copywriter. Create 3 different ad variants for ${campaign.platform} with the following details:

Product: ${campaign.product}
Description: ${campaign.description}
Target Audience: ${campaign.targetAudience}
Tone: ${campaign.tone}
Keywords: ${campaign.keywords || 'N/A'}

For each ad variant, provide:
1. A compelling headline (max 60 characters for Google, 40 for Facebook)
2. A description (max 150 characters)
3. A call-to-action
4. An image generation prompt for AI image generation

Format your response as a JSON array of objects with keys: headline, description, callToAction, imagePrompt.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert advertising copywriter. Always respond with valid JSON only, no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
    })

    let ads = []
    try {
      const content = completion.choices[0].message.content || '[]'
      ads = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse GPT response:', parseError)
      // Fallback ads if GPT fails
      ads = [
        {
          headline: `Amazing ${campaign.product} Deals`,
          description: `Discover ${campaign.product} for ${campaign.targetAudience}. Limited time offer!`,
          callToAction: 'Shop Now',
          imagePrompt: `Professional marketing image for ${campaign.product}, modern and clean design`
        },
        {
          headline: `${campaign.product} - Best Choice`,
          description: `Experience the difference with ${campaign.product}. Perfect for ${campaign.targetAudience}.`,
          callToAction: 'Learn More',
          imagePrompt: `Eye-catching advertisement image showcasing ${campaign.product}, high quality`
        },
        {
          headline: `Transform Your Life`,
          description: `${campaign.product} is designed for ${campaign.targetAudience}. Don't miss out!`,
          callToAction: 'Get Started',
          imagePrompt: `Creative promotional image for ${campaign.product}, professional photography style`
        }
      ]
    }

    campaign.ads = ads
    await campaign.save()

    return NextResponse.json(campaign)
  } catch (error: any) {
    console.error('Generate ads error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to generate ads' },
      { status: 500 }
    )
  }
}
