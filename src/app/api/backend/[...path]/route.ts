import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const FALLBACK_BACKEND = 'http://127.0.0.1:8000/api';

function resolveBackendBaseUrl(): string {
  if (process.env.BACKEND_API_BASE_URL) {
    return process.env.BACKEND_API_BASE_URL;
  }

  const useDevApi = process.env.NEXT_PUBLIC_USE_DEV_API === 'true';
  if (useDevApi && process.env.NEXT_PUBLIC_DEV_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_DEV_BACKEND_URL;
  }

  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }

  return FALLBACK_BACKEND;
}

function filterRequestHeaders(req: NextRequest): Headers {
  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('content-length');
  return headers;
}

function filterResponseHeaders(headers: Headers): Headers {
  const out = new Headers(headers);
  out.delete('content-encoding');
  out.delete('transfer-encoding');
  out.delete('connection');
  return out;
}

async function proxyToBackend(req: NextRequest, params: { path: string[] }) {
  try {
    const backendBase = resolveBackendBaseUrl().replace(/\/$/, '');
    const path = (params.path || []).join('/');
    const target = `${backendBase}/${path}${req.nextUrl.search}`;

    const method = req.method.toUpperCase();
    const hasBody = method !== 'GET' && method !== 'HEAD';

    const response = await fetch(target, {
      method,
      headers: filterRequestHeaders(req),
      body: hasBody ? await req.arrayBuffer() : undefined,
      redirect: 'follow',
    });

    return new NextResponse(response.body, {
      status: response.status,
      headers: filterResponseHeaders(response.headers),
    });
  } catch (error) {
    return NextResponse.json(
      {
        detail: 'Error al conectar con el backend desde el proxy interno',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(req, await context.params);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(req, await context.params);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(req, await context.params);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(req, await context.params);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(req, await context.params);
}

export async function OPTIONS(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(req, await context.params);
}
