# ✈️ Steora — AI-Powered Travel Planner

> **Plan smarter. Travel better. Replan when things change.**

Steora is an **AI-powered travel planning and replanning platform** that creates personalized itineraries using real travel data, user preferences, budget constraints, weather information, routes, and hotel options.

Unlike a basic AI itinerary generator, Steora is being designed as a **travel decision and replanning system** — where travelers can understand trade-offs, modify their plans, and generate updated itineraries without starting from scratch.

> 🚧 **Status: Actively in development**

---

## 🌍 What Problem Does Steora Solve?

Planning a trip usually requires switching between multiple platforms for:

* Finding places to visit
* Checking weather
* Estimating travel time
* Managing a budget
* Finding hotels
* Organizing activities
* Rebuilding the itinerary when plans change

AI itinerary generators can make this easier, but they can also produce unrealistic or invented travel information.

**Steora focuses on connecting real travel data with AI-powered planning and validation.**

---

## 💡 How Steora Works

```text
User Preferences
       ↓
Destination & Dates
       ↓
Real Travel Data
       ↓
Places + Weather + Routes + Hotels
       ↓
Travel Intelligence
       ↓
AI Itinerary Generation
       ↓
Constraint & Budget Validation
       ↓
Personalized Trip
       ↓
User Changes Something
       ↓
Replanning
       ↓
Updated Trip
```

The goal is to make the itinerary **dynamic rather than static**.

---

## ✨ Core Features

### 🧠 AI Trip Planning

Steora uses Google Gemini to generate personalized itineraries based on:

* Destination
* Travel dates
* Number of travelers
* Budget
* Interests
* Travel style
* Daily pace
* Preferred travel time
* Additional preferences

The AI is provided with real travel data rather than being allowed to invent places or travel information.

---

### 📍 Real Place Discovery

Steora integrates real place data to discover relevant:

* Attractions
* Restaurants
* Cafes
* Markets
* Parks
* Museums
* Cultural locations
* Adventure activities
* Photography spots

Places are ranked according to the traveler's preferences and trip requirements.

---

### 💰 Budget-Aware Planning

Steora treats budget as a **planning constraint and decision tool**, rather than silently removing everything that exceeds the budget.

The planned system supports:

* Within-budget options
* Slightly-over-budget options
* Premium alternatives
* Cost breakdowns
* Verified pricing
* Unpriced item handling
* Budget trade-offs
* Future budget optimization

When reliable pricing is unavailable, Steora does **not invent a price**.

---

### 🗺️ Route & Travel Planning

Steora uses real routing data to calculate:

* Travel distances
* Travel times
* Route geometry
* Activity-to-activity movement
* Day routes

This allows the itinerary to consider the actual movement between places rather than simply generating a list of attractions.

---

### 🌦️ Weather-Aware Planning

Weather information is incorporated into the travel planning pipeline.

The system can use weather conditions to support future planning decisions such as:

* Outdoor vs indoor activities
* Rain-aware alternatives
* Weather-based activity ordering
* Plan B activities

---

### 🏨 Real Hotel Discovery

Steora currently integrates real hotel search through **Roost + Google Hotels data**.

Hotel results can include:

* Hotel name
* Platform
* Nightly price
* Total price
* Number of nights
* Star rating
* Guest rating
* Review count
* Amenities
* Real hotel photos
* Listing link

Hotel pricing and availability are retrieved for the requested travel dates.

---

### 🔄 Replanning

One of Steora's main goals is **continuous itinerary replanning**.

Instead of generating a new trip from zero, users should eventually be able to make requests such as:

```text
"Make this cheaper"

"Add more food places"

"Remove museums"

"Change Day 2"

"Give me more outdoor activities"

"Reduce travel time"
```

Steora can then recalculate the affected parts of the itinerary while preserving the rest of the trip where possible.

---

## 🧩 Architecture

```text
                         STEORA
                            │
             ┌──────────────┴──────────────┐
             │                             │
        Frontend                       Backend
             │                             │
       Next.js + React              Next.js API Routes
             │                             │
             └──────────────┬──────────────┘
                            │
                    Travel Intelligence
                            │
       ┌────────────┬───────┼────────┬──────────┐
       │            │       │        │          │
   Geocoding     Places   Weather  Routing   Hotels
       │            │       │        │          │
       └────────────┴───────┴────────┴──────────┘
                            │
                     Data Normalization
                            │
                       Place Ranking
                            │
                  Constraint Evaluation
                            │
                     Budget Analysis
                            │
                     Route Planning
                            │
                     Google Gemini
                            │
                    AI Itinerary
                            │
                       Validation
                            │
                       Trip Result
```

