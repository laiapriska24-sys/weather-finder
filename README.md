# WeatherFinder — Pertemuan 10 Praktikum

Aplikasi cuaca real-time React Native + Expo yang
mendemonstrasikan useEffect, debounce, dan integrasi API.

## Fitur
- Cari cuaca berdasarkan nama kota
- Debounce 500ms (hemat request)
- 4 kondisi UI: kosong / loading / error / sukses
- Data dari Open-Meteo (gratis, tanpa API key)

## Konsep yang Dipakai
- useState (4 state), useEffect (dependency array)
- Debounce dengan setTimeout + clearTimeout
- AbortController untuk cleanup & anti race-condition
- Conditional rendering dengan operator &&

## Cara Menjalankan
1. npm install
2. npx expo start
3. Scan QR dengan Expo Go

## Link
- Expo Snack: [https://snack.expo.dev/@priskalaiacio/register]

## Screenshot
![Kondisi Awal](<img width="730" height="1600" alt="WhatsApp Image 2026-06-06 at 08 50 04" src="https://github.com/user-attachments/assets/f09a6155-2804-4535-988f-b55c0b691990" />

)
![Loading](<img width="1080" height="2364" alt="WhatsApp Image 2026-06-06 at 08 50 04 (1)" src="https://github.com/user-attachments/assets/32a5724e-0e9a-4304-976a-2833bc0a0d00" />

)
![Hasil](<img width="730" height="1600" alt="WhatsApp Image 2026-06-06 at 08 50 03" src="https://github.com/user-attachments/assets/c69fb057-cfda-4458-bbfa-959bade1e8a1" />
)

## Author
[Priska] - [243303621230] - Universitas Prima Indonesia
