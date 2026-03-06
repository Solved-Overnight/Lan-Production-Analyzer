import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "GEMINI_API_KEY missing" }), { status: 500 });

  try {
    const { base64Data, mimeType } = await req.json();
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash";

    const systemInstruction = `Extract "Daily Dyeing Program" data. Industry (lantabur/taqwa), date (DD-MMM-YY), unit, and table rows (sl, buyer, orderNo, colour, fType, inhouse, subcontact, totalQty).`;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Extract all table rows from this Dyeing Program report into JSON." },
        ],
      },
      config: {
        systemInstruction,
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            industry: { type: Type.STRING, enum: ["lantabur", "taqwa"] },
            date: { type: Type.STRING },
            unit: { type: Type.STRING },
            entries: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sl: { type: Type.STRING },
                  buyer: { type: Type.STRING },
                  orderNo: { type: Type.STRING },
                  colour: { type: Type.STRING },
                  fType: { type: Type.STRING },
                  inhouse: { type: Type.NUMBER },
                  subcontact: { type: Type.NUMBER },
                  totalQty: { type: Type.NUMBER }
                }
              }
            }
          }
        },
      },
    });

    return new Response(response.text, { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
