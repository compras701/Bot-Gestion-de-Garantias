
import { auth } from "../../../auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const N8N_URL =
  "https://sedesa.app.n8n.cloud/webhook/74444b98-ebf6-4c52-b3e1-5080ee0c4d78/chat";

export async function POST(request: NextRequest) {
  // 1. Verificar la sesión de Google
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();

  if (!email || !email.endsWith("@icomsalud.com.ar")) {
    return NextResponse.json(
      { error: "Acceso no autorizado." },
      { status: 401 }
    );
  }

  // 2. Comprobar credenciales privadas
  const user = process.env.N8N_BASIC_USER;
  const password = process.env.N8N_BASIC_PASSWORD;

  if (!user || !password) {
    return NextResponse.json(
      { error: "Conexión no configurada." },
      { status: 503 }
    );
  }

  try {
    // 3. Validar el mensaje y la conversación
    const body = await request.json();

    const chatInput = body?.chatInput;
    const sessionId = body?.sessionId;

    if (
      typeof chatInput !== "string" ||
      !chatInput.trim() ||
      chatInput.length > 4000 ||
      typeof sessionId !== "string" ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(sessionId)
    ) {
      return NextResponse.json(
        { error: "Mensaje o sesión inválidos." },
        { status: 400 }
      );
    }

    // 4. Autenticarse ante n8n
    const basicAuth = Buffer.from(
      `${user}:${password}`
    ).toString("base64");

    // 5. Enviar el mensaje al Chat Trigger
    const response = await fetch(N8N_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        action: "sendMessage",
        chatInput: chatInput.trim(),
        sessionId,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(55000),
    });

    if (!response.ok) {
      console.error("n8n respondió:", response.status);

      return NextResponse.json(
        { error: "No se pudo consultar el asistente." },
        { status: 502 }
      );
    }

    // 6. Devolver la respuesta de n8n
    const contentType =
      response.headers.get("content-type") || "";

    const result = await response.text();

    return new NextResponse(result, {
      status: 200,
      headers: {
        "Content-Type": contentType ||
          "application/json",
        "Cache-Control": "no-store",
      },
    });

  } catch (error) {
    console.error("Error de conexión con n8n:", error);

    return NextResponse.json(
      { error: "No fue posible conectar con el asistente." },
      { status: 502 }
    );
  }
}
