# SmartTrip AI Flutter app

The Flutter app provides trip search, journey comparison, and Firebase email/password authentication for SmartTrip AI.

## Run locally

Start the backend stack from `smarttrip/` first:

```powershell
docker compose up -d --build
```

Then run the Flutter application:

```powershell
cd "D:\projects\Smart Trip AI\smarttrip\frontend"
$env:Path = "C:\flutter_all_files\flutter\bin;$env:Path"
flutter run
```

The Android emulator uses `http://10.0.2.2:8000` automatically. Windows and web use `http://localhost:8000`. Override the API address for a physical device when required:

```powershell
flutter run --dart-define=API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8000
```

## Firebase Authentication

The Android application ID is `com.ashutoshsingh220.smarttripai`.

1. Register that exact Android package name in Firebase.
2. Download `google-services.json`.
3. Place it at `android/app/google-services.json`. It is ignored by Git.
4. In Firebase Authentication, enable **Email/Password** sign-in.

Then the account button in the app can create an account and sign users in. Do not commit or share `google-services.json`.

## Quality checks

```powershell
flutter analyze
flutter test
```
