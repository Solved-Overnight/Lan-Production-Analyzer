
import { GoogleGenAI, Type } from "@google/genai";

export default async (req: Request) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Ensure API Key is available on the server
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API_KEY environment variable is not set on the server." }), { 
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
    const model = "gemini-3-flash-preview";

    const systemInstruction = `
      You are an expert data extraction specialist for textile manufacturing reports. 
      Your task is to extract production data from the "Daily Dyeing Production Report" of LANTABUR GROUP.
      
      Look for summary tables or headers labeled "Color Group Wise", "Inhouse/Sub Contract", and "Taqwa/Others".
      
      MAPPING RULES FOR ABBREVIATIONS:
      - If you see "N/wash" (even if truncated or poorly scanned), map it exactly to the group name "N/wash".
      - If you see "Double Part -Blac" (due to space shortage), map it exactly to the group name "Double Part -Black".
      - "Double Part" remains "Double Part".
      
      Data to extract for both "Lantabur" and "Taqwa":
      - Total Weight (kg)
      - Loading Capacity %
      - Production type breakdown (Inhouse vs Sub Contract)
      - Specific Color Group breakdown from the "Color Group Wise" table:
        1. 100% Polyester
        2. Average
        3. Black
        4. Dark
        5. Extra Dark
        6. Double Part
        7. Double Part -Black (Normalized from "Double Part -Blac")
        8. Light
        9. Medium
        10. N/wash (Normalized from "N/wash" or "Normal Wash")
        11. Royal
        12. White
      
      Return the date in "DD MMM YYYY" format.
      Strictly follow the output schema. Ensure all numeric values are numbers.
    `;

    const prompt = "Analyze this production report image. Carefully extract weights for all categories for both Lantabur and Taqwa sections, paying specific attention to the Color Group Wise summary table. Note that 'N/wash' and 'Double Part -Blac' are common abbreviations for 'N/wash' and 'Double Part -Black' respectively.";

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
        thinkingConfig: { thinkingBudget: 2048 },
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
