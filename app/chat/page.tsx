
import { auth, signOut } from "../../auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const session = await auth();

  if (
    !session?.user?.email ||
    !session.user.email.toLowerCase().endsWith(
      "@icomsalud.com.ar"
    )
  ) {
    redirect("/");
  }

  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Asistente Garantías ICOM
          </h1>
          <p style={styles.subtitle}>
            Sesión iniciada: {session.user.email}
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" style={styles.logout}>
            Cerrar sesión
          </button>
        </form>
      </header>

      <section style={styles.chat}>
        <h2>Bienvenido al asistente</h2>
        <p>
          Tu acceso con Google Workspace
          fue verificado correctamente.
        </p>
        <p>
          Próximamente estará disponible
          el chat integrado con n8n.
        </p>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f5f7fb",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
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
    fontSize: "13px",
    color: "#667085",
  },
  logout: {
    padding: "10px 16px",
    backgroundColor: "#ffffff",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    cursor: "pointer",
  },
  chat: {
    maxWidth: "900px",
    margin: "40px auto",
    padding: "30px",
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
    textAlign: "center",
    color: "#475467",
  },
};
