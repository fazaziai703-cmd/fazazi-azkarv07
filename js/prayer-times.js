let currentCity = localStorage.getItem('selectedCity') || 'auto';
let method = localStorage.getItem('method') || '2';
let prayerTimes = {};
let nextPrayer = '';
let countdownInterval;
let prayerTimesInterval;
let locationMapInstance; // New global variable to store the map

function getFormattedDate() {
  const now = new Date();
  // Using toLocaleDateString for better localization and consistency,
  // but keeping original format if strictly needed for API.
  // For aladhan.com API, format is DD-MM-YYYY.
  return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
}

async function fetchPrayerTimes(city, lat = null, lng = null) {
  let apiUrl;

  if (city === 'auto' && lat && lng) {
    apiUrl = `https://api.aladhan.com/v1/timings/${getFormattedDate()}?latitude=${lat}&longitude=${lng}&method=${method}`;
  } else {
    // Ensure 'city' is URL-encoded, especially for cities with spaces or special characters
    apiUrl = `https://api.aladhan.com/v1/timingsByCity/${getFormattedDate()}?city=${encodeURIComponent(city)}&country=SA&method=${method}`;
  }

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.code === 200) {
      prayerTimes = {
        Fajr: data.data.timings.Fajr,
        Sunrise: data.data.timings.Sunrise,
        Dhuhr: data.data.timings.Dhuhr,
        Asr: data.data.timings.Asr,
        Maghrib: data.data.timings.Maghrib,
        Isha: data.data.timings.Isha
      };
      localStorage.setItem('lastPrayerTimes', JSON.stringify(prayerTimes));
      updatePrayerTimesDisplay();
      calculateNextPrayer();
      updateHijriDate(data.data.date.hijri);
    } else {
        // Log API error for debugging
        console.error('Aladhan API Error:', data.status, data.code, data.data);
        // Fallback to cached data even if API returns error code
        const cached = localStorage.getItem('lastPrayerTimes');
        if (cached) {
            prayerTimes = JSON.parse(cached);
            updatePrayerTimesDisplay();
            calculateNextPrayer();
            // Note: Hijri date from cache might be old
        }
    }
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    const cached = localStorage.getItem('lastPrayerTimes');
    if (cached) {
      prayerTimes = JSON.parse(cached);
      updatePrayerTimesDisplay();
      calculateNextPrayer();
    } else {
        // If no cached data and fetch fails, display default
        console.warn('No cached prayer times available.');
        // Set default values if all else fails to prevent split() error
        prayerTimes = { Fajr: '--:--', Sunrise: '--:--', Dhuhr: '--:--', Asr: '--:--', Maghrib: '--:--', Isha: '--:--' };
        updatePrayerTimesDisplay();
        document.getElementById('nextPrayer').textContent = 'تعذر تحميل أوقات الصلاة';
        clearInterval(countdownInterval);
        document.getElementById('countdown').textContent = '';
    }
  }
}

function updateHijriDate(hijri) {
  document.getElementById('currentDate').textContent = `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`;
}

function updatePrayerTimesDisplay() {
  ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'].forEach(name => {
    const el = document.getElementById(`${name.toLowerCase()}Time`);
    if (el) el.textContent = prayerTimes[name] || '--:--';
  });
}

function convertToMinutes(timeStr) {
  // Add a check to ensure timeStr is a string before splitting
  if (typeof timeStr !== 'string' || !timeStr.includes(':')) {
    console.error('Invalid time string for convertToMinutes:', timeStr);
    return 0; // Or throw an error, or handle more robustly
  }
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function calculateNextPrayer() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const prayerOrder = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];
  let next = 'Fajr', minDiff = Infinity;
  let foundNext = false; // Flag to check if a future prayer is found

  for (const name of prayerOrder) {
    // Ensure prayerTimes[name] is a valid string before converting
    if (prayerTimes[name] && prayerTimes[name] !== '--:--') {
      const time = convertToMinutes(prayerTimes[name]);
      if (time > currentMinutes && (time - currentMinutes) < minDiff) {
        next = name;
        minDiff = time - currentMinutes;
        foundNext = true;
      }
    }
  }

  // If no future prayer for today, set next prayer to Fajr of next day
  if (!foundNext) {
      next = 'Fajr';
      // No need to calculate minDiff, just set the display for next day's Fajr
  }


  nextPrayer = next;
  updateNextPrayerDisplay();
  // Ensure we pass a valid time string to startCountdownToNextPrayer
  if (prayerTimes[nextPrayer] && prayerTimes[nextPrayer] !== '--:--') {
      startCountdownToNextPrayer(prayerTimes[nextPrayer]);
  } else {
      clearInterval(countdownInterval);
      document.getElementById('countdown').textContent = '---'; // No countdown if no valid next prayer
  }
}


