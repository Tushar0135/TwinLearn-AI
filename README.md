# 🧠 TwinLearn-AI: Your Personal AI Learning Twin

> **Learn smarter, not harder.** TwinLearn-AI is an intelligent, adaptive learning platform that creates a digital twin of your learning style to provide a truly personalized education experience.

[![GitHub stars](https://img.shields.io/github/stars/Tushar0135/TwinLearn-AI?style=for-the-badge&logo=github)](https://github.com/Tushar0135/TwinLearn-AI/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Tushar0135/TwinLearn-AI?style=for-the-badge&logo=github)](https://github.com/Tushar0135/TwinLearn-AI/network)
[![GitHub issues](https://img.shields.io/github/issues/Tushar0135/TwinLearn-AI?style=for-the-badge&logo=github)](https://github.com/Tushar0135/TwinLearn-AI/issues)
[![License](https://img.shields.io/github/license/Tushar0135/TwinLearn-AI?style=for-the-badge)](https://github.com/Tushar0135/TwinLearn-AI/blob/main/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)

---

## 🌟 Overview

**TwinLearn-AI** is not just another study tool; it's a paradigm shift in how we approach education. By analyzing your unique learning patterns, strengths, and weaknesses, TwinLearn-AI builds a **personalized AI mentor**—your "Learning Twin"—that adapts to you.

Inspired by the challenges of information overload and one-size-fits-all education, TwinLearn-AI ensures that every student has access to a tutor that understands *how* they learn best. Whether you're struggling with a complex concept or looking to accelerate your mastery, your Twin is there to guide the way.

---

## ✨ Key Features

- **📊 Personalized Learning Profile:** Analyzes your notes, quizzes, and interactions to build a dynamic model of your knowledge.
- **📝 Intelligent Summaries:** Upload your study materials and get concise, AI-generated summaries that highlight key concepts.
- **🗺️ Adaptive Study Plans:** Generates customized study schedules and learning paths based on your goals and available time.
- **🧪 Smart Quiz Generation:** Creates quizzes tailored to your weak areas, helping you reinforce learning and identify gaps.
- **💡 AI Tutoring Assistance:** Get instant explanations and step-by-step guidance when you're stuck on a problem.
- **📈 Progress Insights:** Visual dashboards that track your learning journey and show you how you're improving over time.
- **🗣️ Interactive & Engaging:** Includes features for voice interaction and animated explanations for a more immersive experience.

---

## 🛠️ Tech Stack

This project is built with a modern, robust technology stack designed for performance and scalability.

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React, Next.js, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express.js, Python (FastAPI) |
| **Database** | MongoDB, Pinecone (Vector DB) |
| **AI/ML** | LangChain, Hugging Face Transformers, OpenAI/Gemini API |
| **DevOps** | Docker, Git, GitHub Actions |
| **Authentication** | Firebase Auth / JWT |

> *Update this table based on the actual technologies used in your project.*

---

## 🚀 Getting Started

Follow these instructions to get a local copy of TwinLearn-AI up and running.

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Python (v3.9 or later)
- MongoDB instance (local or Atlas)
- API keys for your chosen AI service (e.g., OpenAI, Gemini)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Tushar0135/TwinLearn-AI.git
   cd TwinLearn-AI
   ```

2. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd ../server
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the `server` directory and add your keys:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   OPENAI_API_KEY=your_openai_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   JWT_SECRET=your_jwt_secret
   ```

5. **Run the development servers:**

   - **Backend (from the `server` directory):**
     ```bash
     uvicorn main:app --reload
     ```
   - **Frontend (from the `client` directory):**
     ```bash
     npm run dev
     ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## 🎯 Usage

1. **Create an account** and complete your learning profile.
2. **Upload study materials** such as PDFs, notes, or textbooks.
3. **Generate summaries, quizzes, and study plans** with one click.
4. **Chat with your AI Twin** whenever you need help or clarification.
5. **Track your progress** and watch your knowledge grow.

---

## 🗺️ Project Roadmap

- [ ] **Core Foundation:** User authentication, document upload, and basic summarization.
- [ ] **Personalization Engine:** Implement learning profile analysis and adaptive quiz generation.
- [ ] **Advanced Tutoring:** Integrate step-by-step AI tutoring and real-time feedback.
- [ ] **Immersive Experience:** Add voice interaction and animated 3D lesson scenes.
- [ ] **Analytics Dashboard:** Build a comprehensive progress tracking dashboard.
- [ ] **Multi-language Support:** Expand accessibility to a global audience.
- [ ] **LMS Integration:** Connect with popular Learning Management Systems like Canvas and Moodle.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read `CONTRIBUTING.md` for details on our code of conduct and the process for submitting pull requests.


## 📬 Contact

**Tushar** – [GitHub Profile](https://github.com/Tushar0135)

Project Link: [https://github.com/Tushar0135/TwinLearn-AI](https://github.com/Tushar0135/TwinLearn-AI)

---
