import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Compass, Heart, Shield, Sparkles } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200/80 dark:border-white/[0.04] bg-white/60 dark:bg-[#09090b]/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] shadow-sm">
                <Image
                  src="/logo.png"
                  alt="PathPeek"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain"
                />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                PathPeek
              </span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm leading-relaxed font-normal">
              Smart Tourism & Travel Booking Portal. Discover curated Indian destinations matching your mood, vibe, and budget.
            </p>
            <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                Curated Experiences
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                Verified Stays
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-gray-900 dark:text-white mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link
                  href="/"
                  className="text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  Home Discovery
                </Link>
              </li>
              <li>
                <Link
                  href="/destinations"
                  className="text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  All Destinations
                </Link>
              </li>
              <li>
                <Link
                  href="/trip-planner"
                  className="text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  Trip Planner
                </Link>
              </li>
              <li>
                <Link
                  href="/my-trips"
                  className="text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  My Trips
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Hackathon */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-gray-900 dark:text-white mb-4">
              Account & Portal
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link
                  href="/auth/login"
                  className="text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  Create Account
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors font-semibold"
                >
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100 dark:border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
          <p>© {currentYear} PathPeek — DEVSTORM-2026 Hackathon</p>
          <p className="flex items-center gap-1">
            Built for Smart Tourism with <Heart className="w-3 h-3 text-red-500 fill-red-500" />
          </p>
        </div>
      </div>
    </footer>
  )
}
