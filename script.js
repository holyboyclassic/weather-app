const cityInput = document.getElementById('cityInput');
const searchForm = document.getElementById('searchForm');
const locationButton = document.getElementById('locationButton');

const locationName = document.getElementById('locationName');
const currentDate = document.getElementById('currentDate');
const conditionIcon = document.getElementById('conditionIcon');
const conditionText = document.getElementById('conditionText');
const currentTemp = document.getElementById('currentTemp');
const feelsLike = document.getElementById('feelsLike');
const humidityValue = document.getElementById('humidityValue');
const windValue = document.getElementById('windValue');
const sunriseValue = document.getElementById('sunriseValue');
const sunsetValue = document.getElementById('sunsetValue');
const hourlyForecast = document.getElementById('hourlyForecast');
const dailyForecast = document.getElementById('dailyForecast');
const hourlyTemplate = document.getElementById('hourlyTemplate');
const dailyTemplate = document.getElementById('dailyTemplate');

const defaultLocation = { city: 'New York', latitude: 40.7128, longitude: -74.006 };

function formatTemperature(value) {
  return `${Math.round(value)}°`;
}

function getWeatherMeta(code) {
  const weatherMap = {
    0: { label: 'Clear sky', icon: '☀️' },
    1: { label: 'Mostly clear', icon: '🌤️' },
    2: { label: 'Partly cloudy', icon: '⛅' },
    3: { label: 'Overcast', icon: '☁️' },
    45: { label: 'Foggy', icon: '🌫️' },
    48: { label: 'Depositing rime fog', icon: '🌫️' },
    51: { label: 'Light drizzle', icon: '🌦️' },
    53: { label: 'Drizzle', icon: '🌦️' },
    55: { label: 'Heavy drizzle', icon: '🌧️' },
    56: { label: 'Freezing drizzle', icon: '🌧️' },
    57: { label: 'Heavy freezing drizzle', icon: '🌧️' },
    61: { label: 'Light rain', icon: '🌦️' },
    63: { label: 'Rain', icon: '🌧️' },
    65: { label: 'Heavy rain', icon: '🌧️' },
    66: { label: 'Freezing rain', icon: '🌧️' },
    67: { label: 'Heavy freezing rain', icon: '🌧️' },
    71: { label: 'Light snow', icon: '🌨️' },
    73: { label: 'Snow', icon: '❄️' },
    75: { label: 'Heavy snow', icon: '❄️' },
    77: { label: 'Snow grains', icon: '❄️' },
    80: { label: 'Rain showers', icon: '🌦️' },
    81: { label: 'Heavy showers', icon: '🌧️' },
    82: { label: 'Violent showers', icon: '⛈️' },
    85: { label: 'Snow showers', icon: '🌨️' },
    86: { label: 'Heavy snow showers', icon: '🌨️' },
    95: { label: 'Thunderstorm', icon: '⛈️' },
    96: { label: 'Thunderstorm with hail', icon: '⛈️' },
    99: { label: 'Severe hail storm', icon: '⛈️' }
  };

  return weatherMap[code] || { label: 'Conditions', icon: '🌤️' };
}

function getHourlyCards(data) {
  const times = data.hourly.time;
  const temperatures = data.hourly.temperature_2m;
  const precipitation = data.hourly.precipitation_probability ?? [];
  const weatherCodes = data.hourly.weather_code ?? [];

  const nextHours = times
    .map((time, index) => ({
      time,
      temp: temperatures[index],
      precipitation: precipitation[index] ?? 0,
      code: weatherCodes[index] ?? 0
    }))
    .filter((item) => new Date(item.time).getTime() >= Date.now())
    .slice(0, 6);

  return nextHours;
}

function renderHourlyForecast(data) {
  const cards = getHourlyCards(data);
  hourlyForecast.innerHTML = '';

  cards.forEach((entry) => {
    const clone = hourlyTemplate.content.firstElementChild.cloneNode(true);
    const date = new Date(entry.time);
    clone.querySelector('.hour-time').textContent = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric'
    }).format(date);

    const meta = getWeatherMeta(entry.code);
    clone.querySelector('.hour-icon').textContent = meta.icon;
    clone.querySelector('.hour-temp').textContent = formatTemperature(entry.temp);
    clone.querySelector('.hour-precip').textContent = `${entry.precipitation}% rain`;
    hourlyForecast.appendChild(clone);
  });
}

function renderDailyForecast(data) {
  const times = data.daily.time ?? [];
  const maxTemps = data.daily.temperature_2m_max ?? [];
  const minTemps = data.daily.temperature_2m_min ?? [];
  const codes = data.daily.weather_code ?? [];

  dailyForecast.innerHTML = '';

  times.forEach((day, index) => {
    const clone = dailyTemplate.content.firstElementChild.cloneNode(true);
    const date = new Date(day);
    const meta = getWeatherMeta(codes[index] ?? 0);

    clone.querySelector('.day-name').textContent = new Intl.DateTimeFormat('en-US', {
      weekday: 'short'
    }).format(date);
    clone.querySelector('.day-icon').textContent = meta.icon;
    clone.querySelector('.day-max').textContent = formatTemperature(maxTemps[index]);
    clone.querySelector('.day-min').textContent = formatTemperature(minTemps[index]);
    dailyForecast.appendChild(clone);
  });
}

function renderCurrentWeather(data, cityLabel) {
  const current = data.current;
  const daily = data.daily;

  const date = new Date(current.time);

  locationName.textContent = cityLabel;
  currentDate.textContent = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date);

  const currentMeta = getWeatherMeta(current.weather_code);
  conditionIcon.textContent = currentMeta.icon;
  conditionText.textContent = currentMeta.label;
  currentTemp.textContent = formatTemperature(current.temperature_2m);
  feelsLike.textContent = `Feels like ${formatTemperature(current.apparent_temperature)}`;

  humidityValue.textContent = `${current.relative_humidity_2m}%`;
  windValue.textContent = `${Math.round(current.wind_speed_10m)} km/h`;

  const sunrise = new Date(daily.sunrise[0]);
  const sunset = new Date(daily.sunset[0]);

  sunriseValue.textContent = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(sunrise);

  sunsetValue.textContent = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(sunset);
}

async function fetchWeather(latitude, longitude, cityLabel) {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
    timezone: 'auto',
    forecast_days: '5'
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Weather request failed');
    }

    const weatherData = await response.json();
    renderCurrentWeather(weatherData, cityLabel);
    renderHourlyForecast(weatherData);
    renderDailyForecast(weatherData);
  } catch (error) {
    locationName.textContent = 'Unable to load weather';
    conditionText.textContent = 'Try another city';
    currentTemp.textContent = '—';
    console.error(error);
  }
}

async function searchCity(city) {
  const query = city.trim();
  if (!query) return;

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
    );

    if (!response.ok) {
      throw new Error('City lookup failed');
    }

    const data = await response.json();
    const result = data.results?.[0];

    if (!result) {
      throw new Error('City not found');
    }

    cityInput.value = result.name;
    fetchWeather(result.latitude, result.longitude, `${result.name}, ${result.country ?? ''}`.trim());
  } catch (error) {
    locationName.textContent = 'City not found';
    conditionText.textContent = 'Please try another search';
    console.error(error);
  }
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  searchCity(cityInput.value);
});

locationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported in this browser.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      fetchWeather(
        position.coords.latitude,
        position.coords.longitude,
        'Your location'
      );
    },
    () => {
      fetchWeather(defaultLocation.latitude, defaultLocation.longitude, defaultLocation.city);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

fetchWeather(defaultLocation.latitude, defaultLocation.longitude, defaultLocation.city);
