import { GoogleGenAI, Type } from "@google/genai"; 
 
import type { 
  AIItineraryInput, 
  AIItineraryOutput, 
  Activity, 
  Itinerary, 
  Weather, 
} from "@/types/trip"; 
 
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY, 
}); 
 
const activitySchema = { 
  type: Type.OBJECT, 
 
  properties: { 
    id: { 
      type: Type.STRING, 
    }, 
 
    name: { 
      type: Type.STRING, 
    }, 
 
    category: { 
      type: Type.STRING, 
      enum: [ 
        "activity", 
        "food", 
        "culture", 
        "nature", 
        "transport", 
        "rest", 
        "other", 
      ], 
    }, 
 
    locationName: { 
      type: Type.STRING, 
    }, 
 
    startTime: { 
      type: Type.STRING, 
    }, 
 
    durationMinutes: { 
      type: Type.NUMBER, 
    }, 
 
    reasons: { 
      type: Type.ARRAY, 
 
      items: { 
        type: Type.OBJECT, 
 
        properties: { 
          code: { 
            type: Type.STRING, 
            enum: [ 
              "matches_interests", 
              "fits_available_time", 
              "close_to_previous", 
              "suitable_for_weather", 
              "matches_travel_style", 
              "beyond_preferred_travel_time", 
            ], 
          }, 
 
          label: { 
            type: Type.STRING, 
          }, 
 
          detail: { 
            type: Type.STRING, 
          }, 
        }, 
 
        required: [ 
          "code", 
          "label", 
          "detail", 
        ], 
      }, 
    }, 
  }, 
 
  required: [ 
    "id", 
    "name", 
    "category", 
    "locationName", 
    "startTime", 
    "durationMinutes", 
    "reasons", 
  ], 
}; 
 
const itinerarySchema = { 
  type: Type.OBJECT, 
 
  properties: { 
    itinerary: { 
      type: Type.OBJECT, 
 
      properties: { 
        days: { 
          type: Type.ARRAY, 
 
          items: { 
            type: Type.OBJECT, 
 
            properties: { 
              dayNumber: { 
                type: Type.INTEGER, 
              }, 
 
              date: { 
                type: Type.STRING, 
              }, 
 
              segments: { 
                type: Type.OBJECT, 
 
                properties: { 
                  morning: { 
                    type: Type.ARRAY, 
                    items: activitySchema, 
                  }, 
 
                  afternoon: { 
                    type: Type.ARRAY, 
                    items: activitySchema, 
                  }, 
 
                  evening: { 
                    type: Type.ARRAY, 
                    items: activitySchema, 
                  }, 
                }, 
 
                required: [ 
                  "morning", 
                  "afternoon", 
                  "evening", 
                ], 
              }, 
            }, 
 
            required: [ 
              "dayNumber", 
              "date", 
              "segments", 
            ], 
          }, 
        }, 
      }, 
 
      required: ["days"], 
    }, 
  }, 
 
  required: ["itinerary"], 
}; 
 
export async function generateItinerary( 
  input: AIItineraryInput 
): Promise<AIItineraryOutput> { 
  if (!process.env.GEMINI_API_KEY) { 
    throw new Error( 
      "GEMINI_API_KEY is missing" 
    ); 
  } 
 
  const prompt = buildItineraryPrompt(input); 
 
  const response = 
    await generateWithRetry(prompt); 
 
  if (!response.text) { 
    throw new Error( 
      "Gemini returned an empty response" 
    ); 
  } 
 
  try { 
    const parsed = 
      JSON.parse( 
        response.text 
      ) as AIItineraryOutput; 
 
    const enrichedItinerary = 
      enrichItineraryWithRealData( 
        parsed.itinerary, 
        input 
      ); 
 
    return { 
      itinerary: enrichedItinerary, 
    }; 
  } catch { 
    throw new Error( 
      "Gemini returned invalid itinerary JSON" 
    ); 
  } 
} 
 

