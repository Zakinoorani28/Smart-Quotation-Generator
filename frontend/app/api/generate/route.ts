import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  const body = await req.json();

  // FIX: Use Environment Variable for Production
  const API_URL = "https://smag-backend-1051387132770.us-central1.run.app";

  try {
    const response = await axios.post(`${API_URL}/generate-quotation`, {
      prompt: body.prompt,
    });

    return NextResponse.json(response.data);
  } catch (err: unknown) {
    let errorMessage = "Unknown error";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return NextResponse.json(
      { error: "Backend request failed", detail: errorMessage },
      { status: 500 }
    );
  }
}
