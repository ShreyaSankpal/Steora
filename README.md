# ✈️ Steora — AI-Powered Travel Planning & Replanning

> **Plan smarter. Travel better. Replan when things change.**

**Steora** is an AI-powered travel planning platform that combines **real travel data, user preferences, budget analysis, weather, routing, hotel discovery, and AI itinerary generation** to create personalized travel plans.

Unlike a basic AI itinerary generator, Steora is being developed as a **travel decision and replanning system** — where users can understand constraints, compare trade-offs, modify their plans, and eventually replan affected parts of a trip without starting from scratch.

> 🚧 **Status: Actively in development**

**🌐 Live Demo:** https://steora.vercel.app/
**💻 Source Code:** https://github.com/ShreyaSankpal/Steora

---

# 🌍 The Problem

Planning a trip usually requires switching between multiple platforms to:

* Find places to visit
* Discover restaurants and activities
* Check weather
* Calculate travel times
* Find hotels
* Estimate expenses
* Build an itinerary
* Rebuild the plan when something changes

AI itinerary generators can simplify planning, but purely AI-generated plans can contain unrealistic or inaccurate information.

For a real travel product, an itinerary needs to consider **actual places, routes, weather, costs, and user constraints**.

Steora is being built around that problem.

---

# 💡 What Makes Steora Different?

Steora is not designed as:

```text
User Prompt
    ↓
AI
    ↓
Random Itinerary
```

Instead, the architecture follows:

```text
User Preferences
       ↓
Real Travel Data
       ↓
Data Normalization
       ↓
Place Ranking
       ↓
Constraint Evaluation
       ↓
Budget Analysis
       ↓
AI Itinerary Generation
       ↓
Validation
       ↓
Personalized Trip
       ↓
Replanning
```

The goal is to make AI an **intelligent planning layer over real travel data**, rather than the source of truth for real-world information.

---

# 🧠 Core Engineering Concept

Steora separates the system into multiple stages:

### Data Retrieval

Collect real travel information.

### Data Normalization

Convert different API responses into consistent internal structures.

### Travel Intelligence

Rank places, calculate routes, evaluate constraints, and estimate costs.

### AI Orchestration

Use Gemini to organize the available information into a personalized itinerary.

### Validation

Check the generated plan against application-level constraints.

This separation makes the system more reliable and easier to extend.

---

# ✨ Core Features

## 🧠 AI Trip Planning

Steora uses **Google Gemini** to generate personalized itineraries based on:

* Destination
* Travel dates
* Number of travelers
* Budget
* Currency
* Interests
* Travel style
* Daily pace
* Maximum preferred travel time
* Additional preferences

The AI receives structured travel information and candidate options rather than being expected to invent the entire trip.

---

## 📍 Real Place Discovery

Steora integrates real place data for discovering relevant:

* Attractions
* Restaurants
* Cafes
* Markets
* Parks
* Museums
* Cultural locations
* Adventure activities
* Photography locations

Candidate places can be ranked according to the user's interests and trip requirements.

---

## 💰 Budget-Aware Planning

Budget is treated as a **planning constraint and decision tool**, rather than simply displaying a number after an itinerary is generated.

Steora's budget analysis considers factors such as:

* Accommodation
* Food
* Transportation
* Activities
* Number of travelers
* Number of nights
* Travel style

If an itinerary exceeds the requested budget, the system can identify the feasibility issue instead of pretending that the plan fits.

### Planned direction

The budget system is being extended toward:

```text
User Budget
     ↓
Core Activities
     ↓
Optional Activities
     ↓
Cost Impact
     ↓
Trade-offs
     ↓
Optimize / Swap / Remove / Add
```

This will allow users to understand:

> **What can I realistically get for my budget?**

---

## 🗺️ Route & Travel-Time Intelligence

Steora uses routing data to calculate:

* Travel distance
* Travel duration
* Activity-to-activity movement
* Day routes
* Route geometry

This allows the itinerary to consider the **actual movement between locations** instead of simply producing a list of attractions.

---

## 🌦️ Weather-Aware Planning

Weather information is incorporated into the planning pipeline.

This creates the foundation for decisions such as:

* Outdoor vs indoor activities
* Rain-aware alternatives
* Weather-based activity ordering
* Plan B activities

Weather is treated as a planning input rather than simply a separate information card.

---

## 🏨 Hotel Discovery

Steora currently integrates hotel discovery through the **Roost + Google Hotels data pipeline**.

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
* Hotel photos
* Listing links

Hotel pricing and availability are retrieved for the requested travel dates where supported by the data source.

### Planned hotel intelligence

```text
Hotel Selection
      ↓
Trip Base
      ↓
Hotel → Activity Travel Times
      ↓
Daily Route Planning
      ↓
Total Trip Cost
```

The goal is to make the selected hotel part of the actual itinerary and routing logic.

---

# 🔄 Dynamic Replanning

One of Steora's main product goals is **continuous itinerary replanning**.

Users should eventually be able to make requests such as:

