import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server Error: GEMINI_API_KEY is missing." }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { base64Data, mimeType } = await req.json();
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash";

    const systemInstruction = `Extract table from "DAILY RFT REPORT". Columns: MC, Batch no, Buyer, order, Colour, Color Group, F/Type, F.Qty, Load Cap%, Shade ok, Shade not ok, Dyeing Type, Shift Unload, Remarks. Shade ok/not ok as BOOLEANS.`;

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
          { text: "Extract the RFT data table into JSON format. Capture all rows faithfully." },
        ],
      },
      config: {
        systemInstruction,
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSuccess: { type: Type.BOOLEAN },
            errorMessage: { type: Type.STRING },
            date: { type: Type.STRING },
            unit: { type: Type.STRING },
            companyName: { type: Type.STRING },
            entries: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  mc: { type: Type.STRING },
                  batchNo: { type: Type.STRING },
                  buyer: { type: Type.STRING },
                  order: { type: Type.STRING },
                  colour: { type: Type.STRING },
                  colorGroup: { type: Type.STRING },
                  fType: { type: Type.STRING },
                  fQty: { type: Type.NUMBER },
                  loadCapPercent: { type: Type.NUMBER },
                  shadeOk: { type: Type.BOOLEAN },
                  shadeNotOk: { type: Type.BOOLEAN },
                  dyeingType: { type: Type.STRING },
                  shiftUnload: { type: Type.STRING },
                  remarks: { type: Type.STRING }
                }
              }
            },
            bulkRftPercent: { type: Type.NUMBER },
            labRftPercent: { type: Type.NUMBER }
          },
          required: ["isSuccess"]
        },
      },
    });

    return new Response(response.text, { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ isSuccess: false, errorMessage: err.message }), { status: 200 });
  }
};
