# SentinelStream

**SentinelStream** is a secure, multi-tenant video streaming platform designed for enterprise environments. It integrates advanced AI processing to automatically analyze uploaded content for sensitivity, ensuring compliance and safety before content is distributed.

## 🚀 Features

### Core Functionality
- **Secure Video Upload**: Encrypted upload pipeline for MP4, MOV, and WEBM formats.
- **AI Sensitivity Analysis**: Powered by **Google Gemini 2.5**, the system automatically audits video metadata and content to detect violence, hate speech, or explicit material.
- **Adaptive Streaming**: Seamless video playback using HTTP range requests and optimized delivery.
- **Real-Time Progress Tracking**: Live updates for upload status, processing, and analysis stages.

### Enterprise Security
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full system access, bypass safety locks, user management.
  - **Editor**: Upload and manage content for their organization.
  - **Viewer**: Read-only access to approved videos.
- **Multi-Tenancy**: Strict data isolation between different organizations.
- **Content Flagging**: Automated locking of sensitive content with manual review workflows.

## 🛠 Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: Tailwind CSS, Lucide React Icons
- **AI Integration**: Google GenAI SDK (Gemini 3 Flash & 2.5 models)
- **State Management**: React Hooks & Context
- **Deployment**: Edge-compatible static build

## 🏗 Architecture

1.  **Upload Layer**: Validates file types and mimics a multipart upload process to secure object storage.
2.  **Processing Pipeline**:
    *   **Stage 1**: Ingestion & Transcoding (Simulated).
    *   **Stage 2**: Metadata Audit via Gemini API.
    *   **Stage 3**: Content Classification (Safe/Flagged).
3.  **Consumption Layer**: Custom video player with safety overlays for flagged content.

## 🚦 Getting Started

### Prerequisites
*   Node.js v18+
*   Google Gemini API Key

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-org/sentinel-stream.git
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    ```bash
    export API_KEY="your_google_genai_api_key"
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

## 🔒 Safety & Compliance

SentinelStream enforces a "Safety First" approach. Videos flagged by the AI are immediately locked behind a warning screen. Only users with **Admin** privileges can bypass this lock or mark the video as safe after manual review.

---
*Built for the Modern Enterprise.*