# 📺 Stasera In TV — App Android Ufficiale

Applicazione Android nativa ad alte prestazioni per la guida TV di **[intvstasera.it](https://www.intvstasera.it)**.

---

## 📱 Caratteristiche Principali

- **🌙 Stasera in TV**:
  - Palinsesto completo della prima e seconda serata su tutte le reti nazionali, regionali e tematiche.
  - Filtri rapidi per categoria: *Tutti*, *Film*, *Serie TV*, *Sport*, *Intrattenimento*, *Informazione*, *Bambini*, *Documentari*.
  - Locandine ad alta risoluzione (TMDB e broadcaster).
- **🔴 In Onda Ora (Live TV)**:
  - Percentuale di avanzamento dinamica e calcolo in tempo reale dei minuti rimanenti alla fine del programma.
  - Anteprima del programma a seguire (*"A seguire: ..."*).
- **📅 Domani in TV**:
  - Palinsesto completo del giorno successivo.
- **📺 Canali & Emittenti Regionali**:
  - Canali Nazionali del Digitale Terrestre (Rai, Mediaset, La7, Discovery, ecc.).
  - Emittenti Regionali con sede e bacino di copertura (es. *Tele Norba*, *TRM h24*, *Radionorba TV*, *San Marino RTV*, *RSI LA 1/2*).
  - Canali Club Serie A (*Inter TV*, *Milan TV*, *Roma TV*, *Lazio Style*, ecc.).
- **▶️ Dirette Streaming Integrate**:
  - Apertura immediata della diretta streaming ufficiale via Custom Tabs Android (RaiPlay, Mediaset Infinity, NorbaPlay, TRMTV, ecc.).
- **🔔 Promemoria & Notifiche Push Locali**:
  - Notifica automatica **10 minuti prima dell'inizio** del programma desiderato con canale di notifica prioritario Android.
- **💾 Funzionamento Offline & Cache Istantanea**:
  - Salvataggio automatico dei palinsesti in locale tramite `AsyncStorage` per apertura istantanea anche senza connessione.
- **🌓 Dark / Light Mode Nativa**:
  - Tema scuro elegante ottimizzato per schermi OLED e tema chiaro dinamico.
- **🔍 Ricerca Istantanea**:
  - Ricerca rapida per titolo, trama, genere, attori o nome del canale.

---

## 🛠️ Stack Tecnologico

- **Framework**: React Native 0.76 + Expo SDK 52 (TypeScript)
- **UI & Icone**: Lucide Icons (`lucide-react-native`) + React Native Reanimated
- **Notifiche**: `expo-notifications` (canale ad alta priorità per Android)
- **Browser & Streaming**: `expo-web-browser`
- **Cache & Storage**: `@react-native-async-storage/async-storage`

---

## 🚀 Istruzioni per Avviare l'App

### 1. Installazione Dipendenze
```bash
cd stasera-in-tv-app
npm install
```

### 2. Avvio in Modalità Sviluppo
```bash
npx expo start
```
- Inquadra il QR code con l'app **Expo Go** (disponibile gratis su Google Play Store) per testare l'app in tempo reale sul tuo smartphone Android.

---

## 📦 Generazione File APK per Android (Standalone)

Per generare il file `.apk` installabile direttamente su qualsiasi smartphone Android:

### Opzione A: Con EAS Build (Cloud Gratuito Expo)
```bash
# Installa la CLI di EAS se non presente
npm install -g eas-cli

# Login al tuo account Expo
eas login

# Genera l'APK di preview
eas build -p android --profile preview
```
Al termine del processo riceverai il link diretto per scaricare il file `.apk`.

### Opzione B: Compilazione Locale con Android Studio
```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
# Il file APK sarà generato in: android/app/build/outputs/apk/release/app-release.apk
```

---

## 📂 Struttura del Progetto

```
stasera-in-tv-app/
├── App.tsx                      # Entry point con navigazione e provider
├── app.json                     # Configurazione Expo & Android (package, permessi, icone)
├── package.json                 # Dipendenze e script
├── src/
│   ├── api/
│   │   ├── client.ts            # Client HTTP con caching offline AsyncStorage
│   │   └── mockData.ts          # Dati di fallback offline
│   ├── components/
│   │   ├── BottomTabBar.tsx     # Barra di navigazione inferiore
│   │   ├── CategoryFilter.tsx   # Filtri a chip (Film, Sport, Serie...)
│   │   ├── ChannelRow.tsx       # Riga canale con badge territoriale
│   │   ├── EmptyState.tsx       # Gestione stati vuoti / errore
│   │   ├── Header.tsx           # Testata con logo, data, cerca e switch tema
│   │   ├── LiveProgramCard.tsx  # Scheda In Onda Ora con progress bar
│   │   ├── LoadingSkeleton.tsx  # Scheletro di caricamento
│   │   ├── ProgramCard.tsx      # Scheda programma con locandina e azioni
│   │   └── ProgramDetailModal.tsx # Modale dettaglio con trama e promemoria
│   ├── context/
│   │   └── AppContext.tsx       # Gestione stato globale (tema, preferiti, promemoria)
│   ├── screens/
│   │   ├── CanaliScreen.tsx     # Catalogo canali Nazionali / Regionali / Club
│   │   ├── DomaniScreen.tsx     # Guida TV per il giorno successivo
│   │   ├── OraScreen.tsx        # Canali in onda adesso
│   │   ├── PreferitiScreen.tsx  # Preferiti e promemoria attivi
│   │   ├── SearchScreen.tsx     # Ricerca globale
│   │   └── StaseraScreen.tsx    # Homepage stasera in TV
│   ├── services/
│   │   ├── notifications.ts     # Notifiche locali (-10 min)
│   │   ├── storage.ts           # Gestione preferiti e promemoria
│   │   └── streaming.ts         # Lancio streaming live ufficiale
│   ├── theme/
│   │   └── colors.ts            # Palette Dark / Light
│   └── types/
│       └── index.ts             # Interfacce TypeScript
└── assets/                      # Icone, splash screen e adaptive icons
```
