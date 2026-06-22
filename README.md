# OmniSupport AI - Mobile Support Simulator

OmniSupport AI is a comprehensive enterprise-grade support simulation platform. It models a mobile viewport experience equipped with AI-powered conversational assistance.

## Features

- **Internal Mobile Viewport Simulation:** A sleek, fully contained mobile device frame rendering the application as it would appear on a native mobile device.
- **Predictive Reference Base:** Integrated knowledge base articles with responsive search and automated resolution flows.
- **Sidebar Navigation Control Center:** A collapsible mobile sidebar structure for seamlessly toggling between Chat, Telemetry, CRM tools, and settings.
- **Theme-Switching Capability:** Dynamic support for both Light and Dark modes.

## Installation

Ensure you have Node.js installed on your machine.

Clone the repository and install dependencies:

```bash
npm install
```

## Running Locally

To start the development server, run:

```bash
npm run dev
```

Then, open \`http://localhost:3000\` in your browser to view the application.

## Environment Configuration

Copy the \`.env.example\` file to \`.env.local\` and populate it with your environment-specific values, such as your Gemini API Key if you intend to use the live AI endpoint.

```bash
cp .env.example .env.local
```
