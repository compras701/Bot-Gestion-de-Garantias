
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  COOKIE_NAME,
  SESSION_DURATION,
  crearSesion,
} from "@/lib/auth";

export const runtime = "nodejs";

function compararSeguro(
  recibido: string,
  esperado: string
): boolean {
  const a = Buffer.from(recibido, "utf8");
  const b = Buffer.from(esperado, "utf8");

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const usuario = body?.usuario;
    const password = body?.password;

    if (
      typeof usuario !== "string" ||
      typeof password !== "string" ||
      usuario.length > 200 ||
      password.length > 500
    ) {
      return NextResponse.json(
        { error: "Datos de acceso inválidos." },
        { status: 400 }
      );
    }

    const usuarioConfigurado = process.env.LOGIN_USER;
    const passwordConfigurada = process.env.LOGIN_PASSWORD;

    if (!usuarioConfigurado || !passwordConfigurada) {
      console.error("Credenciales no configuradas.");

      return NextResponse.json(
        { error: "Servicio no configurado." },
        { status: 503 }
      );
    }

    const usuarioValido = compararSeguro(
      usuario,
      usuarioConfigurado
    );

    const passwordValida = compararSeguro(
      password,
      passwordConfigurada
    );

    if (!usuarioValido || !passwordValida) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos." },
        { status: 401 }
      );
    }

    const token = await crearSesion();

    const response = NextResponse.json({
      ok: true,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION,
    });

    return response;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    return NextResponse.json(
      { error: "No se pudo iniciar sesión." },
      { status: 500 }
    );
  }
}
