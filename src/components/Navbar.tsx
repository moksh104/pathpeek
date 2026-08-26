'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Compass,
  MapPin,
  Calendar,
  Briefcase,
  ShieldCheck,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export default function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize and sync dark mode state with document and localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pathpeek-dark-mode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialDark = saved !== null ? saved === 'true' : prefersDark
    setIsDarkMode(initialDark)
    if (initialDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('pathpeek-dark-mode', String(newMode))
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const navLinks: { name: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { name: 'Home', href: '/', icon: Compass },
    { name: 'Destinations', href: '/destinations', icon: MapPin },
    { name: 'Trip Planner', href: '/trip-planner', icon: Calendar },
    { name: 'My Trips', href: '/my-trips', icon: Briefcase },
  ]

  const user = session?.user
  const isAdmin = user?.role === 'admin'

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl border-b bg-white/80 dark:bg-[#09090b]/90 border-gray-200/80 dark:border-white/[0.06] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-1.5 rounded-xl bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] shadow-sm group-hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="PathPeek Logo"
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-purple-900 to-violet-800 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              PathPeek
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              const Icon = link.icon
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 font-normal">
                      {link.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Desktop Right Actions: Theme toggle + Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {status === 'loading' ? (
              <div className="w-20 h-8 rounded-lg bg-gray-200 dark:bg-white/[0.05] animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link href="/admin">
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25 px-2.5 py-1 text-xs gap-1 cursor-pointer">
                      <ShieldCheck className="w-3 h-3" />
                      Admin Dashboard
                    </Badge>
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-xl border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-white/[0.06] text-xs h-9 px-3 gap-2"
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-violet-500 to-purple-500 text-white flex items-center justify-center text-[10px] font-bold">
                        {user.name ? user.name[0].toUpperCase() : 'U'}
                      </div>
                      <span className="max-w-[120px] truncate font-medium">
                        {user.name || user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl border-gray-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#0f0f14]/95 backdrop-blur-xl">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none text-gray-900 dark:text-white">
                          {user.name || 'Traveler'}
                        </p>
                        <p className="text-xs leading-none text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                        <Badge className="w-fit mt-1 text-[10px] px-1.5 py-0 bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 border-0">
                          {user.role}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-100 dark:bg-white/[0.06]" />
                    <DropdownMenuItem asChild>
                      <Link href="/my-trips" className="cursor-pointer">
                        <Briefcase className="w-4 h-4 mr-2" />
                        My Bookings
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer text-amber-600 dark:text-amber-400">
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          Admin Console
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-gray-100 dark:bg-white/[0.06]" />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    className="h-9 px-3.5 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                  >
                    <LogIn className="w-3.5 h-3.5 mr-1.5" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="h-9 px-3.5 rounded-xl text-xs font-medium bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-md shadow-violet-500/20">
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-white/[0.06] bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-xl px-4 pt-2 pb-6 space-y-3">
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              const Icon = link.icon
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">
                      {link.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06]">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user.name || 'Traveler'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <Badge className="bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 border-0 text-[10px]">
                    {user.role}
                  </Badge>
                </div>

                {isAdmin && (
                  <Link href="/admin" className="block">
                    <Button variant="outline" className="w-full justify-start text-amber-600 dark:text-amber-400 border-amber-500/30">
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Button>
                  </Link>
                )}

                <Button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  variant="ghost"
                  className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/auth/login" className="w-full">
                  <Button variant="outline" className="w-full rounded-xl text-xs">
                    <LogIn className="w-3.5 h-3.5 mr-1" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register" className="w-full">
                  <Button className="w-full rounded-xl text-xs bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
