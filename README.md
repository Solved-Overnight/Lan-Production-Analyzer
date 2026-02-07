# Lantabur & Taqwa Production Dashboard

An enterprise-grade manufacturing intelligence platform designed for the textile industry. This dashboard provides real-time data extraction, visualization, and performance monitoring for Lantabur and Taqwa manufacturing units.

![Production Dashboard](https://img.shields.io/badge/Industry-4.0-blueviolet?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)

## 🚀 Key Features

### 🧠 AI-Powered Data Extraction
Utilizes **Google Gemini 3 Flash** to automatically extract complex production and RFT (Right-First-Time) data from PDF reports and images. No more manual data entry; simply upload and sync.

### 📊 Real-Time Analytics
*   **Operational Command**: High-level KPI tracking for daily, monthly, and yearly production targets.
*   **Production Velocity**: Multi-industry comparison charts using Recharts to monitor throughput trends.
*   **Shift Performance**: Detailed monitoring of supervisor efficiency (Yousuf & Humayun) with automated "Working Day" logic.

### 🧪 Quality & Lab Intelligence
*   **RFT Dashboard**: Automated calculation of Bulk vs. Lab RFT percentages.
*   **Color Portfolio**: Deep dive into color group distributions (Black, Dark, Light, etc.).
*   **Recipe Analysis**: Tracking top chemical usage and recipe accuracy.

### ⚡ Equipment & Resource Management
*   **Telemetry**: Real-time status monitoring of dyeing machines (Jiggers, Soft Flow, Stenters).
*   **Sustainability**: Tracking environmental footprints, including process water consumption and carbon output (CO2).

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts (Composed, Area, Bar, Pie, Radar)
- **AI/LLM**: Google Generative AI (Gemini API) via Netlify Functions
- **Database**: Firebase Realtime Database
- **Build Tool**: ES6 Modules / ESM.sh

## 📂 Project Structure

```text
├── components/          # Reusable UI components (Layout, Charts)
├── services/            # API & Firebase service integrations
├── netlify/functions/   # Serverless functions for secure AI extraction
├── types.ts             # Global TypeScript interfaces
├── Dashboard.tsx        # Main Operational Command view
├── ProductionData.tsx   # Data management and history
├── RFTReport.tsx        # Quality reporting and AI sync
└── ShiftPerformance.tsx # Efficiency and supervisor metrics
```

## ⚙️ Setup & Configuration

### Environment Variables
The application requires the following environment variables (handled via Netlify/hosting provider):
- `API_KEY`: Your Google Gemini API Key.

### Theme Support
The dashboard supports multiple professional themes, configurable in the settings:
- ☀️ Light / 🌙 Dark
- 🎨 Material / 🌌 Tokio Night
- 🍬 Monokai / 🧛 Dracula

---

**Built for Industrial Excellence by Lantabur IT Node.**
*Industrial OS Build v3.4.12*
