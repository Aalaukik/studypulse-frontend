# 📚 StudyPulse — Personal Study Operating System

> The single tool a student opens at the start of every study session.

![StudyPulse](https://img.shields.io/badge/version-1.0.0-emerald) ![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3-teal) ![Vite](https://img.shields.io/badge/Vite-6-purple)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **Goal Manager** | Create, prioritise, and track study goals by subject |
| 🧠 **Spaced Repetition** | SM-2 algorithm schedules reviews at optimal intervals |
| 📅 **Exam Planner** | Countdown + auto-distributor for exam preparation |
| ⏱️ **Pomodoro Timer** | Focus/Break timer with quality tracking |
| 🏥 **Subject Health** | Visual health scores showing neglected subjects |
| 🔥 **Streak System** | Daily consistency tracker + weekly score |
| 📖 **Mistake Journal** | Log errors → auto-creates review cards |
| ⚡ **Energy Journal** | Correlate energy levels with focus quality |
| 📊 **Time Audit** | Planned vs actual study time per subject |
| 📄 **Past Paper Tracker** | Track scores and frequent exam topics |
| 🏆 **XP & Levels** | Gamified progress with challenge mode |
| ⭐ **Weekly Review** | Auto-generated Sunday progress reports |

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open http://localhost:5173
```

## 🏗️ Build & Deploy

```bash
# Build for production
npm run build

# Deploy to Vercel (one command)
npx vercel --prod

# Preview production build locally
npm run preview
```

---

## 📁 Project Structure

```
src/
├── types/                    # TypeScript interfaces
│   └── index.ts              # All entity types (User, Goal, Exam, etc.)
├── store/
│   └── index.ts              # Zustand global store with localStorage persist
├── utils/
│   └── index.ts              # SM-2 algorithm, health scores, helpers
└── components/
    ├── shared/
    │   ├── index.tsx          # Card, Modal, Badge, Toast, etc.
    │   ├── Sidebar.tsx        # Navigation sidebar
    │   ├── Onboarding.tsx     # First-run wizard
    │   └── OtherViews.tsx     # Time Audit, Past Papers, XP, Weekly Review
    ├── dashboard/             # Main dashboard
    ├── goals/                 # Goal manager
    ├── pomodoro/              # Focus timer
    ├── spaced-repetition/     # Review deck
    ├── exam-planner/          # Exam countdown
    ├── subject-health/        # Health dashboard
    ├── streak/                # Streak tracker
    ├── mistake-journal/       # Mistake log
    └── energy-journal/        # Energy tracker
```

---

## 🏗️ Architecture (Mobile-Ready)

The codebase is designed for future React Native migration:

- **`src/store/`** — 100% reusable in React Native (Zustand is platform-agnostic)
- **`src/utils/`** — 100% reusable (pure functions, no DOM)
- **`src/types/`** — 100% reusable (TypeScript interfaces)
- **`src/components/`** — Needs React Native equivalents (View, Text, StyleSheet)

See `DEPLOYMENT_GUIDE.md` for the full mobile migration plan.

---

## 🛠️ Tech Stack

- **React 18 + TypeScript** — Component model with type safety
- **Tailwind CSS** — Utility-first styling
- **Zustand + persist** — State management with auto localStorage sync
- **Recharts** — Charts and analytics
- **date-fns** — Date arithmetic (SM-2 scheduling)
- **Lucide React** — Icon library
- **Vite** — Fast builds and HMR

---

## 📱 Target Users

- Secondary school students (ages 14–18) preparing for board exams
- Undergraduate students managing multiple subjects
- Self-learners and competitive exam aspirants

---

## 📋 Roadmap

**v1.0** ✅ Current release
- All 13 core features
- Beautiful dark UI with glassmorphism
- Offline-first with localStorage

**v1.1** 🔜 Next release
- Concept Map Builder (React Flow)
- Syllabus Importer (text paste → auto-populate)
- Resource Linker (URLs + notes per topic)
- PDF export for Weekly Review

**v2.0** 🔮 Future
- User accounts + cloud sync
- Study groups + friend leaderboards
- React Native mobile app

---

*Built with ❤️ — StudyPulse v1.0*
