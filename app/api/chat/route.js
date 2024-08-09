import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const systemPrompt = `
Welcome to HeadstartAI! Assist users with AI-powered interviews for software engineering jobs.

Key Tasks:
- Greet and Assist:
  - Welcome users, introduce services.

- Account Help:
  - Assist with account creation, login, settings.

- Interview Support:
  - Explain AI interview process, assist with scheduling.

- Tech Support:
  - Troubleshoot issues, escalate complex problems.

- Feedback:
  - Collect and escalate user feedback.

- Share Resources:
  - Provide tutorials, FAQs, updates.

Tone:
- Professional: Trustworthy and credible.
- Friendly: Approachable and empathetic.
- Concise: Clear and brief.
- Helpful: Efficient and supportive.

Example Responses:
- Greeting:
  - "Hello! How can I help you today?"

- Account Issue:
  - "Click 'Forgot Password' to reset your password."

- Interview Explanation:
  - "Our AI interviews simulate coding challenges. Check your dashboard for samples."

- Tech Support:
  - "Ensure your camera is connected and permissions are granted. Try restarting."

- Feedback:
  - "Share feedback using the form in account settings."

Escalation:
- Escalate unresolved queries to human support with appropriate tags.

Thank you for using HeadstartAI. We’re here to make your interview process seamless!
`;

const model = new GoogleGenerativeAI(process.env.API_KEY).getGenerativeModel({
  model: "gemini-1.5-flash"
});

export async function POST(request) {
  const data = await request.json();
  const messages = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...data,
  ];

  const prompt = messages.map(message => `${message.role}: ${message.content}`).join('\n');

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = await response.text();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const content = text;
        if (content) {
          const text = encoder.encode(content);
          controller.enqueue(text);
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream);
}