async function generateWithRetry(prompt: string) {
  const models = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
  ];

  const maxAttemptsPerModel = 2;

  let lastError: unknown;

  for (const model of models) {
    for (
      let attempt = 1;
      attempt <= maxAttemptsPerModel;
      attempt++
    ) {
      try {
        console.log(
          `Gemini request using ${model} - attempt ${attempt}/${maxAttemptsPerModel}...`
        );

        return await ai.models.generateContent({
          model,

          contents: prompt,

          config: {
            responseMimeType: "application/json",
            responseSchema: itinerarySchema,
          },
        });
      } catch (error) {
        lastError = error;

        console.error(
          `Gemini request failed using ${model} on attempt ${attempt}/${maxAttemptsPerModel}.`,
          error
        );

        if (attempt === maxAttemptsPerModel) {
          console.log(
            `${model} failed. Trying next model if available...`
          );
          break;
        }

        const delay =
          attempt === 1
            ? 3000
            : 6000;

        console.log(
          `Waiting ${delay / 1000}s before retrying...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, delay)
        );
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        "Gemini itinerary generation failed after all model retries."
      );
}
 
function buildItineraryPrompt( 
  input: AIItineraryInput 
): string { 
  const { 
    request, 
    weather, 
    eligiblePlaces, 
  } = input; 
 
  return ` 
You are the itinerary planning engine for Steora, an AI travel planning application. 
 
Your job is to create a realistic day-by-day travel itinerary using ONLY the real travel data supplied below. 
 
TRIP REQUIREMENTS 
 
Destination: 
${request.destination.name ?? request.destination.query} 
 
Start date: 
${request.startDate} 
 
End date: 
${request.endDate} 
 
Travelers: 
${request.travelers} 
 
Budget: 
${request.currency} ${request.budget} 
 
Interests: 
${request.interests.join(", ")} 
 
Travel style: 
${request.travelStyle} 
 
Daily pace: 
${request.dailyPace} 
 
Maximum preferred travel time: 
${request.maxTravelTimeMinutes} minutes 
 
Additional preferences: 
${request.additionalPreferences || "None"} 
 
WEATHER DATA 
 
${JSON.stringify(weather, null, 2)} 
 
RANKED REAL PLACES 
 
${JSON.stringify(eligiblePlaces, null, 2)} 
 
IMPORTANT DATA INTEGRITY RULES 
 
1. Use ONLY places present in the supplied ranked real places. 
 
2. Never invent a place, attraction, restaurant, cafe, landmark, activity, coordinate, distance, travel time, rating, opening hour, ticket price, or booking price. 
 
3. Activity names MUST exactly match the supplied place names. 
 
4. Do not create new place names. 
 
5. Do not create prices. 
 
6. Do not estimate or guess activity costs. 
 
7. Do not put a cost value anywhere in the itinerary. 
 
8. Price information will be handled separately by Steora's verified pricing system. 
 
9. If a place has no verified price, it must remain unpriced. 
 
10. Maximum travel time is a PREFERENCE, not an automatic exclusion rule. 
 
11. A place that exceeds the preferred travel time may still be selected if it is highly relevant to the user's interests. 
 
12. If a selected place exceeds the preferred travel time, include a reason explaining that it is beyond the preferred travel time. 
 
13. Use the supplied relevance scores and matched interests when deciding which places are useful. 
 
14. Consider distance and travel time when ordering activities. 
 
15. Avoid unnecessary backtracking. 
 
16. Consider the supplied weather data when choosing suitable activities. 
 
17. Respect the user's daily pace. 
 
18. Avoid scheduling too many activities in one day. 
 
19. Create one itinerary day for every date from the start date through the end date. 
 
20. Every selected activity must have a unique id. 
 
21. Every selected activity must contain at least one recommendation reason. 
 
22. Use only these recommendation reason codes: 
    - matches_interests 
    - fits_available_time 
    - close_to_previous 
    - suitable_for_weather 
    - matches_travel_style 
    - beyond_preferred_travel_time 
 
23. Use only these activity categories: 
    - activity 
    - food 
    - culture 
    - nature 
    - transport 
    - rest 
    - other 
 
24. Do not claim that anything has been booked. 
 
25. Do not return any budget breakdown. 
 
26. Do not return any price estimates. 
 
27. Return ONLY the JSON structure requested by the response schema. 
 
Create a practical itinerary rather than listing every available place. 
`; 
} 
 
function enrichItineraryWithRealData( 
  itinerary: Itinerary, 
  input: AIItineraryInput 
): Itinerary { 
  const weatherByDate = new Map( 
    input.weather.daily.map((day) => [ 
      day.date, 
      day, 
    ]) 
  ); 
 
  const days = itinerary.days.map( 
    (day) => { 
      const forecast = 
        weatherByDate.get(day.date); 
 
      const weather = forecast 
        ? createWeatherFromForecast( 
            forecast 
          ) 
        : undefined; 
 
      const allActivities = [ 
        ...day.segments.morning, 
        ...day.segments.afternoon, 
        ...day.segments.evening, 
      ]; 
 
      const enrichedActivities = 
        enrichActivitiesWithRouting( 
          allActivities, 
          input 
        ); 
 
      let activityIndex = 0; 
 
      return { 
        ...day, 
 
        weather, 
 
        segments: { 
          morning: 
            enrichedActivities.slice( 
              activityIndex, 
              (activityIndex += 
                day.segments.morning.length) 
            ), 
 
          afternoon: 
            enrichedActivities.slice( 
              activityIndex, 
              (activityIndex += 
                day.segments.afternoon.length) 
            ), 
 
          evening: 
            enrichedActivities.slice( 
              activityIndex, 
              (activityIndex += 
                day.segments.evening.length) 
            ), 
        }, 
      }; 
    } 
  ); 
 
  return { 
    ...itinerary, 
    days, 
  }; 
} 
 
function enrichActivitiesWithRouting( 
  activities: Activity[], 
  input: AIItineraryInput 
): Activity[] { 
  let previousPlaceIndex: 
    | number 
    | null = null; 
 
  return activities.map( 
    (activity) => { 
      const matchingPlace = 
        findMatchingPlace( 
          activity.name, 
          input.eligiblePlaces 
        ); 
 
      if (!matchingPlace) { 
        return { 
          ...activity, 
          cost: undefined, 
          costStatus: "unavailable", 
        }; 
      } 
 
      const currentPlaceIndex = 
        input.eligiblePlaces.findIndex( 
          (place) => 
            normalizeName(place.name) === 
            normalizeName( 
              matchingPlace.name 
            ) 
        ); 
 
      if (currentPlaceIndex === -1) { 
        return { 
          ...activity, 
          cost: undefined, 
          costStatus: "unavailable", 
        }; 
      } 
 
      let distanceFromPreviousKm = 
        matchingPlace.distanceFromDestinationKm; 
 
      let travelTimeFromPreviousMinutes = 
        matchingPlace.travelTimeFromDestinationMinutes; 
 
      if ( 
        previousPlaceIndex !== null && 
        input.routing?.betweenPlaces[ 
          previousPlaceIndex 
        ]?.[currentPlaceIndex] 
      ) { 
        const route = 
          input.routing.betweenPlaces[ 
            previousPlaceIndex 
          ][currentPlaceIndex]; 
 
        distanceFromPreviousKm = 
          route.distanceKm; 
 
        travelTimeFromPreviousMinutes = 
          route.travelTimeMinutes; 
      } 
 
      previousPlaceIndex = 
        currentPlaceIndex; 
 
      return { 
        ...activity, 
 
        coordinates: 
          matchingPlace.coordinates, 
 
        distanceFromPreviousKm, 
 
        travelTimeFromPreviousMinutes, 
 
        cost: undefined, 
 
        costStatus: "unavailable", 
      }; 
    } 
  ); 
} 
 
function findMatchingPlace( 
  activityName: string, 
  places: AIItineraryInput["eligiblePlaces"] 
) { 
  const normalizedActivity = 
    normalizeName(activityName); 
 
  return places.find( 
    (place) => 
      normalizeName(place.name) === 
      normalizedActivity 
  ); 
} 
 
function normalizeName( 
  name: string 
): string { 
  return name 
    .trim() 
    .toLowerCase() 
    .replace(/\s+/g, " "); 
} 
 
function createWeatherFromForecast( 
  forecast: AIItineraryInput["weather"]["daily"][number] 
): Weather { 
  return { 
    date: forecast.date, 
 
    condition: 
      weatherCodeToCondition( 
        forecast.weatherCode 
      ), 
 
    summary: 
      weatherCodeToSummary( 
        forecast.weatherCode, 
        forecast.precipitationChance 
      ), 
 
    highC: forecast.highC, 
 
    lowC: forecast.lowC, 
 
    precipitationChance: 
      forecast.precipitationChance, 
  }; 
} 
 
function weatherCodeToCondition( 
  code: number 
): string { 
  if (code === 0) { 
    return "Clear sky"; 
  } 
 
  if (code === 1 || code === 2) { 
    return "Partly cloudy"; 
  } 
 
  if (code === 3) { 
    return "Overcast"; 
  } 
 
  if ( 
    code === 45 || 
    code === 48 
  ) { 
    return "Fog"; 
  } 
 
  if ( 
    code >= 51 && 
    code <= 57 
  ) { 
    return "Drizzle"; 
  } 
 
  if ( 
    code >= 61 && 
    code <= 67 
  ) { 
    return "Rain"; 
  } 
 
  if ( 
    code >= 71 && 
    code <= 77 
  ) { 
    return "Snow"; 
  } 
 
  if ( 
    code >= 80 && 
    code <= 82 
  ) { 
    return "Rain showers"; 
  } 
 
  if ( 
    code >= 85 && 
    code <= 86 
  ) { 
    return "Snow showers"; 
  } 
 
  if ( 
    code >= 95 && 
    code <= 99 
  ) { 
    return "Thunderstorm"; 
  } 
 
  return "Unknown"; 
} 
 
function weatherCodeToSummary( 
  code: number, 
  precipitationChance: number 
): string { 
  const condition = 
    weatherCodeToCondition(code); 
 
  return `${condition}. ${precipitationChance}% chance of precipitation.`; 
} 