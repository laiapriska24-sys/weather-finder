import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';

// ─────────────────────────────────────────────
// KAMUS KODE CUACA WMO → label, emoji siang, emoji malam, warna bg siang, warna bg malam
// ─────────────────────────────────────────────
const WEATHER_CODES = {
  0:  { label: 'Cerah',            emojiDay: '☀️',  emojiNight: '🌕',  bgDay: ['#1565c0', '#42a5f5'], bgNight: ['#0d1b4b', '#1a2f7a'] },
  1:  { label: 'Cerah Berawan',    emojiDay: '🌤️',  emojiNight: '🌙',  bgDay: ['#1976d2', '#64b5f6'], bgNight: ['#0f2060', '#1c3a80'] },
  2:  { label: 'Berawan Sebagian', emojiDay: '⛅',  emojiNight: '☁️',  bgDay: ['#3d6b8a', '#8ab9d4'], bgNight: ['#1a2a3a', '#2d3f55'] },
  3:  { label: 'Mendung',          emojiDay: '☁️',  emojiNight: '☁️',  bgDay: ['#4a5568', '#718096'], bgNight: ['#1a1f2a', '#252d3a'] },
  45: { label: 'Berkabut',         emojiDay: '🌫️',  emojiNight: '🌫️',  bgDay: ['#5a6474', '#9aa3af'], bgNight: ['#1e2430', '#2a3040'] },
  48: { label: 'Kabut Beku',       emojiDay: '🌫️',  emojiNight: '🌫️',  bgDay: ['#4e5d6b', '#8fa0af'], bgNight: ['#1c2530', '#28333d'] },
  51: { label: 'Gerimis Ringan',   emojiDay: '🌦️',  emojiNight: '🌧️',  bgDay: ['#2d5a7a', '#5b9bb5'], bgNight: ['#0e1e30', '#1a2f45'] },
  53: { label: 'Gerimis Sedang',   emojiDay: '🌦️',  emojiNight: '🌧️',  bgDay: ['#2a5270', '#4e8ba8'], bgNight: ['#0c1a28', '#162840'] },
  55: { label: 'Gerimis Lebat',    emojiDay: '🌦️',  emojiNight: '🌧️',  bgDay: ['#264a65', '#3f7a95'], bgNight: ['#0a1620', '#12233a'] },
  61: { label: 'Hujan Ringan',     emojiDay: '🌧️',  emojiNight: '🌧️',  bgDay: ['#1e3a5f', '#2d6a9f'], bgNight: ['#0a1525', '#111e35'] },
  63: { label: 'Hujan Sedang',     emojiDay: '🌧️',  emojiNight: '🌧️',  bgDay: ['#1a3050', '#235a8a'], bgNight: ['#081220', '#0f1a30'] },
  65: { label: 'Hujan Lebat',      emojiDay: '🌧️',  emojiNight: '🌧️',  bgDay: ['#152540', '#1c4a72'], bgNight: ['#060e1a', '#0c1525'] },
  71: { label: 'Salju Ringan',     emojiDay: '🌨️',  emojiNight: '❄️',  bgDay: ['#4a6580', '#8ab0d0'], bgNight: ['#1a2535', '#253345'] },
  80: { label: 'Hujan Lokal',      emojiDay: '🌦️',  emojiNight: '🌧️',  bgDay: ['#1e3f60', '#2c6090'], bgNight: ['#0a1828', '#101f38'] },
  95: { label: 'Badai Petir',      emojiDay: '⛈️',  emojiNight: '⛈️',  bgDay: ['#1a1a2e', '#16213e'], bgNight: ['#050510', '#0a0a1e'] },
  99: { label: 'Badai Petir Lebat',emojiDay: '⛈️',  emojiNight: '⛈️',  bgDay: ['#0f0f1a', '#12102a'], bgNight: ['#020208', '#050510'] },
};

function getWeatherInfo(code) {
  return WEATHER_CODES[code] || {
    label: 'Tidak Diketahui', emojiDay: '❓', emojiNight: '❓',
    bgDay: ['#2d3748', '#4a5568'], bgNight: ['#111827', '#1f2937'],
  };
}

// ─────────────────────────────────────────────
// KONVERSI ARAH ANGIN (derajat → mata angin)
// ─────────────────────────────────────────────
const WIND_DIRS = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'];
const WIND_LABELS = {
  U: 'Utara', TL: 'Timur Laut', T: 'Timur', TG: 'Tenggara',
  S: 'Selatan', BD: 'Barat Daya', B: 'Barat', BL: 'Barat Laut',
};

