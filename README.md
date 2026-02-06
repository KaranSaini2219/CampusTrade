# CampusTrade NITJ

A production-ready MERN marketplace for **NIT Jalandhar students only**. Buy and sell items within campus, chat to arrange meetups, meetup + cash only. No online payments.

## Features

- **Public**: Browse listings, search, filter by category, sort by price/date
- **Auth**: Login/Register with @nitj.ac.in email only
- **Listings**: Create, edit, delete, mark sold, save/unsave
- **Chat**: One-to-one realtime chat with Socket.IO
- **Reporting**: Report inappropriate listings
- **Admin**: Ban users, remove listings, view reports and block logs
- **Content Filter**: Auto-blocks illegal items (alcohol, drugs, weapons, etc.)

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, React Router, Axios, Socket.io-client
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, Socket.IO, Cloudinary/multer

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone and install

```bash
cd campustrade-nitj
npm run install:all
```

### 2. Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `ALLOWED_EMAIL_DOMAINS` | Comma-separated, e.g. `nitj.ac.in` |
| `CLIENT_URL` | Frontend URL, e.g. `http://localhost:5173` |

Optional (for image uploads):

| Variable | Description |
|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

Without Cloudinary, images are stored locally in `server/uploads/`.

### 3. Run locally

**Terminal 1 – Server:**
```bash
cd server && npm run dev
```

**Terminal 2 – Client:**
```bash
cd client && npm run dev
```

Or from root (concurrently):
```bash
npm run dev
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:5000

### 4. Seed (optional)

```bash
npm run seed
```

Creates admin (`admin@nitj.ac.in` / `admin123`) and sample user/listings.

---

## Deployment

### Frontend (Vercel)

1. Push repo to GitHub.
2. Import project in [Vercel](https://vercel.com).
3. Root directory: `client`.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add env: `VITE_API_URL` = your backend URL (if using separate API URL).

### Backend (Render / Railway)

1. Create new Web Service.
2. Root directory: `server`.
3. Build: `npm install`.
4. Start: `npm start`.
5. Add env vars: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `ALLOWED_EMAIL_DOMAINS`, Cloudinary vars.

### MongoDB Atlas

1. Create cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Database Access → Add user.
3. Network Access → Add IP (or `0.0.0.0/0` for development).
4. Connect → copy connection string → set `MONGODB_URI`.

### Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com).
2. Dashboard → copy Cloud Name, API Key, API Secret.
3. Add to backend `.env`.

### Post-deploy

- Set `CLIENT_URL` on backend to your Vercel frontend URL.
- Set CORS to allow your frontend origin.
- For Socket.IO, ensure client connects to the deployed API URL.

---

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | - | Register (college email only) |
| POST | /api/auth/login | - | Login |
| GET | /api/auth/me | ✓ | Current user |
| GET | /api/listings | - | List listings (search, filter, sort) |
| GET | /api/listings/:id | - | Listing detail |
| POST | /api/listings | ✓ | Create listing |
| PUT | /api/listings/:id | ✓ | Update listing |
| DELETE | /api/listings/:id | ✓ | Delete listing |
| POST | /api/listings/:id/save | ✓ | Toggle save |
| POST | /api/listings/:id/mark-sold | ✓ | Mark sold |
| GET | /api/chats | ✓ | User chats |
| POST | /api/chats/start | ✓ | Start chat |
| GET | /api/chats/:id/messages | ✓ | Chat messages |
| POST | /api/chats/:id/messages | ✓ | Send message |
| POST | /api/reports | ✓ | Report listing |
| GET | /api/admin/users | Admin | List users |
| PUT | /api/admin/users/:id/ban | Admin | Ban/unban user |
| DELETE | /api/admin/listings/:id | Admin | Remove listing |
| GET | /api/admin/reports | Admin | List reports |

---

## Project Structure

```
campustrade-nitj/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── main.jsx
│   └── ...
├── server/                 # Express backend
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── utils/
│   └── index.js
├── .env.example
└── README.md
```

---

## Disclaimer

Only legal items allowed. Admins may remove listings. Platform is for NIT Jalandhar students only.
