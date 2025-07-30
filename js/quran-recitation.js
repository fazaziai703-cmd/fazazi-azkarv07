// Quran Recitation Player
// We will now fetch reciter base URLs dynamically
const quranRecitersMap = {}; // Map to store reciter data with their server URLs

let allQuranSurahs = []; // To store the full list of surahs from API
let currentReciterId = localStorage.getItem('quranReciterId') || ''; // Store reciter ID instead of key
let currentReciterServer = ''; // To store the fetched server URL for the current reciter
let currentSurahNumber = parseInt(localStorage.getItem('quranSurah')) || 1;
let audioPlayer;

// Function to fetch all surahs from an API
async function fetchAllSurahs() {
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();
        if (data.code === 200) {
            allQuranSurahs = data.data.map(s => ({
                number: s.number,
                name: s.englishName,
                arabicName: s.name,
                ayahs: s.numberOfAyahs
            }));
            populateSurahSelect();
            // After populating, ensure the selected surah from localStorage is set
            document.getElementById('surahSelect').value = currentSurahNumber;
            // updateAudioSource will be called after reciters are fetched and set up
        } else {
            console.error('Failed to fetch surahs from Al-Quran Cloud API:', data.status, data.data);
            // Fallback to a hardcoded list if API fails
            allQuranSurahs = [
                { number: 1, name: 'Al-Fatiha', arabicName: 'الفاتحة', ayahs: 7 },
                { number: 2, name: 'Al-Baqarah', arabicName: 'البقرة', ayahs: 286 },
                { number: 3, name: 'Al-Imran', arabicName: 'آل عمران', ayahs: 200 },
                { number: 4, name: 'An-Nisa', arabicName: 'النساء', ayahs: 176 },
                { number: 5, name: 'Al-Maidah', arabicName: 'المائدة', ayahs: 120 },
                { number: 6, name: 'Al-Anam', arabicName: 'الأنعام', ayahs: 165 },
                { number: 7, name: 'Al-Araf', arabicName: 'الأعراف', ayahs: 206 },
                { number: 8, name: 'Al-Anfal', arabicName: 'الأنفال', ayahs: 75 },
                { number: 9, name: 'At-Tawbah', arabicName: 'التوبة', ayahs: 129 },
                { number: 10, name: 'Yunus', arabicName: 'يونس', ayahs: 109 },
                { number: 11, name: 'Hud', arabicName: 'هود', ayahs: 123 },
                { number: 12, name: 'Yusuf', arabicName: 'يوسف', ayahs: 111 },
                { number: 13, name: 'Ar-Rad', arabicName: 'الرعد', ayahs: 43 },
                { number: 14, name: 'Ibrahim', arabicName: 'ابراهيم', ayahs: 52 },
                { number: 15, name: 'Al-Hijr', arabicName: 'الحجر', ayahs: 99 },
                { number: 16, name: 'An-Nahl', arabicName: 'النحل', ayahs: 128 },
                { number: 17, name: 'Al-Isra', arabicName: 'الإسراء', ayahs: 111 },
                { number: 18, name: 'Al-Kahf', arabicName: 'الكهف', ayahs: 110 },
                { number: 19, name: 'Maryam', arabicName: 'مريم', ayahs: 98 },
                { number: 20, name: 'Taha', arabicName: 'طه', ayahs: 135 },
                { number: 21, name: 'Al-Anbiya', arabicName: 'الأنبياء', ayahs: 112 },
                { number: 22, name: 'Al-Hajj', arabicName: 'الحج', ayahs: 78 },
                { number: 23, name: 'Al-Muminun', arabicName: 'المؤمنون', ayahs: 118 },
                { number: 24, name: 'An-Nur', arabicName: 'النور', ayahs: 64 },
                { number: 25, name: 'Al-Furqan', arabicName: 'الفرقان', ayahs: 77 },
                { number: 26, name: 'Ash-Shuara', arabicName: 'الشعراء', ayahs: 227 },
                { number: 27, name: 'An-Naml', arabicName: 'النمل', ayahs: 93 },
                { number: 28, name: 'Al-Qasas', arabicName: 'القصص', ayahs: 88 },
                { number: 29, name: 'Al-Ankabut', arabicName: 'العنكبوت', ayahs: 69 },
                { number: 30, name: 'Ar-Rum', arabicName: 'الروم', ayahs: 60 },
                { number: 31, name: 'Luqman', arabicName: 'لقمان', ayahs: 34 },
                { number: 32, name: 'As-Sajdah', arabicName: 'السجدة', ayahs: 30 },
                { number: 33, name: 'Al-Ahzab', arabicName: 'الأحزاب', ayahs: 73 },
                { number: 34, name: 'Saba', arabicName: 'سبأ', ayahs: 54 },
                { number: 35, name: 'Fatir', arabicName: 'فاطر', ayahs: 45 },
                { number: 36, name: 'Ya-Sin', arabicName: 'يس', ayahs: 83 },
                { number: 37, name: 'As-Saffat', arabicName: 'الصافات', ayahs: 182 },
                { number: 38, name: 'Sad', arabicName: 'ص', ayahs: 88 },
                { number: 39, name: 'Az-Zumar', arabicName: 'الزمر', ayahs: 75 },
                { number: 40, name: 'Ghafir', arabicName: 'غافر', ayahs: 85 },
                { number: 41, name: 'Fussilat', arabicName: 'فصلت', ayahs: 54 },
                { number: 42, name: 'Ash-Shuraa', arabicName: 'الشورى', ayahs: 53 },
                { number: 43, name: 'Az-Zukhruf', arabicName: 'الزخرف', ayahs: 89 },
                { number: 44, name: 'Ad-Dukhan', arabicName: 'الدخان', ayahs: 59 },
                { number: 45, name: 'Al-Jathiyah', arabicName: 'الجاثية', ayahs: 37 },
                { number: 46, name: 'Al-Ahqaf', arabicName: 'الأحقاف', ayahs: 35 },
                { number: 47, name: 'Muhammad', arabicName: 'محمد', ayahs: 38 },
                { number: 48, name: 'Al-Fath', arabicName: 'الفتح', ayahs: 29 },
                { number: 49, name: 'Al-Hujurat', arabicName: 'الحجرات', ayahs: 18 },
                { number: 50, name: 'Qaf', arabicName: 'ق', ayahs: 45 },
                { number: 51, name: 'Adh-Dhariyat', arabicName: 'الذاريات', ayahs: 60 },
                { number: 52, name: 'At-Tur', arabicName: 'الطور', ayahs: 49 },
                { number: 53, name: 'An-Najm', arabicName: 'النجم', ayahs: 62 },
                { number: 54, name: 'Al-Qamar', arabicName: 'القمر', ayahs: 55 },
                { number: 55, name: 'Ar-Rahman', arabicName: 'الرحمن', ayahs: 78 },
                { number: 56, name: 'Al-Waqiah', arabicName: 'الواقعة', ayahs: 96 },
                { number: 57, name: 'Al-Hadid', arabicName: 'الحديد', ayahs: 29 },
                { number: 58, name: 'Al-Mujadila', arabicName: 'المجادلة', ayahs: 22 },
                { number: 59, name: 'Al-Hashr', arabicName: 'الحشر', ayahs: 24 },
                { number: 60, name: 'Al-Mumtahanah', arabicName: 'الممتحنة', ayahs: 13 },
                { number: 61, name: 'As-Saff', arabicName: 'الصف', ayahs: 14 },
                { number: 62, name: 'Al-Jumuah', arabicName: 'الجمعة', ayahs: 11 },
                { number: 63, name: 'Al-Munafiqun', arabicName: 'المنافقون', ayahs: 11 },
                { number: 64, name: 'At-Taghabun', arabicName: 'التغابن', ayahs: 18 },
                { number: 65, name: 'At-Talaq', arabicName: 'الطلاق', ayahs: 12 },
                { number: 66, name: 'At-Tahrim', arabicName: 'التحريم', ayahs: 12 },
                { number: 67, name: 'Al-Mulk', arabicName: 'الملك', ayahs: 30 },
                { number: 68, name: 'Al-Qalam', arabicName: 'القلم', ayahs: 52 },
                { number: 69, name: 'Al-Haqqah', arabicName: 'الحاقة', ayahs: 52 },
                { number: 70, name: 'Al-Maarij', arabicName: 'المعارج', ayahs: 44 },
                { number: 71, name: 'Nuh', arabicName: 'نوح', ayahs: 28 },
                { number: 72, name: 'Al-Jinn', arabicName: 'الجن', ayahs: 28 },
                { number: 73, name: 'Al-Muzzammil', arabicName: 'المزمل', ayahs: 20 },
                { number: 74, name: 'Al-Muddaththir', arabicName: 'المدثر', ayahs: 56 },
                { number: 75, name: 'Al-Qiyamah', arabicName: 'القيامة', ayahs: 40 },
                { number: 76, name: 'Al-Insan', arabicName: 'الانسان', ayahs: 31 },
                { number: 77, name: 'Al-Mursalat', arabicName: 'المرسلات', ayahs: 50 },
                { number: 78, name: 'An-Naba', arabicName: 'النبأ', ayahs: 40 },
                { number: 79, name: 'An-Naziat', arabicName: 'النازعات', ayahs: 46 },
                { number: 80, name: 'Abasa', arabicName: 'عبس', ayahs: 42 },
                { number: 81, name: 'At-Takwir', arabicName: 'التكوير', ayahs: 29 },
                { number: 82, name: 'Al-Infitar', arabicName: 'الانفطار', ayahs: 19 },
                { number: 83, name: 'Al-Mutaffifin', arabicName: 'المطففين', ayahs: 36 },
                { number: 84, name: 'Al-Inshiqaq', arabicName: 'الانشقاق', ayahs: 25 },
                { number: 85, name: 'Al-Buruj', arabicName: 'البروج', ayahs: 22 },
                { number: 86, name: 'At-Tariq', arabicName: 'الطارق', ayahs: 17 },
                { number: 87, name: 'Al-Ala', arabicName: 'الأعلى', ayahs: 19 },
                { number: 88, name: 'Al-Ghashiyah', arabicName: 'الغاشية', ayahs: 26 },
                { number: 89, name: 'Al-Fajr', arabicName: 'الفجر', ayahs: 30 },
                { number: 90, name: 'Al-Balad', arabicName: 'البلد', ayahs: 20 },
                { number: 91, name: 'Ash-Shams', arabicName: 'الشمس', ayahs: 15 },
                { number: 92, name: 'Al-Layl', arabicName: 'الليل', ayahs: 21 },
                { number: 93, name: 'Ad-Duhaa', arabicName: 'الضحى', ayahs: 11 },
                { number: 94, name: 'Ash-Sharh', arabicName: 'الشرح', ayahs: 8 },
                { number: 95, name: 'At-Tin', arabicName: 'التين', ayahs: 8 },
                { number: 96, name: 'Al-Alaq', arabicName: 'العلق', ayahs: 19 },
                { number: 97, name: 'Al-Qadr', arabicName: 'القدر', ayahs: 5 },
                { number: 98, name: 'Al-Bayyinah', arabicName: 'البينة', ayahs: 8 },
                { number: 99, name: 'Az-Zalzalah', arabicName: 'الزلزلة', ayahs: 8 },
                { number: 100, name: 'Al-Adiyat', arabicName: 'العاديات', ayahs: 11 },
                { number: 101, name: 'Al-Qariah', arabicName: 'القارعة', ayahs: 11 },
                { number: 102, name: 'At-Takathur', arabicName: 'التكاثر', ayahs: 8 },
                { number: 103, name: 'Al-Asr', arabicName: 'العصر', ayahs: 3 },
                { number: 104, name: 'Al-Humazah', arabicName: 'الهمزة', ayahs: 9 },
                { number: 105, name: 'Al-Fil', arabicName: 'الفيل', ayahs: 5 },
                { number: 106, name: 'Quraysh', arabicName: 'قريش', ayahs: 4 },
                { number: 107, name: 'Al-Maun', arabicName: 'الماعون', ayahs: 7 },
                { number: 108, name: 'Al-Kawthar', arabicName: 'الكوثر', ayahs: 3 },
                { number: 109, name: 'Al-Kafirun', arabicName: 'الكافرون', ayahs: 6 },
                { number: 110, name: 'An-Nasr', arabicName: 'النصر', ayahs: 3 },
                { number: 111, name: 'Al-Masad', arabicName: 'المسد', ayahs: 5 },
                { number: 112, name: 'Al-Ikhlas', arabicName: 'الإخلاص', ayahs: 4 },
                { number: 113, name: 'Al-Falaq', arabicName: 'الفلق', ayahs: 5 },
                { number: 114, name: 'An-Nas', arabicName: 'الناس', ayahs: 6 }
            ];
            populateSurahSelect();
            document.getElementById('surahSelect').value = currentSurahNumber;
            // updateAudioSource will be called after reciters are fetched and set up
        }
    } catch (error) {
        console.error('Error fetching surahs:', error);
        // Fallback to a hardcoded list if fetch fails
        allQuranSurahs = [
            { number: 1, name: 'Al-Fatiha', arabicName: 'الفاتحة', ayahs: 7 },
            { number: 2, name: 'Al-Baqarah', arabicName: 'البقرة', ayahs: 286 },
            { number: 3, name: 'Al-Imran', arabicName: 'آل عمران', ayahs: 200 },
            { number: 4, name: 'An-Nisa', arabicName: 'النساء', ayahs: 176 },
            { number: 5, name: 'Al-Maidah', arabicName: 'المائدة', ayahs: 120 },
            { number: 6, name: 'Al-Anam', arabicName: 'الأنعام', ayahs: 165 },
            { number: 7, name: 'Al-Araf', arabicName: 'الأعراف', ayahs: 206 },
            { number: 8, name: 'Al-Anfal', arabicName: 'الأنفال', ayahs: 75 },
            { number: 9, name: 'At-Tawbah', arabicName: 'التوبة', ayahs: 129 },
            { number: 10, name: 'Yunus', arabicName: 'يونس', ayahs: 109 },
            { number: 11, name: 'Hud', arabicName: 'هود', ayahs: 123 },
            { number: 12, name: 'Yusuf', arabicName: 'يوسف', ayahs: 111 },
            { number: 13, name: 'Ar-Rad', arabicName: 'الرعد', ayahs: 43 },
            { number: 14, name: 'Ibrahim', arabicName: 'ابراهيم', ayahs: 52 },
            { number: 15, name: 'Al-Hijr', arabicName: 'الحجر', ayahs: 99 },
            { number: 16, name: 'An-Nahl', arabicName: 'النحل', ayahs: 128 },
            { number: 17, name: 'Al-Isra', arabicName: 'الإسراء', ayahs: 111 },
            { number: 18, name: 'Al-Kahf', arabicName: 'الكهف', ayahs: 110 },
            { number: 19, name: 'Maryam', arabicName: 'مريم', ayahs: 98 },
            { number: 20, name: 'Taha', arabicName: 'طه', ayahs: 135 },
            { number: 21, name: 'Al-Anbiya', arabicName: 'الأنبياء', ayahs: 112 },
            { number: 22, name: 'Al-Hajj', arabicName: 'الحج', ayahs: 78 },
            { number: 23, name: 'Al-Muminun', arabicName: 'المؤمنون', ayahs: 118 },
            { number: 24, name: 'An-Nur', arabicName: 'النور', ayahs: 64 },
            { number: 25, name: 'Al-Furqan', arabicName: 'الفرقان', ayahs: 77 },
            { number: 26, name: 'Ash-Shuara', arabicName: 'الشعراء', ayahs: 227 },
            { number: 27, name: 'An-Naml', arabicName: 'النمل', ayahs: 93 },
            { number: 28, name: 'Al-Qasas', arabicName: 'القصص', ayahs: 88 },
            { number: 29, name: 'Al-Ankabut', arabicName: 'العنكبوت', ayahs: 69 },
            { number: 30, name: 'Ar-Rum', arabicName: 'الروم', ayahs: 60 },
            { number: 31, name: 'Luqman', arabicName: 'لقمان', ayahs: 34 },
            { number: 32, name: 'As-Sajdah', arabicName: 'السجدة', ayahs: 30 },
            { number: 33, name: 'Al-Ahzab', arabicName: 'الأحزاب', ayahs: 73 },
            { number: 34, name: 'Saba', arabicName: 'سبأ', ayahs: 54 },
            { number: 35, name: 'Fatir', arabicName: 'فاطر', ayahs: 45 },
            { number: 36, name: 'Ya-Sin', arabicName: 'يس', ayahs: 83 },
            { number: 37, name: 'As-Saffat', arabicName: 'الصافات', ayahs: 182 },
            { number: 38, name: 'Sad', arabicName: 'ص', ayahs: 88 },
            { number: 39, name: 'Az-Zumar', arabicName: 'الزمر', ayahs: 75 },
            { number: 40, name: 'Ghafir', arabicName: 'غافر', ayahs: 85 },
            { number: 41, name: 'Fussilat', arabicName: 'فصلت', ayahs: 54 },
            { number: 42, name: 'Ash-Shuraa', arabicName: 'الشورى', ayahs: 53 },
            { number: 43, name: 'Az-Zukhruf', arabicName: 'الزخرف', ayahs: 89 },
            { number: 44, name: 'Ad-Dukhan', arabicName: 'الدخان', ayahs: 59 },
            { number: 45, name: 'Al-Jathiyah', arabicName: 'الجاثية', ayahs: 37 },
            { number: 46, name: 'Al-Ahqaf', arabicName: 'الأحقاف', ayahs: 35 },
            { number: 47, name: 'Muhammad', arabicName: 'محمد', ayahs: 38 },
            { number: 48, name: 'Al-Fath', arabicName: 'الفتح', ayahs: 29 },
            { number: 49, name: 'Al-Hujurat', arabicName: 'الحجرات', ayahs: 18 },
            { number: 50, name: 'Qaf', arabicName: 'ق', ayahs: 45 },
            { number: 51, name: 'Adh-Dhariyat', arabicName: 'الذاريات', ayahs: 60 },
            { number: 52, name: 'At-Tur', arabicName: 'الطور', ayahs: 49 },
            { number: 53, name: 'An-Najm', arabicName: 'النجم', ayahs: 62 },
            { number: 54, name: 'Al-Qamar', arabicName: 'القمر', ayahs: 55 },
            { number: 55, name: 'Ar-Rahman', arabicName: 'الرحمن', ayahs: 78 },
            { number: 56, name: 'Al-Waqiah', arabicName: 'الواقعة', ayahs: 96 },
            { number: 57, name: 'Al-Hadid', arabicName: 'الحديد', ayahs: 29 },
            { number: 58, name: 'Al-Mujadila', arabicName: 'المجادلة', ayahs: 22 },
            { number: 59, name: 'Al-Hashr', arabicName: 'الحشر', ayahs: 24 },
            { number: 60, name: 'Al-Mumtahanah', arabicName: 'الممتحنة', ayahs: 13 },
            { number: 61, name: 'As-Saff', arabicName: 'الصف', ayahs: 14 },
            { number: 62, name: 'Al-Jumuah', arabicName: 'الجمعة', ayahs: 11 },
            { number: 63, name: 'Al-Munafiqun', arabicName: 'المنافقون', ayahs: 11 },
            { number: 64, name: 'At-Taghabun', arabicName: 'التغابن', ayahs: 18 },
            { number: 65, name: 'At-Talaq', arabicName: 'الطلاق', ayahs: 12 },
            { number: 66, name: 'At-Tahrim', arabicName: 'التحريم', ayahs: 12 },
            { number: 67, name: 'Al-Mulk', arabicName: 'الملك', ayahs: 30 },
            { number: 68, name: 'Al-Qalam', arabicName: 'القلم', ayahs: 52 },
            { number: 69, name: 'Al-Haqqah', arabicName: 'الحاقة', ayahs: 52 },
            { number: 70, name: 'Al-Maarij', arabicName: 'المعارج', ayahs: 44 },
            { number: 71, name: 'Nuh', arabicName: 'نوح', ayahs: 28 },
            { number: 72, name: 'Al-Jinn', arabicName: 'الجن', ayahs: 28 },
            { number: 73, name: 'Al-Muzzammil', arabicName: 'المزمل', ayahs: 20 },
            { number: 74, name: 'Al-Muddaththir', arabicName: 'المدثر', ayahs: 56 },
            { number: 75, name: 'Al-Qiyamah', arabicName: 'القيامة', ayahs: 40 },
            { number: 76, name: 'Al-Insan', arabicName: 'الانسان', ayahs: 31 },
            { number: 77, name: 'Al-Mursalat', arabicName: 'المرسلات', ayahs: 50 },
            { number: 78, name: 'An-Naba', arabicName: 'النبأ', ayahs: 40 },
            { number: 79, name: 'An-Naziat', arabicName: 'النازعات', ayahs: 46 },
            { number: 80, name: 'Abasa', arabicName: 'عبس', ayahs: 42 },
            { number: 81, name: 'At-Takwir', arabicName: 'التكوير', ayahs: 29 },
            { number: 82, name: 'Al-Infitar', arabicName: 'الانفطار', ayahs: 19 },
            { number: 83, name: 'Al-Mutaffifin', arabicName: 'المطففين', ayahs: 36 },
            { number: 84, name: 'Al-Inshiqaq', arabicName: 'الانشقاق', ayahs: 25 },
            { number: 85, name: 'Al-Buruj', arabicName: 'البروج', ayahs: 22 },
            { number: 86, name: 'At-Tariq', arabicName: 'الطارق', ayahs: 17 },
            { number: 87, name: 'Al-Ala', arabicName: 'الأعلى', ayahs: 19 },
            { number: 88, name: 'Al-Ghashiyah', arabicName: 'الغاشية', ayahs: 26 },
            { number: 89, name: 'Al-Fajr', arabicName: 'الفجر', ayahs: 30 },
            { number: 90, name: 'Al-Balad', arabicName: 'البلد', ayahs: 20 },
            { number: 91, name: 'Ash-Shams', arabicName: 'الشمس', ayahs: 15 },
            { number: 92, name: 'Al-Layl', arabicName: 'الليل', ayahs: 21 },
            { number: 93, name: 'Ad-Duhaa', arabicName: 'الضحى', ayahs: 11 },
            { number: 94, name: 'Ash-Sharh', arabicName: 'الشرح', ayahs: 8 },
            { number: 95, name: 'At-Tin', arabicName: 'التين', ayahs: 8 },
            { number: 96, name: 'Al-Alaq', arabicName: 'العلق', ayahs: 19 },
            { number: 97, name: 'Al-Qadr', arabicName: 'القدر', ayahs: 5 },
            { number: 98, name: 'Al-Bayyinah', arabicName: 'البينة', ayahs: 8 },
            { number: 99, name: 'Az-Zalzalah', arabicName: 'الزلزلة', ayahs: 8 },
            { number: 100, name: 'Al-Adiyat', arabicName: 'العاديات', ayahs: 11 },
            { number: 101, name: 'Al-Qariah', arabicName: 'القارعة', ayahs: 11 },
            { number: 102, name: 'At-Takathur', arabicName: 'التكاثر', ayahs: 8 },
            { number: 103, name: 'Al-Asr', arabicName: 'العصر', ayahs: 3 },
            { number: 104, name: 'Al-Humazah', arabicName: 'الهمزة', ayahs: 9 },
            { number: 105, name: 'Al-Fil', arabicName: 'الفيل', ayahs: 5 },
            { number: 106, name: 'Quraysh', arabicName: 'قريش', ayahs: 4 },
            { number: 107, name: 'Al-Maun', arabicName: 'الماعون', ayahs: 7 },
            { number: 108, name: 'Al-Kawthar', arabicName: 'الكوثر', ayahs: 3 },
            { number: 109, name: 'Al-Kafirun', arabicName: 'الكافرون', ayahs: 6 },
            { number: 110, name: 'An-Nasr', arabicName: 'النصر', ayahs: 3 },
            { number: 111, name: 'Al-Masad', arabicName: 'المسد', ayahs: 5 },
            { number: 112, name: 'Al-Ikhlas', arabicName: 'الإخلاص', ayahs: 4 },
            { number: 113, name: 'Al-Falaq', arabicName: 'الفلق', ayahs: 5 },
            { number: 114, name: 'An-Nas', arabicName: 'الناس', ayahs: 6 }
        ];
        populateSurahSelect();
        document.getElementById('surahSelect').value = currentSurahNumber;
        // updateAudioSource will be called after reciters are fetched and set up
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

// Function to fetch reciters from mp3quran.net API
async function fetchReciters() {
    console.log('Fetching reciters...'); // ADDED LOG
    try {
        const response = await fetch('https://mp3quran.net/api/v3/reciters?language=ar'); // Request Arabic names
        if (!response.ok) { // Check for HTTP errors
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Reciters API response data:', data); // ADDED LOG

        if (data.reciters && data.reciters.length > 0) {
            const reciterSelect = document.getElementById('reciterSelect');
            reciterSelect.innerHTML = ''; // Clear existing options

            // UPDATED FILTERING LOGIC
            const filteredReciters = data.reciters.filter(reciter =>
                reciter.moshaf.some(m =>
                    m.name.toLowerCase().includes('hafs') && m.name.toLowerCase().includes('assem')
                )
            );
            console.log('Filtered Reciters (Hafs A\'n Assem):', filteredReciters); // ADDED LOG

            // Populate quranRecitersMap and reciterSelect
            filteredReciters.forEach(reciter => {
                const hafsMoshaf = reciter.moshaf.find(m =>
                    m.name.toLowerCase().includes('hafs') && m.name.toLowerCase().includes('assem')
                );
                if (hafsMoshaf) {
                    quranRecitersMap[reciter.id] = { // Use reciter.id as the key
                        name: reciter.name,
                        baseUrl: hafsMoshaf.server // This is the server URL!
                    };

                    const option = document.createElement('option');
                    option.value = reciter.id;
                    option.textContent = reciter.name;
                    reciterSelect.appendChild(option);
                }
            });
            console.log('quranRecitersMap after population:', quranRecitersMap); // ADDED LOG

            // Set initial reciter based on localStorage or default to the first available
            let selectedReciterFound = false;
            if (currentReciterId && quranRecitersMap[currentReciterId]) {
                reciterSelect.value = currentReciterId;
                selectedReciterFound = true;
                console.log('Reciter from localStorage found:', currentReciterId); // ADDED LOG
            } else if (filteredReciters.length > 0) {
                currentReciterId = filteredReciters[0].id;
                reciterSelect.value = currentReciterId;
                localStorage.setItem('quranReciterId', currentReciterId);
                selectedReciterFound = true;
                console.log('Defaulting to first reciter:', currentReciterId); // ADDED LOG
            } else {
                console.warn('No suitable reciters found in API response.'); // ADDED LOG
            }

            if (selectedReciterFound) {
                currentReciterServer = quranRecitersMap[currentReciterId]?.baseUrl || '';
                console.log('Current Reciter ID:', currentReciterId); // ADDED LOG
                console.log('Current Reciter Server URL:', currentReciterServer); // ADDED LOG
                updateAudioSource(); // Load the audio after reciters are set
            } else {
                console.error('Could not set a valid reciter for audio playback.');
                document.getElementById('reciterSelect').innerHTML = '<option value="">تعذر تحميل القراء</option>';
            }

        } else {
            console.error('No reciters found in mp3quran.net API response or data format unexpected.'); // MODIFIED LOG
            // Handle cases where no reciters are returned, e.g., display error message
            document.getElementById('reciterSelect').innerHTML = '<option value="">تعذر تحميل القراء</option>';
        }
    } catch (error) {
        console.error('Error fetching reciters:', error);
        // Fallback or error message for reciters if API fails
        document.getElementById('reciterSelect').innerHTML = '<option value="">تعذر تحميل القراء</option>';
    }
}


async function initQuranPlayer() {
    audioPlayer = document.getElementById('quranPlayer');

    // Fetch surahs and reciters concurrently or sequentially as needed
    await fetchAllSurahs(); // This populates surah dropdown and sets initial surah
    await fetchReciters();  // This populates reciter dropdown and sets initial reciter & server URL


    // Set up event listeners
    document.getElementById('reciterSelect').addEventListener('change', function() {
        currentReciterId = this.value;
        localStorage.setItem('quranReciterId', currentReciterId); // Save selection
        currentReciterServer = quranRecitersMap[currentReciterId]?.baseUrl || '';
        console.log('Reciter changed. New Reciter ID:', currentReciterId, 'New Server URL:', currentReciterServer); // ADDED LOG
        updateAudioSource();
    });

    document.getElementById('surahSelect').addEventListener('change', function() {
        currentSurahNumber = parseInt(this.value);
        localStorage.setItem('quranSurah', currentSurahNumber); // Save selection
        console.log('Surah changed. New Surah Number:', currentSurahNumber); // ADDED LOG
        updateAudioSource();
    });

    document.getElementById('playPauseBtn').addEventListener('click', function() {
        if (!audioPlayer.src || audioPlayer.src.endsWith('.mp3')) { // Check if source is set
             // Prevent play if no valid source is loaded
            if (audioPlayer.paused) {
                audioPlayer.play();
                this.innerHTML = '<i class="fas fa-pause"></i> إيقاف مؤقت';
            } else {
                audioPlayer.pause();
                this.innerHTML = '<i class="fas fa-play"></i> تشغيل';
            }
        } else {
            console.warn('No audio source loaded or invalid source. Cannot play.');
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
            console.log('Finished all surahs. Resetting to Surah 1.');
            currentSurahNumber = 1; // Loop back to Surah 1
            localStorage.setItem('quranSurah', currentSurahNumber);
            document.getElementById('surahSelect').value = currentSurahNumber;
            updateAudioSource();
            // Don't auto-play immediately if it's the end of the Quran, user can restart
            document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-play"></i> تشغيل';
        }
    });

    // updateAyahInfo is primarily for displaying current surah name now
    audioPlayer.addEventListener('timeupdate', function() {
        updateAyahInfo();
    });
}

function updateAudioSource() {
    if (!currentReciterServer) {
        console.error('Reciter server URL not available. Cannot set audio source.'); // MODIFIED LOG
        return;
    }

    // ⭐ CORRECTED URL for full surah audio files, using the fetched server URL
    const surahPadded = currentSurahNumber.toString().padStart(3, '0');
    const audioUrl = `${currentReciterServer}${surahPadded}.mp3`;

    console.log('Attempting to load audio from:', audioUrl);

    audioPlayer.src = audioUrl;
    audioPlayer.load(); // Load the new audio source

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
    const currentSurahObj = allQuranSurahs.find(s => s.number === currentSurahNumber);
    document.getElementById('currentSurah').textContent = `السورة: ${currentSurahObj?.arabicName || '--'}`;
}

// Initialize when the tab is opened (or document is ready)
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('quranTab')) {
        initQuranPlayer();
    }
});