```text
"Make this cheaper"

"Add more food places"

"Remove museums"

"Change Day 2"

"Give me more outdoor activities"

"Reduce travel time"

"Make the trip more relaxed"
```

Instead of generating an entirely unrelated trip, Steora is being designed to reconsider the affected parts while preserving valid parts of the existing itinerary where possible.

---

# 🔐 Data Integrity

A core design principle of Steora is:

> **If reliable data is unavailable, Steora should say so instead of making it up.**

The system is designed so that AI is not treated as the source of truth for:

* Places
* Coordinates
* Prices
* Ratings
* Opening hours
* Travel distances
* Travel times
* Hotel information

The intended architecture is:

```text
External Data
     ↓
Validation
     ↓
Normalization
     ↓
Planning Logic
     ↓
AI
     ↓
Output Validation
     ↓
User
```

This is especially important for travel applications because inaccurate information can directly affect real-world decisions.

---

# 🏗️ Architecture

```text
                           STEORA
                              │
                 ┌────────────┴────────────┐
                 │                         │
             Frontend                  Backend
                 │                         │
          Next.js + React           Next.js API Routes
                 │                         │
                 └────────────┬────────────┘
                              │
                     Travel Intelligence
                              │
      ┌────────────┬──────────┼──────────┬────────────┐
      │            │          │          │            │
  Geocoding      Places    Weather    Routing      Hotels
      │            │          │          │            │
      └────────────┴──────────┴──────────┴────────────┘
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
                     Google Gemini AI
                              │
                   Structured Itinerary
                              │
                         Validation
                              │
                        Trip Result
                              │
                         Replanning
```

---

# 🔁 Travel Planning Pipeline

## 1. User Requirements

The traveler provides:

* Destination
* Dates
* Travelers
* Budget
* Currency
* Interests
* Travel style
* Daily pace
* Maximum travel time
* Additional preferences

## 2. Real Travel Data

The backend retrieves relevant information from external travel services.

```text
Destination
     ↓
Geocoding
     ↓
Places
     ↓
Weather
     ↓
Routing
     ↓
Hotels
```

## 3. Data Normalization

External APIs return different response structures.

Steora normalizes this information into internal application types before the planning logic uses it.

This provides a consistent structure for:

* Places
* Coordinates
* Prices
* Weather
* Routes
* Hotels

## 4. Place Ranking

Candidate places are evaluated against the user's requirements.

Factors can include:

* Interest match
* Travel style
* Distance
* Travel time
* Budget
* Available information
* Trip constraints

## 5. Constraint Evaluation

The system evaluates constraints such as:

* Budget
* Travel time
* Daily pace
* Number of travelers
* Dates
* Destination
* Weather considerations

Plans can therefore have different states:

```text
VALID
WARNING
NEEDS_REPLANNING
```

## 6. AI Itinerary Generation

Google Gemini acts as the AI orchestration layer.

The model receives structured travel information and candidate options and organizes them into a structured itinerary.

## 7. Validation

The generated itinerary is checked against application-level travel and constraint logic.

This keeps the final decision layer separate from the language model.

---

# 🧩 Engineering Modules

Steora is structured around reusable travel-planning modules.

```text
lib/
│
├── ai/
│   └── itinerary generation
│
└── travel/
    ├── budget
    ├── constraints
    ├── filtering
    ├── ranking
    ├── routing
    ├── weather
    ├── places
    ├── hotels
    ├── geocoding
    └── normalization
```

This modular approach allows individual parts of the travel pipeline to evolve independently.

---

# 🧠 Engineering Challenges

## AI Hallucination

### Problem

LLMs can generate plausible-sounding travel information that does not actually exist.

### Approach

Steora retrieves real travel data first and uses AI primarily to organize and personalize that information.

```text
Real APIs
   ↓
Normalized Data
   ↓
Planning Logic
   ↓
Gemini
   ↓
Validation
```

---

## Budget Feasibility

### Problem

A user can request a budget that is lower than the estimated cost of a generated itinerary.

### Approach

Steora independently calculates estimated trip costs and compares them with the user's budget.

For example:

```text
Requested Budget
      ₹7,300
         ↓
Estimated Cost
      ₹24,200
         ↓
Budget Difference
      ₹16,900
         ↓
Needs Replanning
```

The system exposes the conflict instead of silently claiming that the itinerary fits.

---

## Travel-Time Feasibility

### Problem

An itinerary can contain individually good attractions while requiring unrealistic movement between them.

### Approach

Steora calculates travel time and distance between locations.

```text
Activity A
    ↓
Travel Time
    ↓
Activity B
    ↓
Travel Time
    ↓
Activity C
```

This allows route feasibility to become part of itinerary planning.

---

## API Data Normalization

### Problem

Different travel APIs return different schemas, naming conventions, units, and optional fields.

### Approach

Steora uses a normalization layer to convert external responses into application-specific structures.

```text
API A ─┐
API B ─┤
API C ─┼──→ Normalization ──→ Internal Types
API D ─┤
API E ─┘
```

