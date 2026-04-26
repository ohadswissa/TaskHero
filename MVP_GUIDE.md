# TaskHero MVP Setup & Connection Guide

This guide explains how to set up the full TaskHero stack, including the backend, mobile app, and how to successfully connect your physical iPhone for the demo recording.

## 🚀 1. Backend Infrastructure (Docker & NestJS)

We use Docker to manage our database and cache.

### Start the Database & Redis
Ensure Docker Desktop is running, then execute:
```bash
docker compose up -d postgres redis
```

### Setup the API
In the `backend` directory, install dependencies and sync the database:
```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```
*Note: The seed command creates a demo user: `demo@taskhero.app` / `password123`.*

---

## 📱 2. Mobile App (Expo)

### Local IP Configuration (CRITICAL for iPhone)
For a physical iPhone to talk to your Mac's backend, we must use the **Local IP Address** instead of `localhost`.

1. **Find your Mac IP**: Go to Settings -> Wi-Fi -> Details (on your connected network). Your IP is likely something like `172.20.10.3`.
2. **Update `.env`**: Make sure `mobile/.env` has:
   ```env
   EXPO_PUBLIC_API_URL=http://172.20.10.3:3000/api/v1
   ```
3. **Internal Fallback**: We also updated `mobile/src/api/client.ts` to use this IP as the default fallback.

### Start Expo
```bash
cd mobile
npx expo start -c
```
*Tip: Use the `-c` flag to clear cache whenever you change `.env` variables.*

---

## 🔗 3. Connecting Your iPhone

To successfully login from your iPhone without "Network Error":

1. **Same Network**: Both Mac and iPhone must be on the **exact same Wi-Fi** or Hotspot.
2. **Backdoor Binding**: The NestJS server is configured in `backend/src/main.ts` to listen on `0.0.0.0`. This is what allows external devices to connect.
   ```typescript
   await app.listen(port, '0.0.0.0');
   ```
3. **Firewall**: Ensure your Mac Firewall is not blocking port `3000`. We verified that Node.js is allowed to accept incoming connections.
4. **No VPN**: Ensure no VPN is active on either device, as they can prevent local subnet discovery.

---

## ✨ 4. Visual Polish (Top Rated App Vibe)

*   **Logo**: We integrated a large, high-fidelity transparent PNG logo.
*   **Layout**: The login screen uses a custom gradient hero section with an animated, oversized mascot logo for maximum impact in the demo recording.
*   **iOS Fixes**: All button truncation and alignment issues specific to iPhone layouts have been resolved.

---

## 🔑 5. Demo Credentials

Use these to showcase the app:
*   **Email**: `demo@taskhero.app`
*   **Password**: `password123`
