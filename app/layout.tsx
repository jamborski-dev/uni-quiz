import type { Metadata, Viewport } from "next"
import { Montserrat } from "next/font/google"
import { ThemeProvider } from "@/components/ThemeProvider"
import BottomNav from "@/components/BottomNav"
import AuthGuard from "@/components/AuthGuard"
import ToastContainer from "@/components/ToastContainer"
import { AuthProvider } from "@/context/AuthContext"
import "./globals.css"

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

// Inline script runs before React hydrates to prevent flash of wrong theme
const themeScript = `(function(){try{var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.add(t)}catch(e){}})();`

export const metadata: Metadata = {
  title: "Open Uni TM111 Quiz",
  description: "Open University TM111 revision quiz",
  manifest: "/manifest.json",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎓</text></svg>" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Open Uni TM111 Quiz",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f0ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0d16" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs synchronously before paint - prevents dark/light flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${montserrat.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <AuthGuard>
              <div className="pb-20">
                {children}
              </div>
              <BottomNav />
            </AuthGuard>
          </AuthProvider>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  )
}
