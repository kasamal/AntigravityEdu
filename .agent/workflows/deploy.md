---
description: How to build and deploy the application
---

1. Build the application for production:
// turbo
```powershell
npm run build
```

2. The output will be in the `dist` folder. You can:
   - Upload the contents of `dist` to any static hosting service (Netlify, Vercel, S3).
   - Zip the `dist` folder for manual distribution.
   - For local sharing with Node.js:
     ```powershell
     npx serve dist
     ```
