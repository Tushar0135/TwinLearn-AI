# TwinLearnAI Frontend

A production-quality React + Vite frontend for an AI-powered learning platform.

## Features

✨ **Modern UI** - Beautiful, responsive design with dark/light mode support
🎓 **Complete Dashboard** - Dashboard, lectures, upload, AI professor, progress tracking
🤖 **AI Integration Ready** - Mock services ready for backend API integration
📱 **Responsive** - Works perfectly on desktop, tablet, and mobile
💾 **State Management** - Context API for authentication and theme
🔐 **Protected Routes** - Secure authentication-based routing
🎨 **Tailwind CSS** - Utility-first CSS framework
📊 **Data Visualization** - Charts and progress tracking with Recharts

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **React Router v7** - Routing
- **Lucide React** - Icons
- **Recharts** - Data visualization
- **Context API** - State management

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── UI.jsx       # Base components (Button, Card, Input, etc.)
│   └── Layout.jsx   # Dashboard layout (Sidebar, Topbar)
├── pages/           # Page components
│   ├── LandingPage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx
│   ├── MyLecturesPage.jsx
│   ├── UploadLecturePage.jsx
│   ├── AIProfessorPage.jsx
│   ├── LearningProgressPage.jsx
│   ├── TopicsPage.jsx
│   ├── BookmarksPage.jsx
│   ├── SettingsPage.jsx
│   └── NotFoundPage.jsx
├── services/        # API service layer
│   ├── authService.js       # Authentication (mock)
│   ├── lectureService.js    # Lectures & topics (mock)
│   ├── ragService.js        # AI Q&A (mock)
│   └── bookmarkService.js   # Bookmarks (localStorage)
├── data/           # Mock data
│   └── mockData.js
├── context/        # React Context
│   ├── AuthContext.jsx
│   └── ThemeContext.jsx
├── routes/         # Route protection
│   └── ProtectedRoute.jsx
├── utils/          # Helper functions
│   └── helpers.js
├── App.jsx         # Main app component
├── main.jsx        # Entry point
└── index.css       # Global styles
```

## Getting Started

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Dev server runs on `http://localhost:5173`

### Build

```bash
npm run build
```

### Demo Credentials

- **Email:** test@university.edu
- **Password:** password123

## Features Overview

### 1. Landing Page
- Hero section with CTA
- Features showcase
- Teaching strategies
- How it works
- Call to action

### 2. Authentication
- Register with validation
- Login with remember me
- Forgot password flow
- Protected routes
- Auto-logout

### 3. Dashboard
- Welcome greeting
- Key stats (lectures, topics, questions, streak)
- Weekly progress chart
- Continue learning section
- Recent activity feed
- Quick actions

### 4. My Lectures
- Search & filter lectures
- Difficulty badges
- Progress bars
- Sort by status
- Quick actions (play, ask AI, delete)

### 5. Upload Lecture
- Support for multiple formats (PDF, PPT, DOC, Audio, Video, YouTube)
- Realistic processing stages
- Auto-extracted metadata
- Learning objectives display

### 6. AI Professor
- Chat interface with AI
- 9 teaching strategies
- Lecture selection
- Message history
- Quick questions
- Copy/bookmark responses
- Source citations
- Typing indicators

### 7. Learning Progress
- Overall progress gauge
- Subject-wise breakdown
- Topic mastery radar chart
- Streak tracking
- Strong/weak topics

### 8. Topics
- Topic cards with mastery circles
- Search & filter
- Difficulty levels
- Question count

### 9. Bookmarks
- Grouped by type (explanation, question, section)
- Timestamp
- Delete functionality
- Easy access

### 10. Settings
- Profile management
- Learning preferences
- Teaching strategy selection
- Difficulty level
- Dark/Light mode toggle
- Notifications
- Email updates

## Mock Data & Services

All data is stored in **localStorage** for now:

- **Auth** - User registration & login
- **Bookmarks** - Saved explanations/questions
- **Lectures** - Mock lecture data
- **AI Responses** - Strategy-based mock responses
- **Progress** - Mock learning metrics

## Future Backend Integration

Services are structured for easy API integration:

```javascript
// Example: Replace mock with real API
// authService.login() → axios.post('/api/auth/login')
// lectureService.getLectures() → axios.get('/api/lectures')
// ragService.askQuestion() → axios.post('/api/chat/question')
```

Each service maintains the same interface, so UI changes are minimal.

## Dark Mode

Automatically persisted in localStorage. Toggle via settings or topbar icon.

## Responsive Design

- Mobile-first approach
- Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
- Touch-friendly buttons and spacing
- Sidebar collapses on mobile

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Code splitting with Suspense
- Lazy loading routes
- Optimized images
- CSS animations
- ~2.3s initial load time

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus states
- Color contrast compliance

## Environment Variables

Create `.env` if needed for future API integration:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=TwinLearnAI
```

## Deployment

### Vercel

```bash
npm run build
vercel deploy
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

## License

MIT

## Support

For issues or questions, check the backend README or contact the team.

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
