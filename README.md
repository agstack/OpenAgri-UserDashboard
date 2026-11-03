# OpenAgri-UserDashboard
A user-friendly graphical interface that exposes the functionality of the OpenAgri services. 
🇪🇺
*"This service was created in the context of OpenAgri project (https://horizon-openagri.eu/). OpenAgri has received funding from the EU’s Horizon Europe research and innovation programme under Grant Agreement no. 101134083."*


The objective of the OpenAgri Dashboard is to act as a user-friendly graphical interface (GUI) that will serve the needs of the farmers/advisors. The offered functionalities will be based on the combined use of the core OpenAgri services e.g. farm calendar, reporting service, weather service, irrigation service and pest and disease management service.


The OpenAgri Dashboard ensures a quick, seamless, and engaging user experience. In more details, the OpenAgri Dashboard will: 

 - Deliver a smooth UX even in poor network conditions. 
 - Will work offline, load quickly, and feel like native mobile apps
 - Perform faster load times, better user engagement, and no need for users to download an app from the store. 


The technology selected for the development of the GUI complies with [Progressive Web App](https://developer.chrome.com/blog/getting-started-pwa) (PWA) type of web applications that native app-like experience to users, using web technologies. This ensures maximum compatibility with desktop, tablets and smart phones with reduced development effort.  
Progressive web apps are typically built on top of web technologies such as HTML, CSS, JavaScript, and on top of joint open-source projects, such as React Native and Angular Ionic. 
In the case of the OpenAgri project the React open-source front-end JavaScript library will be used. It should be noted that React supports the development of PWA. 

# License
This project code is licensed under the Apache 2.0 license, see the LICENSE file for more details.
Please note that each service may have different licenses, which can be found their specific source code repository.

# Prerequisites
To run this web application locally, [Node.js](https://nodejs.org/) needs to be installed on your machine. The application was generated using [Vite PWA](https://vite-pwa-org.netlify.app/guide/) with Node version `22.17.0`. Make sure that your Node version is not older than this.

# Running
Simply by cloning this repository and navigating into it, first install the node modules using the `npm install` command. After this the web application can be run via the `npm run dev` command. The application will be available at: [http://localhost:5173/](http://localhost:5173/)

# Installation and Building
To install dependencies run `npm install`

Building the application is also a very simple task, running the `npm run build` command will put all of the static files into the newly generated `dist` folder.

# Docker
To application using docker use the following commnad

```
docker build -t openagri-dashboard .
```

Run

```
docker run --rm -it -p 80:80 openagri-dashboard
```

You can now visit the page [http://127.0.0.1](http://127.0.0.1) to access the WEB Dashboard

# Using as a PWA
The dashboard is a Progressive Web App, so it can be installed and run like a native app on desktop and mobile, with offline support for the app shell.

A service worker is registered automatically (`registerType: 'autoUpdate'`), so an installed app silently updates to the latest version on the next launch.

### Runtime caching
The service worker also caches API responses to keep the dashboard usable on poor or absent network. Strategies per endpoint group:

| Cache | Strategy | TTL | Scope |
|---|---|---|---|
| `oa-reference` | StaleWhileRevalidate | 7 days | Global catalogs (activity types, crops, diseases, threat models, soil types, ETo option types) |
| `oa-user-semi` | NetworkFirst (5s timeout) | 1 day | User-scoped semi-static (Farm, FarmParcels, FarmAnimals, AgriculturalMachines, Pesticides, Fertilizers, `me/`) |
| `oa-user-live` | NetworkFirst (3s timeout) | 1 hour | User-scoped live data (FarmCalendarActivities, Observations, Alerts, CompostOperations, IrrigationOperations, irrigation datasets/calculations) |
| `oa-forecast` | CacheFirst | 30 min | Weather/risk forecasts |

User-scoped caches (`oa-user-*`) are wiped on sign-out to prevent cross-user data leak on the same device. Reference and forecast caches survive.

> **Offline writes are NOT supported yet.** Mutations (POST/PATCH/DELETE) bypass the service worker entirely — they fail without a live connection. A future round will add Workbox Background Sync to queue mutations and replay them on reconnect.

An `OfflineChip` appears in the toolbar whenever `navigator.onLine` reports offline, with a tooltip explaining that data shown may be stale and submissions will fail.

> **Note:** Installing requires a secure context — HTTPS, or `localhost` during local development. Plain `http://<ip>` over the LAN will not offer installation.

### Install
- **Desktop (Chrome/Edge):** click the install icon at the right of the address bar, or open the ⋮ menu → *Install OpenAgri-UserDashboard…*
- **Android (Chrome):** ⋮ menu → *Install app* / *Add to Home screen*
- **iOS (Safari):** Share → *Add to Home Screen*

The installed app launches in its own standalone window using the OpenAgri logo as its icon.

### Regenerating icons
App icons (favicon, Apple touch icon, and the `pwa-*`/`maskable` PNGs) are generated from `public/logo.png`. After changing that image, regenerate them with:

```
npm run generate-pwa-assets
```

### Testing on a mobile device
The production build (`npm run build` + `npm run preview`) serves the service worker reliably (the dev server's is best-effort). To install on a phone you need an HTTPS origin:

- **Android:** Chrome `chrome://inspect` → *Port forwarding* maps the phone's `localhost:4173` to your machine — this counts as a secure context and keeps the same origin the backend expects.
- **Any device:** expose the preview over an HTTPS tunnel, e.g. `npx cloudflared tunnel --url http://localhost:4173`. Tunnel hostnames are already allowed in `vite.config.ts` (`preview.allowedHosts`). Note that API calls still require the tunnel origin to be on the backend's CORS allow-list.
