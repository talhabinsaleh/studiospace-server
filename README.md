# StudioSpace Server

The Express and MongoDB REST API behind [StudioSpace](https://studiospace-talha.vercel.app), a peer-to-peer marketplace for creative studios.

**Client repository:** https://github.com/talhabinsaleh/studiospace-client

## Tech stack

Express 5, TypeScript, MongoDB native driver, jsonwebtoken, cookie-parser, deployed on Vercel.

## Main features

- Studio CRUD with search and category filtering using MongoDB operators such as `$regex`, `$or` and `$in`
- JWT verification from an HTTPOnly cookie, with `401 Unauthorized` on protected routes
- Ownership checks taken from the verified token, never from the request body
- Double-booking prevention using the overlap rule `start < newEnd AND end > newStart`
- Host confirmations run in a MongoDB transaction, so two overlapping requests cannot both be confirmed at once
- Reviews with ratings recalculated through an `$avg` aggregation
- Saved studios wishlist using `$lookup`

## API

| Method | Route | Access |
| --- | --- | --- |
| GET | `/api/studios`, `/api/studios/featured`, `/api/studios/categories` | Public |
| GET | `/api/studios/:id`, `/api/studios/:id/availability`, `/api/studios/:id/reviews` | Public |
| GET | `/api/studios/mine` | JWT |
| POST | `/api/studios`, `/api/studios/:id/reviews` | JWT |
| PUT, DELETE | `/api/studios/:id` | JWT, owner |
| POST | `/api/bookings` | JWT |
| GET | `/api/bookings/mine`, `/api/bookings/host`, `/api/bookings/stats` | JWT |
| PATCH | `/api/bookings/:id/cancel` | JWT, guest |
| PATCH | `/api/bookings/:id/status` | JWT, host |
| GET, POST, DELETE | `/api/wishlist`, `/api/wishlist/:studioId` | JWT |

## Local setup

```bash
git clone https://github.com/talhabinsaleh/studiospace-server.git
cd studiospace-server
npm install
cp .env.example .env   # add your MongoDB URI and JWT secret
npm run seed           # optional: adds demo studios and bookings
npm run dev            # http://localhost:5000
```

`JWT_SECRET` must be the same value on the client and the server.
