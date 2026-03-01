# Wealth Orbit

Wealth Orbit is an open-source personal finance and asset management application designed to help you track your net worth, manage liabilities, and precisely plan your journey to Financial Independence, Retire Early (FIRE).
<img width="3173" height="1815" alt="image" src="https://github.com/user-attachments/assets/5757fe97-bfc3-4025-8472-63942400407b" />

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database**: [Prisma ORM](https://www.prisma.io/) with your preferred SQL database
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Charts**: [Recharts](https://recharts.org/)

---

## Running Locally

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- A SQL database (PostgreSQL, MySQL, or SQLite)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/yourusername/wealth-orbit.git
cd wealth-orbit
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory based on the provided `.env.example` (if available), or add the following:
```env
# Database connection string
DATABASE_URL="postgresql://user:password@localhost:5432/wealth_orbit"

# NextAuth Secret (Required even for local development)
# You can generate a random secret by running:
# `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` in your terminal
# or by visiting https://generate-secret.vercel.app/32
NEXTAUTH_SECRET="your_secret_here"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup
Push the database schema and generate the Prisma client:
```bash
npx prisma db push
npx prisma generate
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

---

## Deployment to Vercel

Wealth Orbit is optimized for deployment on Vercel.

1. **Push your code to a GitHub repository.**
2. **Log into Vercel** and click **Add New... > Project**.
3. **Import your GitHub repository**.
4. **Configure Environment Variables**:
   In the Vercel deployment settings, add the following Environment Variables:
   - `DATABASE_URL`: Your production database connection string (e.g., Supabase, Neon, or PlanetScale).
   - `NEXTAUTH_SECRET`: A secure random string for authentication.
   - `NEXTAUTH_URL`: Your production URL (e.g., `https://wealth-orbit.vercel.app`).
5. **Build Command**: Vercel will automatically detect Next.js. Ensure your `package.json` contains a `postinstall` script to generate the Prisma client:
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```
6. Click **Deploy**. Vercel will build and host your application.
