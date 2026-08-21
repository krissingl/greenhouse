# Greenhouse

> Plant interests. Explore barriers. Learn what grows.

# Overview

Greenhouse is a local-first personal enrichment application designed to help users manage a backlog of interests, hobbies, projects, and experiences they wish to pursue.

The application helps users identify barriers to participation ahead of time, organize activities based on their real-world requirements, and receive recommendations based on their current circumstances.

Greenhouse is not intended to increase productivity, optimize performance, or encourage goal completion.

Its purpose is to help users spend their limited free time on activities that are accessible, meaningful, and fulfilling.

# Problem Statement

The user has a large and constantly growing collection of interests, hobbies, projects, and experiences they would like to pursue.

Examples include:

- Learning violin
- Voice acting
- Painting
- Game design
- Home improvement projects
- Professional certifications
- Creative pursuits

When free time becomes available, selecting an activity often becomes overwhelming.

Even after selecting an activity, hidden barriers frequently prevent immediate participation:

- Required supplies are unavailable.
- Necessary stores are closed.
- The activity requires more time than is currently available.
- The activity can only be performed in a specific location.
- The activity requires more energy or focus than the user currently has.

The effort required to determine what is possible often exceeds the motivation available to begin.

As a result, the user frequently spends free time deciding what to do rather than doing something they genuinely enjoy.

# Vision

Greenhouse helps users answer a simple question:

> What would I enjoy doing right now that I can actually start right now?

The application should reduce decision fatigue, surface realistic options, and help users better understand which activities create lasting fulfillment.

# Target User

## Primary User

The product is initially designed for a single user with:

- Many hobbies and interests
- Limited free time
- Frequent decision paralysis when selecting activities
- A desire to better understand what creates personal fulfillment

## Future Users

Future versions may support users with similar behavioral patterns, but v1 is explicitly optimized for the author's personal workflow and needs.

# Product Principles

## Fulfillment Over Productivity

Greenhouse exists to support fulfillment, enjoyment, curiosity, and enrichment.

The application does not exist to maximize output, efficiency, achievement, or measurable productivity.

## Curiosity Without Obligation

Adding an activity should feel like planting a seed, not creating a commitment.

Activities are opportunities, not obligations.

Users should never feel guilty about unfinished activities.

## Reduce Activation Energy

The application should help users identify barriers before they are ready to begin.

When motivation becomes available, the user should be able to start quickly and confidently.

## Reality-Based Recommendations

Recommendations should be based on the user's current circumstances.

The system should prioritize what is realistically achievable right now.

## Reflection Over Performance

The application should help users learn about themselves.

Insights should focus on fulfillment and personal patterns rather than performance metrics.

# Running the App Locally

Greenhouse runs in Expo Go on an Android emulator. There is no custom native code, so no `expo prebuild` or Gradle build is needed.

## Everyday loop

Open a **new** terminal (see "Environment" below for why) and run:

```powershell
emulator -avd greenhouse_pixel7    # skip if the emulator is already running
npm run android                    # starts Metro and opens the app in Expo Go
```

The first `npm run android` after a fresh emulator wipe installs Expo Go automatically. Fast Refresh is on — save a file and the emulator reloads. Leave both processes running while you work.

## Ending a test session

```powershell
adb emu kill      # graceful emulator shutdown
```

Then `Ctrl+C` the Metro process. Shut the emulator down first so Metro does not spam reconnect errors.

Use `adb emu kill` rather than closing the emulator window — it lets Android write its snapshot, so the next boot takes seconds instead of cold-booting, and it avoids leaving a stale lock file that makes the next launch report the AVD is already in use.

If a launch ever does complain the AVD is in use after a crash:

```powershell
Remove-Item C:\Users\Kay\.android\avd\greenhouse_pixel7.avd\*.lock -Recurse -Force
```

## Useful while testing

```powershell
adb devices                                   # confirm the emulator is attached
adb shell screencap -p /sdcard/s.png; adb pull /sdcard/s.png   # capture the screen
adb logcat -d -t 200 | Select-String ReactNative               # recent app logs
adb shell input keyevent 4                    # back button (dismisses the Expo dev menu)
```

Shake gesture equivalent — open the Expo dev menu: `adb shell input keyevent 82`.

The app stores data in SQLite **inside the emulator**, so it persists across reloads and restarts. To start from an empty database, wipe the AVD:

```powershell
emulator -avd greenhouse_pixel7 -wipe-data
```

## Environment

Local machine setup (already done, documented here for rebuilds):

| | |
|---|---|
| SDK | `C:\Android\Sdk` — CLI-only, no Android Studio |
| AVD | `greenhouse_pixel7` — Pixel 7, API 36 (Android 16), x86_64 |
| JDK | 17 — `sdkmanager` requires 17+, so `JAVA_HOME` must point at it |
| Acceleration | WHPX. Requires AMD SVM (or Intel VT-x) **enabled in BIOS** plus the "Windows Hypervisor Platform" Windows feature. Verify with `emulator -accel-check`. |

`ANDROID_HOME`, `ANDROID_SDK_ROOT`, and the PATH entries for `platform-tools` / `emulator` / `cmdline-tools\latest\bin` are set at **User** scope. Terminals opened before they were set will not see them — that is why the loop above says to open a new one.

If you get `The term 'adb' is not recognized` (or the same for `emulator`), that is a stale terminal, not a broken install. Either open a new terminal, or refresh the current one in place:

```powershell
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
```

Full paths always work regardless: `C:\Android\Sdk\platform-tools\adb.exe`, `C:\Android\Sdk\emulator\emulator.exe`.

## Web preview

Deliberately not set up. `expo-sqlite` behaves differently on web, so a browser build would give false confidence about anything touching data. The emulator is the source of truth.

# Checks

```powershell
npm test          # Jest (jest-expo preset)
npm run typecheck # tsc --noEmit
npm run lint      # eslint
npm run format    # prettier --write
```
