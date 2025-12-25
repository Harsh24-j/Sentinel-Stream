import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
// Note: In a real app, this key comes from env. For this demo, we assume process.env.API_KEY is available.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const auditVideoMetadata = async (title: string, description: string): Promise<{ safetyStatus: string; reason: string }> => {
  if (!apiKey) {
    console.warn("No API Key provided. Returning mock analysis.");
    return {
      safetyStatus: 'SAFE',
      reason: 'AI Analysis skipped (No API Key). Defaulting to Safe.'
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following video metadata for safety sensitivity. 
      Classify as SAFE, FLAGGED, or MANUAL_REVIEW based on keywords implying violence, hate speech, or explicit content.
      
      Title: ${title}
      Description: ${description}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            safetyStatus: {
              type: Type.STRING,
              description: "One of: SAFE, FLAGGED, MANUAL_REVIEW"
            },
            reason: {
              type: Type.STRING,
              description: "A short explanation of the classification."
            }
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      safetyStatus: 'MANUAL_REVIEW',
      reason: 'AI Analysis failed due to technical error.'
    };
  }
};
