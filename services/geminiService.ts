
export async function extractProductionData(base64Data: string, mimeType: string) {
  try {
    const res = await fetch("/.netlify/functions/extractProductionData", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Data, mimeType }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Extraction failed");
    }

    return await res.json();
  } catch (error: any) {
    console.error("Extraction error:", error);
    throw new Error(error.message || "The AI was unable to parse the report. Please ensure the file is clear.");
  }
}

export async function extractRFTData(base64Data: string, mimeType: string) {
  try {
    const res = await fetch("/.netlify/functions/extractRFTData", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Data, mimeType }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "RFT Extraction failed");
    }

    return await res.json();
  } catch (error: any) {
    console.error("RFT Extraction error:", error);
    throw new Error(error.message || "The AI was unable to parse the RFT report. Please ensure the image is high resolution.");
  }
}
