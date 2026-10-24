# Academic Focus & Productivity Platform

A comprehensive student productivity platform that integrates Google Classroom, provides focus mode capabilities, GPA tracking, goal management, and AI-powered academic assistance.

## 🎯 Features

### Core Functionality
- **Google Classroom Integration**: Seamlessly connect and sync your courses, assignments, and announcements
- **Focus Mode**: Browser extension to block distracting websites during study sessions
- **GPA Tracker**: Monitor academic performance across current and previous semesters
- **Goal Management**: Set and track personal and academic goals
- **AI Chat Assistant**: Get help with academic questions powered by Gemini AI
- **Course Management**: Organize and view all your courses in one place
- **Schedule Planner**: Manage your academic schedule efficiently

### Additional Features
- Activity feed with recent updates
- Visual GPA calculator with ring chart
- Task management system
- Responsive dashboard with statistics
- User authentication and profile management

## 🏗️ Project Structure

```
.
├── browser-extension/          # Chrome extension for focus mode
│   ├── background.js           # Extension background script
│   ├── content.js              # Content script for website blocking
│   ├── popup.html/js           # Extension popup interface
│   ├── blocked.html/js         # Blocked website page
│   └── manifest.json           # Extension configuration
│
├── src/
│   ├── components/             # React components
│   │   ├── dashboard/          # Dashboard-specific components
│   │   └── ui/                 # Reusable UI components (shadcn/ui)
│   │
│   ├── contexts/               # React Context providers
│   │   ├── AuthContext.tsx     # Authentication state
│   │   ├── ClassroomContext.tsx # Google Classroom integration
│   │   ├── CoursesContext.tsx  # Course management
│   │   └── GoalsContext.tsx    # Goal tracking
│   │
│   ├── pages/                  # Application pages/routes
│   │   ├── Auth.tsx            # Login/signup page
│   │   ├── Index.tsx           # Dashboard home
│   │   ├── Courses.tsx         # Course overview
│   │   ├── GPATracker.tsx      # GPA management
│   │   ├── Goals.tsx           # Goal tracking
│   │   ├── FocusMode.tsx       # Focus mode settings
│   │   ├── Chat.tsx            # AI chat interface
│   │   ├── Schedule.tsx        # Schedule planner
│   │   └── Settings.tsx        # User settings
│   │
│   ├── integrations/
│   │   └── supabase/           # Supabase client and types
│   │
│   ├── lib/
│   │   ├── classroomApi.ts     # Google Classroom API wrapper
│   │   ├── gemini.ts           # Gemini AI integration
│   │   └── utils.ts            # Utility functions
│   │
│   └── hooks/                  # Custom React hooks
│
├── supabase/
│   └── migrations/             # Database migration files
│
└── public/                     # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun package manager
- Supabase account
- Google Cloud Console project (for Classroom API)
- Google AI API key (for Gemini)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd web
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Database Setup**
   ```bash
   # Initialize Supabase locally or use cloud instance
   # Run migrations
   supabase db reset
   ```

5. **Google Cloud Console Setup**
   - Create a project in Google Cloud Console
   - Enable Google Classroom API
   - Create OAuth 2.0 credentials
   - Add authorized origins: `http://localhost:8080`
   - Copy Client ID to environment variables

6. **Start Development Server**
   ```bash
   npm run dev
   # or
   bun dev
   ```
   
   The application will be available at `http://localhost:8080`

### Browser Extension Setup

1. **Build the extension** (if needed)
   ```bash
   # Extension files are in browser-extension/
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `browser-extension` folder

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **TanStack Query** for data fetching
- **shadcn/ui** for UI components
- **Tailwind CSS** for styling
- **Recharts** for data visualization

### Backend & Services
- **Supabase** for database and authentication
- **Google Classroom API** for course integration
- **Google Gemini AI** for chat assistance

### Browser Extension
- Vanilla JavaScript
- Chrome Extension Manifest V3

## 📱 Key Pages

- **Dashboard** (`/`): Overview with stats, courses, and activity feed
- **Courses** (`/courses`): Course management and details
- **GPA Tracker** (`/gpa-tracker`): Current and previous semester GPA tracking
- **Goals** (`/goals`): Personal and academic goal management
- **Focus Mode** (`/focus-mode`): Configure website blocking for productivity
- **Chat** (`/chat`): AI-powered academic assistance
- **Schedule** (`/schedule`): Class and study schedule planner
- **Settings** (`/settings`): User preferences and account settings

## 🔐 Authentication

The application uses Supabase authentication with email/password. Protected routes require authentication and redirect to the login page if not authenticated.

## 🐛 Known Issues

Based on the error logs, the following issues are present:

1. **React Router Warnings**: Future flags for v7 compatibility
   - `v7_startTransition`
   - `v7_relativeSplatPath`

2. **Google Classroom Integration**: 403 Forbidden errors when connecting
   - Origin `http://localhost:8080` may need to be properly configured in Google Cloud Console
   - Check OAuth consent screen settings
   - Verify API scopes are approved

3. **COOP Policy Warnings**: Cross-Origin-Opener-Policy warnings with Google OAuth popup

## 🔧 Troubleshooting

### Google Classroom Connection Fails
1. Verify Google Cloud Console OAuth credentials
2. Check authorized JavaScript origins include `http://localhost:8080`
3. Ensure all required scopes are enabled
4. Clear browser cache and cookies
5. Check browser console for specific error messages

### Extension Not Working
1. Ensure extension is loaded in Chrome
2. Check extension permissions
3. Reload extension after code changes
4. Verify manifest.json configuration

## 📝 Development

### Running Tests
```bash
npm run test
# or
bun test
```

### Building for Production
```bash
npm run build
# or
bun run build
```

### Linting
```bash
npm run lint
# or
bun run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

Team 3 - Victory_Mode 

---
