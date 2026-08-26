'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, Compass, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      })

      if (result?.error) {
        setError('Invalid email or password. Please try again.')
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        // Fetch updated session to check role for redirection
        const session = await getSession()
        if (session?.user?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/')
        }
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred during sign in.')
      setIsLoading(false)
    }
  }

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setError(null)
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#09090b] dark:via-[#0c0a13] dark:to-[#09090b] transition-colors">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[160px] bg-gradient-to-bl from-violet-500/10 via-purple-500/5 to-transparent dark:from-violet-900/20 dark:via-purple-900/10" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full blur-[140px] bg-gradient-to-tr from-indigo-500/10 to-transparent dark:from-indigo-900/15" />
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="p-2 rounded-2xl bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] shadow-md group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/logo.png"
                alt="PathPeek Logo"
                width={36}
                height={36}
                className="w-9 h-9 object-contain"
                priority
              />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-purple-900 to-violet-800 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
              PathPeek
            </span>
          </Link>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Sign in to manage your bookings and trips
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-gray-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#0f0f14]/90 backdrop-blur-xl shadow-xl dark:shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Welcome back
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-300 font-normal">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm font-medium animate-fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-11 rounded-xl text-sm bg-gray-50/50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] focus:border-violet-500 dark:focus:border-violet-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-11 rounded-xl text-sm bg-gray-50/50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] focus:border-violet-500 dark:focus:border-violet-400 transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25 transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2 border-t border-gray-100 dark:border-white/[0.04]">
              {/* Quick Demo Fill Buttons for Judge convenience */}
              <div className="w-full pt-1">
                <p className="text-[11px] uppercase tracking-wider text-center font-medium text-gray-400 dark:text-gray-500 mb-2">
                  Demo Accounts
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemo('demo@pathpeek.demo', 'Demo@123')}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-white/[0.06] transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5 text-violet-500" />
                    User Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo('admin@pathpeek.demo', 'Admin@123')}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-white/[0.06] transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    Admin Demo
                  </button>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                Don&apos;t have an account?{' '}
                <Link
                  href="/auth/register"
                  className="font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Create an account
                </Link>
              </div>

              <div className="text-center">
                <Link
                  href="/"
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  ← Back to PathPeek Explore
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
