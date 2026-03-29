import { ThemeProvider } from '@/providers/ThemeProvider';
import './globals.css';

export const metadata = {
  title: 'Pollarsteps — Track Your Adventures',
  description: 'Pin your travel memories on a beautiful interactive map. Discover recommendations, track statistics, and relive every journey.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#F2F2F7] dark:bg-black text-[#1C1C1E] dark:text-[#F5F5F7] transition-colors duration-300 min-h-screen">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
