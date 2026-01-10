
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
    return new Response(JSON.stringify({ error: "Server Error: API_KEY is missing in environment." }), { 
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
      You are a specialized data extractor for Lantabur Apparels Ltd "Daily RFT Report".
      
      REPORT STRUCTURE:
      - Top Center: Date (e.g., 01/01/2026)
      - Top Right: Unit (e.g., Unit-02)
      - Header Row: [MC, Batch no., Buyer, order, Colour, Color Group, F/Type, F.Qty, Load Cap, Shade ok, Shade no, Dyeing Ty, Shift Unload, Remarks]
      
      EXTRACTION RULES:
      1. IGNORE the large watermark "Page 1".
      2. Extract EVERY row in the table starting from the first machine number (MC).
      3. For the "Shade ok" column: If the cell contains the text "ok", set "shadeOk" to true and "shadeNotOk" to false.
      4. For the "Shade no" column: If the cell contains any text or is marked/ticked, set "shadeNotOk" to true and "shadeOk" to false.
      5. "F.Qty" is the Fabric Quantity. Extract as a NUMBER (e.g., 1377, 1429.5).
      6. "Load Cap" is the Loading Capacity percentage. Extract as a NUMBER (e.g., 76.50).
      7. "Batch no." can contain strings like "00062+63" or ";00072+85+". Extract exactly as shown.
      8. "order" can contain alphanumeric codes like "4625/25" or "APR UX 3".
      9. "Shift Unload" contains the shift and the operator name (e.g., "DAY-HUMAYUN", "Night yousuf").
      
      SUMMARY DATA:
      Look for summary boxes at the very bottom of the page (if visible):
      - "YOUSUF" box: Extract "TOTAL QTY (KG)" into shiftPerformance.yousuf and "TOTAL COUNT" into shiftCount.yousuf.
      - "HUMAYUN" box: Extract "TOTAL QTY (KG)" into shiftPerformance.humayun and "TOTAL COUNT" into shiftCount.humayun.
      - If these boxes are not visible, return 0 for these fields.
      
      Ensure ALL columns for EVERY row are extracted: mc, batchNo, buyer, order, colour, colorGroup, fType, fQty, loadCapPercent, shadeOk, shadeNotOk, dyeingType, shiftUnload, remarks.
    `;

    const prompt = `
      Please perform a deep OCR scan of this RFT Report image and extract all table rows into the provided JSON schema. 
      Pay special attention to the columns: Batch no, Buyer, Order, Colour, and F.Qty. 
      Ensure every single row is captured correctly.
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
          { text: prompt },
        ],
      },
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 4096 },
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
                required: ["mc", "batchNo", "buyer", "order", "colour"]
              }
            },
            bulkRftPercent: { type: Type.NUMBER },
            labRftPercent: { type: Type.NUMBER },
            shiftPerformance: {
              type: Type.OBJECT,
              properties: {
                yousuf: { type: Type.NUMBER },
                humayun: { type: Type.NUMBER }
              }
            },
            shiftCount: {
              type: Type.OBJECT,
              properties: {
                yousuf: { type: Type.NUMBER },
                humayun: { type: Type.NUMBER }
              }
            }
          },
          required: ["date", "entries"]
        },
      },
    });

    return new Response(response.text, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("RFT Function Error:", err);
    return new Response(
      JSON.stringify({ error: "AI failed to extract RFT data. Please ensure the image is clear and includes all headers." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
