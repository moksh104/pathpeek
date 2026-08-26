'use client'

import { useState } from 'react'
import { Users, Search, ShieldCheck, User as UserIcon, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatTripDate } from '@/lib/booking-utils'

export interface UserAdminItem {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string | Date
  _count: {
    bookings: number
  }
}

export default function UsersManager({ initialUsers }: { initialUsers: UserAdminItem[] }) {
  const [users] = useState<UserAdminItem[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Users & Travelers
            </h1>
            <Badge variant="outline" className="text-xs">
              {users.length} registered
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Registered customer accounts, role assignments, and booking history volume.
          </p>
        </div>
      </div>

      {/* Table Card */}
      <Card className="rounded-2xl border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-gray-100 dark:border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-gray-50/50 dark:bg-white/[0.02]"
              />
            </div>

            <div className="flex items-center gap-1">
              {['all', 'admin', 'user'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
                    roleFilter === r
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                      : 'bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-gray-400">
            Showing {filtered.length} of {users.length} accounts
          </span>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-white/[0.02] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-white/[0.04]">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined Date</th>
                <th className="px-4 py-3 text-right">Bookings Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
              {filtered.map((u) => {
                const isAdmin = u.role === 'admin'

                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isAdmin
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                          }`}
                        >
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">
                            {u.name || 'Anonymous Traveler'}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                      {u.email}
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        className={`text-[10px] px-2 py-0.5 font-semibold capitalize flex items-center gap-1 w-fit ${
                          isAdmin
                            ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            : 'bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30'
                        }`}
                      >
                        {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                        {u.role}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatTripDate(u.createdAt)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0 border-0">
                        {u._count.bookings} trip{u._count.bookings !== 1 ? 's' : ''}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
