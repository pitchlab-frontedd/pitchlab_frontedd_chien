# Baseball App Frontend

React + Vite frontend for the baseball pitch tendency app.

## Main Files

- `src/App.jsx` - main dashboard page.
- `src/pages/` - page-level views.
- `src/components/` - reusable chart, table, and filter components.
- `src/utils/` - shared filtering and pitch type helpers.
- `public/` - static images and icons served by Vite.
- `dist/` - production build output. This folder is generated and ignored by git.
- `node_modules/` - installed dependencies. This folder is generated and ignored by git.

## Local Development

```bash
npm install
npm run dev
```

The frontend uses the deployed backend by default. To point it at a local backend:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Build

```bash
npm run build
```
