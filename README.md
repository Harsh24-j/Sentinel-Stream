# SentinelStream

**Enterprise-oriented video review and content-safety prototype built with React and Google Gemini.**

SentinelStream models a multi-tenant video workflow in which uploaded content is processed, analyzed for safety signals, and presented with access controls and review states.

## Features

### Content workflow

- Video upload flow for MP4, MOV, and WEBM inputs
- AI-assisted sensitivity analysis for uploaded content
- Video playback with HTTP range-request support
- Real-time processing/progress states
- Safety overlays for flagged content

### Access control

- **Admin:** Full access, including review/bypass actions
- **Editor:** Upload and manage organization content
- **Viewer:** Read-only access to approved content
- Organization-aware data separation
- Flagged-content locking and manual review workflow

## Architecture

```text
Video Upload
     |
     v
Ingestion / Processing
     |
     +----> Metadata analysis with Gemini
     |
     +----> Content classification
     |
     v
Safe / Flagged state
     |
     v
Video playback + access controls
```

> The current repository models some ingestion/transcoding behavior rather than providing a complete production media-processing pipeline. The README keeps those responsibilities clearly separated from implemented application behavior.

## Tech Stack

- **Frontend:** React 19, Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **AI integration:** Google GenAI SDK / Gemini models
- **State management:** React Hooks and Context
- **Deployment:** Edge-compatible static build

## Getting Started

### Prerequisites

- Node.js 18+
- Google Gemini API key

### Install

```bash
npm install
```

### Configure

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

Then set:

```text
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

The application reads this value through Vite's `import.meta.env` mechanism. Never commit the real key.

> Because this is a client-side demo, a browser-delivered API key should be treated as an application credential with appropriate restrictions. A production design should move model calls behind a trusted backend.

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Project Focus

The project explores how enterprise video workflows can combine AI-assisted content review with role-based access, organization-level isolation, processing states, and user-facing safety controls.

## Current Scope vs. Production Extensions

The repository is best understood as a prototype demonstrating the product and application workflow. A production implementation would require a full object-storage pipeline, real media transcoding, durable backend persistence, stronger observability, and a hardened authentication/authorization layer.

## Author

**Harsh Shrivastava**  
[GitHub](https://github.com/Harsh24-j) · [LinkedIn](https://linkedin.com/in/harshshrivastava24)
