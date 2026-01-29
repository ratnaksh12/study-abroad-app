import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { message, history, profileState } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        // Simulation Mode if no API Key
        if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
            // Simple mock logic for prototype without key
            return NextResponse.json({
                reply: "I am running in simulation mode (No API Key). Based on what you said (" + message + "), I'll assume we can proceed. What is your major?",
                progress: 25,
                isComplete: false
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // System instruction to guide the AI acting as a counsellor
        const systemInstruction = `
      You are an expert AI Study Abroad Counsellor. Your goal is to help the student build their profile.
      You need to collect the following information one step at a time:
      1. Education Level (High School, Bachelors, etc.)
      2. Major/Degree Subject
      3. Graduation Year
      4. Intended Degree (The one they want to study)
      5. Field of Study
      6. Preferred Countries
      7. Budget
      8. English Test Status

      Current Profile State: ${JSON.stringify(profileState || {})}
      
      Rules:
      - Ask only ONE question at a time.
      - Be friendly and encouraging.
      - Keep responses concise.
      - If the user answers, acknowledge it and ask the next relevant question.
      - If you have all information, say "PROFILE_COMPLETE" at the end of your message.
    `;

        // Construct chat history for Gemini
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemInstruction }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am ready to help the student build their profile. I will ask one question at a time." }],
                },
                ...history.map((msg: any) => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                }))
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        // Determine progress (heuristic or asked from LLM - simple heuristic here)
        // Ideally we ask LLM to return JSON, but for "Chat" mode, text is better. 
        // We'll calculate progress based on turn count for this prototype.
        const progress = Math.min((history.length / 16) * 100, 100);

        const isComplete = text.includes("PROFILE_COMPLETE");

        if (isComplete) {
            // Persist completion to DB
            // In a real app we'd get userId from session/token
            // For prototype we'll use a mocked email or parse it from headers if available
            // Here we just mock it since we don't have auth middleware yet in this route
            // importing dynamically to avoid build time issues if db init runs at build
            const { db } = await import('@/lib/db');
            // Mock user for now or get from request body if passed
            // For now, we update the first user found or a default 'test@example.com' 
            // This is a prototype limitation fix
            const userEmail = 'test@example.com'; // TOOD: Real auth
            db.updateProfile(userEmail, { isComplete: true });
        }

        return NextResponse.json({
            reply: text.replace("PROFILE_COMPLETE", ""),
            progress: isComplete ? 100 : progress,
            isComplete
        });

    } catch (error) {
        console.error('AI Chat Error:', error);
        return NextResponse.json(
            { error: 'Failed to process message' },
            { status: 500 }
        );
    }
}
