
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const COOKIE_NAME = "icom_garantias_session";

export const SESSION_DURATION = 7 * 24 * 60 * 60;

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET debe tener al menos 32 caracteres."
    );
  }

  return new TextEncoder().encode(secret);
}

// Crear una sesión válida durante 7 días
export async function crearSesion() {
  return new SignJWT({
    acceso: "garantias",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setIssuer("icom-garantias")
    .sign(getSecret());
}

// Comprobar si la sesión es válida
export async function verificarSesion(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(
      token,
      getSecret(),
      {
        algorithms: ["HS256"],
        issuer: "icom-garantias",
      }
    );

    return payload.acceso === "garantias";
  } catch {
    return false;
  }
}

// Consultar la cookie de sesión del navegador
export async function usuarioAutenticado() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  return verificarSesion(token);
}
