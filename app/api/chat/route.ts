
import { auth } from "../../../auth";
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const N8N_URL =
  "https://sedesa.app.n8n.cloud/webhook/74444b98-ebf6-4c52-b3e1-5080ee0c4d78/chat";

// Generar un identificador seguro por usuario y conversación
function crearSessionId(
  email: string,
  conversacion: string
): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET no configurado");
  }

  return createHmac("sha256", secret)
    .update(
      JSON.stringify([
        "icom-garantias-chat-v1",
        email,
        conversacion,
      ])
    )
    .digest("hex");
}

export async function POST(request: NextRequest) {
  // 1. Verificar identidad con Google
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (
    !email ||
    !email.endsWith("@icomsalud.com.ar")
  ) {
    return NextResponse.json(
      { error: "Acceso no autorizado." },
      { status: 401 }
    );
  }

  // 2. Obtener credenciales privadas de n8n
  const user = process.env.N8N_BASIC_USER;
  const password = process.env.N8N_BASIC_PASSWORD;

  if (!user || !password || !process.env.AUTH_SECRET) {
    return NextResponse.json(
      { error: "Servicio no configurado." },
      { status: 503 }
    );
  }

  try {
    // 3. Validar los datos enviados por el navegador
    const body = await request.json();

    const chatInput = body?.chatInput;
    const conversacion = body?.sessionId;

    if (
      typeof chatInput !== "string" ||
      !chatInput.trim() ||
      chatInput.length > 4000 ||
      typeof conversacion !== "string" ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(conversacion)
    ) {
      return NextResponse.json(
        { error: "Mensaje inválido." },
        { status: 400 }
      );
    }

    // 4. Vincular la conversación al usuario autenticado
    const sessionId = crearSessionId(
      email,
      conversacion
    );

    // 5. Preparar autenticación de n8n
    const basicAuth = Buffer.from(
      `${user}:${password}`
    ).toString("base64");

    // 6. Enviar mensaje al workflow existente
    const response = await fetch(N8N_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
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
      console.error(
        "Error n8n:",
        response.status
      );

      return NextResponse.json(
        {
          error: "No se pudo consultar el asistente.",
        },
        { status: 502 }
      );
    }

    // 7. Devolver respuesta al navegador
    const contentType =
      response.headers.get("content-type") || "";

    const result = await response.text();

    if (
      !contentType.toLowerCase().includes(
        "application/json"
      )
    ) {
      console.error(
        "Formato inesperado de respuesta de n8n:",
        contentType
      );

      return NextResponse.json(
        { error: "Formato de respuesta no compatible." },
        { status: 502 }
      );
    }

    let data: unknown;

    try {
      data = JSON.parse(result);
    } catch {
      return NextResponse.json(
        { error: "Respuesta inválida del asistente." },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "Error de conexión con n8n:",
      error
    );

    return NextResponse.json(
      { error: "No fue posible conectar con el asistente." },
      { status: 502 }
    );
  }
}
