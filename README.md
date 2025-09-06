# 🎓 EduPlatform - Distance Learning System

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

## 🌟 Overview

**EduPlatform** is a comprehensive Learning Management System built with Next.js 15 and Supabase. This project demonstrates modern full-stack development with advanced features for educational institutions.

## ✨ Key Features

### 👨‍🎓 Student Portal
- 🔐 Secure JWT authentication
- 🔍 Advanced search with autocomplete
- 🎥 Video and PDF player integration
- 📊 Progress tracking
- 🏆 Digital certificates
- 💳 Payment integration

### 👨‍🏫 Instructor Dashboard  
- 📚 Course creation and management
- 📁 Multi-format content uploads
- 👥 Student analytics
- 📝 Assessment tools
- 📈 Performance dashboards

### 👨‍💼 Admin Panel
- 🖥️ System management
- 👤 User administration
- 📊 Analytics and reporting
- ⚙️ Configuration management
- 🔍 Audit logging

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Features**: SSR/SSG, Real-time updates, PWA support
- **Security**: Row Level Security, JWT tokens, Input validation

## 🏗️ Architecture

```javascript
// Smart search with client-side indexing
const useSearch = () => {
  const index = useMemo(() => createSearchIndex(courses), [courses])
  return useCallback((query) => index.search(query), [index])
}

// Responsive design pattern
const Component = () => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  return isMobile ? <MobileView /> : <DesktopView />
}
```

## 🚦 Quick Start

```bash
git clone https://github.com/daryanfreelancer/ead-platform-portfolio.git
cd ead-platform-portfolio
npm install
cp .env.example .env.local
npm run dev
```

## 📊 Project Metrics

- 15,000+ lines of code
- 50+ React components  
- 30+ API endpoints
- 12 database tables
- Mobile-responsive design

## 👨‍💻 Developer

**Daryan Silva** - Full Stack Developer

- 📧 [daryanfreelancer@gmail.com](mailto:daryanfreelancer@gmail.com)
- 💼 [LinkedIn](https://linkedin.com/in/daryansilva)

---

⭐ **Star this repo if you find it interesting!**

*Built with ❤️ using Next.js, React, and Supabase*
