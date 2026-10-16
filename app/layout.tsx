
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Asistente Garantías ICOM",
  description: "Asistente interno de Gestión de Garantías ICOM",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          fontFamily: "Arial, Helvetica, sans-serif",
          backgroundColor: "#f5f7fb",
          color: "#172033",
        }}
      >
        {children}
      </body>
    </html>
  );
}
