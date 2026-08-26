'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  MapPin,
  Building2,
  Ticket,
  Calendar,
  Users,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Destinations', href: '/admin/destinations', icon: MapPin },
  { name: 'Hotels', href: '/admin/hotels', icon: Building2 },
  { name: 'Activities', href: '/admin/activities', icon: Ticket },
  { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
  { name: 'Users', href: '/admin/users', icon: Users },
]

export default function AdminSidebar({
  adminUser,
}: {
  adminUser: { name?: string | null; email?: string | null; role: string }
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 z-40 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.08] px-4 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="PathPeek" width={24} height={24} className="w-6 h-6 object-contain" />
          <span className="font-bold text-base text-gray-900 dark:text-white">Admin Console</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-[#09090b] border-r border-gray-200/80 dark:border-white/[0.06] flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 dark:border-white/[0.04]">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="p-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 shadow-sm">
                <Image src="/logo.png" alt="PathPeek Logo" width={24} height={24} className="w-6 h-6 object-contain" />
              </div>
              <div>
                <span className="text-base font-bold text-gray-900 dark:text-white block leading-none">
                  PathPeek
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mt-1 block">
                  Admin Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-violet-500" />}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User Info & Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-white/[0.04] space-y-3">
          {/* Admin user info badge */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[140px]">
                {adminUser.name || 'Admin'}
              </span>
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[9px] px-1.5 py-0 flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" />
                Admin
              </Badge>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {adminUser.email}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link href="/" className="w-full">
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl text-xs h-9 justify-center border-gray-200 dark:border-white/[0.08]"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Site
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full rounded-xl text-xs h-9 justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Exit
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
