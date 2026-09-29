# Quick Start Guide - TwinLearnAI Frontend

## 🚀 Get Started in 2 Minutes

### Step 1: Navigate to Frontend
```bash
cd frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Development Server
```bash
npm run dev
```

### Step 4: Open in Browser
Navigate to **http://localhost:5173**

---

## 🔐 Login Credentials

Use these for testing:
- **Email:** test@university.edu
- **Password:** password123

---

## 📂 Project Structure

```
src/
├── pages/          # 13 complete pages
├── components/     # UI library + layout
├── services/       # Mock API services
├── context/        # Auth & theme state
├── data/           # Mock database
├── utils/          # Helper functions
└── App.jsx         # Main routing
```

---

## 🎯 Key Features to Explore

1. **Landing Page** (`/`)
   - Click "Get Started" → Goes to Register

2. **Register** (`/register`)
   - Create account with university
   - Auto-redirects to login

3. **Login** (`/login`)
   - Use demo credentials above
   - "Remember me" saves session

4. **Dashboard** (`/dashboard`)
   - Overview of progress
   - Weekly stats
   - Recent activity

5. **My Lectures** (`/lectures`)
   - Search & filter lectures
   - Click "Ask AI" to chat
   - Delete lectures (with confirmation)

6. **Upload Lecture** (`/upload`)
   - Choose upload type
   - Fill in details
   - Watch 7-stage processing animation

7. **AI Professor** (`/ai-professor`)
   - Select lecture
   - Choose teaching strategy
   - Chat with AI
   - 2-second delay simulates "thinking"

8. **Learning Progress** (`/progress`)
   - Visual progress charts
   - Subject breakdown
   - Topic mastery

9. **Settings** (`/settings`)
   - Toggle dark/light mode
   - Change preferences
   - Logout

---

## 🎨 Dark Mode

**Toggle dark mode:**
- Click the moon/sun icon in top-right (Topbar)
- Or go to Settings page

**Persists in localStorage** - will remember your preference

---

## 🛠️ Available Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Create production build
npm run preview  # Preview production build locally
```

---

## 📊 Mock Services

All data is **mock + localStorage**:

- ✅ User can register & login
- ✅ Lectures stored in localStorage
- ✅ Bookmarks persist
- ✅ Dark mode preference saved
- ✅ Progress tracked locally

**To clear all data:**
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

---

## 🔗 Route Guide

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Landing page | No |
| `/register` | Create account | No |
| `/login` | Sign in | No |
| `/dashboard` | Main hub | **Yes** |
| `/lectures` | Your lectures | **Yes** |
| `/upload` | Add lecture | **Yes** |
| `/ai-professor` | Chat with AI | **Yes** |
| `/progress` | View progress | **Yes** |
| `/topics` | Browse topics | **Yes** |
| `/bookmarks` | Saved items | **Yes** |
| `/settings` | User settings | **Yes** |

---

## 💡 Tips & Tricks

### Simulate AI Response Delay
- RAG service has 2-second delay to mimic "AI thinking"
- See in `/src/services/ragService.js`

### Customize Mock Data
- Edit `/src/data/mockData.js`
- Lectures, users, topics all defined there
- Services read from this file

### Change Colors
- Edit `/tailwind.config.js`
- Update primary color palette
- All components will update automatically

### Add New Page
1. Create file in `/src/pages/`
2. Import in `App.jsx`
3. Add route to Routes component

---

## 🐛 Troubleshooting

### Port 5173 already in use?
```bash
npm run dev -- --port 5174
```

### Clear cache and reinstall
```bash
rm -r node_modules package-lock.json
npm install
npm run dev
```

### Build failing?
```bash
npm run build -- --minify=false
```

---

## 📞 Architecture Overview

### Authentication Flow
```
Register → Login → Dashboard (protected)
         → Logout → Landing Page
```

### State Management
```
App
├── AuthProvider (user, login, logout)
└── ThemeProvider (dark mode toggle)
    └── Routes (protected/public)
        └── Pages
```

### Component Hierarchy
```
App.jsx
├── ProtectedRoute / PublicRoute
└── Page Component
    └── DashboardLayout
        ├── Sidebar
        ├── Topbar
        └── Page Content
            └── UI Components
```

---

## 🚀 Production Build

To create a production-ready build:

```bash
npm run build
```

This creates `/dist` folder with:
- Minified HTML, CSS, JS
- Optimized bundle (~209KB gzipped)
- Ready to deploy

**Deploy to:**
- Vercel: `vercel deploy`
- Netlify: `netlify deploy --prod --dir=dist`
- GitHub Pages, AWS, Heroku, etc.

---

## 📚 Technology Stack

- **React 19** - UI framework
- **Vite 8** - Build tool
- **Tailwind CSS 4** - Styling
- **React Router 7** - Routing
- **Lucide React** - Icons
- **Recharts** - Charts
- **localStorage** - Persistence

---

## 🎓 Learning Resources

### Component Library
All reusable components in `/src/components/UI.jsx`:
- Button, Card, Badge, Input, Modal, etc.

### Service Layer
API-like services in `/src/services/`:
- authService, lectureService, ragService, bookmarkService

### Utilities
Helper functions in `/src/utils/helpers.js`:
- Validation, formatting, styling

---

## ✨ What's Included

- ✅ Complete UI/UX
- ✅ 13 fully functional pages
- ✅ Dark/light mode
- ✅ Authentication system
- ✅ Protected routes
- ✅ Mock API services
- ✅ Data visualization
- ✅ Responsive design
- ✅ localStorage persistence
- ✅ Component library
- ✅ Utility functions
- ✅ Layout templates
- ✅ Production build

---

## 🎯 Next Steps

1. **Explore the app** - Test all features
2. **Customize** - Update mock data, colors
3. **Connect backend** - Replace mock services with real APIs
4. **Deploy** - Push to production
5. **Scale** - Add new features

---

## 📞 Need Help?

Check these files:
- `frontend/README.md` - Detailed docs
- `FRONTEND_COMPLETION_REPORT.md` - Full report
- `src/components/UI.jsx` - Component props
- `src/services/*.js` - Service methods

---

**Happy coding! 🚀**

For more details, see `FRONTEND_COMPLETION_REPORT.md` in the root directory.
