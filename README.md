# EAD Platform

A modern and comprehensive e-learning platform built with Next.js 15, React 19, and Supabase.

## 🚀 Features

- **Authentication System**: Secure user registration, login, and password reset
- **Course Management**: Complete course catalog with structured content delivery
- **Student Dashboard**: Personalized learning experience and progress tracking
- **Payment Integration**: MercadoPago integration for course purchases
- **Certificate System**: Digital certificate generation and validation
- **Admin Panel**: Comprehensive administrative tools for platform management
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern Stack**: Built with the latest Next.js 15 and React 19

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Supabase (Database + Authentication + Storage)
- **Payments**: MercadoPago integration
- **PDF Generation**: jsPDF for certificates
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Deployment**: Vercel-ready configuration

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd ead-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase and MercadoPago credentials

# Run development server
npm run dev
```

## 🔧 Environment Setup

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MERCADOPAGO_ACCESS_TOKEN=your_mercadopago_token
```

## 🚀 Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## 📱 Key Features

### For Students
- Course enrollment and progress tracking
- Interactive learning materials
- Certificate generation upon completion
- Payment processing for premium courses
- Personal dashboard with learning analytics

### For Administrators
- Course content management
- Student progress monitoring
- Payment and enrollment tracking
- Certificate management
- User administration

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── api/               # API routes
│   ├── courses/           # Course pages
│   └── payment/           # Payment processing
├── components/            # Reusable components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
└── middleware.js         # Route protection and middleware
```

## 🔒 Security Features

- Row Level Security (RLS) with Supabase
- Protected routes with middleware
- Secure payment processing
- User role-based access control

## 📄 License

This project is private and proprietary.

## 👨‍💻 Developer

**Daryan** - Full Stack Developer

---

Built with ❤️ using Next.js and Supabase