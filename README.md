# AdGenXAI - AI-Powered Ad Generator

AdGenXAI is a professional web application that uses AI to generate compelling ad copy and images for digital advertising campaigns. The platform enables users to create, preview, edit, and export ad variants for multiple platforms including Google Ads, Facebook, Instagram, LinkedIn, and Twitter.

## Features

- **User Authentication**: Secure login and registration system
- **AI-Powered Ad Copy Generation**: Uses GPT to create compelling headlines, descriptions, and calls-to-action
- **AI Image Generation**: Integrates DALL-E for creating custom ad images
- **Multi-Platform Support**: Generate ads optimized for Google, Facebook, Instagram, LinkedIn, and Twitter
- **Campaign Management**: Create and manage multiple ad campaigns
- **Ad Editing**: Preview and edit generated ads before export
- **Export Functionality**: Download ads for use in your campaigns
- **Professional UI**: Clean, modern interface built with React and Tailwind CSS

## Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **Node.js**: Runtime environment
- **MongoDB**: Database for campaigns and user data
- **Mongoose**: MongoDB object modeling

### AI Integration
- **OpenAI GPT-3.5**: Ad copy generation
- **OpenAI DALL-E 3**: Image generation

### Authentication
- **JWT**: JSON Web Tokens for secure authentication
- **bcryptjs**: Password hashing

## Installation

### Prerequisites
- Node.js 18+ installed
- MongoDB installed and running (or MongoDB Atlas account)
- OpenAI API key

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/brandonlacoste9-tech/Agency.git
   cd Agency
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your credentials:
   ```
   MONGODB_URI=mongodb://localhost:27017/adgenxai
   JWT_SECRET=your-secure-secret-key
   OPENAI_API_KEY=sk-your-openai-api-key
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   
   If using local MongoDB:
   ```bash
   mongod
   ```
   
   Or use MongoDB Atlas and update the `MONGODB_URI` in `.env`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   
   Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Creating Your First Campaign

1. **Register/Login**: Create an account or log in to access the dashboard
2. **Create Campaign**: Click "New Campaign" button
3. **Fill Campaign Details**:
   - Campaign name
   - Product/service name
   - Product description
   - Target audience
   - Platform (Google, Facebook, etc.)
   - Tone (professional, casual, etc.)
   - Keywords (optional)
4. **Generate Ads**: Click "Create Campaign & Generate Ads"
5. **Review Generated Ads**: View AI-generated ad variants with headlines, descriptions, and CTAs
6. **Generate Images**: Click "Generate Image" for each ad to create AI-powered visuals
7. **Edit Ads**: Use the Edit button to customize any ad copy
8. **Export**: Download ads for use in your advertising campaigns

## Project Structure

```
Agency/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   └── campaigns/       # Campaign management endpoints
│   ├── campaign/            # Campaign pages
│   ├── dashboard/           # Dashboard page
│   ├── login/               # Login page
│   ├── register/            # Registration page
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── server/                  # Server-side code
│   └── models/              # Database models
│       ├── User.js
│       └── Campaign.js
├── lib/                     # Utilities
│   └── mongodb.js           # Database connection
├── public/                  # Static files
├── .env.example             # Environment variables template
├── .gitignore              # Git ignore rules
├── next.config.js          # Next.js configuration
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Campaigns
- `GET /api/campaigns` - List user's campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/[id]` - Get campaign details
- `PUT /api/campaigns/[id]` - Update campaign
- `DELETE /api/campaigns/[id]` - Delete campaign
- `POST /api/campaigns/[id]/generate` - Generate ads for campaign
- `PUT /api/campaigns/[id]/ads/[adId]` - Update specific ad
- `POST /api/campaigns/[id]/ads/[adId]/generate-image` - Generate image for ad

## Build for Production

```bash
npm run build
npm start
```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `OPENAI_API_KEY`: OpenAI API key for GPT and DALL-E
- `NEXT_PUBLIC_API_URL`: Public API URL

## Security Notes

- Always use strong, unique JWT secrets in production
- Store API keys securely and never commit them to version control
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Validate and sanitize all user inputs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub. 
