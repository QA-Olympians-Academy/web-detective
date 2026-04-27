# web-detective

A React + TypeScript ecommerce app with login and a sales/revenue dashboard.

## Prerequisites

- Node.js 18+
- npm 9+

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Demo credentials**

| Field    | Value               |
|----------|---------------------|
| Email    | admin@shop.com      |
| Password | password123         |

## Pages

| Route        | Description                                  |
|--------------|----------------------------------------------|
| `/login`     | Login form (redirects to dashboard on auth)  |
| `/dashboard` | Stat cards, monthly sales bar chart, revenue line chart |
| `/products`  | Product list with live search and stock badges |

## Scripts

| Command           | Description                        |
|-------------------|------------------------------------|
| `npm run dev`     | Start dev server on port 5173      |
| `npm run build`   | Type-check + production build      |
| `npm run preview` | Serve the production build locally |

## Stack

- **React 18** + **TypeScript**
- **Vite 5** — dev server & bundler
- **React Router v6** — client-side routing
- **Recharts** — bar and line charts
