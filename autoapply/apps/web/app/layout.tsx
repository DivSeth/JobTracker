import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
// GeistSans.variable === '--font-geist-sans' (fixed by the package)

export const metadata: Metadata = {
  title: 'AutoApply',
  description: 'Your job application operating system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);else if(window.matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.setAttribute('data-theme','dark')}catch(e){}})()` }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
