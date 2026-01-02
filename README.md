# Gift Tracker
[![Netlify Status](https://api.netlify.com/api/v1/badges/a8de3b03-4a11-48b5-9287-c914c9c49c1c/deploy-status)](https://app.netlify.com/projects/thriving-eclair-3d1906/deploys)

Eine webbasierte Anwendung zur persönlichen Verwaltung von Geschenkideen.  
Der Gift Tracker ermöglicht es, Personen, Anlässe und Geschenkideen strukturiert zu erfassen und pro Benutzer dauerhaft zu speichern.

---

## Funktionen

- Benutzer-Authentifizierung (Registrierung, Login, Logout)
- Personenverwaltung (Name, Geburtstag, Notizen)
- Geschenkideen verwalten
  - Zuordnung zu Personen & Anlässen
  - Status: Idee · Geplant · Gekauft · Überreicht
  - Optionale Links & Bilder
- Übersicht aktueller und vergangener Geschenke

---

## Architektur

- **Frontend:** Nuxt 3 (Vue 3, TypeScript, Nuxt UI)
- **Backend:** Supabase (PostgreSQL, Auth, API)
- **Datenhaltung:** PostgreSQL mit Benutzertrennung
- **Hosting:** lokal / Netlify

---

## Datenmodell (Kurzüberblick)

- **people:** Personen pro Benutzer
- **gifts:** Geschenkideen mit Status & Zuordnung
- **occasions:** Globale Anlässe

---

## Lokale Entwicklung

### Voraussetzungen
- Node.js ≥ 18
- Supabase-Projekt

### Konfiguration

**env**
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=public-anon-key

### Start
- npm install
- pm run dev
- App läuft unter http://localhost:3000