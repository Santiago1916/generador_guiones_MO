import localFont from "next/font/local";
import "driver.js/dist/driver.css";
import "./globals.css";
import "./styles/layout.css";
import "./styles/hero.css";
import "./styles/stepper.css";
import "./styles/tour.css";
import "./styles/upload-step.css";
import "./styles/review-step.css";
import "./styles/modal.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Guiones de cursos y capacitaciones | Mundo Ocupacional",
  description:
    "Valida documentos de cursos y capacitaciones, y genera guiones en primera persona para Mundo Ocupacional.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
