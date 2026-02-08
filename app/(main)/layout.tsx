import Header from '@/components/layout/Header'

export const dynamic = 'force-dynamic'

export default function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Header />
      {children}
    </>
  )
}
