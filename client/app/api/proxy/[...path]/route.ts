import { auth } from "@/lib/auth";
import { createAppToken } from "@/lib/jwt";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } },
) {
  const params = await Promise.resolve(context.params);
  return handleRequest(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } },
) {
  const params = await Promise.resolve(context.params);
  return handleRequest(request, params, "POST");
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } },
) {
  const params = await Promise.resolve(context.params);
  return handleRequest(request, params, "PATCH");
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } },
) {
  const params = await Promise.resolve(context.params);
  return handleRequest(request, params, "DELETE");
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string,
) {
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

    if (!params?.path || !Array.isArray(params.path)) {
      return NextResponse.json(
        { error: "Invalid request path" },
        { status: 400 },
      );
    }

    const path = params.path.join("/");
    const url = new URL(request.url);
    const queryString = url.search;
    const backendUrl = `${BACKEND_URL}/api/${path}${queryString}`;

    const body =
      method !== "GET" && method !== "DELETE"
        ? await request.text()
        : undefined;

    const response = await fetch(backendUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    let data: unknown;
    try {
      data = isJson
        ? await response.json()
        : {
            error:
              (await response.text()) ||
              `HTTP ${response.status}: ${response.statusText}`,
          };
    } catch {
      data = { error: `HTTP ${response.status}: ${response.statusText}` };
    }

    if (!response.ok && response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      if (retryAfter) {
        (data as Record<string, unknown>).retryAfter = retryAfter;
        (data as Record<string, unknown>).error =
          `Muitas requisições. Tente novamente em ${retryAfter} segundos.`;
      }
    }

    return NextResponse.json(data as object, { status: response.status });
  } catch (error: unknown) {
    console.error("Proxy error:", error);
    const msg =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
