// This file contains the logic for the Prayer Times section of the app.

// =======================================================================
// Global Variables and Constants
// =======================================================================
const PRAYER_API_URL = 'https://api.aladhan.com/v1/timings';
const GEOLOCATION_API_URL = 'https://api.opencagedata.com/geocode/v1/json';
const OPEN_CAGE_API_KEY = 'YOUR_API_KEY_HERE'; // Note: Replace with a valid API key if needed.
const STORAGE_KEY_PRAYER_LOCATION = 'fazazi_prayer_location';

let map;
let marker;
let currentPrayerTimes = {};
let currentCoordinates = {};
let countdownInterval;

// =======================================================================
// DOM Element Selectors
// =======================================================================
const prayerTabEl = document.getElementById('prayerTab');
const cityInputEl = document.getElementById('cityInput');
const searchCityBtn = document.getElementById('searchCityBtn');
const useCurrentLocationBtn = document.getElementById('useCurrentLocationBtn');
const prayerTimesDisplayEl = document.getElementById('prayerTimesDisplay');
const hijriDateEl = document.getElementById('hijriDate');
const currentTimeEl = document.getElementById('currentTime');
const nextPrayerEl = document.getElementById('nextPrayer');
const countdownTextEl = document.getElementById('countdownText');

// =======================================================================
// Event Listeners (Added to the DOMContentLoaded event)
// =======================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Check if the prayer tab and its elements exist before adding listeners.
    if (prayerTabEl) {
        // Search city button listener
        searchCityBtn.addEventListener('click', () => {
            const city = cityInputEl.value.trim();
            if (city) {
                // geocodeCity function will be defined later
                geocodeCity(city).then(coords => {
                    if (coords) {
                        fetchPrayerTimes(coords.latitude, coords.longitude);
                        saveLocation({ city: city, latitude: coords.latitude, longitude: coords.longitude });
                    } else {
                        openModal('خطأ في الموقع', 'لم يتم العثور على المدينة. الرجاء المحاولة مرة أخرى.', `<button class="button btn btn-primary" onclick="closeModal()">حسناً</button>`);
                    }
                });
            } else {
                openModal('خطأ', 'الرجاء إدخال اسم المدينة.', `<button class="button btn btn-primary" onclick="closeModal()">حسناً</button>`);
            }
        });

        // Use current location button listener
        useCurrentLocationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    const coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    reverseGeocode(coords.latitude, coords.longitude).then(city => {
                        if (city) {
                            cityInputEl.value = city;
                            fetchPrayerTimes(coords.latitude, coords.longitude);
                            saveLocation({ city: city, latitude: coords.latitude, longitude: coords.longitude });
                        }
                    });
                }, () => {
                    openModal('خطأ في الموقع', 'تعذر الحصول على موقعك. الرجاء التحقق من الإعدادات.', `<button class="button btn btn-primary" onclick="closeModal()">حسناً</button>`);
                });
            } else {
                openModal('خطأ', 'متصفحك لا يدعم تحديد الموقع الجغرافي.', `<button class="button btn btn-primary" onclick="closeModal()">حسناً</button>`);
            }
        });
    }

    // Load saved location on startup
    loadSavedLocation();
});

// =======================================================================
// Core Functions
// =======================================================================

/**
 * Initializes the map and places a marker.
 * @param {number} lat - Latitude.
 * @param {number} lng - Longitude.
 */
function initMap(lat, lng) {
    if (!map) {
        map = L.map('locationMap').setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        marker = L.marker([lat, lng]).addTo(map);
    } else {
        map.setView([lat, lng], 13);
        marker.setLatLng([lat, lng]);
    }
}

/**
 * Fetches prayer times from the Aladhan API.
 * @param {number} latitude - Latitude.
 * @param {number} longitude - Longitude.
 */
async function fetchPrayerTimes(latitude, longitude) {
    // Add a loading indicator
    prayerTimesDisplayEl.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';

    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const url = `${PRAYER_API_URL}/${date.getTime()/1000}?latitude=${latitude}&longitude=${longitude}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK') {
            currentPrayerTimes = data.data.timings;
            renderPrayerTimes(currentPrayerTimes, data.data.date.hijri);
            startCountdown();
            initMap(latitude, longitude);
        } else {
            openModal('خطأ في البيانات', 'لم يتم العثور على أوقات الصلاة لهذه المدينة.', `<button class="button btn btn-primary" onclick="closeModal()">حسناً</button>`);
        }
    } catch (error) {
        console.error('Error fetching prayer times:', error);
        openModal('خطأ في الشبكة', 'تعذر جلب أوقات الصلاة. الرجاء التحقق من اتصالك بالإنترنت.', `<button class="button btn btn-primary" onclick="closeModal()">حسناً</button>`);
    }
}

/**
 * Geocodes a city name to get its coordinates using OpenCage.
 * @param {string} city - The city name.
 * @returns {Promise<object|null>} - A promise that resolves to coordinates or null.
 */
async function geocodeCity(city) {
    const url = `${GEOLOCATION_API_URL}?key=${OPEN_CAGE_API_KEY}&q=${encodeURIComponent(city)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results.length > 0) {
            const result = data.results[0].geometry;
            return { latitude: result.lat, longitude: result.lng };
        }
    } catch (error) {
        console.error('Error geocoding city:', error);
    }
    return null;
}

