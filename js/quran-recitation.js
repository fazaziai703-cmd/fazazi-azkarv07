// This file contains the logic for the Quran Recitation section.

// =======================================================================
// Global Variables and Constants
// =======================================================================
const QURAN_API_URL = 'https://api.alquran.cloud/v1';
const STORAGE_KEY_QURAN = 'fazazi_quran_settings';

let allReciters = [];
let allSurahs = [];
let currentReciterEdition = '';
let currentAudio;

// =======================================================================
// DOM Element Selectors
// =======================================================================
const reciterSelectEl = document.getElementById('reciterSelect');
const surahSelectEl = document.getElementById('surahSelect');
const quranPlayerEl = document.getElementById('quranPlayer');
const ayahInfoEl = document.getElementById('ayahInfo');

// =======================================================================
// Event Listeners (Added to the DOMContentLoaded event)
// =======================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Check if elements exist before adding listeners to avoid errors
    if (reciterSelectEl && surahSelectEl) {
        initQuranPlayer();
        
        // Listen for reciter selection change
        reciterSelectEl.addEventListener('change', () => {
            currentReciterEdition = reciterSelectEl.value;
            saveQuranSettings();
            
            // Check if a surah is already selected and play it
            if (surahSelectEl.value) {
                playSelectedSurah();
            }
        });

        // Listen for surah selection change
        surahSelectEl.addEventListener('change', () => {
            saveQuranSettings();
            playSelectedSurah();
        });
    }
});

// =======================================================================
// Core Functions
// =======================================================================

/**
 * Initializes the Quran Recitation player by fetching reciters and surahs.
 */
async function initQuranPlayer() {
    await fetchReciters();
    await fetchSurahs();
    loadQuranSettings();
}

/**
 * Fetches the list of reciters from the Al Quran Cloud API.
 */
async function fetchReciters() {
    try {
        const response = await fetch(`${QURAN_API_URL}/edition?format=audio&type=versebyverse`);
        const data = await response.json();
        if (data.status === 'OK') {
            allReciters = data.data;
            populateReciterSelect(allReciters);
        }
    } catch (error) {
        console.error('Error fetching reciters:', error);
        openModal('خطأ في الشبكة', 'تعذر جلب قائمة القراء.', `<button class="button btn btn-primary" onclick="closeModal()">حسناً</button>`);
    }
}

/**
 * Populates the reciter dropdown menu.
 * @param {Array} reciters - The list of reciter objects.
 */
function populateReciterSelect(reciters) {
    if (!reciterSelectEl) {
        console.error('Reciter select element not found.');
        return;
    }
    reciterSelectEl.innerHTML = '';
    reciters.forEach(reciter => {
        const option = document.createElement('option');
        option.value = reciter.identifier;
        option.textContent = reciter.englishName; // You might prefer to use ar-name here
        reciterSelectEl.appendChild(option);
    });
}

/**
 * Fetches the list of surahs from the Al Quran Cloud API.
 */
async function fetchSurahs() {
    try {
        const response = await fetch(`${QURAN_API_URL}/surah`);
        const data = await response.json();
        if (data.status === 'OK') {
            allSurahs = data.data;
            populateSurahSelect(allSurahs);
        }
    } catch (error) {
        console.error('Error fetching surahs:', error);
        openModal('خطأ في الشبكة', 'تعذر جلب قائمة السور.', `<button class="button btn btn-primary" onclick="closeModal()">حسناً</button>`);
    }
}

/**
 * Populates the surah dropdown menu.
 * @param {Array} surahs - The list of surah objects.
 */
function populateSurahSelect(surahs) {
    if (!surahSelectEl) {
        console.error('Surah select element not found.');
        return;
    }
    surahSelectEl.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'اختر سورة';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    surahSelectEl.appendChild(defaultOption);

    surahs.forEach(surah => {
        const option = document.createElement('option');
        option.value = surah.number;
        option.textContent = `${surah.number}. ${surah.englishName} (${surah.name})`;
        surahSelectEl.appendChild(option);
    });
}

/**
 * Plays the selected surah.
 */
async function playSelectedSurah() {
    const surahNumber = surahSelectEl.value;
    const reciterEdition = reciterSelectEl.value;

    if (!surahNumber || !reciterEdition) return;

    if (!quranPlayerEl) {
        console.error('Audio player element not found.');
        return;
    }

    try {
        const url = `${QURAN_API_URL}/surah/${surahNumber}/${reciterEdition}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.data.ayahs && data.data.ayahs.length > 0) {
            currentAudio = data.data.ayahs.map(ayah => ayah.audio);
            const firstAudio = currentAudio[0];
            
            quranPlayerEl.src = firstAudio;
            quranPlayerEl.play();
            updateAyahInfo(data.data.ayahs[0]);

            let currentAyahIndex = 0;
            quranPlayerEl.onended = () => {
                currentAyahIndex++;
                if (currentAyahIndex < currentAudio.length) {
                    quranPlayerEl.src = currentAudio[currentAyahIndex];
                    quranPlayerEl.play();
                    updateAyahInfo(data.data.ayahs[currentAyahIndex]);
                } else {
                    ayahInfoEl.textContent = 'انتهت السورة';
                }
            };
        } else {
            openModal('خطأ', 'تعذر تشغيل هذه السورة بالقارئ المحدد.', `<button class="button btn btn-primary" onclick="closeModal()">حسناً</button>`);
        }
    } catch (error) {
        console.error('Error playing surah:', error);
        openModal('خطأ في التشغيل', 'تعذر تشغيل الصوت. الرجاء التحقق من اتصالك بالإنترنت.', `<button class="button btn btn-primary" onclick="closeModal()">حسناً</button>`);
    }
}

/**
 * Updates the ayah information displayed on the UI.
 * @param {object} ayah - The ayah object from the API response.
 */
function updateAyahInfo(ayah) {
    if (ayahInfoEl) {
        ayahInfoEl.textContent = `سورة ${ayah.surah.name}، الآية ${ayah.numberInSurah}`;
    }
}

/**
 * Saves the user's Quran settings to local storage.
 */
function saveQuranSettings() {
    const settings = {
        reciterEdition: reciterSelectEl.value,
        surahNumber: surahSelectEl.value
    };
    localStorage.setItem(STORAGE_KEY_QURAN, JSON.stringify(settings));
}

/**
 * Loads the saved Quran settings from local storage.
 */
function loadQuranSettings() {
    const savedSettings = localStorage.getItem(STORAGE_KEY_QURAN);
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.reciterEdition) {
            reciterSelectEl.value = settings.reciterEdition;
            currentReciterEdition = settings.reciterEdition;
        }
        if (settings.surahNumber) {
            surahSelectEl.value = settings.surahNumber;
        }
    }
}
