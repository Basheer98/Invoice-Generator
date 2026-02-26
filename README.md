# Invoice Generator

A web app for Indian companies to create GST-compliant invoices. Supports **domestic (India)** and **export (USA)** invoices.

## Features

- **Dashboard** – Overview of total invoiced, recent invoices
- **Create invoices** – Domestic (with GST) or Export (no GST, USD)
- **Invoice list** – Searchable list of all invoices
- **Download PDF** – One-click PDF download
- **Company profile** – Set business and bank details (Settings)
- **Clients** – Save clients when creating invoices, reuse for future invoices

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + SQLite
- NextAuth.js
- jsPDF (PDF generation)

## Requirements

- **Node.js 20+** (Next.js 16 requires Node >= 20.9)

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment** (optional – SQLite works out of the box)
   - Copy `.env.example` to `.env` if you need to customize
   - Default: `DATABASE_URL="file:./dev.db"`
   - For production auth: Set `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32`)

3. **Run migrations** (already done if you just created the project)
   ```bash
   npx prisma migrate dev
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)
   - Create an account
   - Go to **Settings** to add your company details
   - Create your first invoice

## Invoice Types

### Domestic (India)
- Tax Invoice with GST
- CGST + SGST (intrastate) or IGST (interstate)
- HSN codes, place of supply

### Export (USA)
- Invoice for Export of Services
- No GST (zero-rated)
- USD currency
- SWIFT/bank details for wire transfer

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register
│   ├── (dashboard)/     # Dashboard, Invoices, Clients, Settings
│   └── api/             # Auth, Invoices, Company, Clients
├── components/
└── lib/                 # Prisma, Auth
```
