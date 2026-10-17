import mongoose from 'mongoose';
import { env } from '../config/env.js';

export const renderServerStatusHtml = (req) => {
  const dbConnected = mongoose.connection.readyState === 1;
  const dbStateMap = {
    0: 'Disconnected',
    1: 'Connected & Operational',
    2: 'Connecting...',
    3: 'Disconnecting...',
  };
  const dbStateText = dbStateMap[mongoose.connection.readyState] || 'Unknown';
  const dbHost = mongoose.connection.host || 'MongoDB Cluster';
  const uptimeSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;
  const uptimeFormatted = `${hours}h ${minutes}m ${seconds}s`;

  const memory = process.memoryUsage();
  const heapUsedMb = (memory.heapUsed / 1024 / 1024).toFixed(1);
  const heapTotalMb = (memory.heapTotal / 1024 / 1024).toFixed(1);

  const clientUrl =
    env.CLIENT_URL ||
    (env.CLIENT_URLS && env.CLIENT_URLS[0]) ||
    'https://e-com-phi-beige.vercel.app';

  const hostUrl = `${req.protocol}://${req.get('host') || 'localhost'}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NovaStore API Engine • Live Operational Dashboard</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #070a12;
      --card-bg: rgba(17, 24, 39, 0.72);
      --card-border: rgba(255, 255, 255, 0.08);
      --card-hover-border: rgba(99, 102, 241, 0.4);
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --primary: #6366f1;
      --primary-light: #818cf8;
      --primary-glow: rgba(99, 102, 241, 0.25);
      --success: #10b981;
      --success-glow: rgba(16, 185, 129, 0.25);
      --warning: #f59e0b;
      --accent: #ec4899;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
      line-height: 1.5;
    }

    /* Animated background gradient orbs */
    .ambient-glow {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.45;
      animation: float 20s ease-in-out infinite alternate;
    }

    .orb-1 {
      top: -10%;
      left: 15%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, #4f46e5 0%, transparent 70%);
      animation-duration: 18s;
    }

    .orb-2 {
      bottom: -15%;
      right: 10%;
      width: 550px;
      height: 550px;
      background: radial-gradient(circle, #06b6d4 0%, transparent 70%);
      animation-duration: 22s;
      animation-delay: -5s;
    }

    .orb-3 {
      top: 40%;
      right: 30%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
      animation-duration: 25s;
      animation-delay: -10s;
    }

    @keyframes float {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(40px, -30px) scale(1.08); }
      100% { transform: translate(-30px, 35px) scale(0.95); }
    }

    /* Grid overlay */
    .grid-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
      z-index: 1;
    }

    /* Main layout container */
    .container {
      position: relative;
      z-index: 2;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }

    /* Header section */
    .header {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-bottom: 40px;
    }

    @media (min-width: 768px) {
      .header {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-icon {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5);
      position: relative;
    }

    .brand-icon svg {
      width: 28px;
      height: 28px;
      fill: #ffffff;
    }

    .brand-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1.1;
    }

    .brand-subtitle {
      font-size: 0.88rem;
      color: var(--text-muted);
      margin-top: 4px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    /* Operational Badge */
    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 9999px;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: #34d399;
      text-transform: uppercase;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #10b981;
      position: relative;
    }

    .live-dot::after {
      content: '';
      position: absolute;
      top: -4px;
      left: -4px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: #10b981;
      opacity: 0.6;
      animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse-ring {
      0% { transform: scale(0.6); opacity: 0.8; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    .client-link-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 18px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #ffffff;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.88rem;
      border-radius: 12px;
      transition: all 0.25s ease;
      box-shadow: 0 8px 20px -4px rgba(79, 70, 229, 0.4);
    }

    .client-link-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px -4px rgba(79, 70, 229, 0.6);
      color: #ffffff;
    }

    /* Cards Grid */
    .grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }

    @media (min-width: 640px) {
      .grid-3 {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 24px;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    }

    .card:hover {
      border-color: var(--card-hover-border);
      transform: translateY(-3px);
      box-shadow: 0 14px 30px -10px rgba(0, 0, 0, 0.6);
    }

    .card-label {
      font-size: 0.76rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .card-value {
      font-family: 'Outfit', sans-serif;
      font-size: 1.6rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .card-subtext {
      font-size: 0.85rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .badge-pill {
      font-size: 0.72rem;
      padding: 3px 10px;
      border-radius: 9999px;
      font-weight: 600;
    }

    .badge-success {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .badge-warning {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .badge-info {
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    /* Diagnostics Section */
    .section-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .diagnostic-panel {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 30px;
    }

    .button-group {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 18px;
    }

    .test-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: var(--text-main);
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: inherit;
    }

    .test-btn:hover {
      background: rgba(99, 102, 241, 0.18);
      border-color: var(--primary-light);
      color: #ffffff;
      transform: translateY(-1px);
    }

    .test-btn.active {
      background: var(--primary);
      border-color: var(--primary);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
    }

    .console-box {
      background: #040711;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      overflow: hidden;
      font-family: 'JetBrains Mono', monospace;
    }

    .console-header {
      background: rgba(255, 255, 255, 0.03);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .console-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-tag {
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
    }

    .status-tag.ok {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
    }

    .status-tag.wait {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
    }

    .copy-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-muted);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.74rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .copy-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }

    .console-body {
      padding: 16px;
      font-size: 0.82rem;
      color: #e2e8f0;
      max-height: 280px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }

    /* Endpoint Directory */
    .endpoint-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: 12px;
    }

    @media (min-width: 640px) {
      .endpoint-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .endpoint-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
    }

    .endpoint-row:hover {
      background: rgba(99, 102, 241, 0.08);
      border-color: rgba(99, 102, 241, 0.25);
      transform: translateX(4px);
    }

    .endpoint-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .method-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
    }

    .endpoint-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      font-weight: 500;
      color: #ffffff;
    }

    .endpoint-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    /* Footer */
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 0.82rem;
      color: #64748b;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .footer a {
      color: #818cf8;
      text-decoration: none;
    }

    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="ambient-glow">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
  </div>
  <div class="grid-overlay"></div>

  <div class="container">
    <!-- Header -->
    <header class="header">
      <div class="brand-wrap">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <h1 class="brand-title">NovaStore API Engine</h1>
          <p class="brand-subtitle">
            <span>Production Backend Service</span>
            <span>•</span>
            <span style="font-family: 'JetBrains Mono', monospace;">Node ${process.version}</span>
            <span>•</span>
            <span>Vercel Serverless</span>
          </p>
        </div>
      </div>

      <div class="header-actions">
        <div class="live-badge">
          <div class="live-dot"></div>
          <span>System Operational</span>
        </div>
        <a href="${clientUrl}" target="_blank" rel="noopener noreferrer" class="client-link-btn">
          <span>Launch Web Store</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"></line>
            <polyline points="7 7 17 7 17 17"></polyline>
          </svg>
        </a>
      </div>
    </header>

    <!-- Core Metrics Grid -->
    <div class="grid grid-3">
      <!-- Database Card -->
      <div class="card">
        <div class="card-label">
          <span>Database Connectivity</span>
          <span class="badge-pill ${dbConnected ? 'badge-success' : 'badge-warning'}">
            ${dbConnected ? 'Active' : 'Standby'}
          </span>
        </div>
        <div class="card-value">
          <span style="color: ${dbConnected ? '#34d399' : '#fbbf24'};">●</span>
          <span>${dbStateText}</span>
        </div>
        <div class="card-subtext">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.78rem;">${dbHost}</span>
        </div>
      </div>

      <!-- Server Uptime Card -->
      <div class="card">
        <div class="card-label">
          <span>Server Uptime</span>
          <span class="badge-pill badge-info">Live</span>
        </div>
        <div class="card-value" id="uptimeCounter">
          ${uptimeFormatted}
        </div>
        <div class="card-subtext">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>Heap: ${heapUsedMb} MB / ${heapTotalMb} MB</span>
        </div>
      </div>

      <!-- Client Cross-Origin Card -->
      <div class="card">
        <div class="card-label">
          <span>Client Integration</span>
          <span class="badge-pill badge-success">CORS Ready</span>
        </div>
        <div class="card-value" style="font-size: 1.2rem; word-break: break-all;">
          ${clientUrl.replace(/^https?:\/\//, '')}
        </div>
        <div class="card-subtext">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          <span>Credentials: Allowed (Cross-Origin)</span>
        </div>
      </div>
    </div>

    <!-- Live Diagnostics Panel -->
    <div class="diagnostic-panel">
      <div class="section-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <span>Live API Health & Diagnostics Tester</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
        Click an endpoint below to ping the live database and verify real-time latency and payload delivery from this deployed instance:
      </p>

      <div class="button-group">
        <button class="test-btn active" onclick="runDiagnostic('/health')">
          ⚡ GET /health
        </button>
        <button class="test-btn" onclick="runDiagnostic('/api/v1/products')">
          📦 GET /api/v1/products
        </button>
        <button class="test-btn" onclick="runDiagnostic('/api/v1/categories')">
          🏷️ GET /api/v1/categories
        </button>
        <button class="test-btn" onclick="runDiagnostic('/api/v1/home')">
          🏠 GET /api/v1/home
        </button>
      </div>

      <div class="console-box">
        <div class="console-header">
          <div class="console-meta">
            <span id="testedEndpoint" style="color: #cbd5e1; font-weight: 600;">/health</span>
            <span id="responseStatus" class="status-tag ok">200 OK</span>
            <span id="responseLatency" style="color: #94a3b8;">-- ms</span>
          </div>
          <button class="copy-btn" id="copyJsonBtn" onclick="copyConsoleOutput()">
            Copy JSON
          </button>
        </div>
        <pre class="console-body" id="consoleOutput">Loading health diagnostic...</pre>
      </div>
    </div>

    <!-- API Directory -->
    <div class="diagnostic-panel" style="padding-bottom: 20px;">
      <div class="section-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
        <span>API Endpoints Directory</span>
      </div>

      <div class="endpoint-grid">
        <a href="/api/v1/products" target="_blank" class="endpoint-row">
          <div class="endpoint-info">
            <span class="method-tag">GET</span>
            <span class="endpoint-path">/api/v1/products</span>
          </div>
          <span class="endpoint-desc">Catalog & Search</span>
        </a>

        <a href="/api/v1/categories" target="_blank" class="endpoint-row">
          <div class="endpoint-info">
            <span class="method-tag">GET</span>
            <span class="endpoint-path">/api/v1/categories</span>
          </div>
          <span class="endpoint-desc">Categories Hierarchy</span>
        </a>

        <a href="/api/v1/home" target="_blank" class="endpoint-row">
          <div class="endpoint-info">
            <span class="method-tag">GET</span>
            <span class="endpoint-path">/api/v1/home</span>
          </div>
          <span class="endpoint-desc">Aggregated Store Feed</span>
        </a>

        <a href="/health" target="_blank" class="endpoint-row">
          <div class="endpoint-info">
            <span class="method-tag">GET</span>
            <span class="endpoint-path">/health</span>
          </div>
          <span class="endpoint-desc">Liveness & Database Probe</span>
        </a>

        <a href="/api/v1/banners" target="_blank" class="endpoint-row">
          <div class="endpoint-info">
            <span class="method-tag">GET</span>
            <span class="endpoint-path">/api/v1/banners</span>
          </div>
          <span class="endpoint-desc">Store Banners</span>
        </a>

        <a href="/health/ready" target="_blank" class="endpoint-row">
          <div class="endpoint-info">
            <span class="method-tag">GET</span>
            <span class="endpoint-path">/health/ready</span>
          </div>
          <span class="endpoint-desc">Readiness Check</span>
        </a>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <div>
        NovaStore Full-Stack Platform • Node.js Express & MongoDB Atlas • Deployed on Vercel
      </div>
      <div>
        API Base: <code style="font-family: 'JetBrains Mono', monospace; color: #cbd5e1;">${hostUrl}/api/v1</code>
      </div>
    </footer>
  </div>

  <script>
    // Realtime diagnostic runner
    async function runDiagnostic(endpoint) {
      const endpointEl = document.getElementById('testedEndpoint');
      const statusEl = document.getElementById('responseStatus');
      const latencyEl = document.getElementById('responseLatency');
      const consoleEl = document.getElementById('consoleOutput');

      // Update active button state
      document.querySelectorAll('.test-btn').forEach(btn => {
        if (btn.innerText.includes(endpoint)) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      endpointEl.innerText = endpoint;
      statusEl.className = 'status-tag wait';
      statusEl.innerText = 'PINGING...';
      latencyEl.innerText = 'measuring...';
      consoleEl.innerText = 'Connecting to server & database...';

      const start = performance.now();
      try {
        const res = await fetch(endpoint);
        const duration = Math.round(performance.now() - start);
        const data = await res.json();

        statusEl.className = res.ok ? 'status-tag ok' : 'status-tag wait';
        statusEl.innerText = res.status + ' ' + (res.statusText || 'OK');
        latencyEl.innerText = '⚡ ' + duration + ' ms';
        consoleEl.innerText = JSON.stringify(data, null, 2);
      } catch (err) {
        const duration = Math.round(performance.now() - start);
        statusEl.className = 'status-tag wait';
        statusEl.innerText = 'ERROR';
        latencyEl.innerText = duration + ' ms';
        consoleEl.innerText = 'Failed to fetch diagnostic: ' + err.message;
      }
    }

    function copyConsoleOutput() {
      const text = document.getElementById('consoleOutput').innerText;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyJsonBtn');
        btn.innerText = '✓ Copied!';
        setTimeout(() => { btn.innerText = 'Copy JSON'; }, 2000);
      });
    }

    // Live uptime ticker
    let uptimeSec = ${uptimeSeconds};
    setInterval(() => {
      uptimeSec++;
      const h = Math.floor(uptimeSec / 3600);
      const m = Math.floor((uptimeSec % 3600) / 60);
      const s = uptimeSec % 60;
      const el = document.getElementById('uptimeCounter');
      if (el) el.innerText = h + 'h ' + m + 'm ' + s + 's';
    }, 1000);

    // Initial diagnostic run
    runDiagnostic('/health');
  </script>
</body>
</html>`;
};
