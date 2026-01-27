import { auth } from "@/lib/auth";
import { createAppToken } from "@/lib/jwt";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: No user session" },
        { status: 401 },
      );
    }

    const token = createAppToken({
      sub: session.user.id,
      email: session.user.email,
      name: session.user.name,
    });

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Ficheiro não fornecido" },
        { status: 400 },
      );
    }

    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const response = await fetch(`${BACKEND_URL}/api/scanner/scan`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: backendFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error("Scan error:", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Erro ao fazer scan do documento";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: No user session" },
        { status: 401 },
      );
    }

    const token = createAppToken({
      sub: session.user.id,
      email: session.user.email,
      name: session.user.name,
    });

    const scanId = request.nextUrl.searchParams.get("id");
    if (!scanId) {
      return NextResponse.json(
        { error: "Scan ID não fornecido" },
        { status: 400 },
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/scanner/scans/${scanId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : String(error);
    console.error("Fetch scan error:", msg);
    return NextResponse.json({ error: `Erro ao buscar scan: ${msg}` }, { status: 500 });
  }
}
