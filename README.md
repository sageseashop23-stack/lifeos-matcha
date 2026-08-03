# 🌸 LifeOS Mini (Matcha Life & Cycle Companion)

A highly responsive, mobile-first companion application combining a **3-Lens Lifecycle Calendar**, **Side-by-Side Private Journal & Custom Mood Editor**, **Menstrual Cycle Tracker**, and **Looking Back Analytical Dashboard**. It is designed with clean typography, smooth layout transitions powered by `motion`, and offline-first persistence with optional personal cloud sync.

---

## 🎨 Design Philosophy
* **Aesthetic & Mood:** Calming, tactile tones inspired by organic Matcha greens (`#97b58e`), warm slate backgrounds (`#5D524F`), and soft off-white surfaces (`#FAF0EC`).
* **Typography:** Elegant display typography paired with clean, readable monospaced layout elements for indicators.
* **Touch & Mobile First:** Pinned sidebar and top tab navigation optimizing access for touch targets and screen-width adaptation.
* **Data Privacy:** 100% offline-first local storage model with optional self-hosted Google Drive / Google Sheets syncing. Zero tracking or third-party ads.

---

## ✨ Key Features

### 1. 📅 3-Lens Lifecycle Calendar
* **Content Lens (🎬):** Visualizes planned content pipelines, publication timelines, and tracking statuses.
* **Social Lens (🥂):** Tracks personal event commitments, networking, and social phases.
* **Evidence Lens (🎯):** Monitors deliverables, quality scores, targets met, and positive action history.
* **Mood Heatmap Overlay:** Dynamically overlays average mood energy intensities directly onto calendar cells with custom colors matching emotional peaks and valleys.
* **Interactive Hover Tooltips:** Detailed tooltip cards revealing cycle phases, daily average mood metrics with visual scale meters, tag summaries, first journal entry snippets, and planned deliverables breakdown.

### 2. 📝 Journal Module & Side-by-Side History
* **Side-by-Side Layout:** Clean split view placing new log creation/analytics tabs on the left column (5 cols) and an expanded side-by-side card grid of journal history on the right column (7 cols).
* **Custom User Mood Editor:** Users can freely create their own custom moods (with emojis and custom names), edit existing mood options, delete unused moods, or reset to defaults. All custom moods persist across session logs and entry modals.
* **Search & Tag Filtering:** Instant search bar and interactive tag filters for searching through diary text, mood tags, and dates.
* **Attachment Gallery:** Attach photo memories and preview photo thumbnails directly on journal history cards.

### 3. 🔄 Menstrual Cycle & Physiological Tracker
* **Symptom & Flow Logger:** Log cycle flow intensity (Light, Medium, Heavy, Spotting) and physical symptoms.
* **Cycle Correlation Analytics:** Responsive Recharts graphing plotting mood/energy correlations against cycle days and phase predictions (Follicular, Luteal, Ovulation, Menstruation).

### 4. 🔍 Looking Back Retrospective Analytics
* **Dynamic Timeframe Filters:** Filter historical analytics instantly across **Last 30 Days**, **Last 90 Days**, or **All Time**.
* **Mood Frequency & Distribution:** Visual breakdown of most frequent emotional states and percentage distributions.
* **3-Lens Life Balance Triad:** Measures activity ratio across output creation (Content), social connections (Social), and high-impact deliverables (Capacity).
* **Quality Standard Index:** Averages quality scores across completed deliverables.
* **Symptom Frequency Analysis:** Counts physical symptom occurrences to spot hormonal patterns over time.

### 5. ⚙️ Cloud Sync & Data Management
* **Personal Cloud Sync:** Self-host backups directly on your private Google Drive spreadsheet using secure OAuth integration or client-side storage keys.
* **Local Import/Export:** Backup and restore JSON data files anytime.

---

## 🛠️ Tech Stack & Dependencies
* **Frontend Framework:** [React 19](https://react.dev/) + [Vite](https://vite.dev/)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Animation System:** [Motion](https://motion.dev/) (from `motion/react`)
* **Visualizations:** [Recharts](https://recharts.org/) for data-rich interactive graphing
* **Icons:** [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started & Installation

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18.x or above) and [npm](https://www.npmjs.com/) installed on your machine.

### 2. Install Dependencies
Clone the repository, navigate into the directory, and run:
```bash
npm install
```

### 3. Running the Development Server
Launch the local dev environment with hot-reloading:
```bash
npm run dev
```
The application will run on [http://localhost:3000](http://localhost:3000).

### 4. Code Quality & Linting
Check for TypeScript compiler issues and syntax errors:
```bash
npm run lint
```

### 5. Building for Production
Compile a production build:
```bash
npm run build
```
Output static assets will be compiled into `dist/`.

---

## 📂 Project Architecture

```
├── src/
│   ├── components/
│   │   ├── CalendarModule.tsx     # 3-Lens Calendar engine, heatmap overlays, and tooltips
│   │   ├── JournalModule.tsx      # Side-by-side journal logger, custom mood editor, cycle analytics
│   │   ├── LookingBackModule.tsx  # Retrospective analytics dashboard (30d/90d/All-time)
│   │   ├── CreateEntryModal.tsx   # Universal entry creation dialog (Journal, Content, Social, Period)
│   │   └── SettingsPanel.tsx      # Cloud sync configuration, backup & restore, theme settings
│   ├── utils/
│   │   └── cycleUtils.ts          # Math calculation algorithms for predicting cycle phases
│   ├── types.ts                   # Shared TS definitions for Entries, Events, Moods, and Settings
│   ├── App.tsx                    # Main state orchestrator, layout controller, and localStorage engine
│   ├── main.tsx                   # Vite runtime entrypoint
│   └── index.css                  # Global CSS importing Tailwind CSS
├── LOOKING_BACK_SYSTEM.md         # Detailed technical breakdown of analytics backend logic
├── package.json                   # Project dependencies and script runner configurations
└── vite.config.ts                 # Configuration for Vite compiler and dev server
```

---

## 🪵 Data Management & Persistence
* **Local Storage Engine:** Custom lightweight hooks bind state updates to `localStorage` keys so users can log diaries offline.
* **Custom Mood Persistence:** Custom user mood lists are persisted under the `custom_user_moods` client key.

