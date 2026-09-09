import { GoogleGenAI, Type } from "@google/genai";

// Vite exposes client-side environment variables through import.meta.env.
// Use a VITE_ prefixed variable and keep the real key out of source control.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const auditVideoMetadata = async (
  title: string,
  description: string
): Promise<{ safetyStatus: string; reason: string }> => {
  if (!ai) {
    console.warn("No Gemini API key provided. Returning mock analysis.");
    return {
      safetyStatus: "SAFE",
      reason: "AI Analysis skipped (No API Key). Defaulting to Safe.",
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
              description: "One of: SAFE, FLAGGED, MANUAL_REVIEW",
            },
            reason: {
              type: Type.STRING,
              description: "A short explanation of the classification.",
            },
          },
        },
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      safetyStatus: "MANUAL_REVIEW",
      reason: "AI Analysis failed due to technical error.",
    };
  }
};
