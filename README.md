# GitDoc - AI-Powered Repository Documentation Generator

<div align="center">

![GitDoc Banner](https://img.shields.io/badge/GitDoc-AI%20Documentation-purple?style=for-the-badge)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)

**Transform your GitHub repositories into beautiful, interactive documentation books with AI**

[Features](#features) • [Demo](#demo) • [Installation](#installation) • [Usage](#usage) • [Tech Stack](#tech-stack)

</div>

---

## 🌟 Features

### 📚 **AI-Powered Documentation Generation**
- **4-Step Analysis Process**: Automated repository analysis with file scanning, architecture mapping, visual diagram generation, and comprehensive documentation
- **Interactive Book Reader**: Beautiful book-like interface with chapters, table of contents, and page navigation
- **AI-Generated Diagrams**: Automatic creation of class diagrams, sequence diagrams, and architecture visualizations using Mermaid
- **Custom Image Upload**: Upload and tag your own diagrams to complement AI-generated visuals

### 🎤 **AI Mock Interview System**
- **Real-Time Voice Interview**: Practice technical interviews with AI using OpenAI's Realtime API
- **Repository Context**: AI interviewer understands your codebase and asks relevant questions
- **5-Minute Sessions**: Timed interview sessions with automatic feedback generation
- **AI Feedback**: Receive detailed feedback on your interview performance

### 👤 **User Management**
- **Authentication**: Secure sign-up/sign-in with NextAuth.js
- **Personal Dashboard**: Track all your generated documents and interview sessions
- **Admin Panel**: Manage users and view system statistics (admin-only)

### 🎨 **Modern UI/UX**
- **Glassmorphism Design**: Beautiful gradient backgrounds with backdrop blur effects
- **Dark Mode**: Sleek dark theme optimized for readability
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Framer Motion animations for delightful interactions

---

## 🎬 Demo

### Document Generation Flow
1. Enter GitHub repository URL
2. AI analyzes files and structure
3. Generate custom diagrams or upload your own
4. View documentation in interactive book format

### Mock Interview Flow
1. Select repository for interview context
2. Start real-time voice interview with AI
3. Discuss your codebase for 5 minutes
4. Receive AI-generated feedback

---

## 🚀 Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB database
- OpenAI API key
- Cloudinary account (for image storage)
- GitHub OAuth App (optional, for GitHub integration)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/GitDoc.git
cd GitDoc
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/gitdoc"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# GitHub (Optional)
GITHUB_ID="your-github-oauth-app-id"
GITHUB_SECRET="your-github-oauth-app-secret"
```

### 4. Database Setup
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 5. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

---

## 📖 Usage

### Generating Documentation

1. **Navigate to Home Page**
   - Click "Get Started" or navigate to the analysis dashboard

2. **Enter Repository URL**
   - Paste any public GitHub repository URL
   - Example: `https://github.com/facebook/react`

3. **Step 1: File Analysis**
   - AI scans and analyzes repository files
   - Generates textual overview of the codebase

4. **Step 2: Architecture Analysis**
   - AI maps the repository structure
   - Creates architecture documentation

5. **Step 3: Visual Diagrams**
   - Generate AI diagrams (Class, Sequence, Architecture)
   - Upload custom images with tags
   - Preview all visuals before finalizing

6. **Step 4: Final Documentation**
   - AI compiles everything into a beautiful book
   - View in interactive book reader
   - Access from your dashboard anytime

### Starting a Mock Interview

1. **Navigate to Interview Page**
   - Click "Mock Interview" in navigation

2. **Enter Repository URL**
   - Provide the repository you want to discuss

3. **Start Interview**
   - Grant microphone permissions
   - AI analyzes your repository
   - Real-time voice conversation begins

4. **Complete Interview**
   - 5-minute timed session
   - AI asks questions about your code
   - Automatic feedback generation

5. **View Feedback**
   - Access from dashboard
   - Review AI-generated interview feedback

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Markdown** - Markdown rendering
- **Lucide Icons** - Beautiful icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe ORM
- **MongoDB** - NoSQL database
- **NextAuth.js** - Authentication

### AI & APIs
- **OpenAI GPT-4** - Documentation generation
- **OpenAI Realtime API** - Voice interviews
- **Cloudinary** - Image storage and optimization
- **GitHub API** - Repository data fetching

### DevOps
- **Vercel** - Deployment platform (recommended)
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## 📁 Project Structure

```
GitDoc/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── admin/             # Admin panel
│   │   ├── dashboard/         # User dashboard
│   │   ├── document/[id]/     # Document viewer
│   │   ├── interview/         # Interview pages
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── AnalysisDashboard.tsx
│   │   ├── BookViewer.tsx
│   │   ├── InterviewControls.tsx
│   │   └── ...
│   └── lib/                   # Utility functions
│       ├── auth.ts           # NextAuth configuration
│       ├── prisma.ts         # Prisma client
│       └── github-loader.ts  # GitHub API utilities
├── prisma/
│   └── schema.prisma         # Database schema
├── public/                    # Static assets
└── package.json
```

---

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MongoDB connection string | ✅ |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | ✅ |
| `NEXTAUTH_URL` | Application URL | ✅ |
| `OPENAI_API_KEY` | OpenAI API key | ✅ |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ |
| `GITHUB_ID` | GitHub OAuth App ID | ❌ |
| `GITHUB_SECRET` | GitHub OAuth App Secret | ❌ |

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository

3. **Configure Environment Variables**
   - Add all environment variables from `.env`
   - Deploy!

### Build for Production
```bash
npm run build
npm start
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** - For GPT-4 and Realtime API
- **Vercel** - For Next.js and deployment platform
- **Cloudinary** - For image storage and optimization
- **Prisma** - For the amazing ORM
- **Aceternity UI** - For beautiful UI components

---

## 📧 Contact

**Project Maintainer** - Your Name

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

**Project Link**: [https://github.com/yourusername/GitDoc](https://github.com/yourusername/GitDoc)

---

<div align="center">

**Made with ❤️ and AI**

⭐ Star this repo if you find it helpful!

</div>