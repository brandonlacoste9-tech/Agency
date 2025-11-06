# AdGenXAI - AI-Powered Advertising Platform

🚀 Complete Next.js dashboard with Supabase authentication and AI campaign generation.

## Features

- ✅ Google OAuth authentication via Supabase
- ✅ User credit system
- ✅ Campaign creation and management
- ✅ Real-time database updates
- ✅ Beautiful gradient UI with Tailwind CSS
- ✅ TypeScript for type safety

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### 3. Run development server
```bash
npm run dev
```

### 4. Deploy to Vercel
```bash
vercel --prod
```

Add environment variables in Vercel dashboard.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth)
- **Deployment**: Vercel

## License

MIT
