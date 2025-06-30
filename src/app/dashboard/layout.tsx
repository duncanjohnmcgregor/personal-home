import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNavigation } from '@/components/layout/mobile-navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <Navbar />
      
      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar - Hidden on mobile, shown on larger screens */}
        <aside className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Sidebar />
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          <div className="container mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      {/* Add padding bottom on mobile to account for bottom navigation */}
      <div className="lg:hidden h-20" />
    </div>
  )
}