/**
 * Reverse geocodes coordinates to get a city name.
 * @param {number} lat - Latitude.
 * @param {number} lng - Longitude.
 * @returns {Promise<string|null>} - A promise that resolves to the city name or null.
 */
async function reverseGeocode(lat, lng) {
    const url = `${GEOLOCATION_API_URL}?key=${OPEN_CAGE_API_KEY}&q=${lat}+${lng}&pretty=1`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results.length > 0) {
            return data.results[0].components.city || data.results[0].components.town || data.results[0].components.village;
        }
    } catch (error) {
        console.error('Error reverse geocoding:', error);
    }
    return null;
}

/**
 * Renders the prayer times on the UI.
 * @param {object} timings - The prayer timings object.
 * @param {object} hijriDate - The Hijri date object.
 */
function renderPrayerTimes(timings, hijriDate) {
    const prayerNames = {
        Fajr: 'الفجر',
        Dhuhr: 'الظهر',
        Asr: 'العصر',
        Maghrib: 'المغرب',
        Isha: 'العشاء'
    };
    
    prayerTimesDisplayEl.innerHTML = ''; // Clear previous data

    for (const [name, time] of Object.entries(timings)) {
        if (prayerNames[name]) {
            const card = document.createElement('div');
            card.className = 'prayer-time-card';
            card.innerHTML = `
                <div class="prayer-name">${prayerNames[name]}</div>
                <div class="prayer-time">${time}</div>
            `;
            prayerTimesDisplayEl.appendChild(card);
        }
    }
    
    const hijriString = `${hijriDate.day.ar} ${hijriDate.month.ar} ${hijriDate.year}`;
    hijriDateEl.textContent = `التاريخ الهجري: ${hijriString}`;
}

/**
 * Starts the countdown to the next prayer.
 */
function startCountdown() {
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        const now = new Date();
        const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        
        // Find the next prayer
        let nextPrayer = null;
        let nextPrayerTime = null;

        for (const name of prayerNames) {
            const timeString = currentPrayerTimes[name];
            const [hours, minutes] = timeString.split(':').map(Number);
            const prayerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
            
            if (prayerTime > now) {
                nextPrayer = name;
                nextPrayerTime = prayerTime;
                break;
            }
        }
        
        // If no prayer is found for today, find the first prayer of tomorrow
        if (!nextPrayer) {
            const fajrTimeTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, ...currentPrayerTimes.Fajr.split(':').map(Number));
            nextPrayer = 'Fajr';
            nextPrayerTime = fajrTimeTomorrow;
        }
        
        // Update display
        const prayerNamesAr = {
            Fajr: 'الفجر',
            Dhuhr: 'الظهر',
            Asr: 'العصر',
            Maghrib: 'المغرب',
            Isha: 'العشاء'
        };
        
        if (nextPrayer && nextPrayerTime) {
            nextPrayerEl.textContent = `الصلاة القادمة: ${prayerNamesAr[nextPrayer]}`;
            
            const timeLeft = nextPrayerTime.getTime() - now.getTime();
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            countdownTextEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Highlight the next prayer card
            document.querySelectorAll('.prayer-time-card').forEach(card => card.classList.remove('active-prayer'));
            const activeCard = Array.from(document.querySelectorAll('.prayer-time-card')).find(card => card.querySelector('.prayer-name').textContent === prayerNamesAr[nextPrayer]);
            if (activeCard) {
                activeCard.classList.add('active-prayer');
            }
        }

        currentTimeEl.textContent = `الوقت الحالي: ${now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }, 1000);
}

/**
 * Saves the user's location to local storage.
 * @param {object} location - The location object.
 */
function saveLocation(location) {
    localStorage.setItem(STORAGE_KEY_PRAYER_LOCATION, JSON.stringify(location));
}

/**
 * Loads the saved location from local storage.
 */
function loadSavedLocation() {
    const savedLocation = localStorage.getItem(STORAGE_KEY_PRAYER_LOCATION);
    if (savedLocation) {
        const location = JSON.parse(savedLocation);
        cityInputEl.value = location.city;
        fetchPrayerTimes(location.latitude, location.longitude);
    }
}
