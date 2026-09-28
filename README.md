# ✈️ Steora — AI Travel Planner

> **Plan smarter. Travel better.**

Steora is an **AI-powered travel planning platform currently in development**.

The project is being built to generate personalized travel itineraries using a combination of **AI, real-world travel data, deterministic planning logic, budget analysis, routing, weather information, and user-defined constraints**.

Unlike a simple itinerary generator, Steora is designed to evaluate whether a generated plan actually fits the traveler's requirements before presenting it as a valid plan.

---

## 🚧 Project Status

**🟡 Active Development**

Steora is being developed incrementally. The core travel-planning architecture and several planning services are already implemented, while the product experience and additional integrations are still being developed.

### Current focus

* Improving itinerary generation
* Making budget handling more intelligent
* Improving constraint evaluation
* Integrating reliable travel APIs
* Improving route and travel-time optimization
* Building the complete trip experience

---

## 🎯 Problem

Travel planning usually requires switching between multiple services for:

* 📍 Places and attractions
* 🌦️ Weather
* 🗺️ Routes and travel times
* 💰 Budget estimation
* 🍜 Activities and interests
* 📅 Daily itinerary planning

The information exists, but travelers still have to manually combine it and determine whether everything fits together.

**Steora is being built to bring these planning steps into one system.**

---

## 💡 What Steora Is Building

A traveler provides:

* 📍 Destination
* 📅 Travel dates
* 👥 Number of travelers
* 💰 Budget
* 💱 Currency
* ❤️ Interests
* 🧳 Travel style
* ⏱️ Daily pace
* 🚗 Maximum travel time
* ⚙️ Additional preferences

Steora then processes these requirements through its travel-planning pipeline and generates a structured itinerary.

---

## 🧠 Core Architecture

Steora uses a **hybrid planning approach**.

AI is not responsible for every decision.

Deterministic application logic handles things such as:

* Budget calculations
* Place filtering
* Travel-time constraints
* Route calculations
* Data normalization
* Constraint evaluation

The AI layer is then used for itinerary generation and organization.

```text
                    USER INPUT
                        │
                        ▼
              ┌──────────────────┐
              │   Trip Planner   │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Travel Plan API  │
              └────────┬─────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Places       Weather       Routing
          │            │            │
          └────────────┼────────────┘
                       ▼
              Data Normalization
                       │
                       ▼
              Place Filtering
                       │
                       ▼
              Travel-Time Analysis
                       │
                       ▼
              Budget Calculation
                       │
                       ▼
             Constraint Evaluation
                       │
                       ▼
                AI Generation
                       │
                       ▼
               Final Trip Plan
```

---

## ⚙️ Engineering Highlights

### Constraint-Aware Planning

Steora evaluates the user's requirements before treating a trip plan as valid.

Constraints include:

* Total budget
* Maximum travel time
* Daily pace
* Travel dates
* Available places
* Selected interests
* Travel preferences

---

### 💰 Budget Validation

The system calculates an estimated trip cost and compares it against the user's selected budget.

For example:

```text
Budget:          ₹7,300
Estimated Cost: ₹29,400

Result:
needs_replanning
```

Instead of presenting the itinerary as valid, the system can identify that the current requirements cannot be satisfied and return a **replanning state**.

This is an important part of the planning architecture because an AI-generated response should not automatically be considered a valid travel plan.

---

### 📍 Real-World Travel Data

The planning pipeline is being built around external travel data such as:

* Destination geocoding
* Places
* Weather
* Travel times
* Route geometry

External data is normalized before being passed through the rest of the planning pipeline.

---

### 🧮 Deterministic + AI Architecture

Not every travel-planning problem requires AI.

Steora separates responsibilities:

```text
Deterministic Logic
├── Budget
├── Filtering
├── Travel time
├── Routes
├── Constraints
└── Validation

AI Layer
└── Itinerary generation and organization
```

This separation makes the system easier to test, modify, and extend.

---

### 🔄 Trip States

Trips use structured planning states such as:

```text
draft
planning
valid
warning
needs_replanning
```

This allows the application to distinguish between an unfinished plan, a valid result, and a plan that violates one or more constraints.

---

## ✨ Current Features

### 🧳 Trip Planner

The planner currently supports collecting:

* Destination
* Travel dates
* Number of travelers
* Budget
* Currency
* Interests
* Travel style
* Daily pace
* Maximum travel time

### 🤖 Itinerary Generation

The planning pipeline can generate structured daily itinerary data using user preferences and travel information.

### 💰 Budget Analysis

Trip costs are estimated and compared against the user's selected budget.

### 📍 Places Integration

The system retrieves and filters places based on destination and user interests.

### 🌦️ Weather Integration

Weather information is incorporated into the travel-planning pipeline.

### 🗺️ Travel-Time Calculation

Travel time between selected locations is considered when building the plan.

### ⚠️ Constraint Evaluation

The system checks whether the generated planning requirements can realistically satisfy the user's constraints.

---

## 🧪 Example Planning Flow

### Input

```text
Destination: Mumbai
Dates: 4 days
Travelers: 2
Budget: ₹7,300
Currency: INR
Interests:
- Food
- Adventure
- Shopping
- Nightlife
- Photography

Travel Style: Balanced
Pace: Moderate
Maximum Travel Time: 30 minutes
```

### Processing

