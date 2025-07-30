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
    // Add more reciters if needed, ensure their base URLs are correct for full surah audio.
};

let allQuranSurahs = []; // To store the full list of surahs from API
let currentReciter = localStorage.getItem('quranReciter') || 'mishary_rashid_alafasy';
let currentSurahNumber = parseInt(localStorage.getItem('quranSurah')) || 1;
// Ayah tracking is complex for full surah audio without external data, so we'll simplify
let audioPlayer;

// Function to fetch all surahs from an API
async function fetchAllSurahs() {
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();
        if (data.code === 200) {
            allQuranSurahs = data.data.map(s => ({
                number: s.number,
                name: s.englishName, // Using English name for easier debugging, you can use arabicName for display
                arabicName: s.name,
                ayahs: s.numberOfAyahs
            }));
            populateSurahSelect();
            // After populating, ensure the selected surah from localStorage is set
            document.getElementById('surahSelect').value = currentSurahNumber;
            updateAudioSource(); // Load the audio for the initial surah
        } else {
            console.error('Failed to fetch surahs from API:', data.status);
            // Fallback to a hardcoded list if API fails
            allQuranSurahs = [
                { number: 1, name: 'Al-Fatiha', arabicName: 'الفاتحة', ayahs: 7 },
                { number: 2, name: 'Al-Baqarah', arabicName: 'البقرة', ayahs: 286 },
                { number: 3, name: 'Al-Imran', arabicName: 'آل عمران', ayahs: 200 },
                // ... you might need to add more fallback surahs if the API is critical
            ];
            populateSurahSelect();
            document.getElementById('surahSelect').value = currentSurahNumber;
            updateAudioSource();
        }
    } catch (error) {
        console.error('Error fetching surahs:', error);
        // Fallback to a hardcoded list if fetch fails
        allQuranSurahs = [
            { number: 1, name: 'Al-Fatiha', arabicName: 'الفاتحة', ayahs: 7 },
            { number: 2, name: 'Al-Baqarah', arabicName: 'البقرة', ayahs: 286 },
            { number: 3, name: 'Al-Imran', arabicName: 'آل عمران', ayahs: 200 },
            // ... add more fallback surahs
        ];
        populateSurahSelect();
        document.getElementById('surahSelect').value = currentSurahNumber;
        updateAudioSource();
    }
}

function populateSurahSelect() {
    const surahSelect = document.getElementById('surahSelect');
    if (surahSelect) {
        surahSelect.innerHTML = ''; // Clear existing options
        allQuranSurahs.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.number;
            option.textContent = `${surah.number}. ${surah.arabicName}`; // Display Arabic name
            surahSelect.appendChild(option);
        });
    }
}

function initQuranPlayer() {
    audioPlayer = document.getElementById('quranPlayer');

    // Set initial select values from localStorage
    document.getElementById('reciterSelect').value = currentReciter;
    // Surah select will be populated by fetchAllSurahs then its value set.

    // Populate reciter select (assuming it's already done in HTML, but good for dynamic options if needed)
    // const reciterSelect = document.getElementById('reciterSelect');
    // if (reciterSelect) {
    //     for (const key in quranReciters) {
    //         const option = document.createElement('option');
    //         option.value = key;
    //         option.textContent = quranReciters[key].name;
    //         reciterSelect.appendChild(option);
    //     }
    // }

    // Set up event listeners
    document.getElementById('reciterSelect').addEventListener('change', function() {
        currentReciter = this.value;
        localStorage.setItem('quranReciter', currentReciter); // Save selection
        updateAudioSource();
    });

    document.getElementById('surahSelect').addEventListener('change', function() {
        currentSurahNumber = parseInt(this.value);
        localStorage.setItem('quranSurah', currentSurahNumber); // Save selection
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

    // Handle end of surah: Play the next surah automatically
    audioPlayer.addEventListener('ended', function() {
        document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-play"></i> تشغيل'; // Reset button
        const nextSurahNum = currentSurahNumber + 1;
        if (nextSurahNum <= 114) { // Quran has 114 surahs
            currentSurahNumber = nextSurahNum;
            localStorage.setItem('quranSurah', currentSurahNumber);
            document.getElementById('surahSelect').value = currentSurahNumber; // Update dropdown
            updateAudioSource();
            audioPlayer.play(); // Auto-play next surah
            document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-pause"></i> إيقاف مؤقت'; // Update button for auto-play
        } else {
            console.log('Finished all surahs.');
            // Optionally reset to Surah 1 or show a completion message
        }
    });

    // updateAyahInfo is primarily for displaying current surah name now
    audioPlayer.addEventListener('timeupdate', function() {
        updateAyahInfo();
    });

    // Initial fetch and setup
    fetchAllSurahs(); // This will populate the surah dropdown and then call updateAudioSource
}

function updateAudioSource() {
    const reciter = quranReciters[currentReciter];
    if (!reciter) {
        console.error('Selected reciter not found:', currentReciter);
        return;
    }

    // ⭐ CORRECTED URL for full surah audio files
    const surahPadded = currentSurahNumber.toString().padStart(3, '0');
    const audioUrl = `${reciter.baseUrl}${surahPadded}.mp3`; // e.g., .../afs/001.mp3

    audioPlayer.src = audioUrl;
    audioPlayer.load(); // Load the new audio source
    // updateAyahInfo will be called by timeupdate event listener

    // Update UI elements for current surah
    const currentSurahObj = allQuranSurahs.find(s => s.number === currentSurahNumber);
    document.getElementById('currentSurah').textContent = `السورة: ${currentSurahObj?.arabicName || '--'}`;
    // Reset ayah info, as real-time ayah tracking needs more data
    document.getElementById('currentAyah').textContent = `الآية: --`;
}


function updateAyahInfo() {
    // For a full surah audio, tracking individual ayahs accurately
    // requires a separate data source (e.g., JSON files with ayah start/end times).
    // Without such data, this function primarily serves to display the current surah.
    // If you need precise ayah tracking, you'd integrate an API like Quran.com's ayah timings.
    // For now, we only update the current surah name.
    const currentSurahObj = allQuranSurahs.find(s => s.number === currentSurahNumber);
    document.getElementById('currentSurah').textContent = `السورة: ${currentSurahObj?.arabicName || '--'}`;

    // You can add simple logic here if you want to advance Ayah *visually* after each surah ends,
    // or if you implement next/previous ayah buttons that jump within the single surah audio.
}

// Initialize when the tab is opened (or document is ready)
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize the Quran player if the quranTab element exists
    // (This prevents errors if the script is loaded on a page without the player)
    if (document.getElementById('quranTab')) {
        initQuranPlayer();
    }
});
