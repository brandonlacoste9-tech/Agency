import { NextRequest } from "next/server";

/**
 * GET /api/dashboard/projects
 * Retrieve user's projects/generations
 */
export async function GET(req: NextRequest) {
  try {
    // Mock projects data - in production, fetch from database
    const mockProjects = [
      {
        id: "proj_1",
        title: "Product Launch Campaign",
        description: "AI-generated ads for new product launch",
        model: "openai/gpt-4o",
        prompt:
          "Create an engaging social media campaign concept for a new AI productivity tool. Include key messaging angles, visual style guide, and target audience breakdown.",
        output:
          "Campaign focuses on efficiency gains: 'Do more with AI' messaging with minimalist design, targeting busy professionals aged 25-45. Visual: clean white/blue palette with tech-forward imagery.",
        tokensUsed: 2345,
        latency: 245,
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        tags: ["product", "campaign", "launch"],
        status: "success",
      },
      {
        id: "proj_2",
        title: "Blog Post Outline",
        description: "AI-generated blog structure for content marketing",
        model: "openai/gpt-5",
        prompt:
          "Create a comprehensive outline for a 2000-word blog post about AI trends in 2025. Include introduction hook, 5 main sections with subsections, and call-to-action.",
        output:
          "Outline: Intro (hook about AI adoption), Section 1: Multimodal AI, Section 2: Enterprise Adoption, Section 3: Ethical AI, Section 4: Creator Tools, Section 5: Future Outlook, CTA.",
        tokensUsed: 1823,
        latency: 189,
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        tags: ["blog", "content", "writing"],
        status: "success",
      },
      {
        id: "proj_3",
        title: "Email Copy - Holiday Sale",
        description: "Email marketing copy for holiday promotion",
        model: "openai/gpt-4o",
        prompt:
          "Write a compelling holiday email campaign with subject line, preheader, body copy, and CTA. Target: existing customers. Goal: 10% discount drive urgency.",
        output:
          "Subject: Unwrap 10% off this weekend only 🎁 | Preheader: Holiday exclusive for you | Body: Warm holiday greeting, product showcase, limited-time angle, clear CTA: Shop Holiday Sale →",
        tokensUsed: 1456,
        latency: 167,
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        tags: ["email", "marketing", "sales"],
        status: "success",
      },
      {
        id: "proj_4",
        title: "Social Media Captions",
        description: "Generated captions for Instagram posts",
        model: "openai/gpt-4o",
        prompt:
          "Create 5 engaging Instagram captions for product photos. Mix storytelling, calls-to-action, and emojis. Keep each under 150 characters.",
        output:
          "1. Your workflow just got smarter 🚀 2. Built for creators, powered by AI ✨ 3. What if productivity was actually fun? 🎯 4. One click away from your best work 💫 5. AI that understands your vision 👀",
        tokensUsed: 987,
        latency: 145,
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        tags: ["social", "instagram", "copywriting"],
        status: "success",
      },
      {
        id: "proj_5",
        title: "Sales Pitch Deck Outline",
        description: "Structure for investor pitch presentation",
        model: "openai/gpt-5",
        prompt:
          "Create a 10-slide investor pitch deck outline for an AI startup. Include problem statement, solution, market size, team, financials, and ask.",
        output:
          "Slide 1: Hook/Title, 2: Problem, 3: Market Size, 4: Solution Demo, 5: Business Model, 6: Traction, 7: Team Bios, 8: Financial Projections, 9: Use of Funds, 10: Call to Action",
        tokensUsed: 2134,
        latency: 201,
        createdAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
        tags: ["pitch", "startup", "investors"],
        status: "success",
      },
    ];

    return Response.json(mockProjects);
  } catch (error) {
    return Response.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
