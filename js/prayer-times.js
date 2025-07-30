let currentCity = localStorage.getItem('selectedCity') || 'auto';
let method = localStorage.getItem('method') || '2';
let prayerTimes = {};
let nextPrayer = '';
let countdownInterval;
let prayerTimesInterval;

function getFormattedDate() {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
}

async function fetchPrayerTimes(city, lat = null, lng = null) {
  let apiUrl;

  if (city === 'auto' && lat && lng) {
    apiUrl = `https://api.aladhan.com/v1/timings/${getFormattedDate()}?latitude=${lat}&longitude=${lng}&method=${method}`;
  } else {
    apiUrl = `https://api.aladhan.com/v1/timingsByCity/${getFormattedDate()}?city=${city}&country=SA&method=${method}`;
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
    }
  } catch {
    const cached = localStorage.getItem('lastPrayerTimes');
    if (cached) {
      prayerTimes = JSON.parse(cached);
      updatePrayerTimesDisplay();
      calculateNextPrayer();
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
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function calculateNextPrayer() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const prayerOrder = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];
  let next = 'Fajr', minDiff = Infinity;

  for (const name of prayerOrder) {
    const time = convertToMinutes(prayerTimes[name]);
    if (time > currentMinutes && time - currentMinutes < minDiff) {
      next = name;
      minDiff = time - currentMinutes;
    }
  }

  nextPrayer = next;
  updateNextPrayerDisplay();
  startCountdownToNextPrayer(prayerTimes[next]);
}

function updateNextPrayerDisplay() {
  document.querySelectorAll('.prayer-time-card').forEach(card => {
    card.classList.remove('active', 'glow');
  });

  const el = document.getElementById(`${nextPrayer.toLowerCase()}Time`);
  if (el?.parentElement) {
    el.parentElement.classList.add('active', 'glow');
  }

  const arabicNames = {
    Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر',
    Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء'
  };

  const nextEl = document.getElementById('nextPrayer');
  if (nextEl) {
    nextEl.textContent = `الصلاة القادمة: ${arabicNames[nextPrayer] || nextPrayer}`;
  }
}

function startCountdownToNextPrayer(timeStr) {
  clearInterval(countdownInterval);

  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  const countdownEl = document.getElementById('countdown');

  function updateCountdown() {
    const diff = target - new Date();
    if (diff <= 0) {
      countdownEl.textContent = '';
      return clearInterval(countdownInterval);
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
  calculateNextPrayer();
  prayerTimesInterval = setInterval(calculateNextPrayer, 60000);
}

// 🌍 Handle Leaflet map clicks
function setupMapClick() {
  if (typeof L !== 'undefined' && document.getElementById('locationMap')) {
    const map = L.map('locationMap').setView([24.7136, 46.6753], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);

    map.on('click', (e) => {
      fetchPrayerTimes('auto', e.latlng.lat, e.latlng.lng);
    });
  }
}

// 📌 Event Listeners
document.getElementById('citySelect').addEventListener('change', function () {
  currentCity = this.value;
  localStorage.setItem('selectedCity', currentCity);
  fetchPrayerTimes(currentCity);
});

document.getElementById('methodSelect').addEventListener('change', function () {
  method = this.value;
  localStorage.setItem('method', method);
  fetchPrayerTimes(currentCity);
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
