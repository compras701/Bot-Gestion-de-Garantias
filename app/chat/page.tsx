
"use client";

import { useEffect, useRef, useState } from "react";

type Mensaje = {
  rol: "usuario" | "asistente";
  texto: string;
};

function obtenerRespuesta(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data)) {
    return obtenerRespuesta(data[0]);
  }

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    for (const campo of ["output", "text", "response", "message"]) {
      if (typeof obj[campo] === "string") {
        return obj[campo] as string;
      }
    }
  }

  throw new Error("Formato de respuesta no reconocido.");
}

export default function ChatPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      rol: "asistente",
      texto:
        "Hola 👋🏻 Soy el asistente de Gestión de Garantías ICOM. ¿En qué puedo ayudarte?",
    },
  ]);

  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [sesion, setSesion] = useState("");
  const [correo, setCorreo] = useState("");
  const finalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let id = sessionStorage.getItem("icom_chat_session");

    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("icom_chat_session", id);
    }

    setSesion(id);

    fetch("/api/auth/session", {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.email) {
          setCorreo(data.user.email);
        } else {
          window.location.replace("/");
        }
      })
      .catch(() => {
        setError("No se pudo verificar la sesión.");
      });
  }, []);

  useEffect(() => {
    finalRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [mensajes, enviando]);

  async function enviarMensaje(e: React.FormEvent) {
    e.preventDefault();

    const consulta = texto.trim();

    if (!consulta || enviando || !sesion) return;

    setMensajes((prev) => [
      ...prev,
      { rol: "usuario", texto: consulta },
    ]);

    setTexto("");
    setError("");
    setEnviando(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatInput: consulta,
          sessionId: sesion,
        }),
      });

      if (response.status === 401) {
        window.location.replace("/");
        return;
      }

      if (!response.ok) {
        throw new Error("No se pudo consultar el asistente.");
      }

      const data = await response.json();
      const respuesta = obtenerRespuesta(data);

      setMensajes((prev) => [
        ...prev,
        { rol: "asistente", texto: respuesta },
      ]);
    } catch {
      setError(
        "No se pudo obtener una respuesta. Intentá nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  async function cerrarSesion() {
    const response = await fetch("/api/auth/signout", {
      method: "GET",
    });

    if (response.ok) {
      const html = await response.text();
      const doc = new DOMParser().parseFromString(
        html,
        "text/html"
      );
      const csrfToken = doc.querySelector<HTMLInputElement>(
        'input[name="csrfToken"]'
      )?.value;

      if (csrfToken) {
        await fetch("/api/auth/signout", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            csrfToken,
            callbackUrl: "/",
          }),
        });
      }
    }

    sessionStorage.removeItem("icom_chat_session");
    window.location.replace("/");
  }

  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Asistente Garantías ICOM
          </h1>
          <p style={styles.subtitle}>
            {correo
              ? `Sesión iniciada: ${correo}`
              : "Verificando usuario..."}
          </p>
        </div>

        <button
          onClick={cerrarSesion}
          style={styles.logout}
        >
          Cerrar sesión
        </button>
      </header>

      <section style={styles.chatContainer}>
        <div style={styles.messages}>
          {mensajes.map((mensaje, index) => (
            <div
              key={index}
              style={{
                ...styles.message,
                ...(mensaje.rol === "usuario"
                  ? styles.userMessage
                  : styles.botMessage),
              }}
            >
              <div style={styles.messageLabel}>
                {mensaje.rol === "usuario"
                  ? "Vos"
                  : "Asistente ICOM"}
              </div>

              <div style={styles.messageText}>
                {mensaje.texto}
              </div>
            </div>
          ))}

          {enviando && (
            <div style={styles.botMessage}>
              <div style={styles.messageLabel}>
                Asistente ICOM
              </div>
              Escribiendo respuesta...
            </div>
          )}

          <div ref={finalRef} />
        </div>

        {error && (
          <div role="alert" style={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={enviarMensaje} style={styles.form}>
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribí tu consulta..."
            maxLength={4000}
            disabled={enviando || !sesion}
            style={styles.input}
          />

          <button
            type="submit"
            disabled={enviando || !texto.trim() || !sesion}
            style={styles.sendButton}
          >
            Enviar
          </button>
        </form>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f5f7fb",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    padding: "20px 30px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e4e7ec",
  },
  title: {
    margin: 0,
    fontSize: "21px",
    color: "#146c94",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#667085",
    fontSize: "13px",
  },
  logout: {
    backgroundColor: "#ffffff",
    border: "1px solid #d0d5dd",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  chatContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "950px",
    margin: "20px auto",
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    boxSizing: "border-box",
    minHeight: "75vh",
    overflow: "hidden",
    boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
  },
  messages: {
    flex: 1,
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    minHeight: "400px",
    overflowY: "auto",
  },
  message: {
    padding: "14px 18px",
    borderRadius: "12px",
    maxWidth: "80%",
    lineHeight: "1.6",
    fontSize: "14px",
    wordBreak: "break-word",
  },
  userMessage: {
    backgroundColor: "#146c94",
    color: "#ffffff",
    alignSelf: "flex-end",
  },
  botMessage: {
    backgroundColor: "#f2f4f7",
    color: "#172033",
    alignSelf: "flex-start",
    padding: "14px 18px",
    borderRadius: "12px",
    maxWidth: "80%",
  },
  messageLabel: {
    fontWeight: 700,
    fontSize: "12px",
    marginBottom: "6px",
  },
  messageText: {
    whiteSpace: "pre-wrap",
  },
  form: {
    display: "flex",
    gap: "10px",
    padding: "20px",
    borderTop: "1px solid #e4e7ec",
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #d0d5dd",
    fontSize: "15px",
  },
  sendButton: {
    padding: "14px 24px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#146c94",
    color: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: {
    margin: "0 20px",
    padding: "12px",
    backgroundColor: "#fff1f0",
    color: "#b42318",
    borderRadius: "8px",
    fontSize: "13px",
  },
};
