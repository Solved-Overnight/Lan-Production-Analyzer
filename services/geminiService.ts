/**
 * Client-side service for extracting production data from uploaded reports.
 * This service calls Netlify functions to perform the actual AI extraction,
 * bypassing browser-side API key restrictions and ensuring security.
 */

export async function extractProductionData(base64Data: string, mimeType: string) {
  try {
    const response = await fetch('/.netlify/functions/extractProductionData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Data, mimeType }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Extraction service unavailable' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Production Extraction error:", error);
    throw new Error(error.message || "The AI was unable to parse the production report.");
  }
}

export async function extractRFTData(base64Data: string, mimeType: string) {
  try {
    const response = await fetch('/.netlify/functions/extractRFTData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Data, mimeType }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.errorMessage || data?.error || `Server Error (${response.status})`;
      throw new Error(errorMsg);
    }

    if (data && data.isSuccess === false) {
      // Pass the specific AI reason (missing headers etc) directly to the UI
      throw new Error(data.errorMessage || "AI could not identify the table structure. Ensure the image is clear and includes all 14 headers.");
    }

    return data;
  } catch (error: any) {
    console.error("RFT Logic Detail:", error);
    throw new Error(error.message || "Connection to RFT service failed.");
  }
}

export async function extractDyeingProgramData(base64Data: string, mimeType: string) {
  try {
    const response = await fetch('/.netlify/functions/extractDyeingProgram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Data, mimeType }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Dyeing Program Extraction service unavailable' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Dyeing Program Extraction error:", error);
    throw new Error(error.message || "The AI was unable to parse the dyeing program report.");
  }
}