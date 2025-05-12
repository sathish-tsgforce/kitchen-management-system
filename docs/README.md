# Fortitude Culina - Recipe Management System

A comprehensive recipe management system for professional kitchens, built with Next.js and Supabase.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## Overview

Fortitude Culina is a recipe management system designed for professional kitchens. It allows chefs to:

- Create and manage recipes with ingredients and steps
- Upload images and record audio for recipe steps
- Calculate ingredient quantities for different serving sizes
- Manage inventory and track ingredient usage
- Process and track orders
- Assign chefs to orders

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18.x or later)
   \`\`\`bash
   # Check if Node.js is installed
   node --version
   
   # If not installed, download from https://nodejs.org/
   \`\`\`

2. **npm** (v9.x or later, comes with Node.js)
   \`\`\`bash
   # Check npm version
   npm --version
   \`\`\`

3. **Git**
   \`\`\`bash
   # Check if Git is installed
   git --version
   
   # If not installed:
   # Windows: Download from https://git-scm.com/download/win
   # macOS: brew install git
   # Linux: sudo apt install git
   \`\`\`

4. **Code Editor** (VS Code recommended)
   - Download from: https://code.visualstudio.com/

## Getting Started

Follow these steps to set up the project locally:

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-username/fortitude-culina.git
   cd fortitude-culina
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

## Environment Setup

1. **Create a Supabase project**
   - Sign up at [Supabase](https://supabase.com/)
   - Create a new project
   - Note your project URL and anon key

2. **Set up environment variables**
   - Create a `.env.local` file in the root directory
   - Add the following variables:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   \`\`\`

3. **Set up the database**
   - Navigate to the SQL editor in your Supabase dashboard
   - Run the SQL scripts from the `schema` folder in the following order:
     1. `users.sql`
     2. `recipes.sql`
     3. `menu-items.sql`
     4. `orders.sql`
   - Run the function scripts from the `supabase/functions` folder:
     1. `decrement_ingredient_quantity.sql`
     2. `increment_ingredient_quantity.sql`

4. **Create storage buckets**
   - In your Supabase dashboard, go to Storage
   - Create a bucket named `fortitude-culina-media`
   - Set the bucket's privacy to "Authenticated users only"
   - Create folders inside the bucket:
     - `recipes/images`
     - `recipes/audio`
     - `menu`

## Running Locally

1. **Start the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - If this is your first time, you'll be redirected to the login page
   - Create a test user using the script:
   \`\`\`bash
   npm run create-test-user
   \`\`\`

3. **Seed the database with test data (optional)**
   \`\`\`bash
   npm run seed-database
   \`\`\`

## Deployment

### Deploying to Vercel

1. **Push your code to GitHub**
   \`\`\`bash
   git add .
   git commit -m "Ready for deployment"
   git push
   \`\`\`

2. **Connect to Vercel**
   - Sign up/in at [Vercel](https://vercel.com/)
   - Click "New Project"
   - Import your GitHub repository
   - Configure the project:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: next build
     - Output Directory: .next

3. **Add environment variables**
   - Add the same environment variables from your `.env.local` file
   - Add any additional environment variables needed for production

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your application will be available at the provided Vercel URL

### Continuous Deployment

Vercel automatically deploys changes when you push to your repository. To set up a custom domain:

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain and follow the instructions

## Project Structure

\`\`\`
fortitude-culina/
├── app/                  # Next.js app router pages
│   ├── api/              # API routes
│   ├── inventory/        # Inventory management pages
│   ├── login/            # Authentication pages
│   ├── menu/             # Menu management pages
│   ├── orders/           # Order management pages
│   ├── recipes/          # Recipe management pages
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── accessibility/    # Accessibility components
│   ├── inventory/        # Inventory components
│   ├── layout/           # Layout components
│   ├── menu/             # Menu components
│   ├── orders/           # Order components
│   ├── providers/        # Context providers
│   ├── recipes/          # Recipe components
│   └── ui/               # UI components
├── docs/                 # Documentation
├── lib/                  # Utility functions and hooks
│   ├── api/              # API functions
│   ├── context/          # Context providers
│   ├── hooks/            # Custom hooks
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── workers/          # Web workers
├── public/               # Static assets
├── schema/               # Database schema SQL files
├── scripts/              # Utility scripts
├── supabase/             # Supabase-specific files
│   └── functions/        # Database functions
├── .env.local            # Local environment variables
├── next.config.js        # Next.js configuration
├── package.json          # Project dependencies
└── tsconfig.json         # TypeScript configuration
\`\`\`

## Troubleshooting

### Common Issues

1. **Supabase Connection Issues**
   - Verify your environment variables are correct
   - Check if your IP is allowed in Supabase dashboard

2. **Database Schema Issues**
   - Run the SQL scripts in the correct order
   - Check for any error messages in the SQL editor

3. **File Upload Issues**
   - Verify the storage bucket exists and has the correct permissions
   - Check the service role key has the necessary permissions

4. **Build Errors**
   - Clear the `.next` folder: `rm -rf .next`
   - Reinstall dependencies: `npm install`

For more help, check the [Development Guide](./DEVELOPMENT.md) or open an issue on GitHub.
\`\`\`

Now, let's create the DEVELOPMENT.md file:
