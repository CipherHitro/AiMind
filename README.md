# 🤖 AiMind - Intelligent AI Chatbot Platform

<div align="center">

![AiMind Banner](https://img.shields.io/badge/AI-Chatbot-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb)

**A modern, real-time AI chatbot application with organization management, multi-user support, and intelligent conversation capabilities powered by Groq AI.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Configuration](#-configuration) • [Usage](#-usage) • [API Documentation](#-api-documentation)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Features
- **AI-Powered Conversations** - Intelligent chatbot powered by Groq AI (LLaMA models)
- **Real-time Messaging** - Instant message delivery using Socket.IO
- **Multi-Chat Support** - Create, manage, and switch between multiple chat sessions
- **Organization Management** - Create and manage organizations with team collaboration
- **Role-Based Access Control** - Admin and member roles with different permissions
- **User Authentication** - Secure JWT-based authentication with Auth0 OAuth integration
- **Credit System** - Token-based credit system for AI usage management
- **Real-time Notifications** - Get notified about organization invites and updates

### 🔐 Security Features
- JWT token-based authentication
- HTTP-only cookies for secure token storage
- Password hashing with bcryptjs
- CORS protection
- Environment-based configuration

### 🎨 UI/UX Features
- **Responsive Design** - Fully mobile-responsive interface
- **Dark Mode UI** - Modern dark-themed interface
- **Real-time Updates** - Live notification system
- **Intuitive Navigation** - Easy-to-use sidebar and navigation
- **Organization Switching** - Seamlessly switch between organizations
- **Member Management** - Invite, manage roles, and remove team members

### 👥 Organization Features
- Create and rename organizations (Admin only)
- Invite members via email
- Role management (Admin/Member)
- Default personal organization for each user
- Organization switching capabilities
- Member removal and role updates

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.1 | UI Library |
| **Vite** | 7.1.7 | Build Tool & Dev Server |
| **React Router** | 7.9.4 | Client-side Routing |
| **Tailwind CSS** | 4.1.14 | Styling Framework |
| **Socket.IO Client** | 4.8.1 | Real-time Communication |
| **Auth0 React** | 2.6.0 | OAuth Authentication |
| **Lucide React** | 0.545.0 | Icon Library |
| **JS Cookie** | 3.0.5 | Cookie Management |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | Latest | Runtime Environment |
| **Express** | 5.1.0 | Web Framework |
| **MongoDB** | 8.19.1 (Mongoose) | Database |
| **Socket.IO** | 4.8.1 | WebSocket Server |
| **Groq SDK** | 0.33.0 | AI Model Integration |
| **JWT** | 9.0.2 | Authentication |
| **bcryptjs** | 3.0.2 | Password Hashing |
| **CORS** | 2.8.5 | Cross-Origin Resource Sharing |

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │ ◄─────► │  Express Server │ ◄─────► │    MongoDB      │
│   (Vite + UI)   │         │  (REST + WS)    │         │   (Database)    │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                            │                           │
        │                            │                           │
        ▼                            ▼                           ▼
  - React Router            - JWT Auth                  - User Data
  - Socket.IO Client        - Socket.IO Server          - Organizations
  - Auth0 OAuth             - Groq AI Integration       - Chat History
  - State Management        - RESTful APIs              - Notifications
```

### Key Components

#### Frontend Architecture
- **Pages**: Login, Signup, Chat Interface
- **Components**: Navbar, ChatInterface, Modals (Organization, CreateOrg)
- **Hooks**: useSocket (WebSocket management)
- **Utils**: Cookie management, API helpers

#### Backend Architecture
- **Routes**: User, Organization, Chat, Notification
- **Controllers**: Business logic for all features
- **Models**: User, Organization, Chat, Message, Notification
- **Services**: Socket.IO, Groq AI
- **Middlewares**: Authentication, Error handling

---

## 🚀 Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/)

### Step 1: Clone the Repository

```bash
git clone https://github.com/CipherHitro/AiMind.git
cd AiMind
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (see Configuration section below)
touch .env
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory (from root)
cd ../frontend

# Install dependencies
npm install

# Create .env file (see Configuration section below)
touch .env
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=3000
CLIENT_API=http://localhost:5173

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ai-chatbot
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ai-chatbot

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRES_IN=7d

# Groq AI Configuration
GROQ_API_KEY=your_groq_api_key_here

# Optional: AI Model Configuration
GROQ_MODEL=llama-3.3-70b-versatile
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory with the following variables:

```env
# Backend API URL
VITE_BASE_API_URL=http://localhost:3000

# Auth0 Configuration (Optional - for OAuth)
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
VITE_AUTH0_REDIRECT_URI=http://localhost:5173
```

### 🔑 Getting API Keys

#### Groq API Key (Required)
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste into `GROQ_API_KEY` in backend `.env`

#### MongoDB Setup (Required)

**Option 1: Local MongoDB**
```bash
# Install MongoDB locally
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS
brew install mongodb-community

# Start MongoDB service
sudo systemctl start mongodb  # Linux
brew services start mongodb-community  # macOS

# Use connection string
MONGODB_URI=mongodb://localhost:27017/ai-chatbot
```

**Option 2: MongoDB Atlas (Cloud)**
1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get connection string: `mongodb+srv://<username>:<password>@cluster.mongodb.net/ai-chatbot`

#### Auth0 Setup (Optional)
1. Visit [Auth0](https://auth0.com/)
2. Create a free account
3. Create a new application (Single Page Application)
4. Configure Allowed Callback URLs: `http://localhost:5173`
5. Configure Allowed Logout URLs: `http://localhost:5173`
6. Copy Domain and Client ID to frontend `.env`

---

## 🎯 Usage

### Development Mode

#### Start Backend Server

```bash
# From backend directory
cd backend
npm run dev
```

The backend server will start on `http://localhost:3000` with hot-reload enabled.

#### Start Frontend Development Server

```bash
# From frontend directory (in a new terminal)
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173` (or next available port).

### Production Build

#### Build Frontend

```bash
cd frontend
npm run build
```

This creates an optimized production build in the `dist` folder.

#### Preview Production Build

```bash
npm run preview
```

#### Run Backend in Production

```bash
cd backend
node index.js
```

### Accessing the Application

1. Open your browser and navigate to `http://localhost:5173`
2. Sign up for a new account or log in
3. Start chatting with the AI!

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/user/signup` | Register new user | ❌ |
| POST | `/user/login` | Login user | ❌ |
| POST | `/user/oauth-login` | OAuth login (Auth0) | ❌ |
| GET | `/user/profile` | Get user profile | ✅ |
| POST | `/user/check-username` | Check username availability | ❌ |
| GET | `/user/credits` | Get user credits | ✅ |

### Organization Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/organization/create` | Create organization | ✅ | Any |
| GET | `/organization/:orgId` | Get organization details | ✅ | Member |
| POST | `/organization/:orgId/switch` | Switch active organization | ✅ | Member |
| POST | `/organization/:orgId/invite` | Invite member | ✅ | Admin |
| PATCH | `/organization/:orgId/rename` | Rename organization | ✅ | Admin |
| PATCH | `/organization/:orgId/members/:memberId/role` | Update member role | ✅ | Admin |
| DELETE | `/organization/:orgId/members/:memberId` | Remove member | ✅ | Admin |

### Chat Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/chat` | Get all user chats | ✅ |
| POST | `/chat/create` | Create new chat | ✅ |
| GET | `/chat/:chatId` | Get chat messages | ✅ |
| POST | `/chat/:chatId/message` | Send message | ✅ |
| DELETE | `/chat/:chatId` | Delete chat | ✅ |
| PATCH | `/chat/:chatId` | Rename chat | ✅ |

### Notification Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notification` | Get all notifications | ✅ |
| PATCH | `/notification/:notificationId/read` | Mark as read | ✅ |
| PATCH | `/notification/mark-all-read` | Mark all as read | ✅ |
| DELETE | `/notification/:notificationId` | Delete notification | ✅ |

### WebSocket Events

#### Client → Server
- `joinOrganization` - Join organization room for real-time updates
- `leaveOrganization` - Leave organization room

#### Server → Client
- `notification` - New notification received
- `organizationUpdate` - Organization data changed
- `connect` / `disconnect` - Connection status

---

## 📁 Project Structure

```
AiMind/
├── backend/                    # Backend Node.js application
│   ├── controller/            # Business logic controllers
│   │   ├── chat.js           # Chat management
│   │   ├── notification.js   # Notification handling
│   │   ├── organization.js   # Organization CRUD
│   │   └── user.js           # User authentication & profile
│   ├── middlewares/          # Express middlewares
│   │   └── auth.js           # JWT authentication
│   ├── models/               # Mongoose schemas
│   │   ├── chat.js          # Chat model
│   │   ├── message.js       # Message model
│   │   ├── notification.js  # Notification model
│   │   ├── organization.js  # Organization model
│   │   └── user.js          # User model
│   ├── routes/               # API routes
│   │   ├── chat.js          # Chat routes
│   │   ├── notification.js  # Notification routes
│   │   ├── organization.js  # Organization routes
│   │   └── user.js          # User routes
│   ├── services/            # External services
│   │   ├── groq.js         # Groq AI integration
│   │   └── socket.js       # Socket.IO setup
│   ├── utils/              # Utility functions
│   ├── connection.js       # MongoDB connection
│   ├── index.js           # Express app entry point
│   ├── package.json       # Backend dependencies
│   └── .env              # Backend environment variables
│
├── frontend/                  # Frontend React application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ChatInterface.jsx    # Main chat UI
│   │   │   ├── Navbar.jsx           # Navigation bar
│   │   │   ├── OrganizationModal.jsx # Org management
│   │   │   └── CreateOrgModal.jsx   # Create org dialog
│   │   ├── hooks/           # Custom React hooks
│   │   │   └── useSocket.js # Socket.IO hook
│   │   ├── pages/          # Page components
│   │   │   ├── Login.jsx   # Login page
│   │   │   └── Signup.jsx  # Signup page
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx        # Root component
│   │   ├── main.jsx       # Entry point
│   │   ├── App.css        # Component styles
│   │   └── index.css      # Global styles (Tailwind)
│   ├── public/            # Static assets
│   ├── index.html         # HTML template
│   ├── vite.config.js     # Vite configuration
│   ├── tailwind.config.js # Tailwind configuration
│   ├── package.json       # Frontend dependencies
│   └── .env              # Frontend environment variables
│
└── README.md              # This file
```

---

## 🎨 Features in Detail

### 1. Chat Interface
- **Multi-Chat Management**: Create unlimited chat sessions
- **Real-time Responses**: Stream AI responses in real-time
- **Chat History**: Persistent chat storage in MongoDB
- **Chat Operations**: Rename, delete, and organize chats
- **Suggested Prompts**: Quick-start conversation starters

### 2. Organization System
- **Personal Organization**: Auto-created for each user
- **Team Organizations**: Create organizations for team collaboration
- **Member Invitations**: Invite members via email
- **Role Management**: Admin and Member roles with different permissions
- **Organization Switching**: Switch between organizations seamlessly
- **Rename Organizations**: Admins can rename organizations (except default)

### 3. Notification System
- **Real-time Notifications**: Instant delivery via WebSocket
- **Organization Invites**: Get notified about organization invitations
- **Notification Management**: Mark as read, delete, or mark all as read
- **Unread Count**: Visual indicator for unread notifications

### 4. Credit System
- **Token-based Credits**: Manage AI usage with credits
- **Credit Display**: View remaining credits in navbar
- **Credit Deduction**: Automatic deduction per AI message

### 5. Authentication
- **JWT Tokens**: Secure authentication with HTTP-only cookies
- **OAuth Integration**: Sign in with Auth0 (Google, GitHub, etc.)
- **Username Validation**: Real-time username availability check
- **Password Security**: bcrypt password hashing

---

## 🔧 Development

### Code Quality

```bash
# Run ESLint (Frontend)
cd frontend
npm run lint
```

### Debugging

#### Backend Debugging
- Use `console.log()` statements
- Check terminal output for errors
- Use Postman or Thunder Client to test API endpoints

#### Frontend Debugging
- Use React DevTools browser extension
- Check browser console for errors
- Use Vite's built-in error overlay

### Environment-Specific Configuration

**Development**
```env
VITE_BASE_API_URL=http://localhost:3000
```

**Staging**
```env
VITE_BASE_API_URL=https://staging-api.yourdomain.com
```

**Production**
```env
VITE_BASE_API_URL=https://api.yourdomain.com
```

---

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Backend (Port 3000)
lsof -ti:3000 | xargs kill -9

# Frontend (Port 5173)
lsof -ti:5173 | xargs kill -9
```

#### MongoDB Connection Failed
- Ensure MongoDB is running: `sudo systemctl status mongodb`
- Check connection string in `.env`
- For Atlas: Verify IP whitelist and credentials

#### CORS Errors
- Verify `CLIENT_API` in backend `.env` matches frontend URL
- Check CORS configuration in `backend/index.js`

#### Environment Variables Not Loading
- Ensure `.env` files are in correct directories
- Restart dev servers after changing `.env`
- For Vite: Variables must start with `VITE_`

#### Socket.IO Not Connecting
- Check `VITE_BASE_API_URL` in frontend `.env`
- Verify backend is running on correct port
- Check browser console for WebSocket errors

---

## 🚀 Deployment

### Backend Deployment (Recommended: Railway, Render, Heroku)

**Railway**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

**Environment Variables to Set:**
- `MONGODB_URI`
- `JWT_SECRET`
- `GROQ_API_KEY`
- `CLIENT_API` (Your frontend URL)

### Frontend Deployment (Recommended: Vercel, Netlify)

**Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel
```

**Environment Variables to Set:**
- `VITE_BASE_API_URL` (Your backend URL)
- `VITE_AUTH0_DOMAIN` (if using Auth0)
- `VITE_AUTH0_CLIENT_ID` (if using Auth0)
- `VITE_AUTH0_REDIRECT_URI` (Your frontend URL)

---

## 📝 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**CipherHitro**
- GitHub: [@CipherHitro](https://github.com/CipherHitro)

---

## 🙏 Acknowledgments

- [Groq](https://groq.com/) - For the powerful AI infrastructure
- [Meta AI](https://ai.meta.com/) - LLaMA models
- [MongoDB](https://www.mongodb.com/) - Database solution
- [Socket.IO](https://socket.io/) - Real-time communication
- [React](https://react.dev/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

---

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Open an issue on [GitHub Issues](https://github.com/CipherHitro/AiMind/issues)
3. Contact the maintainer

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by CipherHitro

</div>
