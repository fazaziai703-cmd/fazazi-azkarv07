// Global variables for Quran recitation
let quranRecitersMap = {}; // Map to store reciter data
let currentReciterId = '';
let currentReciterServer = '';
let currentSurahNumber = 1; // Default to Surah Al-Fatiha
let currentAyahNumber = 1; // Default to Ayah 1
let audioPlayer;
let surahList = []; // To store fetched surah data

// Function to fetch reciters from Al Quran Cloud API
async function fetchReciters() {
    console.log('Fetching reciters from Al Quran Cloud...');
    try {
        const response = await fetch('https://api.alquran.cloud/v1/edition?format=audio&language=ar');
        const data = await response.json();
        console.log('Al Quran Cloud API response data (editions):', data);

        if (data.code === 200 && data.status === 'OK') {
            // Filter for audio reciters and populate the map
            quranRecitersMap = data.data.filter(edition => edition.format === 'audio' && edition.language === 'ar')
                .reduce((map, edition) => {
                    map[edition.identifier] = edition;
                    return map;
                }, {});
            console.log('Filtered Reciters (Audio):', Object.values(quranRecitersMap));
            console.log('quranRecitersMap after population:', quranRecitersMap);
            populateReciterSelect();
        } else {
            console.error('Failed to fetch reciters:', data);
        }
    } catch (error) {
        console.error('Error fetching reciters:', error);
    }
}

// Function to populate the reciter select dropdown
function populateReciterSelect() {
    const reciterSelect = document.getElementById('reciterSelect');
    if (!reciterSelect) {
        console.error("Reciter select element not found.");
        return;
    }
    reciterSelect.innerHTML = ''; // Clear existing options

    // Add a default option or first fetched reciter
    let defaultReciterOption = document.createElement('option');
    defaultReciterOption.value = '';
    defaultReciterOption.textContent = 'اختر القارئ...';
    reciterSelect.appendChild(defaultReciterOption);

    // Sort reciters alphabetically by English name for easier navigation
    const sortedReciters = Object.values(quranRecitersMap).sort((a, b) => {
        const nameA = a.englishName.toLowerCase();
        const nameB = b.englishName.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });

    sortedReciters.forEach(reciter => {
        const option = document.createElement('option');
        option.value = reciter.identifier;
        option.textContent = reciter.englishName + ' (' + reciter.name + ')';
        reciterSelect.appendChild(option);
    });

    // Load saved reciter or set a default
    const savedReciter = localStorage.getItem('quranReciterId');
    if (savedReciter && quranRecitersMap[savedReciter]) {
        reciterSelect.value = savedReciter;
        console.log('Reciter from localStorage found:', savedReciter);
    } else {
        // Fallback to a common reciter if saved one is not found or no saved reciter
        reciterSelect.value = 'ar.abdulbasitmurattal'; // Example default
        localStorage.setItem('quranReciterId', reciterSelect.value);
    }
    currentReciterId = reciterSelect.value;
    currentReciterServer = quranRecitersMap[currentReciterId]?.server || '';
    console.log('Current Reciter ID:', currentReciterId);
    console.log('Current Reciter Server URL (CDN base):', currentReciterServer);
    fetchSurahs(); // Fetch surahs once reciter is set
}

// Function to fetch surahs (Quran chapters)
async function fetchSurahs() {
    console.log('Fetching surahs...');
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();
        if (data.code === 200 && data.status === 'OK') {
            surahList = data.data;
            populateSurahSelect();
        } else {
            console.error('Failed to fetch surahs:', data);
        }
    } catch (error) {
        console.error('Error fetching surahs:', error);
    }
}

// Function to populate the surah select dropdown
function populateSurahSelect() {
    const surahSelect = document.getElementById('surahSelect');
    if (!surahSelect) {
        console.error("Surah select element not found.");
        return;
    }
    surahSelect.innerHTML = ''; // Clear existing options

    surahList.forEach(surah => {
        const option = document.createElement('option');
        option.value = surah.number;
        option.textContent = `${surah.number}. ${surah.name} (${surah.englishName})`;
        surahSelect.appendChild(option);
    });

    // Load saved surah or set default
    const savedSurah = localStorage.getItem('quranSurahNumber');
    if (savedSurah && surahList.some(s => s.number == savedSurah)) {
        surahSelect.value = savedSurah;
    } else {
        surahSelect.value = 1; // Default to Al-Fatiha
        localStorage.setItem('quranSurahNumber', 1);
    }
    currentSurahNumber = parseInt(surahSelect.value);
    updateSurahAyahInfo();
}

