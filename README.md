# AuraFrame POS - Frontend Web App (posterFE)

Mobile-First React + Vite + Tailwind POS (Point of Sale) and Inventory Web Application for poster & frame businesses.

## Features
- **3-Tap Fast POS Checkout**: Real-time product search, category and size filtering, dynamic cart drawer, quick discount input, customer search/quick-add.
- **Dynamic UPI QR Generation**: Generates client-side QR codes via `qrcode.react` with exact payable amount, merchant name, and sale reference.
- **WhatsApp Share Receipt**: One-tap shareable receipt URL formatted for WhatsApp messaging.
- **Visual Business Analytics**: Interactive Recharts dual area graphs for revenue vs. profit over time, sales by size and category breakdown, and top-selling products.
- **Live Inventory Health**: Stock status indicators (Healthy, Low, Out), low-stock alert banner, and inline 1-click restock modals.
- **Product Catalog Management**: Create & edit products with image uploads and real-time margin percentage preview.
- **Customer CRM**: Buyer directory with purchase history, lifetime spend, and WhatsApp direct link.
- **QR Studio**: Printable/downloadable branded Instagram poster QR card & tabletop counter UPI standee.
- **Dark Mode & Aesthetics**: Sleek modern UI with glassmorphism, responsive bottom nav on mobile, and dark/light mode toggle.

## Tech Stack
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **QR Codes**: `qrcode.react`
- **Celebration Effects**: `canvas-confetti`

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables (.env)
```env
VITE_API_URL=/api
```
*(In production, set `VITE_API_URL` to your backend URL e.g. `https://posterbe.onrender.com/api`)*

### 3. Start Development Server
```bash
npm run dev
```
Runs the Vite development server on `http://localhost:5173` with automatic API proxying to `http://localhost:5001`.

### 4. Build for Production
```bash
npm run build
```

## Deploying to Vercel

1. Push your `posterFE` repository to GitHub (`https://github.com/Muthuvel-M/posterFE.git`).
2. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import the `posterFE` repository.
4. Select **Vite** as the Framework Preset.
5. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com/api`
6. Click **Deploy**.
