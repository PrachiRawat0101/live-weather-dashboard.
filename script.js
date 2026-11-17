
const form = document.getElementById("form");
const cityInput = document.getElementById("city");
const searchBtn = document.getElementById("searchBtn");
const statusText = document.getElementById("status");
const weatherContent = document.getElementById("weatherContent");

// Weather code information
const weatherCodes = {
    0: { label: "Clear Sky", icon: "☀️" },
    1: { label: "Mainly Clear", icon: "🌤️" },
    2: { label: "Partly Cloudy", icon: "⛅" },
    3: { label: "Overcast", icon: "☁️" },
    45: { label: "Fog", icon: "🌫️" },
    48: { label: "Depositing Rime Fog", icon: "🌫️" },
    51: { label: "Light Drizzle", icon: "🌦️" },
    53: { label: "Moderate Drizzle", icon: "🌦️" },
    55: { label: "Dense Drizzle", icon: "🌧️" },
    61: { label: "Slight Rain", icon: "🌧️" },
    63: { label: "Moderate Rain", icon: "🌧️" },
    65: { label: "Heavy Rain", icon: "🌧️" },
    71: { label: "Slight Snow", icon: "🌨️" },
    73: { label: "Moderate Snow", icon: "🌨️" },
    75: { label: "Heavy Snow", icon: "❄️" },
    80: { label: "Rain Showers", icon: "🌦️" },
    81: { label: "Moderate Showers", icon: "🌧️" },
    82: { label: "Violent Showers", icon: "⛈️" },
    95: { label: "Thunderstorm", icon: "⛈️" },
    96: { label: "Thunderstorm with Hail", icon: "⛈️" },
    99: { label: "Heavy Thunderstorm", icon: "⛈️" }
};

// Get weather description
function getWeatherInfo(code) {
    return weatherCodes[code] || {
        label: "Unknown Weather",
        icon: "🌡️"
    };
}

// Find city using Geocoding API
async function findCity(name) {

    const url =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("The search service is not responding.");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("City not found. Please try another city.");
    }

    const city = data.results[0];

    return {
        name: city.name,
        country: city.country || "",
        latitude: city.latitude,
        longitude: city.longitude
    };
}

// Get live weather using Forecast API
async function getWeather(lat, lon) {

    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Could not load the weather forecast.");
    }

    return await response.json();
}

// Display current weather
function displayCurrentWeather(city, weather) {

    const current = weather.current;
    const info = getWeatherInfo(current.weather_code);

    document.getElementById("location").textContent =
        `${city.name}, ${city.country}`;

    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    document.getElementById("temperature").textContent =
        `${Math.round(current.temperature_2m)}°C`;

    document.getElementById("weatherDescription").textContent =
        info.label;

    document.getElementById("weatherIcon").textContent =
        info.icon;

    document.getElementById("feelsLike").textContent =
        `${Math.round(current.apparent_temperature)}°C`;

    document.getElementById("humidity").textContent =
        `${current.relative_humidity_2m}%`;

    document.getElementById("wind").textContent =
        `${current.wind_speed_10m} km/h`;
}

// Display five-day forecast
function displayForecast(weather) {

    const forecastContainer = document.getElementById("forecast");

    // Clear previous forecast
    forecastContainer.replaceChildren();

    const daily = weather.daily;

    for (let i = 0; i < 5; i++) {

        const date = new Date(daily.time[i] + "T12:00:00");

        const info = getWeatherInfo(daily.weather_code[i]);

        const card = document.createElement("div");
        card.className = "forecast-card";

        const day = document.createElement("h3");
        day.textContent = date.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric"
        });

        const icon = document.createElement("div");
        icon.className = "forecast-icon";
        icon.textContent = info.icon;

        const description = document.createElement("p");
        description.textContent = info.label;

        const temperature = document.createElement("strong");
        temperature.textContent =
            `${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°C`;

        card.append(day, icon, description, temperature);

        forecastContainer.appendChild(card);
    }
}

// Handle search form
form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const cityName = cityInput.value.trim();

    // Empty input validation
    if (!cityName) {
        statusText.textContent = "Please enter a city name.";
        weatherContent.classList.add("hidden");
        return;
    }

    // Show loading
    statusText.textContent = "Loading weather data...";

    searchBtn.disabled = true;
    searchBtn.textContent = "Loading...";

    try {

        // Find city
        const city = await findCity(cityName);

        // Fetch weather
        const weather = await getWeather(
            city.latitude,
            city.longitude
        );

        // Display weather
        displayCurrentWeather(city, weather);
        displayForecast(weather);

        // Show weather content
        weatherContent.classList.remove("hidden");

        statusText.textContent =
            `Weather successfully loaded for ${city.name}!`;

        // Save last searched city
        localStorage.setItem("lastCity", city.name);

    } catch (error) {

        weatherContent.classList.add("hidden");

        if (error instanceof TypeError) {
            statusText.textContent =
                "Network problem. Please check your internet connection.";
        } else {
            statusText.textContent = error.message;
        }

    } finally {

        // Enable search button
        searchBtn.disabled = false;
        searchBtn.textContent = "Search";
    }
});

// Load last searched city when page opens
window.addEventListener("DOMContentLoaded", function () {

    const lastCity = localStorage.getItem("lastCity");

    if (lastCity) {
        cityInput.value = lastCity;
        form.requestSubmit();
    }
});