---

## 🛠️ Tech Stack

### Frontend

* **Next.js 16**
* **React 19**
* **TypeScript**
* **Tailwind CSS v4**
* App Router

### Backend

* Next.js API Routes
* TypeScript
* Python bridge for Roost hotel search

### AI

* Google Gemini
* `@google/genai`
* Structured JSON generation

### Travel Data

* Geocoding API
* Places API
* Open-Meteo
* Routing API
* Roost / Google Hotels
* SerpApi Google Hotels Photos

### Maps

* Leaflet
* React Leaflet

### Planned Infrastructure

* Supabase
* PostgreSQL
* Supabase Auth
* Vercel
* Razorpay for future payments

---

## 📂 Project Structure

```text
steora/
│
├── app/
│   ├── api/
│   │   ├── hotels/
│   │   ├── travel-plan/
│   │   └── ...
│   │
│   ├── login/
│   ├── signup/
│   ├── plan/
│   ├── my-trips/
│   └── trip/
│
├── components/
│   ├── planner/
│   ├── planning/
│   ├── trip/
│   ├── hotels/
│   └── trips/
│
├── lib/
│   ├── ai/
│   └── travel/
│
├── scripts/
│   └── roost_bridge.py
│
├── public/
│
├── types/
│
├── .env.local
├── package.json
└── README.md
```

---

## 🔐 Data Integrity

A major design principle of Steora is:

> **If reliable data is unavailable, Steora should say so instead of making it up.**

The AI is instructed not to invent:

* Places
* Coordinates
* Prices
* Ratings
* Opening hours
* Travel distances
* Travel times
* Hotel information

This is particularly important for a travel product where inaccurate information can directly affect real-world decisions.

---

## 🚧 Current Development Status

### ✅ Currently Implemented

* [x] Next.js application architecture
* [x] Trip planner
* [x] Destination geocoding
* [x] Real place discovery
* [x] Weather integration
* [x] Real routing/travel-time calculation
* [x] Place ranking
* [x] Constraint evaluation
* [x] Budget analysis
* [x] Google Gemini itinerary generation
* [x] Structured AI output
* [x] Interactive trip experience
* [x] Hotel search
* [x] Real hotel pricing
* [x] Hotel ratings where supplied
* [x] Hotel amenities where supplied
* [x] Real hotel photos
* [x] Hotel listing links

### 🔨 In Progress

* [ ] Hotel selection
* [ ] Hotel as trip base
* [ ] Hotel-to-activity routing
* [ ] Core + optional activities
* [ ] Budget trade-off UI
* [ ] Budget optimization
* [ ] Advanced itinerary replanning
* [ ] Improved interactive map
* [ ] Save trips
* [ ] User accounts
* [ ] Persistent trip history

### 🔮 Planned

* [ ] Supabase database
* [ ] Authentication
* [ ] Flight discovery
* [ ] Trip sharing
* [ ] Collaborative trip planning
* [ ] Expense tracking
* [ ] Packing lists
* [ ] Persistent AI travel assistant
* [ ] Natural-language trip editing
* [ ] Automatic alternatives
* [ ] Trip disruption handling
* [ ] Production caching
* [ ] Rate limiting
* [ ] Monitoring
* [ ] Automated testing
* [ ] Production deployment

---

## 🧪 Example Planning Flow

A traveler might enter:

```text
Destination: Mumbai
Dates: 25 Sep – 28 Sep
Travelers: 2
Budget: ₹7,300

Interests:
Food
Adventure
Shopping
Nightlife
Photography

Travel Style: Balanced
Daily Pace: Moderate
```

Steora processes:

```text
Destination
    ↓
Geocoding
    ↓
Weather
    ↓
Real Places
    ↓
Travel Times
    ↓
Place Ranking
    ↓
Constraints
    ↓
Budget Analysis
    ↓
Gemini
    ↓
Validated Itinerary
```

If the requested budget cannot support the generated plan, Steora should expose the trade-off instead of pretending the trip fits.

---

## 🎯 Product Vision

Steora is being developed toward a system where a traveler can manage an entire trip from one place:

```text
Discover
   ↓
Plan
   ↓
Compare
   ↓
Optimize
   ↓
Book
   ↓
Track
   ↓
Replan
   ↓
Share
```

The long-term goal is to move beyond **AI itinerary generation** toward an **AI-powered travel planning and decision system**.

---

## 👩‍💻 Creator
 