This reduces coupling between external services and the core planning logic.

---

## Structured AI Output

### Problem

Free-form AI text is difficult for an application to reliably consume.

### Approach

Steora uses structured AI output so the application can work with predictable itinerary data.

```text
User Request
     ↓
Gemini
     ↓
Structured JSON
     ↓
Validation
     ↓
Frontend
```

---

# 🧪 Testing & Development

Steora is being tested incrementally as each major capability is implemented.

Testing currently includes validation of:

* Travel API responses
* Place discovery
* Weather retrieval
* Budget calculations
* Constraint evaluation
* Travel-time calculations
* Route generation
* Gemini structured output
* Hotel search
* Planner flows
* Trip result rendering
* Constraint edge cases

The project is still under active development, so automated testing and broader production test coverage are planned for later stages.

---

# 🛠️ Tech Stack

## Frontend

* **Next.js 16**
* **React 19**
* **TypeScript**
* **Tailwind CSS v4**
* **Next.js App Router**

## Backend

* **Next.js API Routes**
* **TypeScript**
* **Python bridge** for hotel search

## AI

* **Google Gemini**
* **`@google/genai`**
* Structured JSON generation

## Travel Data

* Geocoding API
* Places API
* Open-Meteo
* Routing API
* Roost / Google Hotels
* SerpApi Google Hotels Photos

## Maps

* Leaflet
* React Leaflet

## Infrastructure

* Vercel

### Planned

* Supabase
* PostgreSQL
* Supabase Auth
* Razorpay for future payment functionality

---

# 📂 Project Structure

```text
Steora/
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

# 🧪 Example Planning Flow

### User Input

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
Maximum Travel Time: 30 minutes
```

### Steora Processing

```text
Mumbai
  ↓
Geocoding
  ↓
Weather
  ↓
Real Places
  ↓
Place Ranking
  ↓
Travel Times
  ↓
Constraint Evaluation
  ↓
Budget Analysis
  ↓
Gemini
  ↓
Structured Itinerary
  ↓
Validation
```

If the estimated itinerary exceeds the requested budget, Steora identifies the feasibility issue instead of representing the plan as fully budget-compliant.

---

# 📊 Planning States

Steora uses planning states to represent itinerary feasibility.

```text
DRAFT
  ↓
PLANNING
  ↓
VALID
```

Plans can also enter warning or replanning states:

```text
             ┌──→ VALID
             │
PLANNING ────┼──→ WARNING
             │
             └──→ NEEDS_REPLANNING
```

This allows Steora to distinguish between:

> **"An itinerary was generated."**

and:

> **"An itinerary was generated and evaluated against the user's constraints."**

---

# 🚧 Development Status

## ✅ Implemented

* [x] Next.js application architecture
* [x] React + TypeScript frontend
* [x] Trip planner
* [x] Destination geocoding
* [x] Real place discovery
* [x] Weather integration
* [x] Travel-time calculation
* [x] Route geometry
* [x] Place ranking
* [x] Constraint evaluation
* [x] Budget analysis
* [x] Google Gemini itinerary generation
* [x] Structured AI output
* [x] Interactive trip experience
* [x] Interactive map foundation
* [x] Hotel search integration
* [x] Hotel pricing where supplied
* [x] Hotel ratings where supplied
* [x] Hotel amenities where supplied
* [x] Hotel photos
* [x] Hotel listing links
* [x] Vercel deployment
* [x] Incremental API and planning-pipeline testing

---

## 🔨 In Progress

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

---

## 🔮 Planned

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
* [ ] Production hardening

---

# 🌐 Live Demo

## Try Steora

**https://steora.vercel.app/**

The application is currently deployed on **Vercel** and is actively being developed.

The live deployment represents the current working state of the project. New planning, hotel, budget, and replanning capabilities are being added incrementally.

## Source Code

**https://github.com/ShreyaSankpal/Steora**

---

# 🎯 Product Vision

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

The long-term goal is to move beyond:

> **"Generate me an itinerary."**

toward:

> **"Help me continuously make better travel decisions."**

---

# 👩‍💻 Creator

## Shreya Sankpal

**Computer Engineering Student | India**

Building Steora as a full-stack AI travel technology project focused on:

* Real-world data integration
* AI-assisted planning
* Constraint evaluation
* Budget transparency
* Route intelligence
* Hotel discovery
* Dynamic replanning
* Production-oriented architecture

---

# 📌 Project Status

**Steora is actively under development.**

The project is being built incrementally from a working travel-planning foundation toward a complete AI-powered travel decision and replanning platform.

Current development focuses on:

```text
Real Travel Data
       ↓
Decision Logic
       ↓
Budget Intelligence
       ↓
Hotel Integration
       ↓
AI Orchestration
       ↓
Validation
       ↓
Replanning
       ↓
Persistent Trips
```

The goal is to build a system that does not merely **generate travel plans**, but helps users understand **what is realistically possible, why a plan works, and what changes when their constraints change**.
