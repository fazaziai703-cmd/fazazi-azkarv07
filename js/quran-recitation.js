// Quran Recitation Player
const quranReciters = {
    'mishary_rashid_alafasy': {
        name: 'مشاري راشد العفاسي',
        baseUrl: 'https://server.mp3quran.net/afs/'
    },
    'saad_al_ghamdi': {
        name: 'سعد الغامدي',
        baseUrl: 'https://server.mp3quran.net/s_gmd/'
    },
    'abdul_basit_abdus_samad': {
        name: 'عبد الباسط عبد الصمد',
        baseUrl: 'https://server.mp3quran.net/basit/'
    },
    'maher_al_muaiqly': {
        name: 'ماهر المعيقلي',
        baseUrl: 'https://server.mp3quran.net/maher/'
    }
};

const quranSurahs = [
    { number: 1, name: 'الفاتحة', ayahs: 7 },
    { number: 2, name: 'البقرة', ayahs: 286 },
    { number: 3, name: 'آل عمران', ayahs: 200 },
    // Add more surahs as needed
];

let currentReciter = 'mishary_rashid_alafasy';
let currentSurah = 1;
let currentAyah = 1;
let audioPlayer;

function initQuranPlayer() {
    audioPlayer = document.getElementById('quranPlayer');
    
    // Populate surah select
    const surahSelect = document.getElementById('surahSelect');
    if (surahSelect) {
        surahSelect.innerHTML = '';
        quranSurahs.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.number;
            option.textContent = `${surah.number}. ${surah.name}`;
            surahSelect.appendChild(option);
        });
    }
    
    // Set up event listeners
    document.getElementById('reciterSelect').addEventListener('change', function() {
        currentReciter = this.value;
        updateAudioSource();
    });
    
    document.getElementById('surahSelect').addEventListener('change', function() {
        currentSurah = parseInt(this.value);
        currentAyah = 1;
        updateAudioSource();
    });
    
    document.getElementById('playPauseBtn').addEventListener('click', function() {
        if (audioPlayer.paused) {
            audioPlayer.play();
            this.innerHTML = '<i class="fas fa-pause"></i> إيقاف مؤقت';
        } else {
            audioPlayer.pause();
            this.innerHTML = '<i class="fas fa-play"></i> تشغيل';
        }
    });
    
    document.getElementById('stopBtn').addEventListener('click', function() {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-play"></i> تشغيل';
    });
    
    audioPlayer.addEventListener('ended', function() {
        document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-play"></i> تشغيل';
    });
    
    audioPlayer.addEventListener('timeupdate', function() {
        updateAyahInfo();
    });
}

function updateAudioSource() {
    const reciter = quranReciters[currentReciter];
    if (!reciter) return;
    
    const surah = currentSurah.toString().padStart(3, '0');
    const ayah = currentAyah.toString().padStart(3, '0');
    const audioUrl = `${reciter.baseUrl}${surah}${ayah}.mp3`;
    
    audioPlayer.src = audioUrl;
    updateAyahInfo();
    
    // Update UI
    document.getElementById('currentSurah').textContent = `السورة: ${quranSurahs.find(s => s.number === currentSurah)?.name || '--'}`;
    document.getElementById('currentAyah').textContent = `الآية: ${currentAyah}`;
}

function updateAyahInfo() {
    // In a real implementation, you would track the current ayah based on playback time
    // For demo, we'll just show the starting ayah
    document.getElementById('currentAyah').textContent = `الآية: ${currentAyah}`;
}

// Initialize when the tab is opened
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('quranTab')) {
        initQuranPlayer();
    }
});