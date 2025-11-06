import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { campaignId, brandName } = req.body
    console.log('Campaign generation started:', { campaignId, brandName })
    
    // TODO: Call Modal.com or AI backend here
    // TODO: Or use Vercel AI SDK with Claude!
    
    res.status(200).json({ 
      success: true,
      message: 'Campaign generation started',
      campaignId
    })
  } catch (error) {
    console.error('Generation error:', error)
    res.status(500).json({ error: 'Generation failed' })
  }
}