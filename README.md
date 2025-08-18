# AI Forge - AI-Powered Development Assistant

AI Forge is a powerful, interactive tool that leverages AI to supercharge your development workflow. It's a code reviewer, a code generator, an image generator, and a secure workspace all in one, with a persistent, searchable, and encrypted local database to save all your work.

## ✨ Features

*   **Unified Chat Interface**:
    *   Engage in dynamic conversations with AI, powered by customizable personas.
    *   Reference and discuss files from your workspace directly in the chat.
*   **The Workspace**:
    *   A dedicated panel to create, upload, and manage documents, code files, and images.
    *   Seamlessly provide file content as context for your AI conversations.
*   **Encrypted Forge Vault (Local Database)**:
    *   **Master Password Security**: Your entire vault is encrypted using your own master password.
    *   **Persistent Storage**: Save your chat sessions, personas, and workspace files directly in your browser using IndexedDB. Everything stays on your machine, fully encrypted.
    *   **Tagging & Organization**: Add custom tags to any saved project to keep your work organized.
    *   **Full-Text Search**: Instantly find any saved item by its content, prompt, or tags.
*   **Custom AI Personas**:
    *   Switch between different AI characters (e.g., Code Reviewer, Creative Assistant).
    *   Create and save your own personas with custom system instructions to tailor the AI's behavior.
*   **Multi-Provider Support**:
    *   Connect to **Google Gemini**.
    *   Connect to any **OpenAI-Compatible** backend (Ollama, LM Studio, etc.).
*   **Client-Side Privacy**: All code, prompts, and API keys are processed and stored locally in your browser. Nothing is stored on a server.

## 🚀 Getting Started

There are three ways to use AI Forge:

1.  **Local Development**
2.  **Hosted on GitHub Pages**
3.  **As a Browser Extension**

### 1. Running Locally

To run AI Forge on your own machine:

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

You can host your own version of AI Forge for free on GitHub Pages.

1.  Create a new public repository on GitHub.
2.  Upload all the project files (`index.html`, `index.tsx`, `components/`, etc.) to the repository.
3.  In your repository's settings, navigate to the **Pages** tab.
4.  Under "Build and deployment", select **Deploy from a branch**.
5.  Choose the `main` (or `master`) branch and the `/ (root)` folder, then click **Save**.
6.  Your personal AI Forge instance will be live in a few minutes at `https://<your-username>.github.io/<your-repo-name>/`.

## ⚙️ Configuration

Click the **gear icon** in the header to open the settings panel.

### Google Gemini (Default)

1.  Go to [Google AI Studio](https://aistudio.google.com/app/apikey) to generate an API key.
2.  In AI Forge settings, select the **Google Gemini** provider.
3.  Paste your API key into the "API Key" field.
4.  You can change the model name if you wish (e.g., `gemini-2.5-flash` for text, `imagen-3.0-generate-002` for images).
5.  Click **Save**.

### Ollama & Other Local Models (OpenAI-Compatible)

You can connect AI Forge to a local model running with Ollama.

1.  **Install and run Ollama** on your machine.
2.  Pull a model you want to use (e.g., `llama3`, `codellama`):
    ```bash
    ollama pull llama3
    ```
3.  **Start the Ollama server**. By default, it runs at `http://localhost:11434`.
4.  In AI Forge settings, select the **OpenAI-Compatible** provider.
5.  Set the **API Endpoint** to your Ollama server's completion endpoint: `http://localhost:11434/v1/chat/completions`.
6.  Set the **Model Name** to the model you pulled (e.g., `llama3`).
7.  The **API Key** can usually be left blank or set to `ollama`.
8.  Click **Save**.

> **Note on CORS**: When connecting to a local model from a `file://` URL, your browser may block the request due to security policies (CORS). To avoid this, run AI Forge from a local web server as described in the "Running Locally" section.

## 📦 Building as a Browser Extension

This project is structured to be easily converted into a browser extension.

1.  **Chrome**:
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Enable **Developer mode**.
    *   Click **Load unpacked**.
    *   Select the folder containing the AI Forge project files.
    *   The AI Forge icon will appear in your extension toolbar.

2.  **Firefox**:
    *   Open Firefox and navigate to `about:debugging`.
    *   Click **This Firefox** and then **Load Temporary Add-on...**.
    *   Select the `manifest.json` file from the project folder.

The extension will open AI Forge in a popup window, providing a convenient way to access it anytime.