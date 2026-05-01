import "./globals.css";

export const metadata = {
  title: "PMDM Console",
  description: "Production-grade macOS device management"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
