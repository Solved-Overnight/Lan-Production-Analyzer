
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

export default async (req: Request) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Ensure API Key is available on the server
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY environment variable is not set on the server." }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { base64Data, mimeType } = await req.json();

    if (!base64Data) {
      return new Response(JSON.stringify({ error: "Missing file data" }), { status: 400 });
    }

    // Initialize SDK on server-side
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash";

    const systemInstruction = `Extract production data from "Daily Dyeing Production Report". Sections: LANTABUR, TAQWA. Extract weights for Color Groups, Inhouse, Sub Contract. Date format: "DD MMM YYYY".`;

    const prompt = `Extract LANTABUR and TAQWA production data. Focus on "Color Group Wise" summaries.`;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        systemInstruction,
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            lantabur: {
              type: Type.OBJECT,
              properties: {
                total: { type: Type.NUMBER },
                loadingCap: { type: Type.NUMBER },
                colorGroups: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      groupName: { type: Type.STRING },
                      weight: { type: Type.NUMBER }
                    }
                  }
                },
                inhouse: { type: Type.NUMBER },
                subContract: { type: Type.NUMBER }
              },
              required: ["total", "colorGroups", "inhouse", "subContract"]
            },
            taqwa: {
              type: Type.OBJECT,
              properties: {
                total: { type: Type.NUMBER },
                loadingCap: { type: Type.NUMBER },
                colorGroups: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      groupName: { type: Type.STRING },
                      weight: { type: Type.NUMBER }
                    }
                  }
                },
                inhouse: { type: Type.NUMBER },
                subContract: { type: Type.NUMBER }
              },
              required: ["total", "colorGroups", "inhouse", "subContract"]
            }
          },
          required: ["date", "lantabur", "taqwa"]
        },
      },
    });

    return new Response(response.text, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Netlify Function Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Extraction failed during AI processing." }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
};
