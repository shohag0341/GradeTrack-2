# 🎓 GradeTrack - GPA & CGPA Management Telegram Mini App

![GradeTrack Banner](https://img.shields.io/badge/GradeTrack-v1.0.0-7C5CFF?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Telegram%20Mini%20App-26A5E4?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)
![Tech](https://img.shields.io/badge/Tech-Vanilla%20JS-F7DF1E?style=for-the-badge)

---

## 📱 Overview

**GradeTrack** is a modern, feature-rich GPA and CGPA management application built specifically for Telegram Mini App platform. Designed for university and college students, it provides a beautiful, intuitive interface to track academic performance with precision.

### ✨ Key Features

- 📊 **Dashboard** - Beautiful AMOLED dark theme with glassmorphism design
- 🧮 **GPA Calculator** - Real-time GPA calculation with unlimited courses
- 📈 **CGPA Calculator** - Overall CGPA tracking across all semesters
- 📚 **Semester Management** - Organize courses by semester with expand/collapse
- 🎯 **Target CGPA** - Calculate required GPA to achieve your goals
- 📉 **Trend Analysis** - Visual GPA trends with Chart.js
- 💾 **Cloud Storage** - Supabase backend for data persistence
- 📤 **Export/Import** - JSON backup and restore functionality
- 🎨 **Beautiful UI** - Apple-inspired design with purple gradient theme
- 📱 **Telegram Native** - Full Telegram WebApp SDK integration

---

## 🚀 Quick Start

### Prerequisites

1. **Telegram Bot Token** from [@BotFather](https://t.me/BotFather)
2. **Supabase Account** (Free tier) - [supabase.com](https://supabase.com)
3. **Web Server** - Any static file hosting (GitHub Pages, Vercel, Netlify, etc.)

### Setup Instructions

#### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the SQL from `database.sql`
3. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public key`

#### 2. Telegram Bot Setup

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. Create a new bot: `/newbot`
3. Set bot name and username
4. Save the **Bot Token**
5. Set up Mini App: `/setmenubutton`

#### 3. Configure the App

1. Open `supabase.js`
2. Update the configuration:

```javascript
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
};
