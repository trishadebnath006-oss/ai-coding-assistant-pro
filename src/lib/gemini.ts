import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// Use Vite's way or process.env if injected (especially for AI Studio environments)
const API_KEY = 
  (import.meta as any).env?.VITE_GEMINI_API_KEY || 
  (process.env as any).GEMINI_API_KEY;

if (!API_KEY) {
  console.error("GEMINI_API_KEY is missing. Please set it in your environment variables.");
}

const ai = new GoogleGenAI({ 
  apiKey: API_KEY || "",
});

export async function generateCodeResponse(
  prompt: string, 
  history: { role: string, content: string }[]
) {
  const systemInstruction = `
    You are an expert AI coding assistant for beginners. 
    Your goal is to generate simple, correct, and beginner-friendly code.
    Support languages: Python, JavaScript, C, C++, HTML/CSS.
    
    Rules:
    1. Always provide a short, simple explanation first.
    2. Provide the code in a clean markdown code block.
    3. Use simple English.
    4. Keep it concise.
    5. If the request is unclear, ask for clarification.
    6. Do not use complex libraries unless requested.
    7. Format:
       [Short Explanation]
       \`\`\`[language]
       [Code]
       \`\`\`
       [Optional Tip]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [
        ...history.map(m => ({
          role: m.role === 'ai' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL
        }
      },
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