function updateNextPrayerDisplay() {
  document.querySelectorAll('.prayer-time-card').forEach(card => {
    card.classList.remove('active', 'glow');
  });

  // Only apply active/glow if prayerTimes[nextPrayer] is valid
  if (prayerTimes[nextPrayer] && prayerTimes[nextPrayer] !== '--:--') {
    const el = document.getElementById(`${nextPrayer.toLowerCase()}Time`);
    if (el?.parentElement) {
      el.parentElement.classList.add('active', 'glow');
    }
  }


  const arabicNames = {
    Fajr: 'الفجر', Sunrise: 'الشروq', Dhuhr: 'الظهر',
    Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء'
  };

  const nextEl = document.getElementById('nextPrayer');
  if (nextEl) {
    nextEl.textContent = `الصلاة القادمة: ${arabicNames[nextPrayer] || nextPrayer}`;
  }
}

function startCountdownToNextPrayer(timeStr) {
  clearInterval(countdownInterval);

  if (!timeStr || timeStr === '--:--') {
    document.getElementById('countdown').textContent = '---';
    return;
  }

  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  let target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);

  // If the target time is in the past, calculate for the next day
  if (target.getTime() < now.getTime()) {
      target.setDate(target.getDate() + 1); // Set to next day
  }

  const countdownEl = document.getElementById('countdown');

  function updateCountdown() {
    const diff = target - new Date();
    if (diff <= 0) {
      countdownEl.textContent = 'انتهى الوقت!';
      clearInterval(countdownInterval);
      // Re-calculate next prayer immediately if current one ended
      calculateNextPrayer();
      return;
    }

    const hrs = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    countdownEl.textContent = `العد التنازلي: ${hrs}:${mins}:${secs}`;
  }

  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

function updateCurrentTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('currentTime').textContent = timeStr;
}

function startPrayerTimesUpdater() {
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);
  calculateNextPrayer(); // Initial calculation
  prayerTimesInterval = setInterval(calculateNextPrayer, 60000); // Recalculate every minute
}

// 🌍 Handle Leaflet map clicks and expose map instance
function setupMapClick() {
  if (typeof L !== 'undefined' && document.getElementById('locationMap')) {
    // Only initialize map if it hasn't been initialized yet
    if (!locationMapInstance) {
        locationMapInstance = L.map('locationMap').setView([24.7136, 46.6753], 6); // Default to Riyadh
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(locationMapInstance);

        // Add a marker that user can drag to select location
        const marker = L.marker([24.7136, 46.6753], {draggable: true}).addTo(locationMapInstance);
        marker.on('dragend', function(e) {
            const { lat, lng } = e.target.getLatLng();
            fetchPrayerTimes('auto', lat, lng);
            // Optionally update citySelect to 'auto'
            document.getElementById('citySelect').value = 'auto';
            localStorage.setItem('selectedCity', 'auto');
        });

        locationMapInstance.on('click', (e) => {
          fetchPrayerTimes('auto', e.latlng.lat, e.latlng.lng);
          marker.setLatLng(e.latlng); // Move marker to clicked location
          // Optionally update citySelect to 'auto'
          document.getElementById('citySelect').value = 'auto';
          localStorage.setItem('selectedCity', 'auto');
        });
    }
  }
}

// ⭐ New function to refresh the map view
function refreshMapView() {
    if (locationMapInstance) {
        locationMapInstance.invalidateSize();
        // Optionally center the map if you want it to jump back to a default view
        // locationMapInstance.setView([24.7136, 46.6753], 6);
    }
}


// 📌 Event Listeners
document.getElementById('citySelect').addEventListener('change', function () {
  currentCity = this.value;
  localStorage.setItem('selectedCity', currentCity);
  if (currentCity !== 'auto') { // If a specific city is selected, disable map interactions (optional)
      // You might want to remove map marker or disable map click/drag here
  }
  fetchPrayerTimes(currentCity);
});

document.getElementById('methodSelect').addEventListener('change', function () {
  method = this.value;
  localStorage.setItem('method', method);
  fetchPrayerTimes(currentCity); // Re-fetch with current city and new method
});

document.getElementById('refreshPrayerTimes').addEventListener('click', function () {
  fetchPrayerTimes(currentCity);
});

// 🚀 Init
document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('prayerTab')) {
    fetchPrayerTimes(currentCity);
    startPrayerTimesUpdater();
    setupMapClick();
  }
});
