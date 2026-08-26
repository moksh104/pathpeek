import Link from 'next/link'
import {
  Users,
  MapPin,
  Building2,
  Ticket,
  Calendar,
  IndianRupee,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatBookingReference, formatINR, formatTripDate } from '@/lib/booking-utils'

export default async function AdminDashboardPage() {
  // Aggregate real database metrics in parallel
  const [
    totalUsers,
    totalDestinations,
    totalHotels,
    totalActivities,
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    bookingRevenue,
    recentBookings,
  ] = await Promise.all([
    db.user.count(),
    db.destination.count(),
    db.hotel.count(),
    db.activity.count(),
    db.booking.count(),
    db.booking.count({ where: { status: 'confirmed' } }),
    db.booking.count({ where: { status: 'cancelled' } }),
    db.booking.aggregate({ _sum: { totalPrice: true } }),
    db.booking.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        destination: { select: { name: true, city: true } },
        hotel: { select: { name: true } },
      },
    }),
  ])

  const totalRevenue = bookingRevenue._sum.totalPrice || 0

  const stats = [
    {
      title: 'Total Users',
      value: totalUsers.toLocaleString('en-IN'),
      icon: Users,
      color: 'text-blue-500 bg-blue-500/10',
      description: 'Registered traveler accounts',
    },
    {
      title: 'Destinations',
      value: totalDestinations.toLocaleString('en-IN'),
      icon: MapPin,
      color: 'text-violet-500 bg-violet-500/10',
      description: 'Curated Indian travel spots',
    },
    {
      title: 'Hotels & Stays',
      value: totalHotels.toLocaleString('en-IN'),
      icon: Building2,
      color: 'text-emerald-500 bg-emerald-500/10',
      description: 'Verified resorts & stays',
    },
    {
      title: 'Activities',
      value: totalActivities.toLocaleString('en-IN'),
      icon: Ticket,
      color: 'text-amber-500 bg-amber-500/10',
      description: 'Experiences & guided tours',
    },
    {
      title: 'Total Bookings',
      value: totalBookings.toLocaleString('en-IN'),
      icon: Calendar,
      color: 'text-purple-500 bg-purple-500/10',
      description: `${confirmedBookings} confirmed, ${cancelledBookings} cancelled`,
    },
    {
      title: 'Booking Value (Mock)',
      value: formatINR(totalRevenue),
      icon: IndianRupee,
      color: 'text-teal-500 bg-teal-500/10',
      description: 'Gross platform booking volume',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Platform Overview
            </h1>
            <Badge className="bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border-0 text-xs px-2.5 py-0.5 font-semibold">
              Live Database Metrics
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            Real-time platform statistics and booking telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/destinations">
            <Button size="sm" className="rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm">
              + New Destination
            </Button>
          </Link>
          <Link href="/admin/bookings">
            <Button size="sm" variant="outline" className="rounded-xl text-xs font-semibold">
              Manage Bookings
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Stat Cards Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <Card
              key={item.title}
              className="rounded-2xl border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {item.title}
                  </span>
                  <div className={`p-2.5 rounded-xl ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {item.value}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1.5">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Recent Bookings Table ─────────────────────────── */}
      <Card className="rounded-2xl border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] shadow-sm overflow-hidden">
        <CardHeader className="p-5 border-b border-gray-100 dark:border-white/[0.04] flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
              Recent Bookings
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
              Latest transactions placed across the platform
            </CardDescription>
          </div>
          <Link href="/admin/bookings">
            <Button variant="ghost" size="sm" className="text-xs text-violet-600 dark:text-violet-400">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {recentBookings.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-white/[0.02] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-white/[0.04]">
                <tr>
                  <th className="px-5 py-3.5">Ref / ID</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Destination</th>
                  <th className="px-5 py-3.5">Dates</th>
                  <th className="px-5 py-3.5">Total</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                {recentBookings.map((b) => {
                  const isConfirmed = b.status === 'confirmed'
                  const isCompleted = b.status === 'completed'
                  const ref = formatBookingReference(b.id)

                  return (
                    <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-gray-900 dark:text-white">
                        {ref}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {b.user.name || 'Traveler'}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[140px]">
                          {b.user.email}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {b.destination.name}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {b.destination.city}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                        {formatTripDate(b.checkIn)} → {formatTripDate(b.checkOut)}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                        {formatINR(b.totalPrice)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          className={`text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wider ${
                            isConfirmed
                              ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : isCompleted
                              ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                              : 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30'
                          }`}
                        >
                          {b.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href={`/admin/bookings`}>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                            Manage
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-xs text-gray-500">
              No bookings recorded yet. New customer bookings will appear here in real time.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
