export interface DailyWeather {
  date: string;
  weatherCode: number;
  highC: number;
  lowC: number;
  precipitationChance: number;
}

export interface WeatherResult {
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  daily: DailyWeather[];
}

import { fetchWithTimeout } from "@/lib/http/fetchWithTimeout";

const WEATHER_TIMEOUT_MS = 15_000;

export async function getWeather(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<WeatherResult> {
  const url = new URL(
    "https://api.open-meteo.com/v1/forecast"
  );

  url.searchParams.set(
    "latitude",
    latitude.toString()
  );

  url.searchParams.set(
    "longitude",
    longitude.toString()
  );

  url.searchParams.set(
    "current",
    "temperature_2m,wind_speed_10m,weather_code"
  );

  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
  );

  url.searchParams.set(
    "start_date",
    startDate
  );

  url.searchParams.set(
    "end_date",
    endDate
  );

  url.searchParams.set(
    "timezone",
    "auto"
  );

  const response = await fetchWithTimeout(url, undefined, {
    timeoutMs: WEATHER_TIMEOUT_MS,
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Weather API failed: ${response.status} ${response.statusText} ${errorText}`
    );
  }

  const data = await response.json();

  if (!data.current || !data.daily) {
    throw new Error(
      "Weather API returned an incomplete response."
    );
  }

  return {
    temperature: data.current.temperature_2m,
    windSpeed: data.current.wind_speed_10m,
    weatherCode: data.current.weather_code,

    daily: (data.daily.time ?? []).map(
      (date: string, index: number) => ({
        date,
        weatherCode: data.daily.weather_code[index],
        highC: data.daily.temperature_2m_max[index],
        lowC: data.daily.temperature_2m_min[index],
        precipitationChance:
          data.daily.precipitation_probability_max[index],
      })
    ),
  };
}