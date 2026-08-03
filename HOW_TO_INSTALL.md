# 🚀 How to Install & Run This App (The Easiest Way)

Welcome! This guide will show you exactly how to get this application running on your own computer in just a few minutes.

## 📋 Prerequisites
Before you start, make sure you have the following installed on your computer:
* **[Node.js](https://nodejs.org/)** (Version 18 or higher recommended)
* A Code Editor like **[VS Code](https://code.visualstudio.com/)**

---

## 🛠️ Step-by-Step Installation

### Step 1: Get the Code (Clone or Download)
**Option A: Using Git (Recommended)**
Open your terminal/command prompt and run:
```bash
git clone <YOUR_REPOSITORY_URL_HERE>
cd <NAME_OF_FOLDER>
```

**Option B: Download ZIP**
1. Click the **"Export"** or **"Download ZIP"** button from your repository or AI Studio environment.
2. Extract the downloaded ZIP file to a folder on your computer.
3. Open your terminal (or VS Code terminal) and navigate (`cd`) into that extracted folder.

### Step 2: Install Dependencies
Inside the project folder, run the following command to download all the required packages:
```bash
npm install
```
*(Note: Since this project has a `bun.lock` file, you can also use `bun install` if you have Bun installed, which is much faster!)*

### Step 3: Run the Application!
Once everything is installed, start the local development server by running:
```bash
npm run dev
```

### Step 4: Open in Your Browser
Your terminal will show a local URL (usually `http://localhost:5173` or `http://localhost:3000`). 
Click that link or paste it into your browser to see your app live!

---

## ☁️ Optional: Setting up the Google Sheets Database
This app is designed as an offline-first tool, but it supports saving your journal and calendar data securely to a private Google Sheet.

1. Open the app in your browser and navigate to the **Settings** tab.
2. Copy the **Apps Script Code** provided in the UI.
3. Create a new Google Sheet, go to **Extensions > Apps Script**, and paste the code.
4. Click **Deploy > New Deployment**, select "Web app", set access to "Anyone", and copy the **Web App URL**.
5. Paste that URL back into the app's Settings Panel along with your Access Password to connect your private database!

🎉 **That's it! You're ready to go.**
