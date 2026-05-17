/**
 * SkyCast - Professional Weather Logic
 */

const API_KEY = ''; // Get from openweathermap.org
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const geoBtn = document.getElementById('geo-btn');
const unitSwitch = document.getElementById('unit-switch');
const weatherContent = document.getElementById('weather-content');
const loadingState = document.getElementById('loading-state');
const errorMsg = document.getElementById('error-msg');

let currentUnit = 'metric'; // metric = Celsius, imperial = Fahrenheit

// --- Init ---
window.addEventListener('DOMContentLoaded', () => {
    const lastCity = localStorage.getItem('lastCity') || 'New York';
    getWeatherData(lastCity);
});

// --- Fetch Data ---
async function getWeatherData(city) {
    showLoading(true);
    errorMsg.style.display = 'none';

    try {
        const geoRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${currentUnit}&appid=${API_KEY}`);
        const data = await geoRes.json();

        if (data.cod === "404") throw new Error('City not found');

        updateCurrentWeather(data);
        getForecastData(data.coord.lat, data.coord.lon);
        localStorage.setItem('lastCity', city);
    } catch (err) {
        errorMsg.style.display = 'block';
        showLoading(false);
    }
}

async function getForecastData(lat, lon) {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`);
    const data = await res.json();
    updateForecast(data);
    showLoading(false);
}

// --- UI Updates ---
function updateCurrentWeather(data) {
    document.getElementById('city-name').innerText = data.name;
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });
    document.getElementById('main-temp').innerText = Math.round(data.main.temp);
    document.getElementById('weather-desc').innerText = data.weather[0].description;
    document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    
    document.getElementById('feels-like').innerText = `${Math.round(data.main.feels_like)}°${currentUnit === 'metric' ? 'C' : 'F'}`;
    document.getElementById('humidity').innerText = `${data.main.humidity}%`;
    document.getElementById('wind-speed').innerText = `${data.wind.speed} ${currentUnit === 'metric' ? 'km/h' : 'mph'}`;
    document.getElementById('visibility').innerText = `${(data.visibility / 1000).toFixed(1)} km`;

    updateBackground(data.weather[0].main.toLowerCase());
}

function updateForecast(data) {
    const container = document.getElementById('forecast-container');
    container.innerHTML = '';

    // API gives 3-hour chunks, we want 1 per day (at 12:00)
    const dailyData = data.list.filter(reading => reading.dt_txt.includes("12:00:00"));

    dailyData.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const item = document.createElement('div');
        item.className = 'forecast-item';
        item.innerHTML = `
            <div class="day">${dayName}</div>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="icon">
            <div class="temp">${Math.round(day.main.temp)}°</div>
        `;
        container.appendChild(item);
    });
}

function updateBackground(condition) {
    document.body.className = '';
    if (condition.includes('cloud')) document.body.classList.add('weather-clouds');
    else if (condition.includes('rain') || condition.includes('drizzle')) document.body.classList.add('weather-rain');
    else if (condition.includes('snow')) document.body.classList.add('weather-snow');
    else document.body.classList.add('weather-clear');
}

function showLoading(isLoading) {
    loadingState.style.display = isLoading ? 'block' : 'none';
    weatherContent.style.opacity = isLoading ? '0' : '1';
}

// --- Event Listeners ---
searchBtn.addEventListener('click', () => {
    if (cityInput.value) getWeatherData(cityInput.value);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && cityInput.value) getWeatherData(cityInput.value);
});

unitSwitch.addEventListener('click', () => {
    currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
    document.querySelector('.unit-toggle').classList.toggle('f-active');
    document.getElementById('unit-c').classList.toggle('active');
    document.getElementById('unit-f').classList.toggle('active');
    getWeatherData(localStorage.getItem('lastCity'));
});

geoBtn.addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        fetchByCoords(latitude, longitude);
    });
});

async function fetchByCoords(lat, lon) {
    showLoading(true);
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`);
    const data = await res.json();
    updateCurrentWeather(data);
    getForecastData(lat, lon);
}