```text
User Input
    ↓
Destination Geocoding
    ↓
Places + Weather Data
    ↓
Eligible Place Filtering
    ↓
Travel-Time Calculation
    ↓
Route Calculation
    ↓
Budget Calculation
    ↓
Constraint Evaluation
    ↓
AI Itinerary Generation
```

### Result

```text
Status: needs_replanning

Estimated Cost: ₹29,400
Selected Budget: ₹7,300

Reason:
The estimated trip cost exceeds the selected budget.
```

This demonstrates the intended behavior of the planning system: **identify constraint violations instead of blindly returning an itinerary.**

---

## 🛠️ Tech Stack

| Technology                 | Purpose                            |
| -------------------------- | ---------------------------------- |
| **Next.js**                | Full-stack React framework         |
| **React**                  | Frontend UI                        |
| **TypeScript**             | Type-safe development              |
| **Tailwind CSS**           | Styling and responsive UI          |
| **Next.js API Routes**     | Backend planning API               |
| **AI APIs**                | Itinerary generation               |
| **Places / Location APIs** | Destination and place data         |
| **Routing APIs**           | Routes and travel-time information |
| **Weather APIs**           | Weather information                |
| **Git & GitHub**           | Version control                    |
| **Vercel**                 | Deployment                         |

---

## 🏗️ Project Structure

```text
stayora/
│
├── app/
│   ├── api/
│   │   └── travel-plan/
│   ├── login/
│   ├── signup/
│   ├── plan/
│   ├── my-trips/
│   └── trip/
│
├── components/
│   ├── planner/
│   │   ├── BudgetInput.tsx
│   │   ├── DateRangeInput.tsx
│   │   ├── DestinationInput.tsx
│   │   ├── InterestSelector.tsx
│   │   └── TravelStyleSelector.tsx
│   │
│   └── planning/
│       └── PlanningExperience.tsx
│
├── lib/
│   └── travel/
│       ├── budget/
│       ├── places/
│       ├── routing/
│       ├── weather/
│       └── ...
│
├── types/
│   └── trip.ts
│
├── public/
│
├── package.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

> The local project directory is currently named `stayora`, while the product is branded **Steora**.

---

## 🔄 Product Flow

```text
Landing Page
     ↓
Login / Signup
     ↓
Trip Planner
     ↓
Travel Preferences
     ↓
Planning
     ↓
Travel Data Processing
     ↓
Constraint Evaluation
     ↓
AI Itinerary Generation
     ↓
Trip Details
     ↓
Saved Trips
```

Some parts of this flow are still under active development.

---

## 🧠 Technical Decisions

### Why TypeScript?

Trip inputs, currencies, interests, travel preferences, itinerary data, and planning states use structured types to make the system easier to maintain as it grows.

### Why separate AI from business logic?

Budget calculations, travel-time constraints, filtering, and validation are deterministic problems.

Keeping them outside the AI layer makes the system more predictable and testable.

### Why normalize external data?

Different APIs can return different structures.

A normalized internal representation allows the rest of the planning system to work with consistent data.

### Why validate generated plans?

An AI-generated itinerary can be syntactically valid while still being unrealistic.

Steora therefore evaluates the plan against user-defined constraints before considering it valid.

---

## 📸 Project Preview

Screenshots will be added as the major product flows are finalized.

Planned previews:

* Landing page
* Trip planner
* Planning state
* Generated itinerary
* Trip details
* Saved trips

---

## 🔄 Development Roadmap

### ✅ Completed / Working

* [x] Next.js project setup
* [x] TypeScript configuration
* [x] Trip planner UI
* [x] Destination input
* [x] Date selection
* [x] Traveler selection
* [x] Budget and currency input
* [x] Interest selection
* [x] Travel style selection
* [x] Daily pace selection
* [x] Maximum travel-time constraint
* [x] Travel planning API structure
* [x] Budget calculation logic
* [x] Places data integration
* [x] Weather data integration
* [x] Travel-time calculations
* [x] Route calculation structure
* [x] Constraint evaluation
* [x] Initial itinerary generation

### 🚧 In Progress

* [ ] Improve itinerary quality
* [ ] Improve budget-aware recommendations
* [ ] Smarter replanning
* [ ] Improve places integration
* [ ] Improve route optimization
* [ ] Complete trip detail experience
* [ ] Saved trips
* [ ] Authentication flow
* [ ] Robust error handling
* [ ] Improve API reliability

### 🔮 Planned

* [ ] Interactive maps
* [ ] Hotel recommendations
* [ ] Restaurant recommendations
* [ ] Flight information
* [ ] Collaborative trip planning
* [ ] Conversational AI travel assistant
* [ ] Multi-destination trips
* [ ] Mobile / PWA experience

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ShreyaSankpal/Stayora.git
```

### 2. Navigate to the project

```bash
cd stayora
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env.local` file and add the required API credentials.

```env
# Add required API keys here
```

> Never commit API keys, secrets, or `.env.local` to GitHub.

### 5. Start the development server

```bash
npm run dev
```

Open the local development URL provided by Next.js.

---

## 📌 Why I'm Building Steora

Steora is an exploration of how **AI, real-world APIs, structured data, deterministic business logic, and user constraints** can work together to solve a practical problem.

The project is being developed incrementally, with each part of the planning pipeline being implemented, tested, and refined as the system evolves.

---

## 👩‍💻 Author

**Shreya Sankpal**

Computer Engineering Student



---

## 📄 Disclaimer

Steora is currently a development project. Travel information, prices, routes, weather, and generated recommendations may be incomplete or inaccurate during development and should be independently verified before making real-world travel decisions.
