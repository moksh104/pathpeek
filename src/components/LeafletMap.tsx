'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon issue in bundled environments
const destinationIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

// Haversine formula to calculate distance between two lat/lng points
function haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

// Component to fit map bounds when both markers are present
function FitBounds({ destLat, destLng, userLat, userLng }: {
    destLat: number
    destLng: number
    userLat: number | null
    userLng: number | null
}) {
    const map = useMap()

    useEffect(() => {
        if (userLat !== null && userLng !== null) {
            const bounds = L.latLngBounds(
                [destLat, destLng],
                [userLat, userLng]
            )
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
        } else {
            map.setView([destLat, destLng], 10)
        }
    }, [map, destLat, destLng, userLat, userLng])

    return null
}

interface LeafletMapProps {
    destLat: number
    destLng: number
    destName: string
    isDarkMode: boolean
}

export default function LeafletMap({ destLat, destLng, destName, isDarkMode }: LeafletMapProps) {
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'denied' | 'error'>('loading')
    const [distance, setDistance] = useState<number | null>(null)
    const mapRef = useRef<L.Map | null>(null)

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationStatus('error')
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setUserLocation({ lat: latitude, lng: longitude })
                setLocationStatus('success')
                const dist = haversineDistance(latitude, longitude, destLat, destLng)
                setDistance(Math.round(dist * 10) / 10)
            },
            () => {
                setLocationStatus('denied')
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        )
    }, [destLat, destLng])

    // Invalidate map size when component mounts (fixes grey tiles)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.invalidateSize()
            }
        }, 250)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="mb-6">
            <div
                className="rounded-xl overflow-hidden border"
                style={{
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
                }}
            >
                <MapContainer
                    center={[destLat, destLng]}
                    zoom={10}
                    className="h-[300px] md:h-[400px] w-full"
                    style={{ zIndex: 1 }}
                    ref={mapRef}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Destination marker */}
                    <Marker position={[destLat, destLng]} icon={destinationIcon}>
                        <Popup>
                            <div className="font-semibold text-sm">{destName}</div>
                            <div className="text-xs text-gray-500">Destination</div>
                        </Popup>
                    </Marker>

                    {/* User location marker */}
                    {userLocation && (
                        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                            <Popup>
                                <div className="font-semibold text-sm">Your Location</div>
                            </Popup>
                        </Marker>
                    )}

                    <FitBounds
                        destLat={destLat}
                        destLng={destLng}
                        userLat={userLocation?.lat ?? null}
                        userLng={userLocation?.lng ?? null}
                    />
                </MapContainer>
            </div>

            {/* Distance display */}
            <div
                className={`mt-3 flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isDarkMode
                        ? 'bg-white/[0.03] border border-white/[0.06]'
                        : 'bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100'
                    }`}
            >
                <div
                    className={`flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 ${isDarkMode
                            ? 'bg-violet-500/15'
                            : 'bg-violet-100'
                        }`}
                >
                    <svg
                        className={`w-4.5 h-4.5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    {locationStatus === 'loading' && (
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full animate-pulse ${isDarkMode ? 'bg-violet-400' : 'bg-violet-500'}`} />
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Detecting your location...
                            </span>
                        </div>
                    )}
                    {locationStatus === 'success' && distance !== null && (
                        <div>
                            <div className={`text-xs uppercase tracking-wider font-medium mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                Distance from you
                            </div>
                            <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {distance.toLocaleString('en-IN')} km
                            </div>
                        </div>
                    )}
                    {locationStatus === 'denied' && (
                        <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            Location access denied — enable location to see distance
                        </span>
                    )}
                    {locationStatus === 'error' && (
                        <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            Geolocation not supported by your browser
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