// Function to initialize the Quran player
function initQuranPlayer() {
    audioPlayer = document.getElementById('quranPlayer');
    if (!audioPlayer) {
        console.error("Audio player element not found.");
        return;
    }

    // Add event listener for when audio fails to load
    audioPlayer.onerror = function() {
        console.error('Error loading audio:', audioPlayer.error);
        openModal('خطأ في التشغيل', 'تعذر تحميل ملف الصوت. قد يكون الملف غير موجود أو هناك مشكلة في الاتصال بالشبكة.', `<button class="button btn btn-primary" onclick="closeModal()">حسناً</button>`);
    };

    // Event listeners for player controls
    const playPauseBtn = document.getElementById('playPauseBtn');
    const stopBtn = document.getElementById('stopBtn');

    if (playPauseBtn) {
        playPauseBtn.onclick = togglePlayPause;
    }
    if (stopBtn) {
        stopBtn.onclick = stopPlayback;
    }

    // Event listeners for select changes
    const reciterSelect = document.getElementById('reciterSelect');
    const surahSelect = document.getElementById('surahSelect');

    if (reciterSelect) {
        reciterSelect.onchange = () => {
            currentReciterId = reciterSelect.value;
            currentReciterServer = quranRecitersMap[currentReciterId]?.server || '';
            localStorage.setItem('quranReciterId', currentReciterId);
            loadAudio();
        };
    }
    if (surahSelect) {
        surahSelect.onchange = () => {
            currentSurahNumber = parseInt(surahSelect.value);
            localStorage.setItem('quranSurahNumber', currentSurahNumber);
            updateSurahAyahInfo();
            loadAudio();
        };
    }

    // Load initial audio
    loadAudio();
}

// Function to load audio based on current selections
function loadAudio() {
    if (!currentReciterServer || !currentSurahNumber) {
        console.warn('Reciter server or surah number not set. Cannot load audio.');
        return;
    }
    // Format surah number to 3 digits (e.g., 001, 010, 114)
    const formattedSurahNumber = String(currentSurahNumber).padStart(3, '0');
    const audioUrl = `${currentReciterServer}${formattedSurahNumber}.mp3`;
    console.log('Attempting to load audio from:', audioUrl);
    audioPlayer.src = audioUrl;
    audioPlayer.load(); // Load the audio
    updatePlayPauseButton(false); // Set button to Play state
}

// Function to toggle play/pause
function togglePlayPause() {
    if (audioPlayer.paused) {
        audioPlayer.play();
        updatePlayPauseButton(true);
    } else {
        audioPlayer.pause();
        updatePlayPauseButton(false);
    }
}

// Function to stop playback
function stopPlayback() {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    updatePlayPauseButton(false);
}

// Function to update play/pause button icon
function updatePlayPauseButton(isPlaying) {
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) {
        if (isPlaying) {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i> إيقاف مؤقت';
        } else {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i> تشغيل';
        }
    }
}

// Function to update current surah and ayah info
function updateSurahAyahInfo() {
    const currentSurahEl = document.getElementById('currentSurah');
    const currentAyahEl = document.getElementById('currentAyah');
    const surah = surahList.find(s => s.number === currentSurahNumber);

    if (currentSurahEl) currentSurahEl.textContent = `السورة: ${surah ? surah.name : '--'}`;
    // Ayah info is not directly available from this API for individual ayah tracking
    // For simplicity, we'll just show "الآية: --" or a placeholder
    if (currentAyahEl) currentAyahEl.textContent = `الآية: --`;
}

// Initial calls when the DOM is ready for quran-recitation.js specific elements
document.addEventListener('DOMContentLoaded', () => {
    fetchReciters(); // Fetch reciters first
    fetchSurahs();   // Fetch surahs
    initQuranPlayer(); // Initialize player and set up listeners
});
