import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import PageTransitions from "@/components/page-transitions"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Cryptic Tales",
  description: "Play a game of collaborative storytelling with friends.",
  generator: "Shadow",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <PageTransitions>{children}</PageTransitions>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
