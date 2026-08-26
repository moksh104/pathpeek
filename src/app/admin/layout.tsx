import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth-helpers'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Admin Console — PathPeek',
  description: 'PathPeek Smart Tourism & Travel Administration Portal',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login?callbackUrl=/admin')
  }

  // Strict role verification on server
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#09090b]">
        <div className="text-center max-w-md space-y-4 p-8 rounded-3xl bg-white dark:bg-[#0f0f14] border border-gray-200 dark:border-white/[0.08] shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Access Denied
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            You are signed in as <span className="font-semibold">{user.email}</span>, which does not have administrator privileges.
          </p>
          <div className="pt-3">
            <Link href="/">
              <Button className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to PathPeek Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#09090b] text-foreground flex transition-colors duration-300">
      <AdminSidebar adminUser={user} />
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-10 pt-20 lg:pt-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
