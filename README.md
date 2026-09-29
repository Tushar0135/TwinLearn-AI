# 🧠 LearnTwin AI Professor  
### *Also known as TwinLearn-AI — Your Personal AI Learning Twin*

> **Learn smarter, not harder.** LearnTwin AI Professor is an adaptive, AI-powered learning platform that creates a digital twin of your learning style to provide a truly personalized education experience.

[![GitHub stars](https://img.shields.io/github/stars/Tushar0135/TwinLearn-AI?style=for-the-badge&logo=github)](https://github.com/Tushar0135/TwinLearn-AI/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Tushar0135/TwinLearn-AI?style=for-the-badge&logo=github)](https://github.com/Tushar0135/TwinLearn-AI/network)
[![GitHub issues](https://img.shields.io/github/issues/Tushar0135/TwinLearn-AI?style=for-the-badge&logo=github)](https://github.com/Tushar0135/TwinLearn-AI/issues)
[![License](https://img.shields.io/github/license/Tushar0135/TwinLearn-AI?style=for-the-badge)](https://github.com/Tushar0135/TwinLearn-AI/blob/main/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)

---

## 🌟 Overview

**LearnTwin AI Professor** (TwinLearn-AI) is not just another study tool; it's a paradigm shift in how we approach education. By analyzing your unique learning patterns, strengths, and weaknesses, it builds a **personalized AI mentor**—your "Learning Twin"—that adapts to you.

The system allows students to upload lecture material in different formats such as documents, audio, video, and YouTube lectures. The uploaded content is processed, converted into structured text, analyzed using NLP, divided into chunks, converted into embeddings, and stored in a vector database.

When a student asks a question, the system retrieves the most relevant information from the student's lecture and provides it to Gemini as context through a Retrieval-Augmented Generation (RAG) pipeline.

The system also generates quizzes, evaluates student performance, identifies weak topics, and maintains a **Learning Twin** representing the student's learning state.

The overall learning cycle is:

**Teach → Assess → Analyze → Adapt**

---

## 🎯 Problem Statement

Traditional learning systems generally provide the same explanation to every student. However, every student has different:

- Learning speed
- Understanding level
- Strong topics
- Weak topics
- Preferred learning approaches

A normal chatbot also does not automatically know the exact content of a student's lecture. Therefore, there is a need for a system that can:

- Understand the student's lecture material.
- Answer questions using lecture-specific information.
- Assess student understanding.
- Identify weak topics.
- Maintain a representation of the student's learning state.
- Adapt future teaching accordingly.

---

## 💡 Proposed Solution

LearnTwin AI Professor combines multiple AI technologies into one learning pipeline. The system:

1. Accepts lecture material.
2. Extracts or transcribes lecture content.
3. Cleans and normalizes the text.
4. Performs NLP processing.
5. Extracts topics and keywords.
6. Detects difficulty information.
7. Splits lectures into chunks.
8. Generates embeddings.
9. Stores embeddings in ChromaDB.
10. Retrieves relevant content using semantic similarity.
11. Uses RAG to provide context to Gemini.
12. Generates personalized explanations.
13. Generates quizzes.
14. Analyzes quiz performance.
15. Identifies weak topics.
16. Updates the Learning Twin.
17. Supports adaptive teaching strategies.

---

## ✨ Key Features

- **📊 Personalized Learning Profile:** Analyzes your notes, quizzes, and interactions to build a dynamic model of your knowledge.
- **📝 Intelligent Summaries:** Upload your study materials and get concise, AI-generated summaries that highlight key concepts.
- **🗺️ Adaptive Study Plans:** Generates customized study schedules and learning paths based on your goals and available time.
- **🧪 Smart Quiz Generation:** Creates quizzes tailored to your weak areas, helping you reinforce learning and identify gaps.
- **💡 AI Tutoring Assistance:** Get instant explanations and step-by-step guidance when you're stuck on a problem.
- **📈 Progress Insights:** Visual dashboards that track your learning journey and show you how you're improving over time.
- **🗣️ Interactive & Engaging:** Includes features for voice interaction and animated explanations for a more immersive experience.
- **🔄 Learning Twin:** Maintains a digital representation of the student's learning state for adaptive teaching.

---

## 🏗️ System Architecture

```text
                         LEARN TWIN AI PROFESSOR
                                  │
                                  ▼
                           Lecture Input
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                Documents                    Media
             PDF/DOCX/PPTX             Audio/Video/YouTube
                    │                           │
                    ▼                           ▼
             Text Extraction              Faster Whisper
                    │                           │
                    └─────────────┬─────────────┘
                                  ▼
                            Text Cleaning
                                  │
                                  ▼
                            NLP Processing
                                  │
                       ┌──────────┼──────────┐
                       ▼          ▼          ▼
                    Topics    Keywords   Difficulty
                       │
                       ▼
                    Chunking
                       │
                       ▼
                  Embeddings
                       │
                       ▼
                    ChromaDB
                       │
                       ▼
               Semantic Retrieval
                       │
                       ▼
                 Context Building
                       │
                       ▼
                     Gemini
                       │
                       ▼
                  AI Professor
                       │
                       ▼
                     Quiz
                       │
                       ▼
              Performance Analysis
                       │
                       ▼
                 Learning Twin
                       │
                       ▼
              Adaptive Strategy
                       │
                       └──────────────► Teach Again
```

---

## 🛠️ Tech Stack

This project is built with a modern, robust technology stack designed for performance and scalability.

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React, Next.js, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express.js, Python (FastAPI) |
| **Database** | MongoDB, ChromaDB (Vector DB) |
| **AI/ML** | LangChain, Hugging Face Transformers, Gemini API, Faster Whisper, NLP, RAG, Embeddings |
| **DevOps** | Docker, Git, GitHub Actions |
| **Authentication** | Firebase Auth / JWT |

---

## 🚀 Getting Started

Follow these instructions to get a local copy of LearnTwin AI Professor up and running.

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Python (v3.9 or later)
- MongoDB instance (local or Atlas)
- API keys for Gemini and other services
- ChromaDB (can run locally or via Docker)

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
   GEMINI_API_KEY=your_gemini_api_key
   CHROMA_DB_HOST=localhost
   CHROMA_DB_PORT=8000
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
2. **Upload study materials** such as PDFs, notes, audio, video, or YouTube links.
3. **Generate summaries, quizzes, and study plans** with one click.
4. **Chat with your AI Professor** whenever you need help or clarification.
5. **Take quizzes** and let the system analyze your performance.
6. **Track your progress** and watch your Learning Twin adapt to your needs.

---

## 🗺️ Project Roadmap

- [x] **Core Foundation:** User authentication, document upload, and basic summarization.
- [x] **Personalization Engine:** Implement learning profile analysis and adaptive quiz generation.
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

---

## 📬 Contact

**Tushar** – [GitHub Profile](https://github.com/Tushar0135)

Project Link: [https://github.com/Tushar0135/TwinLearn-AI](https://github.com/Tushar0135/TwinLearn-AI)

---
