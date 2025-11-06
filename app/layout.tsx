import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AdGenXAI - AI-Powered Ad Generator',
  description: 'Generate professional ad copy and images with AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
