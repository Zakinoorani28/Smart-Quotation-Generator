import { NextResponse } from "next/server";
import axios from "axios";
import { API_BASE_URL } from "../../../lib/config";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Debug log to see where it's connecting in Vercel logs
    console.log(`[Proxy] Connecting to Backend: ${API_BASE_URL}`);

    const response = await axios.post(`${API_BASE_URL}/generate-quotation`, {
      prompt: body.prompt,
    });

    return NextResponse.json(response.data);
  } catch (err: unknown) {
    console.error("Proxy Error:", err);

    // Specific Error Handling for Axios
    if (axios.isAxiosError(err)) {
      const status = err.response?.status || 500;
      const data = err.response?.data || { error: err.message };

      return NextResponse.json(
        { error: "Backend request failed", detail: data },
        { status: status }
      );
    }

    // Generic Error Handling
    let errorMessage = "Unknown error";
    if (err instanceof Error) {
      errorMessage = err.message;
    }

    return NextResponse.json(
      { error: "Internal Server Error", detail: errorMessage },
      { status: 500 }
    );
  }
}
