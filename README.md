# TimeIsMoney

A small price-to-hours calculator: enter a price and see how long it takes the
median U.S. full-time worker to earn it. Built as one responsive web app that is
both an installable **progressive web app** and a signed **Android APK**.

Current version: **0.01**.

The app is intentionally dependency-free at runtime. It works offline, makes no
network requests, and keeps everything on the device.

## What it shows

With the latest BLS figures used in this build:

| Input | Result |
| --- | --- |
| Median weekly earnings, full-time wage and salary workers, Q3 2026 | **$1,232 / week** |
| Assumed full-time week | **40 hours** |
| Median hourly equivalent | **$30.80 / hour** |
| Price of **$200.45** | **6h 30m** of gross pay |

The calculation is:

```text
price ÷ (weekly median earnings ÷ 40 hours)
```

The headline duration is rounded to the nearest minute. The app also shows
decimal hours, 8-hour workdays, 40-hour workweeks and years of full-time work
(counting a full-time year as 2,080 hours).

## Data source

- **U.S. Bureau of Labor Statistics** — *Usual Weekly Earnings of Wage and
  Salary Workers*, Q3 2026.
- Series `LEU0252881500`: median usual weekly earnings of full-time wage and
  salary workers, 16 years and over, not seasonally adjusted.
- Release: <https://www.bls.gov/news.release/wkyeng.htm>
- Series: <https://data.bls.gov/timeseries/LEU0252881500>

These are gross, pre-tax earnings. They include overtime, commissions and tips
at the worker's main job, and exclude self-employed workers. BLS defines
full-time as 35 hours or more; this app uses a standard 40-hour week for the
hourly conversion. This is a national benchmark, not a personal salary estimate.

Refresh the embedded figures from the BLS public API with:

```bash
npm run update-data
```

The script updates `src/data.js`; rebuild afterwards.

## Run the PWA locally

```bash
npm install
npm test
npm run build
npm run serve -- dist
```

Open <http://localhost:8000/>. The install button appears in browsers that
support PWA installation. To deploy, upload the contents of `dist/` to any
static HTTPS host. All URLs are relative, so it also works from a subdirectory.

## Build the Android APK

The APK is a WebView wrapper around the same `dist/` build, signed with a release
keystore. No Android SDK, JDK or Gradle is required — this uses
[`goapk`](https://github.com/zapstore/goapk).

```bash
npm run apk
```

Output: `build/TimeIsMoney-0.01.apk`

The first build creates `keystore.p12` and `.keystore-password` locally. Keep
both for future releases so Android can update the app in place. They are
ignored by Git.

Override the package or version with environment variables:

```bash
PACKAGE=com.example.timeismoney VERSION_NAME=0.02 VERSION_CODE=2 npm run apk
```

## Development

```bash
npm run serve        # serve the source tree at http://localhost:8000/
npm run icons        # regenerate PNG icons from the SVG sources (needs rsvg-convert)
npm test             # unit, DOM and PWA checks
```

## Project layout

```text
index.html               app shell
styles.css               responsive UI
manifest.webmanifest     PWA manifest
sw.js                    offline app-shell cache
src/core.js              parsing and price-to-hours math
src/app.js               DOM wiring and display states
src/data.js              BLS benchmark data
icons/                   source SVGs and generated PNGs
scripts/build.mjs        builds dist/
scripts/build-apk.sh     builds and signs the APK
scripts/update-bls.mjs   refreshes data from the BLS API
test/                    node:test suites
```

## Security

Report vulnerabilities privately. See [SECURITY.md](SECURITY.md) for the
contact address, PGP key and disclosure policy.

## License

MIT
