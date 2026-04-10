# 🤖 AI Coding Helper

A premium, high-performance AI coding assistant built with **React 19**, **Vite**, and **Google Gemini AI**. Designed to help beginners and experts alike master code through simple explanations and clean examples.

![Live App Preview](https://github.com/trishadebnath006-oss/ai-coding-assistant-pro/raw/master/public/preview.png) *(Note: Add your own screenshot here)*

## ✨ Key Features

- **Multi-Language Support:** Instant code generation for Python, JavaScript, C, C++, and HTML/CSS.
- **Beginner-Friendly:** Complex logic translated into simple English with clear tips.
- **Smart History:** Localized chat history that stays in your browser via LocalStorage.
- **Beautiful UI/UX:** Built with Tailwind CSS, Framer Motion, and Shadcn/UI for a premium, responsive feel.
- **Code Highlighting:** Syntax highlighting for all supported languages using Prism.

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Bundler:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **AI Engine:** [Google Gemini 1.5 Flash](https://aistudio.google.com/)
- **UI Components:** [Shadcn/UI](https://ui.shadcn.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/trishadebnath006-oss/ai-coding-assistant-pro.git
   cd ai-coding-assistant-pro
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🌐 Deployment (Vercel)

This project is optimized for deployment on **Vercel**:

1. Push your code to a GitHub repository.
2. Import the project into the [Vercel Dashboard](https://vercel.com/new).
3. Add the `VITE_GEMINI_API_KEY` under **Settings > Environment Variables**.
4. Deploy!

## 🔒 Security

This project uses `.gitignore` to prevent sensitive information (like your API key) from being committed to version control. **Never share your `.env` file.**

## 📄 License

MIT License - feel free to use this project for your own learning and development!
