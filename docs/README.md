# Fortitude Culina Kitchen Management System

## Introduction

This guide helps new developers set up the Fortitude Culina Kitchen Management System project locally for development. It assumes you're new to Next.js but familiar with JavaScript/TypeScript and already have Supabase (database and storage buckets) set up.

---

## Tech Stack

- **Frontend Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **UI**: React + Tailwind CSS
- **Database**: Supabase SQL
- **Authentication**: Supabase Auth
- **Media Storage**: Supabase Buckets
- **Hosting**: Vercel

---

## Prerequisites

Before starting, make sure the following are installed:

- Node.js v18.x or later
- npm v9.x or later
- Git
- A code editor (VS Code recommended)

---

## 1. Clone the Repository

\`\`\`bash
git clone https://github.com/noelmathewisaac/kitchen-management-system.git
cd kitchen-management-system
\`\`\`

---

## 2. Install Dependencies

We recommend using `pnpm` for faster and more efficient package management.

### Install pnpm (if not already installed)

\`\`\`bash
npm install -g pnpm
\`\`\`

### Install project dependencies

\`\`\`bash
pnpm install
\`\`\`

---

## 3. Set Up Environment Variables

Create a `.env.local` file in the project root and add the following:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
\`\`\`

> These should match the keys from your Supabase project.

---

## 4. Run the Development Server

Start the local server:

\`\`\`bash
pnpm dev
\`\`\`

This will start the Next.js development environment. Open your browser and go to:

\`\`\`
http://localhost:3000
\`\`\`


## 5. Project Structure (Quick Overview)

\`\`\`
fortitude-culina/
├── app/                  # Next.js app router pages
├── components/           # UI and feature components
├── lib/                  # API, context, hooks, utils
├── public/               # Static assets
├── schema/               # SQL schema files
├── scripts/              # CLI and utility scripts
├── supabase/             # Supabase functions
├── .env.local            # Local environment config
├── package.json          # Project dependencies
└── tsconfig.json         # TypeScript configuration
\`\`\`
