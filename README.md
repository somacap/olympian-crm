# Olympian CRM

Soma Cap's outreach CRM for Olympian candidates. Built with Next.js 16, Tailwind, and Airtable.

## Features
- Browse 733+ olympians with filters (country, source, email status, campaign history)
- Campaign management (queue, send, track replies)
- Airtable as source of truth (fallback-safe)
- Spring 2026 Fellows campaign ($2M uncapped, Apr 1 deadline)

## Setup
```bash
npm install
cp .env.local.example .env.local  # Add your Airtable API key
npm run dev
```

## Deploy
Connected to Vercel. Push to main to deploy.
