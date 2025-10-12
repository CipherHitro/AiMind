# 🤖 AiMind - AI Chatbot Platform

<div align="center">

![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb)

A modern, real-time AI chatbot application with organization management, multi-user support, and intelligent conversation capabilities powered by Groq AI.

</div>

---

## ✨ Features

- **AI-Powered Conversations** - Intelligent chatbot powered by Groq AI (LLaMA models)
- **Real-time Messaging** - Instant message delivery using Socket.IO
- **Organization Management** - Create and manage organizations with team collaboration
- **User Authentication** - Secure JWT-based authentication with Auth0 OAuth integration
- **Credit System** - Token-based credit system for AI usage management
- **Responsive Design** - Fully mobile-responsive interface
- **Rich Text Formatting** - Markdown support for AI responses (bold, italic, lists, code blocks)

---

## 🛠️ Tech Stack

**Frontend:** React 19 • Vite • Tailwind CSS • Socket.IO Client • React Router

**Backend:** Node.js • Express 5 • MongoDB • Socket.IO • Groq SDK • JWT • bcryptjs

---


## 🚀 Installation & Setup

### Prerequisites

- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **MongoDB** - [Local](https://www.mongodb.com/try/download/community) or [Atlas](https://www.mongodb.com/cloud/atlas)
- **Groq API Key** - [Get it here](https://console.groq.com/)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/CipherHitro/AiMind.git
cd AiMind
```

2. **Backend Setup**
```bash
cd backend
npm install

# Create .env file
touch .env
```

Add to `backend/.env`:
```env
PORT=3000
CLIENT_API=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/ai-chatbot
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
GROQ_API_KEY=your_groq_api_key_here
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install

# Create .env file
touch .env
```

Add to `frontend/.env`:
```env
VITE_BASE_API_URL=http://localhost:3000
```

4. **Run the Application**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

5. **Access the App**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

---

## 📁 Project Structure

```
AiMind/
├── backend/
│   ├── controller/          # Business logic
│   │   ├── chat.js
│   │   ├── notification.js
│   │   ├── organization.js
│   │   └── user.js
│   ├── middlewares/         # Auth & validation
│   ├── models/              # MongoDB schemas
│   │   ├── chat.js
│   │   ├── message.js
│   │   ├── notification.js
│   │   ├── organization.js
│   │   └── user.js
│   ├── routes/              # API endpoints
│   ├── services/            # External services
│   │   ├── groq.js
│   │   └── socket.js
│   ├── connection.js        # MongoDB connection
│   └── index.js             # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── MessageContent.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── OrganizationModal.jsx
│   │   │   └── CreateOrgModal.jsx
│   │   ├── hooks/           # Custom hooks
│   │   │   └── useSocket.js
│   │   ├── pages/           # Route pages
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── utils/           # Helper functions
│   │   │   └── formatMessage.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
└── README.md
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | Yes |
| `CLIENT_API` | Frontend URL for CORS | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `JWT_EXPIRES_IN` | Token expiration time | Yes |
| `GROQ_API_KEY` | Groq AI API key | Yes |

### Frontend (`frontend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_BASE_API_URL` | Backend API URL | Yes |
| `VITE_AUTH0_DOMAIN` | Auth0 domain (OAuth) | No |
| `VITE_AUTH0_CLIENT_ID` | Auth0 client ID (OAuth) | No |

---

## 🎯 Usage

### Creating an Account
1. Navigate to signup page
2. Enter username, email, and password
3. Or use OAuth (Auth0) for quick signup

### Starting a Chat
1. Click "New Chat" button
2. Type your message or select a suggested prompt
3. AI will respond in real-time

### Managing Organizations
1. Click organization dropdown in navbar
2. Create new organization or switch between existing ones
3. Admins can invite members, rename organizations, and manage roles

### Credits System
- Each message costs 2 credits
- Monitor your credits in the navbar
- Contact admin for credit top-ups

---

## 🐛 Troubleshooting

**Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**MongoDB Connection Failed**
- Ensure MongoDB is running: `sudo systemctl status mongodb`
- Check connection string in `backend/.env`
- For Atlas: Verify IP whitelist

**Environment Variables Not Loading**
- Restart dev servers after changing `.env`
- Ensure `.env` files are in correct directories
- Frontend variables must start with `VITE_`

---

## 📝 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**CipherHitro**
- GitHub: [@CipherHitro](https://github.com/CipherHitro)
- Repository: [AiMind](https://github.com/CipherHitro/AiMind)

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by CipherHitro

</div>
