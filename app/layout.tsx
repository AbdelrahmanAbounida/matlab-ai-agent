import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'
import { CheckIcon, InfoIcon, TriangleAlert, XIcon } from "lucide-react"

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'MATLAB AI Assistant',
  description: 'AI-powered MATLAB and Simulink assistant - like Cursor for MATLAB',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased bg-[#FAF9F5]`}>
        {children}
        {/* <Toaster richColors position="top-center" /> */}
         <Toaster
          duration={5000}
          position="top-right"
          icons={{
            success: (
              <CheckIcon className="fill-green-600 text-white w-5 h-5 mt-1.5 border-white bg-green-600 dark:bg-green-800 rounded-2xl p-1" />
            ),
            error: (
              <XIcon className="fill-red-500 text-white w-5 h-5 mt-1.5 border-white bg-red-600 dark:bg-red-800 rounded-2xl p-1" />
            ),
            info: (
              <InfoIcon className="text-blue-600  w-5 h-5 mt-1.5   rounded-2xl" />
            ),
            warning: (
              <TriangleAlert className="text-orange-600!  w-5 h-5 mt-1.5   rounded-2xl" />
            ),
          }}
          toastOptions={{
            className:
              " border-gray-400! dark:border-zinc-700/55! flex! items-start! p-3! pl-4! justify-start!  dark:bg-gray-800! text-gray-600! min-h-[65px]!",
          }}
        />

        <Analytics />
      </body>
    </html>
  )
}
