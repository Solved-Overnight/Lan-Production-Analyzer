import { GoogleGenAI, Type } from "@google/genai";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server Error: API_KEY is missing." }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { base64Data, mimeType } = await req.json();

    if (!base64Data) {
      return new Response(JSON.stringify({ error: "Missing report data" }), { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3-flash-preview";

    const systemInstruction = `
      You are an Industrial OCR Specialist for Lantabur Apparels Ltd.
      Target Document: DAILY RFT REPORT.

      VISUAL ANCHORS:
      - Date: Found at the top-center in a cyan box (e.g., 22-Jan-26).
      - Unit: Found at the top-right in a cyan box (e.g., Unit-02).
      - Columns: MC, Batch no., Buyer, Order, Colour, Color Group, F/Type, F.Qty, Load Cap%, Shade ok, Shade not ok, Dyeing Type, Shift Unload, Remarks.

      EXTRACTION PROTOCOL:
      1. AUDIT: Verify all 14 column headers are present and readable.
      2. ERROR HANDLING: If any header is missing or the image is too blurry to read a specific section, set 'isSuccess' to false and explain exactly which headers/areas are missing in 'errorMessage'.
      3. DATA MAPPING:
         - Batch no.: Capture exactly as seen (e.g., "01307+1308").
         - F.Qty: Extract as a NUMBER (e.g., 1456.6).
         - Load Cap%: Extract as a NUMBER. CRITICAL: If the cell contains "FALSE" or any text, return 0.
         - Shade ok / Shade not ok: If the cell contains "ok" or a mark, set the respective boolean to true.
         - Shift Unload: Format as "DAY" or "NIGHT" followed by the operator name (e.g., "DAY- YOUSUF").
         - Dyeing Type: Usually "B/D CARD" or "LAB".

      One-shot accuracy is mandatory. Do not skip any rows between MC 19 and the bottom totals.
    `;

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
          { text: "Perform high-precision extraction. Pay close attention to MC 24 and S-19 which contain 'FALSE' in the Load Cap% column; map these to 0. If headers are missing, provide the exact reason." },
        ],
      },
      config: {
        systemInstruction,
        temperature: 0,
        thinkingConfig: { thinkingBudget: 0 },
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
                },
                required: ["mc", "batchNo"]
              }
            },
            bulkRftPercent: { type: Type.NUMBER },
            labRftPercent: { type: Type.NUMBER }
          },
          required: ["isSuccess"]
        },
      },
    });

    return new Response(response.text, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("RFT AI Error:", err);
    return new Response(
      JSON.stringify({ 
        isSuccess: false, 
        errorMessage: "The AI service encountered an internal error. This often happens if the image file is too large. Please try a smaller or more closely cropped version of the table." 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
};