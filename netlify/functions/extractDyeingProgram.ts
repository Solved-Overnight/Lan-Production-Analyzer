
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
      You are a specialized data extractor for "Daily Dyeing Program".
      
      REPORT STRUCTURE:
      - Header Section: Determine the industry name. Look for "Lantabur" or "Taqwa".
      - Date: Usually "16-Jan-26" format.
      - Main Table: Extract all columns from S/L to Remarks.
      
      COLUMNS TO EXTRACT:
      1. sl (Serial Number)
      2. buyer
      3. priority
      4. positionOfFabrics
      5. orderNo
      6. styleName
      7. colour
      8. ldNo (Lab Dip Number)
      9. labPosition
      10. yarnLot
      11. fType (Fabric Type)
      12. gsm
      13. dyeingCloss
      14. unitNo
      15. inhouse (Number in kg)
      16. subcontact (Number in kg)
      17. totalQty (Number in kg)
      18. anticrease
      19. enzyme
      20. softner
      21. matching
      22. noOfShipment
      23. shipmentDate
      24. remarks
      
      EXTRACTION RULES:
      - industry: set to "lantabur" or "taqwa" based on header text. Default to "lantabur" if unclear.
      - "Inhouse", "Subcontact", and "Total Qty" should be extracted as NUMBERS.
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
          { text: "Extract all table rows from this Dyeing Program report into JSON." },
        ],
      },
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 4096 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            industry: { type: Type.STRING, enum: ["lantabur", "taqwa"] },
            date: { type: Type.STRING },
            unit: { type: Type.STRING },
            inhouseTotal: { type: Type.NUMBER },
            subcontTotal: { type: Type.NUMBER },
            grandTotal: { type: Type.NUMBER },
            entries: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sl: { type: Type.STRING },
                  buyer: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  positionOfFabrics: { type: Type.STRING },
                  orderNo: { type: Type.STRING },
                  styleName: { type: Type.STRING },
                  colour: { type: Type.STRING },
                  ldNo: { type: Type.STRING },
                  labPosition: { type: Type.STRING },
                  yarnLot: { type: Type.STRING },
                  fType: { type: Type.STRING },
                  gsm: { type: Type.STRING },
                  dyeingCloss: { type: Type.STRING },
                  unitNo: { type: Type.STRING },
                  inhouse: { type: Type.NUMBER },
                  subcontact: { type: Type.NUMBER },
                  totalQty: { type: Type.NUMBER },
                  anticrease: { type: Type.STRING },
                  enzyme: { type: Type.STRING },
                  softner: { type: Type.STRING },
                  matching: { type: Type.STRING },
                  noOfShipment: { type: Type.STRING },
                  shipmentDate: { type: Type.STRING },
                  remarks: { type: Type.STRING }
                }
              }
            }
          },
          required: ["industry", "date", "entries"]
        },
      },
    });

    return new Response(response.text, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Dyeing Program Function Error:", err);
    return new Response(JSON.stringify({ error: "AI failed to extract data." }), { status: 500 });
  }
};
