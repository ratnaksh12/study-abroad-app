import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { message, history, profile } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
            // Enhanced Mock Response Logic
            const lowerMsg = message.toLowerCase();
            let reply = "I can help with that. Can you tell me more about your profile?";
            let action = null;

            // Context-Aware Logic
            const isDataScience = profile?.major?.toLowerCase().includes('data') || profile?.fieldOfStudy?.toLowerCase().includes('data');
            const isGermany = profile?.preferredCountries?.some((c: string) => c.toLowerCase() === 'germany');
            const isCanada = profile?.preferredCountries?.some((c: string) => c.toLowerCase() === 'canada');

            if (lowerMsg.includes('recommend') || lowerMsg.includes('university') || lowerMsg.includes('shortlist')) {
                if (isDataScience && isGermany) {
                    reply = "Based on your profile (Data Science, targeting Germany), I highly recommend Technical University of Munich (TUM). It has a world-class Data Engineering program with low fees. Would you like to shortlist it?";
                    action = {
                        type: 'SHORTLIST',
                        data: { id: 'tum_ds', name: 'Technical University of Munich', country: 'Germany', chance: 'High' }
                    };
                } else if (isDataScience && isCanada) {
                    reply = "For Data Science in Canada, University of British Columbia (UBC) is a top choice. Given your solid profile, it's a great Target school.";
                    action = {
                        type: 'SHORTLIST',
                        data: { id: 'ubc_ds', name: 'University of British Columbia', country: 'Canada', chance: 'Medium' }
                    };
                } else {
                    reply = "I see you are interested in " + (profile?.fieldOfStudy || 'Computer Science') + ". I recommend looking at Stanford (Dream) and ASU (Safe).";
                }
            } else if (lowerMsg.includes('stanford')) {
                reply = "Stanford is a Dream university with a 4% acceptance rate. Based on your strong profile, it's worth a shot. I recommend locking it to start the SOP process immediately.";
                action = {
                    type: 'LOCK',
                    data: { id: '1', name: 'Stanford University', country: 'USA' }
                };
            } else if (lowerMsg.includes('toronto')) {
                reply = "University of Toronto is a great Target school. Would you like to shortlist it?";
                action = {
                    type: 'SHORTLIST',
                    data: { id: '2', name: 'University of Toronto', country: 'Canada' }
                };
            } else if (lowerMsg.includes('lock')) {
                reply = "I've prepared the locking request.";
                action = {
                    type: 'LOCK',
                    data: { id: '3', name: 'Arizona State University', country: 'USA' }
                };
            }

            return NextResponse.json({ reply, action });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // We instruct Gemini to output a specific JSON structure if an action is needed.
        // "Function calling" in Gemini Pro via text prompting.
        const systemPrompt = `
      You are an AI Counsellor. 
      If the user expresses interest in a university, explain if it's a Reach/Target/Safe.
      
      CRITICAL: If the user explicitly wants to 'Shortlist' or 'Lock' or 'Apply' to a university, 
      you MUST append a valid JSON object at the END of your response.
      
      Format:
      :::ACTION_JSON
      {
        "type": "LOCK" | "SHORTLIST",
        "data": { "id": "generated_id", "name": "University Name", "country": "Country" }
      }
      :::
      
      Example: "Great choice. Stanford is competitive. :::ACTION_JSON {"type": "LOCK", "data": {"id": "1", "name": "Stanford", "country": "USA"}} :::"
    `;

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: "Understood. I will append JSON actions when appropriate." }] },
                ...history.map((msg: any) => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                }))
            ]
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        // Parse for Action JSON
        const actionRegex = /:::ACTION_JSON([\s\S]*?):::/;
        const match = responseText.match(actionRegex);

        let finalReply = responseText;
        let action = null;

        if (match && match[1]) {
            try {
                action = JSON.parse(match[1]);
                finalReply = responseText.replace(match[0], '').trim();
            } catch (e) {
                console.error("Failed to parse AI action JSON", e);
            }
        }

        return NextResponse.json({
            reply: finalReply,
            action
        });

    } catch (error) {
        console.error('Counsellor Chat Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
