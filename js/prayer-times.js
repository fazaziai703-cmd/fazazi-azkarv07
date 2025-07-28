// Prayer Times Calculator
let currentCity = 'auto';
let prayerTimes = {};
let nextPrayer = '';
let prayerTimesInterval;

function fetchPrayerTimes(city) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    // For demo purposes, we'll use mock data
    // In a real app, you would use an API like Aladhan or similar
    const mockPrayerTimes = {
        'Riyadh': {
            Fajr: '04:30',
            Sunrise: '05:45',
            Dhuhr: '12:15',
            Asr: '15:30',
            Maghrib: '18:45',
            Isha: '20:15'
        },
        'Jeddah': {
            Fajr: '04:45',
            Sunrise: '06:00',
            Dhuhr: '12:30',
            Asr: '15:45',
            Maghrib: '18:55',
            Isha: '20:25'
        },
        'Mecca': {
            Fajr: '04:40',
            Sunrise: '06:00',
            Dhuhr: '12:30',
            Asr: '15:45',
            Maghrib: '18:50',
            Isha: '20:20'
        },
        'Medina': {
            Fajr: '04:35',
            Sunrise: '05:50',
            Dhuhr: '12:20',
            Asr: '15:35',
            Maghrib: '18:45',
            Isha: '20:15'
        },
        'Dammam': {
            Fajr: '04:25',
            Sunrise: '05:40',
            Dhuhr: '12:05',
            Asr: '15:20',
            Maghrib: '18:35',
            Isha: '20:05'
        },
        'Cairo': {
            Fajr: '04:15',
            Sunrise: '05:30',
            Dhuhr: '11:55',
            Asr: '15:10',
            Maghrib: '18:20',
            Isha: '19:45'
        },
        'Dubai': {
            Fajr: '04:50',
            Sunrise: '06:05',
            Dhuhr: '12:20',
            Asr: '15:35',
            Maghrib: '18:50',
            Isha: '20:15'
        },
        'Amman': {
            Fajr: '04:20',
            Sunrise: '05:35',
            Dhuhr: '12:00',
            Asr: '15:15',
            Maghrib: '18:25',
            Isha: '19:50'
        }
    };

    if (city === 'auto') {
        // Default to Riyadh for auto location (in a real app, you'd use geolocation)
        city = 'Riyadh';
    }

    prayerTimes = mockPrayerTimes[city] || mockPrayerTimes['Riyadh'];
    updatePrayerTimesDisplay();
    calculateNextPrayer();
    updateHijriDate();
}

function updatePrayerTimesDisplay() {
    if (!prayerTimes) return;
    
    document.getElementById('fajrTime').textContent = prayerTimes.Fajr || '--:--';
    document.getElementById('sunriseTime').textContent = prayerTimes.Sunrise || '--:--';
    document.getElementById('dhuhrTime').textContent = prayerTimes.Dhuhr || '--:--';
    document.getElementById('asrTime').textContent = prayerTimes.Asr || '--:--';
    document.getElementById('maghribTime').textContent = prayerTimes.Maghrib || '--:--';
    document.getElementById('ishaTime').textContent = prayerTimes.Isha || '--:--';
}

function calculateNextPrayer() {
    if (!prayerTimes) return;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayerTimesInMinutes = {
        Fajr: convertTimeToMinutes(prayerTimes.Fajr),
        Sunrise: convertTimeToMinutes(prayerTimes.Sunrise),
        Dhuhr: convertTimeToMinutes(prayerTimes.Dhuhr),
        Asr: convertTimeToMinutes(prayerTimes.Asr),
        Maghrib: convertTimeToMinutes(prayerTimes.Maghrib),
        Isha: convertTimeToMinutes(prayerTimes.Isha)
    };
    
    let nextPrayerName = '';
    let nextPrayerTime = '';
    let minDiff = Infinity;
    
    for (const [prayer, time] of Object.entries(prayerTimesInMinutes)) {
        if (time > currentTime && (time - currentTime) < minDiff) {
            minDiff = time - currentTime;
            nextPrayerName = prayer;
            nextPrayerTime = prayerTimes[prayer];
        }
    }
    
    // If no prayer found (it's past Isha), next prayer is tomorrow's Fajr
    if (!nextPrayerName) {
        nextPrayerName = 'Fajr';
        nextPrayerTime = prayerTimes.Fajr;
    }
    
    nextPrayer = nextPrayerName;
    updateNextPrayerDisplay();
}

function convertTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function updateNextPrayerDisplay() {
    if (!nextPrayer) return;
    
    // Reset all active states
    document.querySelectorAll('.prayer-time-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Set active state for current prayer
    const activePrayerCard = document.getElementById(`${nextPrayer.toLowerCase()}Time`).parentElement;
    if (activePrayerCard) {
        activePrayerCard.classList.add('active');
    }
    
    // Update next prayer text
    const nextPrayerElement = document.getElementById('nextPrayer');
    if (nextPrayerElement) {
        const prayerNames = {
            'Fajr': 'الفجر',
            'Sunrise': 'الشروق',
            'Dhuhr': 'الظهر',
            'Asr': 'العصر',
            'Maghrib': 'المغرب',
            'Isha': 'العشاء'
        };
        nextPrayerElement.textContent = `الصلاة القادمة: ${prayerNames[nextPrayer] || nextPrayer}`;
    }
}

function updateHijriDate() {
    // For demo purposes, we'll use a simple calculation
    // In a real app, you would use a proper Hijri date library
    const now = new Date();
    const gregorianYear = now.getFullYear();
    const hijriYear = gregorianYear - 622;
    const hijriMonth = now.getMonth() - 1; // Approximate
    const hijriDay = now.getDate() - 1; // Approximate
    
    const hijriMonths = [
        'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 
        'جمادى الأولى', 'جمادى الآخرة', 'رجب', 
        'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];
    
    const hijriDateStr = `${hijriDay} ${hijriMonths[hijriMonth]} ${hijriYear} هـ`;
    document.getElementById('currentDate').textContent = hijriDateStr;
}

function updateCurrentTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('currentTime').textContent = timeStr;
}

function startPrayerTimesUpdater() {
    // Update time every second
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Update next prayer every minute
    calculateNextPrayer();
    prayerTimesInterval = setInterval(calculateNextPrayer, 60000);
}

// Initialize prayer times when the tab is opened
document.getElementById('citySelect').addEventListener('change', function() {
    currentCity = this.value;
    fetchPrayerTimes(currentCity);
});

document.getElementById('refreshPrayerTimes').addEventListener('click', function() {
    fetchPrayerTimes(currentCity);
});

// Initial load
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('prayerTab')) {
        fetchPrayerTimes(currentCity);
        startPrayerTimesUpdater();
    }
});