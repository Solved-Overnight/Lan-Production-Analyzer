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
    // Using gemini-flash-latest for high-speed industrial OCR to prevent timeouts
    const model = "gemini-flash-latest";

    const systemInstruction = `
      You are a high-speed industrial OCR engine. Extract table data from the "DAILY RFT REPORT".
      
      TARGET COLUMNS (14): 
      1. MC 2. Batch no. 3. Buyer 4. order 5. Colour 6. Color Group 7. F/Type 8. F.Qty 9. Load Cap% 10. Shade ok 11. Shade not ok 12. Dyeing Type 13. Shift Unload 14. Remarks
      
      ROBUSTNESS & SPEED RULES:
      - This is a factory report; headers may be slightly different. Map data to the best-fit Target Column.
      - Extract 'Date' (e.g., "1-Feb-26"), 'Unit' (e.g., "Unit-02"), and 'CompanyName' from the top header section.
      - 'Shade ok' and 'Shade not ok' columns usually contain checkmarks/ticks. Convert these to BOOLEANS (true if marked).
      - Ensure 'fQty' and 'loadCapPercent' are numeric.
      - If a column is missing from the image, leave the corresponding JSON field as null/empty and CONTINUE. 
      - Always set isSuccess=true unless the document is completely unreadable.
      - Process the first available table in the document immediately.
      
      Efficiency is critical to avoid system timeouts. Do not provide commentary, only JSON.
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
          { text: "Extract the RFT data table into JSON format. Capture all rows faithfully, even if headers differ slightly from expectations." },
        ],
      },
      config: {
        systemInstruction,
        temperature: 0.1,
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

    return new Response(response.text, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("RFT Extraction Error:", err);
    return new Response(
      JSON.stringify({ 
        isSuccess: false, 
        errorMessage: "The AI service encountered a performance bottleneck. Please try a clearer scan or a smaller PDF file." 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
};