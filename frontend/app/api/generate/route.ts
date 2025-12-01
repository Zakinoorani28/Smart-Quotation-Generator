import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // DYNAMIC CONFIGURATION:
    // 1. Checks for server-only variable (Best practice for secrets)
    // 2. Checks for public variable (Common in Next.js setups)
    // 3. Fallback to localhost (For local development)
    const API_URL =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://127.0.0.1:8000";

    console.log(`Sending request to: ${API_URL}/generate-quotation`); // Helpful for debugging logs

    const response = await axios.post(`${API_URL}/generate-quotation`, {
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
