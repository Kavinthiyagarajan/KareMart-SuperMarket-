# Smart Grocery Application

A full-stack modern e-commerce application built with Next.js, Spring Boot, and PostgreSQL.

## 1. Architecture
- **Frontend**: Next.js 14+ (App Router), Tailwind CSS, Zustand, React Query. Uses a standalone production build for Docker.
- **Backend**: Spring Boot 3, Spring Security (JWT), Hibernate, Flyway.
- **Database**: PostgreSQL 16 for robust relational data mapping, reservations, and history.

## 2. Local Native PostgreSQL Setup
1. Install PostgreSQL 16 locally.
2. Create a database named `supermarket`.
3. The application will automatically create and migrate schemas using Flyway on startup.

## 3. Environment Variables
### Backend
- `DB_HOST`, `DB_PORT`, `DB_NAME` (default: `localhost`, `5432`, `supermarket`)
- `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET` (Must be set securely in production, defaults in dev)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `PAYMENT_PROVIDER` (mock, razorpay), `DELIVERY_PROVIDER` (mock)

### Frontend
- `NEXT_PUBLIC_API_URL` (default: `http://localhost:8080/api`)

## 4. Backend Startup
From the `backend` directory:
```bash
./mvnw spring-boot:run
```

## 5. Frontend Startup
From the `frontend` directory:
```bash
npm install
npm run dev
```

## 6. Test Command
```bash
# Backend tests
mvn clean test

# Frontend build check
npm run build
```

## 7. Mock Catalog Synchronization
In development mode, press `Shift + D` in the frontend to access the Demo Hub, then click "Seed Catalog". This synchronizes 20-30 varied items (Produce, Dairy, Snacks) into the database. (Requires ADMIN token if API hit directly).

## 8. Admin Access
Register a user normally, then manually update their role to `ADMIN` in the database, or use the dev mode Demo Hub to switch roles instantly for UI testing.

## 9. Mock Payment
By default, the backend uses `PAYMENT_PROVIDER=mock`. Selecting "Cash on Delivery" or triggering mock verification will instantly confirm the order.

## 10. Razorpay Test Configuration
To use Razorpay, set `PAYMENT_PROVIDER=razorpay` and provide `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from your Razorpay test dashboard. Transactions will be processed in test mode.

## 11. Mock Delivery
By default, `DELIVERY_PROVIDER=mock`. The delivery service will mock realistic status transitions in memory (Order Placed -> Packed -> Shipped -> Delivered) every few seconds during local testing.

## 12. Docker Deployment
```bash
docker-compose up --build -d
```
This boots Postgres, the Spring Boot API, and the optimized Next.js standalone runner.

## 13. Production Limitations
- No automatic rate-limiting stack (like Redis/Bucket4j) is currently configured.
- Static images rely on external URLs (Unsplash) instead of an S3/Cloudfront CDN.
- Real-time order tracking relies on client polling; WebSockets are not configured.

## 14. Backup Requirement
PostgreSQL is the source of truth for inventory, payments, and order history.
**Action Required:** You MUST configure automated database backups (e.g., `pg_dump` cron jobs or managed AWS RDS backups) before deploying to a live production environment. Data loss will result in irrecoverable order states.
