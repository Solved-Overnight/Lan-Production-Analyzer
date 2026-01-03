
import { GoogleGenAI, Type } from "@google/genai";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { base64Data, mimeType } = await req.json();

    const ai = new GoogleGenAI({
      apiKey: process.env.API_KEY || "", 
    });

    const model = "gemini-3-flash-preview";

    const systemInstruction = `
      You are an expert data extraction specialist for textile manufacturing "Daily RFT Reports". 
      Your task is to extract every row from the main production table and the summary performance metrics at the bottom.
      
      Extraction Rules:
      1. Table Headers: MC, Batch no., Buyer, order, Colour, F/Type, F.Qty, Load Cap%, Shade ok, Shade not ok, Dyeing Type, Shift Unload, Remarks.
      2. Bottom Metrics: "BULK RFT %" and "SHIFT WISE PERFORMANCE" (YOUSUF vs HUMAYUN).
      3. Handle "Shade ok" and "Shade not ok" as booleans (check for 'OK' or marks in the columns).
      
      Strictly follow the output schema.
    `;

    const prompt = "Extract all entries from this RFT report. Ensure you capture every machine row in the main table and the performance summary at the bottom including the Bulk RFT percentage and the shift performance for Yousuf and Humayun.";

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
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
                  fType: { type: Type.STRING },
                  fQty: { type: Type.NUMBER },
                  loadCapPercent: { type: Type.NUMBER },
                  shadeOk: { type: Type.BOOLEAN },
                  shadeNotOk: { type: Type.BOOLEAN },
                  dyeingType: { type: Type.STRING },
                  shiftUnload: { type: Type.STRING },
                  remarks: { type: Type.STRING }
                },
                required: ["mc", "batchNo", "fQty"]
              }
            },
            bulkRftPercent: { type: Type.NUMBER },
            shiftPerformance: {
              type: Type.OBJECT,
              properties: {
                yousuf: { type: Type.NUMBER },
                humayun: { type: Type.NUMBER }
              }
            }
          },
          required: ["date", "entries", "bulkRftPercent"]
        },
      },
    });

    return new Response(response.text, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("RFT Function Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Extraction failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
