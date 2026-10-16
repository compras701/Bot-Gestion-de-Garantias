
"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    async function verificarSesion() {
      try {
        const res = await fetch("/api/session", {
          cache: "no-store",
        });

        if (res.ok) {
          window.location.replace("/chat");
          return;
        }
      } catch {
        // Mostrar el formulario si no se puede verificar.
      }

      setVerificando(false);
    }

    verificarSesion();
  }, []);

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setCargando(true);

    try {
      const respuesta = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario,
          password,
        }),
      });

      if (respuesta.ok) {
        window.location.replace("/chat");
        return;
      }

      if (respuesta.status === 401) {
        setError(
          "Usuario o contraseña incorrectos. Volvé a intentarlo."
        );
      } else if (respuesta.status === 429) {
        setError(
          "Demasiados intentos. Esperá unos minutos."
        );
      } else {
        setError(
          "No pudimos iniciar sesión. Intentá nuevamente."
        );
      }

      setPassword("");
    } catch {
      setError(
        "No se pudo conectar con el servidor. Intentá nuevamente."
      );
    } finally {
      setCargando(false);
    }
  }

  if (verificando) {
    return (
      <main style={styles.container}>
        <p>Verificando acceso...</p>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <div style={styles.logo}>ICOM</div>

        <h1 style={styles.title}>
          Asistente Garantías
        </h1>

        <p style={styles.subtitle}>
          Ingresá tus credenciales para acceder al
          asistente interno de Gestión de Garantías.
        </p>

        <form onSubmit={iniciarSesion}>
          <label htmlFor="usuario" style={styles.label}>
            Usuario
          </label>

          <input
            id="usuario"
            type="text"
            autoComplete="username"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="Ingresá tu usuario"
            required
            style={styles.input}
          />

          <label htmlFor="password" style={styles.label}>
            Contraseña
          </label>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresá tu contraseña"
            required
            style={styles.input}
          />

          {error && (
            <div role="alert" style={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            style={styles.button}
          >
            {cargando ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        <p style={styles.footer}>
          ICOM Salud - Gestión de Garantías
        </p>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    padding: "20px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "410px",
    padding: "36px",
    boxSizing: "border-box",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
  },
  logo: {
    textAlign: "center",
    fontSize: "30px",
    fontWeight: "bold",
    color: "#146c94",
    marginBottom: "20px",
  },
  title: {
    textAlign: "center",
    fontSize: "25px",
    marginBottom: "12px",
  },
  subtitle: {
    color: "#667085",
    fontSize: "14px",
    lineHeight: "1.6",
    textAlign: "center",
    marginBottom: "30px",
  },
  label: {
    display: "block",
    fontWeight: 600,
    fontSize: "14px",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "13px",
    marginBottom: "20px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  error: {
    padding: "12px",
    marginBottom: "20px",
    background: "#fff1f0",
    color: "#b42318",
    borderRadius: "8px",
    fontSize: "13px",
  },
  button: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    background: "#146c94",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
  },
  footer: {
    textAlign: "center",
    marginTop: "30px",
    color: "#98a2b3",
    fontSize: "12px",
  },
};
