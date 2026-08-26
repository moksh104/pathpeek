/**
 * PathPeek — Prisma Seed Script
 * Seeds: Users (admin + demo), 43 Destinations, ~40 Hotels, ~55 Activities
 * 
 * Idempotent: uses deleteMany() in dependency order before re-seeding.
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { travelPlaces } from '../src/data/places'

const prisma = new PrismaClient()
const SALT_ROUNDS = 10

// ─── Hotel seed data keyed by destination ID ─────────────
type HotelSeed = {
  name: string
  pricePerNight: number
  rating: number
  amenities: string
  image: string | null
}

const hotelData: Record<string, HotelSeed[]> = {
  // Ahmedabad — Sabarmati Ashram
  'gj-1': [
    { name: 'Hyatt Regency Ahmedabad', pricePerNight: 6500, rating: 4.5, amenities: 'WiFi, Pool, Restaurant, Spa, Parking', image: '/images/sabarmati_ashram.jpg' },
    { name: 'Lemon Tree Premier Ahmedabad', pricePerNight: 3200, rating: 4.2, amenities: 'WiFi, Breakfast, Restaurant, Parking', image: '/images/sabarmati_ashram.jpg' },
    { name: 'Hotel Cosmopolitan', pricePerNight: 1800, rating: 3.8, amenities: 'WiFi, AC, Room Service, Parking', image: '/images/sabarmati_ashram.jpg' },
  ],
  // Dwarka — Temple Pilgrimage
  'gj-2': [
    { name: 'Hotel Dwarka Residency', pricePerNight: 2800, rating: 4.0, amenities: 'WiFi, Breakfast, Temple View, Parking', image: '/images/dwarka_temple.jpg' },
    { name: 'Gomti Resort Dwarka', pricePerNight: 4500, rating: 4.3, amenities: 'WiFi, Pool, Restaurant, Sea View, Parking', image: '/images/dwarka_temple.jpg' },
  ],
  // Kutch — Rann of Kutch Safari
  'gj-5': [
    { name: 'Rann Riders Resort', pricePerNight: 5500, rating: 4.6, amenities: 'WiFi, Desert Safari, Cultural Show, Meals Included', image: '/images/rann_of_kutch.jpg' },
    { name: 'Shaam-e-Sarhad Village Resort', pricePerNight: 3800, rating: 4.4, amenities: 'Traditional Huts, Meals, Desert View, Cultural Program', image: '/images/rann_of_kutch.jpg' },
    { name: 'White Rann Resort', pricePerNight: 7000, rating: 4.7, amenities: 'Luxury Tent, WiFi, All Meals, Desert Safari, Bonfire', image: '/images/rann_of_kutch.jpg' },
  ],
  // Gir — Lion Safari
  'gj-6': [
    { name: 'Gir Jungle Lodge', pricePerNight: 4200, rating: 4.3, amenities: 'WiFi, Jungle View, Restaurant, Safari Desk, Parking', image: '/images/gir_lion.jpg' },
    { name: 'The Fern Gir Forest Resort', pricePerNight: 6800, rating: 4.6, amenities: 'WiFi, Pool, Spa, Restaurant, Nature Trail', image: '/images/gir_lion.jpg' },
  ],
  // Kevadia — Statue of Unity
  'gj-9': [
    { name: 'Tent City Narmada', pricePerNight: 5000, rating: 4.5, amenities: 'AC Tent, Meals Included, River View, Activities', image: '/images/statue_of_unity.jpg' },
    { name: 'Hotel Padmini Heritage', pricePerNight: 3500, rating: 4.1, amenities: 'WiFi, Breakfast, Parking, Statue View', image: '/images/statue_of_unity.jpg' },
  ],
  // Diu — Island Getaway
  'gj-11': [
    { name: 'Radhika Beach Resort', pricePerNight: 4500, rating: 4.4, amenities: 'WiFi, Pool, Beach Access, Restaurant, Water Sports', image: '/images/diu_island.jpg' },
    { name: 'Hotel Kohinoor Diu', pricePerNight: 2200, rating: 3.9, amenities: 'WiFi, AC, Sea View, Restaurant, Parking', image: '/images/diu_island.jpg' },
  ],
  // Rishikesh — Triveni Ghat
  '1': [
    { name: 'Aloha on the Ganges', pricePerNight: 7500, rating: 4.7, amenities: 'WiFi, River View, Spa, Yoga, Pool, Restaurant', image: '/images/rishikesh-peaceful.jpg' },
    { name: 'Divine Ganga Cottage', pricePerNight: 3000, rating: 4.3, amenities: 'WiFi, River View, Yoga Hall, Vegetarian Restaurant', image: '/images/rishikesh-peaceful.jpg' },
    { name: 'Camp Wildex Rishikesh', pricePerNight: 2500, rating: 4.1, amenities: 'Riverside Camp, Meals, Rafting, Bonfire, Trekking', image: '/images/rishikesh-adventure.jpg' },
  ],
  // Dharamshala — Meditation Retreat
  '2': [
    { name: 'Hyatt Regency Dharamshala', pricePerNight: 8000, rating: 4.6, amenities: 'WiFi, Mountain View, Pool, Spa, Restaurant, Yoga', image: '/images/dharamshala-peaceful.jpg' },
    { name: 'Tibet World Guest House', pricePerNight: 1500, rating: 4.2, amenities: 'WiFi, Mountain View, Meditation Hall, Vegetarian Meals', image: '/images/dharamshala-peaceful.jpg' },
  ],
  // Alleppey — Kerala Backwaters
  '3': [
    { name: 'Premium Houseboat Suite', pricePerNight: 12000, rating: 4.8, amenities: 'AC Houseboat, All Meals, Private Deck, Backwater Cruise', image: '/images/alleppey-peaceful.jpg' },
    { name: 'Marari Beach Resort', pricePerNight: 8500, rating: 4.6, amenities: 'WiFi, Pool, Ayurveda Spa, Beach, Restaurant', image: '/images/alleppey-peaceful.jpg' },
    { name: 'Lake Palace Resort Alleppey', pricePerNight: 5500, rating: 4.4, amenities: 'WiFi, Lake View, Restaurant, Canoe, Cycling', image: '/images/alleppey-peaceful.jpg' },
  ],
  // Jaisalmer — Sand Dune Safari
  '8': [
    { name: 'Suryagarh Jaisalmer', pricePerNight: 9000, rating: 4.7, amenities: 'WiFi, Pool, Spa, Desert View, Heritage Walk, Restaurant', image: '/images/jaisalmer-adventure.jpg' },
    { name: 'Desert Haveli Guest House', pricePerNight: 2800, rating: 4.2, amenities: 'WiFi, Rooftop Restaurant, Fort View, Cultural Show', image: '/images/jaisalmer-adventure.jpg' },
    { name: 'Sam Sand Dunes Camp', pricePerNight: 4500, rating: 4.5, amenities: 'Luxury Tent, Desert Safari, Camel Ride, Folk Music, Meals', image: '/images/jaisalmer-adventure.jpg' },
  ],
  // Leh — Chadar Trek
  '9': [
    { name: 'The Grand Dragon Ladakh', pricePerNight: 8500, rating: 4.6, amenities: 'WiFi, Mountain View, Restaurant, Oxygen Support, Heating', image: '/images/leh-adventure.jpg' },
    { name: 'Ladakh Sarai Resort', pricePerNight: 5000, rating: 4.3, amenities: 'WiFi, Garden, Restaurant, Tour Desk, Heating', image: '/images/leh-adventure.jpg' },
  ],
  // Udaipur — Lake Palace
  '14': [
    { name: 'Taj Lake Palace Udaipur', pricePerNight: 25000, rating: 4.9, amenities: 'WiFi, Lake View, Pool, Spa, Heritage, Butler Service', image: '/images/udaipur-romantic.jpg' },
    { name: 'Hotel Lakend Udaipur', pricePerNight: 6500, rating: 4.5, amenities: 'WiFi, Lake View, Pool, Restaurant, Rooftop Bar', image: '/images/udaipur-romantic.jpg' },
    { name: 'Mewar Haveli Heritage Hotel', pricePerNight: 3500, rating: 4.2, amenities: 'WiFi, Heritage Room, Rooftop Restaurant, City View', image: '/images/udaipur-romantic.jpg' },
  ],
  // Agra — Taj Mahal
  '15': [
    { name: 'The Oberoi Amarvilas Agra', pricePerNight: 18000, rating: 4.8, amenities: 'WiFi, Taj View, Pool, Spa, Fine Dining, Butler', image: '/images/agra-romantic.jpg' },
    { name: 'Crystal Sarovar Premiere Agra', pricePerNight: 4500, rating: 4.3, amenities: 'WiFi, Pool, Restaurant, Taj View Rooms, Parking', image: '/images/agra-romantic.jpg' },
  ],
  // Srinagar — Dal Lake Houseboat
  '16': [
    { name: 'Luxury Houseboat on Dal Lake', pricePerNight: 10000, rating: 4.7, amenities: 'Carved Woodwork, All Meals, Shikara Rides, Lake View', image: '/images/srinagar-romantic.jpg' },
    { name: 'The Lalit Grand Palace Srinagar', pricePerNight: 12000, rating: 4.8, amenities: 'WiFi, Heritage Palace, Garden, Restaurant, Mountain View', image: '/images/srinagar-romantic.jpg' },
    { name: 'Hotel Akbar Srinagar', pricePerNight: 3500, rating: 4.1, amenities: 'WiFi, Dal Lake View, Restaurant, Shikara Arranged, Heating', image: '/images/srinagar-romantic.jpg' },
  ],
  // Munnar — Tea Garden
  '17': [
    { name: 'Tea Valley Resort Munnar', pricePerNight: 5500, rating: 4.5, amenities: 'WiFi, Valley View, Tea Garden Walk, Restaurant, Bonfire', image: '/images/munnar-romantic.jpg' },
    { name: 'Fragrant Nature Munnar', pricePerNight: 7000, rating: 4.6, amenities: 'WiFi, Infinity Pool, Spa, Plantation Tour, Restaurant', image: '/images/munnar-romantic.jpg' },
  ],
  // Goa — Anjuna Beach
  '28': [
    { name: 'Taj Exotica Resort & Spa Goa', pricePerNight: 15000, rating: 4.8, amenities: 'WiFi, Beach, Pool, Spa, Multiple Restaurants, Water Sports', image: '/images/goa-party.jpg' },
    { name: 'Anjuna Beach Resort', pricePerNight: 4500, rating: 4.3, amenities: 'WiFi, Pool, Beach Access, Bar, Flea Market Nearby', image: '/images/goa-party.jpg' },
    { name: 'Palolem Beach Huts', pricePerNight: 2000, rating: 4.0, amenities: 'Beach Hut, Sea View, Restaurant, Kayaking', image: '/images/goa-party.jpg' },
  ],
}

// ─── Activity seed data keyed by destination ID ──────────
type ActivitySeed = {
  name: string
  price: number
  duration: string
  description: string
  image: string | null
}

const activityData: Record<string, ActivitySeed[]> = {
  // Ahmedabad
  'gj-1': [
    { name: 'Heritage Walking Tour of Old City', price: 500, duration: '3 hours', description: 'Explore the UNESCO heritage walled city with its pols, havelis, and vibrant street life.', image: '/images/sabarmati_ashram.jpg' },
    { name: 'Sabarmati Riverfront Cycling', price: 300, duration: '2 hours', description: 'Scenic bicycle ride along the beautifully developed Sabarmati Riverfront.', image: '/images/sabarmati_riverfront.jpg' },
    { name: 'Kite Making Workshop', price: 400, duration: '2 hours', description: 'Learn traditional Ahmedabad kite-making from local artisans.', image: null },
    { name: 'Ahmedabad Street Food Trail', price: 600, duration: '3 hours', description: 'Guided tour of famous Manek Chowk and Law Garden food stalls.', image: null },
  ],
  // Dwarka
  'gj-2': [
    { name: 'Dwarkadhish Temple Guided Tour', price: 200, duration: '2 hours', description: 'Guided visit to the ancient Krishna temple with aarti experience.', image: '/images/dwarka_temple.jpg' },
    { name: 'Nageshwar Jyotirlinga Visit', price: 300, duration: '3 hours', description: 'Visit to one of the twelve Jyotirlingas with transportation included.', image: null },
    { name: 'Beyt Dwarka Island Trip', price: 500, duration: 'Half day', description: 'Boat ride to the sacred island with temple visits and beach time.', image: null },
  ],
  // Kutch
  'gj-5': [
    { name: 'White Rann Jeep Safari', price: 1500, duration: '4 hours', description: 'Jeep safari across the surreal white salt desert with sunset views.', image: '/images/rann_of_kutch.jpg' },
    { name: 'Kutch Handicraft Village Tour', price: 800, duration: '5 hours', description: 'Visit traditional artisan villages known for embroidery, block printing, and pottery.', image: null },
    { name: 'Flamingo Watching Tour', price: 600, duration: '3 hours', description: 'Guided bird-watching in the salt marshes to see flamingos and migratory birds.', image: '/images/kutch_wildlife.jpg' },
    { name: 'Cultural Folk Music Night', price: 400, duration: '2 hours', description: 'Live performance of traditional Kutchi folk music and dance under the stars.', image: '/images/rann_utsav.jpg' },
  ],
  // Gir
  'gj-6': [
    { name: 'Gir Lion Safari', price: 1800, duration: '3 hours', description: 'Guided jeep safari into the Gir National Park to spot Asiatic lions.', image: '/images/gir_lion.jpg' },
    { name: 'Devalia Interpretation Zone Visit', price: 500, duration: '2 hours', description: 'Semi-wild enclosure for guaranteed wildlife sightings including lions and deer.', image: '/images/gir_lion.jpg' },
    { name: 'Crocodile Breeding Centre Tour', price: 200, duration: '1 hour', description: 'Visit the crocodile conservation and breeding facility near Sasan Gir.', image: null },
  ],
  // Statue of Unity — Kevadia
  'gj-9': [
    { name: 'Statue of Unity Viewing Gallery', price: 350, duration: '2 hours', description: 'Elevator ride to the observation deck at 153 meters with panoramic views.', image: '/images/statue_of_unity.jpg' },
    { name: 'Valley of Flowers Garden Visit', price: 100, duration: '1.5 hours', description: 'Stroll through a beautiful garden with diverse flower species near the statue.', image: null },
    { name: 'Sardar Sarovar Dam Light Show', price: 200, duration: '1 hour', description: 'Spectacular evening light and sound show at the Narmada dam.', image: null },
  ],
  // Diu
  'gj-11': [
    { name: 'Diu Fort & Portuguese Heritage Walk', price: 300, duration: '3 hours', description: 'Explore the historic Portuguese-era fort with sea views and colonial churches.', image: '/images/diu_island.jpg' },
    { name: 'Water Sports at Nagoa Beach', price: 1200, duration: '2 hours', description: 'Jet skiing, parasailing, and banana boat rides at the pristine beach.', image: '/images/diu_island.jpg' },
    { name: 'Sunset Cruise along Diu Coast', price: 800, duration: '1.5 hours', description: 'Scenic boat cruise along the coastline during golden hour.', image: null },
  ],
  // Rishikesh
  '1': [
    { name: 'White Water River Rafting', price: 1500, duration: '3 hours', description: 'Thrilling Grade III–IV rapids on the Ganges with professional instructors.', image: '/images/rishikesh-adventure.jpg' },
    { name: 'Bungee Jumping (83m)', price: 3500, duration: '1 hour', description: "India's highest bungee jumping platform with free-fall and pendulum swing.", image: '/images/rishikesh-bungee.jpg' },
    { name: 'Ganga Aarti at Triveni Ghat', price: 200, duration: '1.5 hours', description: 'Mesmerizing evening prayer ceremony on the banks of the Ganges.', image: '/images/rishikesh-peaceful.jpg' },
    { name: 'Beatles Ashram Visit', price: 600, duration: '2 hours', description: 'Explore the abandoned ashram where The Beatles stayed, now covered in vibrant graffiti art.', image: null },
    { name: 'Camping & Cliff Jumping', price: 2000, duration: 'Full day', description: 'Riverside camping with cliff jumping, hiking, and bonfire night.', image: '/images/rishikesh-adventure.jpg' },
  ],
  // Dharamshala
  '2': [
    { name: 'Tibetan Monastery & Culture Tour', price: 400, duration: '3 hours', description: "Visit the Dalai Lama's temple complex and the Tibetan Museum.", image: '/images/dharamshala-peaceful.jpg' },
    { name: 'Triund Trek', price: 800, duration: 'Full day', description: 'Moderate Himalayan trek to Triund peak at 2,850m with stunning views.', image: '/images/dharamshala-peaceful.jpg' },
    { name: 'Meditation & Yoga Session', price: 500, duration: '2 hours', description: 'Guided session with Buddhist monks at a peaceful mountain retreat.', image: null },
  ],
  // Kerala Backwaters — Alleppey
  '3': [
    { name: 'Backwater Houseboat Cruise', price: 3500, duration: 'Full day', description: 'Cruise through palm-fringed canals in a traditional Kerala kettuvallam.', image: '/images/alleppey-peaceful.jpg' },
    { name: 'Kathakali Dance Performance', price: 500, duration: '2 hours', description: 'Traditional Kerala classical dance-drama performance with makeup demonstration.', image: null },
    { name: 'Ayurvedic Spa Treatment', price: 2500, duration: '2 hours', description: 'Authentic Ayurvedic massage and wellness treatment by certified practitioners.', image: null },
    { name: 'Village Canoe Tour', price: 800, duration: '3 hours', description: 'Paddle through narrow canals to visit local villages and see toddy tapping.', image: '/images/alleppey-peaceful.jpg' },
  ],
  // Jaisalmer
  '8': [
    { name: 'Desert Camel Safari', price: 1200, duration: '4 hours', description: 'Ride through the Thar Desert dunes on camelback with a desert guide.', image: '/images/jaisalmer-adventure.jpg' },
    { name: 'Sam Sand Dunes Sunset Jeep Safari', price: 1800, duration: '3 hours', description: '4x4 jeep ride across the Sam dunes with sunset views and chai.', image: '/images/jaisalmer-adventure.jpg' },
    { name: 'Jaisalmer Fort Heritage Walk', price: 400, duration: '2 hours', description: 'Guided tour of the living fort with Jain temples and royal palace.', image: null },
    { name: 'Cultural Desert Evening', price: 600, duration: '3 hours', description: 'Folk music, Kalbeliya dance, fire dancers, and traditional Rajasthani dinner under the stars.', image: null },
  ],
  // Leh
  '9': [
    { name: 'Pangong Lake Day Trip', price: 3500, duration: 'Full day', description: 'Drive through Chang La pass to the stunning color-changing lake.', image: '/images/pangong-nature.jpg' },
    { name: 'Nubra Valley & Bactrian Camel Ride', price: 4000, duration: 'Full day', description: 'Drive over Khardung La to ride double-humped camels at Hunder sand dunes.', image: '/images/nubra-nature.jpg' },
    { name: 'Hemis Monastery Visit', price: 500, duration: '3 hours', description: 'Visit the largest monastery in Ladakh with its ancient Buddhist art and murals.', image: null },
  ],
  // Udaipur
  '14': [
    { name: 'Lake Pichola Boat Ride', price: 800, duration: '1 hour', description: 'Sunset boat ride on the lake with views of City Palace and Lake Palace Hotel.', image: '/images/udaipur-romantic.jpg' },
    { name: 'City Palace Museum Tour', price: 600, duration: '2 hours', description: 'Explore the magnificent palace complex with its courtyards, museums, and lake views.', image: '/images/udaipur-romantic.jpg' },
    { name: 'Vintage Car Museum Visit', price: 500, duration: '1.5 hours', description: 'Collection of royal vintage and classic cars from the Mewar dynasty.', image: null },
  ],
  // Agra
  '15': [
    { name: 'Taj Mahal Sunrise Guided Tour', price: 1200, duration: '3 hours', description: 'Early morning guided visit to the Taj Mahal with a certified ASI guide.', image: '/images/agra-romantic.jpg' },
    { name: 'Agra Fort Heritage Walk', price: 500, duration: '2 hours', description: 'Explore the UNESCO World Heritage Mughal-era fort with expert commentary.', image: null },
    { name: 'Mehtab Bagh Sunset View', price: 300, duration: '1.5 hours', description: 'View the Taj Mahal across the Yamuna from the Moonlight Garden at sunset.', image: '/images/agra-romantic.jpg' },
  ],
  // Srinagar
  '16': [
    { name: 'Shikara Ride on Dal Lake', price: 600, duration: '1.5 hours', description: 'Peaceful boat ride through floating gardens, lotus blooms, and floating markets.', image: '/images/srinagar-romantic.jpg' },
    { name: 'Mughal Gardens Tour', price: 400, duration: '3 hours', description: 'Visit the stunning Shalimar Bagh, Nishat Bagh, and Chashme Shahi gardens.', image: null },
    { name: 'Gondola Ride at Gulmarg', price: 2500, duration: 'Full day', description: 'Cable car ride to 13,780 ft with breathtaking Himalayan panoramas.', image: null },
  ],
  // Munnar
  '17': [
    { name: 'Tea Plantation Walk & Factory Tour', price: 500, duration: '3 hours', description: 'Walk through rolling tea gardens and see tea processing at a working factory.', image: '/images/munnar-romantic.jpg' },
    { name: 'Eravikulam National Park Visit', price: 400, duration: '3 hours', description: 'Spot the endangered Nilgiri Tahr in the misty mountain grasslands.', image: null },
    { name: 'Mattupetty Dam & Echo Point Trip', price: 600, duration: 'Half day', description: 'Visit the scenic dam, Echo Point, and Kundala Lake with speed boating.', image: '/images/munnar-romantic.jpg' },
  ],
  // Goa — Anjuna Beach
  '28': [
    { name: 'Scuba Diving at Grande Island', price: 3500, duration: 'Half day', description: 'Explore coral reefs and marine life with certified PADI diving instructors.', image: '/images/goa-party.jpg' },
    { name: 'Sunset Cruise on Mandovi River', price: 1000, duration: '2 hours', description: 'Evening cruise with live music, Goan dance, and unlimited snacks.', image: null },
    { name: 'Old Goa Church Heritage Walk', price: 300, duration: '2 hours', description: 'Visit the Basilica of Bom Jesus and Se Cathedral with a local guide.', image: null },
    { name: 'Dudhsagar Waterfalls Jeep Safari', price: 2000, duration: 'Full day', description: 'Off-road jeep ride through the jungle to the magnificent four-tiered waterfall.', image: '/images/goa-party.jpg' },
  ],
}

// ─── Main seed function ──────────────────────────────────
async function main() {
  console.log('🌱 Starting PathPeek database seed...\n')

  // ── Step 1: Clean database in reverse-dependency order ──
  console.log('🧹 Cleaning existing data...')
  await prisma.booking.deleteMany()
  await prisma.hotel.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.destination.deleteMany()
  await prisma.user.deleteMany()
  console.log('   ✓ Database cleaned\n')

  // ── Step 2: Seed demo users ─────────────────────────────
  console.log('👤 Seeding demo users...')
  const adminPasswordHash = await bcrypt.hash('Admin@123', SALT_ROUNDS)
  const demoPasswordHash = await bcrypt.hash('Demo@123', SALT_ROUNDS)

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@pathpeek.demo',
      name: 'PathPeek Admin',
      password: adminPasswordHash,
      role: 'admin',
    },
  })
  console.log(`   ✓ Admin: ${adminUser.email} (role: admin)`)

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@pathpeek.demo',
      name: 'Demo User',
      password: demoPasswordHash,
      role: 'user',
    },
  })
  console.log(`   ✓ Demo:  ${demoUser.email} (role: user)\n`)

  // ── Step 3: Seed destinations from places.ts ────────────
  console.log('🗺️  Seeding destinations from places.ts...')
  for (const place of travelPlaces) {
    await prisma.destination.create({
      data: {
        id: place.id, // Reuse original ID for stable hotel/activity references
        name: place.name,
        mood: place.mood,
        state: place.state,
        city: place.city,
        budget: place.budget,
        rating: place.rating,
        description: place.description,
        image: place.image,
        latitude: place.latitude,
        longitude: place.longitude,
        recommendationScore: place.recommendationScore ?? 0,
      },
    })
  }
  const destCount = await prisma.destination.count()
  console.log(`   ✓ ${destCount} destinations seeded\n`)

  // ── Step 4: Seed hotels ─────────────────────────────────
  console.log('🏨 Seeding hotels...')
  let hotelCount = 0
  for (const [destId, hotels] of Object.entries(hotelData)) {
    for (const hotel of hotels) {
      await prisma.hotel.create({
        data: {
          name: hotel.name,
          pricePerNight: hotel.pricePerNight,
          rating: hotel.rating,
          amenities: hotel.amenities,
          image: hotel.image,
          destinationId: destId,
        },
      })
      hotelCount++
    }
  }
  console.log(`   ✓ ${hotelCount} hotels seeded across ${Object.keys(hotelData).length} destinations\n`)

  // ── Step 5: Seed activities ─────────────────────────────
  console.log('🎯 Seeding activities...')
  let actCount = 0
  for (const [destId, activities] of Object.entries(activityData)) {
    for (const activity of activities) {
      await prisma.activity.create({
        data: {
          name: activity.name,
          price: activity.price,
          duration: activity.duration,
          description: activity.description,
          image: activity.image,
          destinationId: destId,
        },
      })
      actCount++
    }
  }
  console.log(`   ✓ ${actCount} activities seeded across ${Object.keys(activityData).length} destinations\n`)

  // ── Summary ─────────────────────────────────────────────
  const finalDest = await prisma.destination.count()
  const finalHotel = await prisma.hotel.count()
  const finalAct = await prisma.activity.count()
  const finalUser = await prisma.user.count()

  console.log('═══════════════════════════════════════')
  console.log('  PathPeek Seed Summary')
  console.log('═══════════════════════════════════════')
  console.log(`  Users:        ${finalUser}`)
  console.log(`  Destinations: ${finalDest}`)
  console.log(`  Hotels:       ${finalHotel}`)
  console.log(`  Activities:   ${finalAct}`)
  console.log(`  Bookings:     0 (created by users)`)
  console.log('═══════════════════════════════════════')
  console.log('\n✅ Database seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
