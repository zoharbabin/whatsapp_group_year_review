# ChatWrap: Festive Year in Review for WhatsApp 🎁

![ChatWrap Banner](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![React](https://img.shields.io/badge/React-18-blue)

**ChatWrap** is a festive, AI-powered web application that turns your boring WhatsApp chat exports into a stunning, "Spotify Wrapped" style year-in-review experience.

Powered by **Google Gemini 2.5 Flash**, it analyzes your group's history to find the funniest moments, the biggest "yappers," the unspoken vibes, and much more.

## ✨ Features

*   **📊 Deep Analytics:** Message counts, peak activity times, and media statistics.
*   **🤖 AI Insights:** 
    *   **Group Vibe:** A one-sentence summary and a generated poem about your group.
    *   **Awards:** Superlatives like "The MVP," "The Ghost," and custom awards based on chat history.
    *   **Reality TV Pitch:** Generates a Netflix-style show concept based on your group dynamics.
    *   **Conversation Killers:** Identifies messages that caused the longest awkward silences (and roasts them).
*   **🕸️ Interaction Graph:** Visualizes who talks to whom the most.
*   **📈 Response Style Matrix:** Plots members on a "Ghost vs. Spammer" axis.
*   **🔗 The Internet Rabbit Hole:** Analyzes shared links and categorizes them by theme.
*   **🔒 Privacy First:** Parsing happens **locally** in your browser. Only anonymized snippets are sent to Gemini for analysis (if you provide an API key).

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   A Google Gemini API Key (Get one at [aistudio.google.com](https://aistudio.google.com/))

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/chat-wrap-ai.git
    cd chat-wrap-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root directory and add your API key:
    ```env
    API_KEY=your_gemini_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  Open `http://localhost:5173` (or the port shown in your terminal).

## 📱 How to Use

1.  **Export your WhatsApp Chat:**
    *   Open a WhatsApp Group or Chat.
    *   Tap Group Info > Scroll down > **Export Chat**.
    *   Select **"Without Media"** (Text processing only).
    *   Save the `.txt` file to your computer.
2.  **Upload to ChatWrap:**
    *   Drag and drop the `.txt` file into the app.
    *   (Optional) Toggle "Anonymize Names" for privacy screenshots.
3.  **Enjoy:**
    *   Wait for the parsing and AI analysis to complete.
    *   Share the results! You can even download a static HTML file of your report.

## 🔒 Privacy Note

*   **Local Processing:** The heavy lifting of parsing dates, counting messages, and generating charts happens entirely in your browser using JavaScript.
*   **AI Analysis:** To generate the creative insights (Poems, Awards, Roasts), the app sends a *sample* of the chat history to the Google Gemini API.
*   **Data Retention:** We do not store your chat logs on any server.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Built with ❤️ and ☕ for festive group chats everywhere.*
