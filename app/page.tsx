
import { auth, signIn } from "../auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  // Si ya inició sesión, ingresar directamente al chat.
  if (session?.user?.email) {
    redirect("/chat");
  }

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <div style={styles.logo}>ICOM</div>

        <h1 style={styles.title}>
          Asistente Garantías
        </h1>

        <p style={styles.subtitle}>
          Bienvenido al asistente interno de
          Gestión de Garantías ICOM.
        </p>

        <p style={styles.description}>
          Para continuar, ingresá con tu cuenta
          corporativa de Google Workspace.
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("google", {
              redirectTo: "/chat",
            });
          }}
        >
          <button type="submit" style={styles.button}>
            Continuar con Google
          </button>
        </form>

        <p style={styles.note}>
          Acceso exclusivo para usuarios
          @icomsalud.com.ar
        </p>

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
    backgroundColor: "#f5f7fb",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "38px",
    boxSizing: "border-box",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  logo: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#146c94",
    marginBottom: "20px",
  },
  title: {
    fontSize: "25px",
    marginBottom: "15px",
    color: "#172033",
  },
  subtitle: {
    color: "#475467",
    fontSize: "15px",
    lineHeight: "1.6",
    marginBottom: "16px",
  },
  description: {
    color: "#667085",
    fontSize: "14px",
    lineHeight: "1.6",
    marginBottom: "28px",
  },
  button: {
    width: "100%",
    padding: "15px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#172033",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
  },
  note: {
    marginTop: "20px",
    color: "#667085",
    fontSize: "13px",
  },
  footer: {
    marginTop: "30px",
    color: "#98a2b3",
    fontSize: "12px",
  },
};
