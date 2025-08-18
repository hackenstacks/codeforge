# Code Forge - AI-Powered Development Assistant

Code Forge is a powerful, interactive tool that leverages AI to supercharge your development workflow. It's a code reviewer, a code generator, and an image generator all in one, with a persistent, searchable local database to save all your work.

## ✨ Features

*   **Multi-Mode AI**:
    *   **Review Code**: Get expert-level analysis of your code for bugs, style, and best practices.
    *   **Generate Code**: Describe what you need, and let the AI write the code for you.
    *   **Generate Image**: Create images from text prompts (with compatible models like Gemini).
*   **The Forge Vault (Local Database)**:
    *   **Persistent Storage**: Save your code reviews, generated code, and images directly in your browser using IndexedDB. Everything stays on your machine.
    *   **Tagging & Organization**: Add custom tags to any saved project to keep your work organized.
    *   **Full-Text Search**: Instantly find any saved item by its content, prompt, or tags.
*   **Interactive Diff Viewer**: Clearly see additions and deletions proposed by the AI during a code review.
*   **Advanced Analysis**: Use "Deep Scan" for a more rigorous two-step validation review and "Live Thinking" to see the AI's response stream in real-time.
*   **Multi-Provider Support**:
    *   Connect to **Google Gemini**.
    *   Connect to any **OpenAI-Compatible** backend (Ollama, LM Studio, etc.).
*   **Browser Extension Ready**: Includes a `manifest.json` to be easily packaged as a browser extension.
*   **Client-Side Privacy**: All code, prompts, and API keys are processed and stored locally in your browser. Nothing is stored on a server.

## 🚀 Getting Started

There are three ways to use Code Forge:

1.  **Local Development**
2.  **Hosted on GitHub Pages**
3.  **As a Browser Extension**

### 1. Running Locally

To run Code Forge on your own machine:

1.  You don't need to install anything! Just open the `index.html` file in your web browser.
2.  For the best experience (to avoid potential CORS issues with local models), run a simple local web server:
    ```bash
    # If you have Python 3
    python -m http.server

    # Or use the 'serve' npm package
    npx serve .
    ```
3.  Navigate to the local URL provided by the server (e.g., `http://localhost:8000`).

### 2. Hosting on GitHub Pages (Free)

You can host your own version of Code Forge for free on GitHub Pages.

1.  Create a new public repository on GitHub.
2.  Upload all the project files (`index.html`, `index.tsx`, `components/`, etc.) to the repository.
3.  In your repository's settings, navigate to the **Pages** tab.
4.  Under "Build and deployment", select **Deploy from a branch**.
5.  Choose the `main` (or `master`) branch and the `/ (root)` folder, then click **Save**.
6.  Your personal Code Forge instance will be live in a few minutes at `https://<your-username>.github.io/<your-repo-name>/`.

## ⚙️ Configuration

Click the **gear icon** in the header to open the settings panel.

### Google Gemini (Default)

1.  Go to [Google AI Studio](https://aistudio.google.com/app/apikey) to generate an API key.
2.  In Code Forge settings, select the **Google Gemini** provider.
3.  Paste your API key into the "API Key" field.
4.  You can change the model name if you wish (e.g., `gemini-2.5-flash` for text, `imagen-3.0-generate-002` for images).
5.  Click **Save**.

### Ollama & Other Local Models (OpenAI-Compatible)

You can connect Code Forge to a local model running with Ollama.

1.  **Install and run Ollama** on your machine.
2.  Pull a model you want to use (e.g., `llama3`, `codellama`):
    ```bash
    ollama pull llama3
    ```
3.  **Start the Ollama server**. By default, it runs at `http://localhost:11434`.
4.  In Code Forge settings, select the **OpenAI-Compatible** provider.
5.  Set the **API Endpoint** to your Ollama server's completion endpoint: `http://localhost:11434/v1/chat/completions`.
6.  Set the **Model Name** to the model you pulled (e.g., `llama3`).
7.  The **API Key** can usually be left blank or set to `ollama`.
8.  Click **Save**.

> **Note on CORS**: When connecting to a local model from a `file://` URL, your browser may block the request due to security policies (CORS). To avoid this, run Code Forge from a local web server as described in the "Running Locally" section.

## 📦 Building as a Browser Extension

This project is structured to be easily converted into a browser extension.

1.  **Chrome**:
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Enable **Developer mode**.
    *   Click **Load unpacked**.
    *   Select the folder containing the Code Forge project files.
    *   The Code Forge icon will appear in your extension toolbar.

2.  **Firefox**:
    *   Open Firefox and navigate to `about:debugging`.
    *   Click **This Firefox** and then **Load Temporary Add-on...**.
    *   Select the `manifest.json` file from the project folder.

The extension will open Code Forge in a popup window, providing a convenient way to access it anytime.