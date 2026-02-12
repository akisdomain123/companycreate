# 🚀 GitHub Setup & Deployment Guide

Complete guide to push your Google Sheets AI Agent to GitHub and deploy it.

## 📁 Project Structure

Your repository will have this structure:

```
google-sheets-ai-agent/
├── public/
│   └── index.html
├── src/
│   ├── App.js              # Main application component
│   └── index.js            # React entry point
├── .env.example            # Template for environment variables
├── .gitignore             # Files to ignore in git
├── package.json           # Dependencies and scripts
├── README.md              # Project documentation
└── GOOGLE_SHEETS_SETUP.md # Setup instructions
```

## 🎯 Method 1: Create from Scratch (Recommended)

### Step 1: Create React App

```bash
# Open terminal and run:
npx create-react-app google-sheets-ai-agent
cd google-sheets-ai-agent
```

### Step 2: Install Dependencies

```bash
npm install lucide-react
```

### Step 3: Replace Files

Download the files from this chat and replace:

1. Replace `src/App.js` with the provided `App.js`
2. Replace `src/index.js` with the provided `index.js`
3. Replace `public/index.html` with the provided `index.html`
4. Add `.env.example` to the root
5. Update `.gitignore` with the provided version

### Step 4: Initialize Git

```bash
# Initialize git repository
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: Google Sheets AI Agent"
```

### Step 5: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click the "+" icon → "New repository"
3. Repository name: `google-sheets-ai-agent`
4. Description: "AI-powered spreadsheet agent with Google Sheets integration"
5. Choose Public or Private
6. **Don't** initialize with README (we already have one)
7. Click "Create repository"

### Step 6: Push to GitHub

```bash
# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/google-sheets-ai-agent.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username!

---

## 🎯 Method 2: Upload Existing Files

If you already have the files:

### Step 1: Create Directory Structure

```bash
# Create project folder
mkdir google-sheets-ai-agent
cd google-sheets-ai-agent

# Create folder structure
mkdir public src
```

### Step 2: Add All Files

Copy these files into the project:

```
google-sheets-ai-agent/
├── public/
│   └── index.html          # Copy from outputs
├── src/
│   ├── App.js              # Copy from outputs
│   └── index.js            # Copy from outputs
├── .env.example            # Copy from outputs
├── .gitignore             # Copy from outputs
├── package.json           # Copy from outputs
├── README.md              # Copy from outputs (or create new)
└── GOOGLE_SHEETS_SETUP.md # Copy from outputs
```

### Step 3: Install & Test

```bash
# Install dependencies
npm install

# Test locally
npm start
```

### Step 4: Push to GitHub

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/google-sheets-ai-agent.git
git branch -M main
git push -u origin main
```

---

## 🌐 Deploy to Vercel (Free Hosting)

### Option A: Deploy from GitHub (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" → Sign in with GitHub
3. Click "Add New" → "Project"
4. Import your `google-sheets-ai-agent` repository
5. Configure:
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. Add Environment Variables:
   - `REACT_APP_GOOGLE_CLIENT_ID`: (your Google Client ID)
   - `REACT_APP_GOOGLE_API_KEY`: (your Google API Key)
7. Click "Deploy"

Your app will be live at: `https://your-app-name.vercel.app`

### Option B: Deploy from CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts, then deploy to production
vercel --prod
```

---

## 🔐 Configure Google OAuth for Production

After deploying, update your Google OAuth settings:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "APIs & Services" → "Credentials"
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins**:
   ```
   https://your-app-name.vercel.app
   ```
5. Save changes

---

## 📝 Update .env Variables

### For Local Development

Create `.env.local` in project root:

```bash
REACT_APP_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
REACT_APP_GOOGLE_API_KEY=AIzaSyAbc123...
```

### For Vercel Production

Add in Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add:
   - `REACT_APP_GOOGLE_CLIENT_ID`
   - `REACT_APP_GOOGLE_API_KEY`
3. Redeploy

---

## 🎨 Customize Your Project

### Update package.json

```json
{
  "name": "google-sheets-ai-agent",
  "version": "1.0.0",
  "description": "AI-powered spreadsheet agent",
  "author": "Your Name",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/google-sheets-ai-agent"
  }
}
```

### Update README.md

Add your own:
- Project description
- Screenshots
- Demo link
- Installation instructions
- Your contact info

---

## 🐛 Troubleshooting

### Error: "Permission denied"

```bash
# If you can't push to GitHub:
git remote set-url origin https://YOUR_USERNAME@github.com/YOUR_USERNAME/google-sheets-ai-agent.git
```

### Error: "Module not found"

```bash
# Reinstall dependencies:
rm -rf node_modules package-lock.json
npm install
```

### Error: "Command not found: npx"

```bash
# Install Node.js from https://nodejs.org
# Then try again
```

---

## 📋 Checklist

Before deploying, ensure:

- [ ] All files are in correct folders
- [ ] Dependencies installed (`npm install`)
- [ ] App runs locally (`npm start`)
- [ ] `.gitignore` includes sensitive files
- [ ] `.env.example` created (not `.env`)
- [ ] Google OAuth configured
- [ ] Credentials added to Vercel
- [ ] Authorized origins updated in Google Console
- [ ] Repository is public (or Vercel has access)

---

## 🚀 Quick Commands Reference

```bash
# Clone your repo (after pushing)
git clone https://github.com/YOUR_USERNAME/google-sheets-ai-agent.git

# Install dependencies
npm install

# Run locally
npm start

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Update code
git add .
git commit -m "Update message"
git push
```

---

## 🎉 You're Done!

Your Google Sheets AI Agent is now:
- ✅ On GitHub
- ✅ Deployed to Vercel
- ✅ Accessible worldwide
- ✅ Connected to Google Sheets

Share your live URL and start creating spreadsheets! 🎊

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vercel Documentation](https://vercel.com/docs)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [GitHub Guides](https://guides.github.com)

## 💡 Next Steps

1. Add more spreadsheet templates
2. Implement data persistence
3. Add user authentication
4. Create shareable links
5. Build a template library
6. Add export to Excel (.xlsx)
7. Implement collaborative editing

Happy coding! 🚀
