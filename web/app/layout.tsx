import "./globals.css";
import ThemeFontControls from "@/app/components/ThemeFontControls";
import { SidebarProvider } from "@/app/components/sidebar-context";
import { Nunito } from "next/font/google";

// Estilo "Duolingo" (jorima-estilo-duolingo.md, bloque 2): geométrica,
// terminaciones redondeadas, un solo peso pesado en vez de varios finos.
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-nunito",
});

export const metadata = {
  title: "Jorima",
  description: "Plataforma de bienestar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={nunito.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.lineicons.com/4.0/lineicons.css"
        />

        {/* Evita flash de tema incorrecto */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('jorima_theme') || 'light';
                  const scale = localStorage.getItem('jorima_font_scale') || '1';

                  document.documentElement.dataset.theme = theme;
                  document.documentElement.style.setProperty('--font-scale', scale);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>

      <body className={nunito.variable}>
        {/* Estado de la sidebar (colapsada / drawer móvil) centralizado
            aquí para que todas las vistas compartan el mismo comportamiento. */}
        <SidebarProvider>
          {children}
        </SidebarProvider>

        {/* Panel flotante */}
        <ThemeFontControls />
      </body>
    </html>
  );
}