function getWindDirection(degrees) {
  const key = WIND_DIRS[Math.round(degrees / 45) % 8];
  return { key, label: WIND_LABELS[key] };
}

const MAX_HISTORY = 5;

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [searchInput, setSearchInput] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [history, setHistory]         = useState([]);

  // 🌙 Mode toggle: 'auto' ikut API, 'day' paksa siang, 'night' paksa malam
  const [modeOverride, setModeOverride] = useState('auto');

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const toggleAnim = useRef(new Animated.Value(0)).current;

  // ─── Tentukan isDay berdasarkan mode ───
  const resolvedIsDay = (() => {
    if (modeOverride === 'day')   return true;
    if (modeOverride === 'night') return false;
    return weatherData ? Boolean(weatherData.isDay) : true;
  })();

  // ─── Animasi toggle pill ───
  useEffect(() => {
    const target = modeOverride === 'night' ? 1 : modeOverride === 'day' ? 0 : 0.5;
    Animated.spring(toggleAnim, {
      toValue: target,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
  }, [modeOverride]);

  // ─── EFFECT: fetch cuaca ───
  useEffect(() => {
    if (!searchInput.trim()) {
      setWeatherData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);
      fadeAnim.setValue(0);

      try {
        // STEP 1: Geocoding
        const geoUrl =
          `https://geocoding-api.open-meteo.com/v1/search` +
          `?name=${encodeURIComponent(searchInput)}&count=1&language=id`;
        const geoRes  = await fetch(geoUrl, { signal: controller.signal });
        const geoJson = await geoRes.json();

        if (!geoJson.results || geoJson.results.length === 0) {
          throw new Error(`Kota "${searchInput}" tidak ditemukan`);
        }

        const lokasi = geoJson.results[0];

        // STEP 2: Forecast
        const cuacaUrl =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${lokasi.latitude}&longitude=${lokasi.longitude}` +
          `&current_weather=true` +
          `&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
        const cuacaRes  = await fetch(cuacaUrl, { signal: controller.signal });
        const cuacaJson = await cuacaRes.json();

        const cw = cuacaJson.current_weather;

        setWeatherData({
          kota:        lokasi.name,
          negara:      lokasi.country,
          suhu:        cw.temperature,
          angin:       cw.windspeed,
          arahDerajat: cw.winddirection,
          kode:        cw.weathercode,
          isDay:       cw.is_day,
          suhuMax:     cuacaJson.daily?.temperature_2m_max?.[0] ?? null,
          suhuMin:     cuacaJson.daily?.temperature_2m_min?.[0] ?? null,
        });

        // Riwayat pencarian
        setHistory(prev => {
          const filtered = prev.filter(c => c.toLowerCase() !== searchInput.trim().toLowerCase());
          return [searchInput.trim(), ...filtered].slice(0, MAX_HISTORY);
        });

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();

      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setWeatherData(null);
        }
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchInput]);

  // ─── Computed values ───
  const info    = weatherData ? getWeatherInfo(weatherData.kode) : null;
  const windDir = weatherData ? getWindDirection(weatherData.arahDerajat) : null;

  const currentEmoji = info
    ? (resolvedIsDay ? info.emojiDay : info.emojiNight)
    : null;

  const [bgTop, bgBot] = info
    ? (resolvedIsDay ? info.bgDay : info.bgNight)
    : (resolvedIsDay ? ['#0a1628', '#1a2a4a'] : ['#030710', '#070d20']);

  // Warna teks & aksen berdasarkan mode
  const accentColor  = resolvedIsDay ? '#7ecef7' : '#a78bfa';
  const subtitleColor = resolvedIsDay ? '#a0c4e8' : '#c4b5fd';

  return (
    <View style={[styles.root, { backgroundColor: bgTop }]}>
      <StatusBar barStyle="light-content" backgroundColor={bgTop} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {resolvedIsDay ? '🌤️' : '🌙'} WeatherFinder
          </Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            Cuaca real-time di kota mana pun
          </Text>
        </View>

        {/* ── TOGGLE SIANG / MALAM ── */}
        <View style={styles.toggleWrapper}>
          <Text style={[styles.toggleTitle, { color: subtitleColor }]}>Mode Tampilan</Text>
          <View style={[styles.toggleTrack, { borderColor: accentColor + '55' }]}>

            {/* Tombol SIANG */}
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                modeOverride === 'day' && { backgroundColor: '#f59e0b' },
              ]}
              onPress={() => setModeOverride(prev => prev === 'day' ? 'auto' : 'day')}
            >
              <Text style={styles.toggleBtnText}>☀️ Siang</Text>
            </TouchableOpacity>

            {/* Tombol AUTO */}
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                modeOverride === 'auto' && { backgroundColor: accentColor + 'aa' },
              ]}
              onPress={() => setModeOverride('auto')}
            >
              <Text style={styles.toggleBtnText}>🔄 Auto</Text>
            </TouchableOpacity>

            {/* Tombol MALAM */}
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                modeOverride === 'night' && { backgroundColor: '#7c3aed' },
              ]}
              onPress={() => setModeOverride(prev => prev === 'night' ? 'auto' : 'night')}
            >
              <Text style={styles.toggleBtnText}>🌙 Malam</Text>
            </TouchableOpacity>

          </View>
          {modeOverride !== 'auto' && (
            <Text style={[styles.toggleHint, { color: subtitleColor }]}>
              {modeOverride === 'day'
                ? '☀️ Mode siang aktif — tampilan dipaksa terang'
                : '🌙 Mode malam aktif — tampilan dipaksa gelap'}
            </Text>
          )}
          {modeOverride === 'auto' && weatherData && (
            <Text style={[styles.toggleHint, { color: subtitleColor }]}>
              🔄 Auto: ikut data API ({weatherData.isDay ? 'sekarang siang' : 'sekarang malam'})
            </Text>
          )}
        </View>

        {/* ── INPUT ── */}
        <TextInput
          style={[styles.input, { borderColor: accentColor + '88' }]}
          placeholder="Ketik nama kota (cth: Jakarta)"
          placeholderTextColor="#888"
          value={searchInput}
          onChangeText={setSearchInput}
          autoCorrect={false}
          returnKeyType="search"
        />

        {/* ── RIWAYAT PENCARIAN ── */}
        {history.length > 0 && (
          <View style={styles.historyRow}>
            <Text style={[styles.historyLabel, { color: subtitleColor }]}>🕘 Riwayat:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {history.map((kota) => (
                <TouchableOpacity
                  key={kota}
                  style={[
                    styles.chip,
                    { borderColor: accentColor + '55' },
                    searchInput === kota && { backgroundColor: accentColor + '44', borderColor: accentColor },
                  ]}
                  onPress={() => setSearchInput(kota)}
                >
                  <Text style={[
                    styles.chipText,
                    { color: subtitleColor },
                    searchInput === kota && { color: '#fff', fontWeight: '700' },
                  ]}>
                    {kota}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={[styles.loadingText, { color: subtitleColor }]}>Mencari cuaca...</Text>
          </View>
        )}

        {/* ── ERROR ── */}
        {error && !loading && (
          <View style={styles.errorCard}>
            <Text style={styles.errorEmoji}>❌</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorSub}>Periksa nama kota dan coba lagi</Text>
          </View>
        )}

        {/* ── HASIL CUACA ── */}
        {weatherData && !loading && !error && (
          <Animated.View
            style={[
              styles.resultCard,
              {
                opacity: fadeAnim,
                backgroundColor: (resolvedIsDay ? bgBot : bgTop) + '55',
                borderColor: accentColor + '44',
              },
            ]}
          >
            {/* Badge siang/malam — sekarang responsif terhadap toggle */}
            <View style={[
              styles.dayBadge,
              { backgroundColor: resolvedIsDay ? '#f59e0b33' : '#7c3aed33',
                borderWidth: 1,
                borderColor: resolvedIsDay ? '#f59e0b88' : '#a78bfa88' }
            ]}>
              <Text style={[styles.dayBadgeText, { color: resolvedIsDay ? '#fcd34d' : '#c4b5fd' }]}>
                {resolvedIsDay ? '☀️ Mode Siang' : '🌙 Mode Malam'}
              </Text>
            </View>

            {/* Kota & Negara */}
            <Text style={styles.cityName}>{weatherData.kota}</Text>
            <Text style={[styles.country, { color: subtitleColor }]}>{weatherData.negara}</Text>

            {/* Emoji cuaca — berubah sesuai mode! */}
            <Text style={styles.emoji}>{currentEmoji}</Text>

            {/* Suhu */}
            <Text style={[styles.temp, { color: resolvedIsDay ? '#fff' : '#e9d5ff' }]}>
              {weatherData.suhu}°C
            </Text>
            <Text style={[styles.weatherLabel, { color: subtitleColor }]}>{info.label}</Text>

            {/* Min/Maks */}
            {weatherData.suhuMax !== null && (
              <View style={[styles.minMaxRow, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                <View style={styles.minMaxBox}>
                  <Text style={styles.minMaxIcon}>🔼</Text>
                  <Text style={styles.minMaxVal}>{weatherData.suhuMax}°</Text>
                  <Text style={[styles.minMaxLbl, { color: subtitleColor }]}>Maks</Text>
                </View>
                <View style={styles.minMaxDivider} />
                <View style={styles.minMaxBox}>
                  <Text style={styles.minMaxIcon}>🔽</Text>
                  <Text style={styles.minMaxVal}>{weatherData.suhuMin}°</Text>
                  <Text style={[styles.minMaxLbl, { color: subtitleColor }]}>Min</Text>
                </View>
              </View>
            )}

            <View style={styles.divider} />

            {/* Angin */}
            <View style={styles.windRow}>
              <Text style={styles.windIcon}>💨</Text>
              <View>
                <Text style={styles.windSpeed}>{weatherData.angin} km/jam</Text>
                <Text style={[styles.windDir, { color: subtitleColor }]}>
                  Arah: {windDir.label} ({windDir.key}) · {weatherData.arahDerajat}°
                </Text>
              </View>
            </View>

            {/* Info data asli dari API */}
            {modeOverride !== 'auto' && (
              <Text style={[styles.apiNote, { color: subtitleColor }]}>
                ℹ️ Data API: {weatherData.isDay ? 'siang hari' : 'malam hari'} di lokasi ini
              </Text>
            )}

          </Animated.View>
        )}

        {/* ── HINT KOSONG ── */}
        {!searchInput && !loading && (
          <View style={styles.center}>
            <Text style={styles.hintEmoji}>{resolvedIsDay ? '🔍' : '🌌'}</Text>
            <Text style={styles.hint}>Mulai ketik nama kota di atas</Text>
            <Text style={[styles.hintSub, { color: subtitleColor }]}>
              Data cuaca real-time tanpa API key
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },

  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  subtitle: { fontSize: 13, marginTop: 4 },

  // ── Toggle Siang/Malam ──
  toggleWrapper: { marginBottom: 18, alignItems: 'center' },
  toggleTitle: { fontSize: 12, marginBottom: 8, fontWeight: '600', letterSpacing: 0.5 },
  toggleTrack: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  toggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  toggleBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  toggleHint: { fontSize: 11, marginTop: 8, textAlign: 'center' },

  // Input
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    color: '#fff',
    marginBottom: 16,
  },

  // Riwayat
  historyRow: { marginBottom: 20 },
  historyLabel: { fontSize: 12, marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipText: { fontSize: 13 },

  // Center
  center: { alignItems: 'center', marginTop: 50 },
  loadingText: { marginTop: 14, fontSize: 14 },
  hintEmoji: { fontSize: 40, marginBottom: 12 },
  hint: { color: '#fff', fontSize: 16, fontWeight: '600' },
  hintSub: { fontSize: 12, marginTop: 6 },

  // Error
  errorCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e05252',
  },
  errorEmoji: { fontSize: 36, marginBottom: 10 },
  errorText: { color: '#ff8080', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  errorSub: { color: '#a0c4e8', fontSize: 12, marginTop: 6 },

  // Result card
  resultCard: {
    borderRadius: 20,
    padding: 28,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1,
  },

  // Badge siang/malam
  dayBadge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 14,
  },
  dayBadgeText: { fontSize: 13, fontWeight: '700' },

  cityName: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center' },
  country: { fontSize: 13, marginTop: 2 },
  emoji: { fontSize: 72, marginVertical: 14 },
  temp: { fontSize: 52, fontWeight: '800' },
  weatherLabel: { fontSize: 16, marginTop: 4 },

  // Min/Maks
  minMaxRow: {
    flexDirection: 'row',
    marginTop: 20,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  minMaxBox: { alignItems: 'center', flex: 1 },
  minMaxIcon: { fontSize: 18 },
  minMaxVal: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 2 },
  minMaxLbl: { fontSize: 11, marginTop: 2 },
  minMaxDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'stretch',
    marginVertical: 20,
  },

  // Angin
  windRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  windIcon: { fontSize: 28 },
  windSpeed: { fontSize: 18, fontWeight: '700', color: '#fff' },
  windDir: { fontSize: 12, marginTop: 3 },

  // Note API
  apiNote: { fontSize: 11, marginTop: 14, fontStyle: 'italic' },
})