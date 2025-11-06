# AdGenXAI Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (local installation or MongoDB Atlas account)
3. **OpenAI API Key** (sign up at https://platform.openai.com)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Database - Use local MongoDB or MongoDB Atlas
MONGODB_URI=mongodb://localhost:27017/adgenxai
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/adgenxai

# JWT Secret - Generate a secure random string
# Run this command to generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_generated_secret_here

# OpenAI API Key - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your_openai_api_key_here

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Start MongoDB (if using local installation)

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

### 5. Build for Production

```bash
npm run build
npm start
```

## Getting Your API Keys

### OpenAI API Key

1. Go to https://platform.openai.com/signup
2. Create an account or sign in
3. Navigate to https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Copy the key and add it to your `.env` file
6. **Important**: Add credits to your OpenAI account for API usage

### MongoDB Atlas (Free Tier)

If you don't want to install MongoDB locally:

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a new cluster (select free tier)
4. Create a database user
5. Whitelist your IP address (or use 0.0.0.0/0 for development)
6. Get your connection string and add it to `.env`

## Generate JWT Secret

Run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET` in `.env`

## Troubleshooting

### Port 3000 already in use

```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### MongoDB connection failed

- Check if MongoDB is running: `mongosh` (should connect without errors)
- Verify your connection string in `.env`
- For MongoDB Atlas, ensure your IP is whitelisted

### OpenAI API errors

- Verify your API key is correct
- Check that you have credits in your OpenAI account
- Ensure your API key has access to GPT-3.5 and DALL-E 3

### Build errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

## Project Structure

```
Agency/
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   └── campaigns/      # Campaign management endpoints
│   ├── campaign/           # Campaign pages
│   ├── dashboard/          # Dashboard page
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── server/                  # Server-side code
│   └── models/             # Database models
├── lib/                    # Utilities
│   ├── mongodb.js          # Database connection
│   └── auth.ts             # Auth helpers
├── .env                    # Environment variables (not in git)
├── .env.example            # Environment template
└── README.md               # Documentation
```

## Usage

1. **Register an account** at http://localhost:3000/register
2. **Create a campaign** by clicking "New Campaign" on the dashboard
3. **Fill in campaign details**: product name, description, target audience, platform
4. **Generate ads** - the AI will create multiple ad variants
5. **Generate images** for each ad variant
6. **Edit ads** to refine the copy
7. **Export ads** to download them for use in your campaigns

## Features

- ✅ User authentication with JWT
- ✅ AI-powered ad copy generation (GPT-3.5)
- ✅ AI image generation (DALL-E 3)
- ✅ Support for multiple ad platforms
- ✅ Campaign management (CRUD operations)
- ✅ Ad editing and customization
- ✅ Export functionality
- ✅ Responsive design
- ✅ Security best practices

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the main README.md
3. Open an issue on GitHub

## License

See LICENSE file for details.
