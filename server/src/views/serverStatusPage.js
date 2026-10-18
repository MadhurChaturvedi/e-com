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
  const dbHost = mongoose.connection.host || 'MongoDB Cluster (WiredTiger)';
  const uptimeSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;
  const uptimeFormatted = `${hours}h ${minutes}m ${seconds}s`;

  const memory = process.memoryUsage();
  const heapUsedMb = (memory.heapUsed / 1024 / 1024).toFixed(1);
  const heapTotalMb = (memory.heapTotal / 1024 / 1024).toFixed(1);
  const heapPercent = Math.min(100, Math.round((memory.heapUsed / memory.heapTotal) * 100));
  const rssMb = (memory.rss / 1024 / 1024).toFixed(1);

  const clientUrl =
    env.CLIENT_URL ||
    (env.CLIENT_URLS && env.CLIENT_URLS[0]) ||
    'https://e-com-phi-beige.vercel.app';

  const hostUrl = `${req.protocol}://${req.get('host') || 'localhost'}`;
  const environmentName = (env.NODE_ENV || 'production').toUpperCase();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NovaStore Infrastructure Console • API Gateway & System Health</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --surface: #0f1523;
      --surface-elevated: #151d30;
      --border: #1c263c;
      --border-subtle: #162033;
      --border-highlight: #2c3a59;
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --primary-subtle: rgba(59, 130, 246, 0.1);
      --success: #10b981;
      --success-subtle: rgba(16, 185, 129, 0.12);
      --warning: #f59e0b;
      --warning-subtle: rgba(245, 158, 11, 0.12);
      --danger: #ef4444;
      --danger-subtle: rgba(239, 68, 68, 0.12);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text-primary);
      min-height: 100vh;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Top Global Header Bar */
    .top-nav {
      background: rgba(15, 21, 35, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .top-nav-inner {
      max-width: 1320px;
      margin: 0 auto;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-mark {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border: 1px solid #334155;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #3b82f6;
    }

    .brand-mark svg {
      width: 20px;
      height: 20px;
    }

    .brand-info {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-badge {
      font-size: 0.68rem;
      font-weight: 600;
      background: var(--primary-subtle);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: 4px;
      padding: 1px 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .brand-sub {
      font-size: 0.78rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: ${dbConnected ? 'var(--success-subtle)' : 'var(--warning-subtle)'};
      border: 1px solid ${dbConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'};
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      color: ${dbConnected ? '#34d399' : '#fbbf24'};
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: ${dbConnected ? '#10b981' : '#f59e0b'};
      box-shadow: 0 0 8px ${dbConnected ? '#10b981' : '#f59e0b'};
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 14px;
      font-size: 0.82rem;
      font-weight: 600;
      border-radius: 6px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      font-family: inherit;
    }

    .btn-secondary {
      background: var(--surface-elevated);
      color: var(--text-primary);
      border: 1px solid var(--border);
    }

    .btn-secondary:hover {
      background: #1c263c;
      border-color: var(--border-highlight);
      color: #ffffff;
    }

    .btn-primary {
      background: var(--primary);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .btn-primary:hover {
      background: var(--primary-hover);
    }

    /* Main Container */
    .container {
      max-width: 1320px;
      margin: 0 auto;
      padding: 28px 24px 80px;
    }

    /* Sub-header / Env Breadcrumbs */
    .env-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .env-tags {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.76rem;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-muted);
    }

    .env-tag {
      background: #111827;
      border: 1px solid var(--border);
      padding: 3px 8px;
      border-radius: 4px;
      color: var(--text-secondary);
    }

    .clock-display {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Metric Summary Cards Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }

    @media (min-width: 640px) {
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .metrics-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .metric-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: border-color 0.2s ease;
    }

    .metric-card:hover {
      border-color: var(--border-highlight);
    }

    .metric-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .metric-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .metric-title svg {
      width: 15px;
      height: 15px;
      stroke: var(--text-muted);
    }

    .metric-badge {
      font-size: 0.7rem;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .badge-ok {
      background: var(--success-subtle);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }

    .badge-warn {
      background: var(--warning-subtle);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.25);
    }

    .metric-value {
      font-size: 1.55rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      margin-bottom: 6px;
      font-family: 'JetBrains Mono', monospace;
    }

    .metric-sub {
      font-size: 0.78rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
      word-break: break-all;
    }

    .progress-bar-wrap {
      width: 100%;
      height: 4px;
      background: var(--border);
      border-radius: 2px;
      margin-top: 10px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    /* Section Panels */
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 24px;
      overflow: hidden;
    }

    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--surface-elevated);
      flex-wrap: wrap;
      gap: 12px;
    }

    .panel-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .panel-title-wrap svg {
      width: 18px;
      height: 18px;
      stroke: #60a5fa;
    }

    .panel-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .panel-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .panel-body {
      padding: 20px;
    }

    /* Interactive API Workbench */
    .workbench-tabs {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 16px;
    }

    .tab-btn {
      background: #111827;
      border: 1px solid var(--border);
      color: var(--text-secondary);
      padding: 7px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tab-btn:hover {
      background: #1c263c;
      color: var(--text-primary);
      border-color: var(--border-highlight);
    }

    .tab-btn.active {
      background: #1e293b;
      color: #60a5fa;
      border-color: #3b82f6;
      font-weight: 600;
    }

    .method-pill {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      text-transform: uppercase;
    }

    .pill-get {
      background: var(--success-subtle);
      color: #34d399;
    }

    .pill-post {
      background: var(--primary-subtle);
      color: #60a5fa;
    }

    .pill-put {
      background: var(--warning-subtle);
      color: #fbbf24;
    }

    .pill-delete {
      background: var(--danger-subtle);
      color: #f87171;
    }

    .url-command-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .url-input-container {
      flex: 1;
      min-width: 280px;
      display: flex;
      align-items: center;
      background: #090d16;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      gap: 8px;
    }

    .url-input-container .host-prefix {
      color: var(--text-muted);
    }

    .url-input-container .path-active {
      color: var(--text-primary);
      font-weight: 600;
    }

    .terminal-window {
      background: #060910;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      font-family: 'JetBrains Mono', monospace;
    }

    .terminal-header {
      background: #0d1322;
      border-bottom: 1px solid var(--border);
      padding: 9px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .terminal-meta-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .terminal-meta-left .resp-tag {
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 0.72rem;
    }

    .terminal-meta-left .tag-ok {
      background: var(--success-subtle);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .terminal-meta-left .tag-err {
      background: var(--danger-subtle);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .terminal-meta-left .tag-wait {
      background: var(--warning-subtle);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .terminal-code {
      padding: 16px;
      font-size: 0.82rem;
      line-height: 1.6;
      max-height: 320px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
      color: #e2e8f0;
    }

    /* JSON Syntax Highlighting */
    .json-key { color: #93c5fd; }
    .json-string { color: #86efac; }
    .json-number { color: #fde047; }
    .json-boolean { color: #f472b6; }
    .json-null { color: #94a3b8; }

    /* Endpoint Directory Table */
    .table-container {
      overflow-x: auto;
    }

    .api-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
      text-align: left;
    }

    .api-table th {
      background: #0d1322;
      color: var(--text-muted);
      font-weight: 600;
      padding: 11px 16px;
      border-bottom: 1px solid var(--border);
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.05em;
    }

    .api-table td {
      padding: 13px 16px;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      vertical-align: middle;
    }

    .api-table tr:hover td {
      background: rgba(255, 255, 255, 0.015);
      color: var(--text-primary);
    }

    .api-table .path-cell {
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-primary);
      font-weight: 500;
    }

    .auth-badge {
      font-size: 0.7rem;
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 500;
      display: inline-block;
    }

    .auth-public {
      background: #111827;
      color: #94a3b8;
      border: 1px solid #1f2937;
    }

    .auth-jwt {
      background: rgba(59, 130, 246, 0.1);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.25);
    }

    .auth-admin {
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }

    .test-action-link {
      color: #60a5fa;
      cursor: pointer;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.78rem;
    }

    .test-action-link:hover {
      text-decoration: underline;
    }

    /* Security & Compliance Checklist */
    .checklist-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: 12px;
    }

    @media (min-width: 640px) {
      .checklist-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .checklist-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .check-item {
      background: #090d16;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
    }

    .check-item-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .check-item-header svg {
      width: 16px;
      height: 16px;
      color: #34d399;
    }

    .check-item-desc {
      font-size: 0.74rem;
      color: var(--text-muted);
      line-height: 1.45;
    }

    /* Footer */
    .footer {
      border-top: 1px solid var(--border);
      padding-top: 24px;
      margin-top: 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .footer a {
      color: var(--text-secondary);
      text-decoration: none;
    }

    .footer a:hover {
      color: #ffffff;
      text-decoration: underline;
    }
  </style>
</head>
<body>

  <!-- Top Global Navigation -->
  <nav class="top-nav">
    <div class="top-nav-inner">
      <div class="nav-left">
        <div class="brand-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
        </div>
        <div class="brand-info">
          <div class="brand-name">
            <span>NovaStore Infrastructure Platform</span>
            <span class="brand-badge">REST Gateway</span>
          </div>
          <div class="brand-sub">core-api-service &bull; version 1.4.0</div>
        </div>
      </div>

      <div class="nav-right">
        <div class="status-indicator">
          <div class="status-dot"></div>
          <span>${dbConnected ? 'All Systems Operational' : 'Database Degraded'}</span>
        </div>
        <a href="${clientUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
          <span>Customer Storefront</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"></line>
            <polyline points="7 7 17 7 17 17"></polyline>
          </svg>
        </a>
      </div>
    </div>
  </nav>

  <!-- Main Container -->
  <main class="container">

    <!-- Sub-header Environment Strip -->
    <div class="env-strip">
      <div class="env-tags">
        <span class="env-tag">ENV: ${environmentName}</span>
        <span class="env-tag">RUNTIME: Node ${process.version}</span>
        <span class="env-tag">ARCH: ${process.platform}-${process.arch}</span>
        <span class="env-tag">PID: ${process.pid}</span>
      </div>
      <div class="clock-display">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span id="liveClockUtc">UTC ...</span>
      </div>
    </div>

    <!-- Core Metrics Overview Grid -->
    <div class="metrics-grid">
      <!-- Database Status -->
      <div class="metric-card">
        <div class="metric-head">
          <span class="metric-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>
            Database Cluster
          </span>
          <span class="metric-badge ${dbConnected ? 'badge-ok' : 'badge-warn'}">
            ${dbConnected ? 'HEALTHY' : 'STANDBY'}
          </span>
        </div>
        <div class="metric-value" style="font-size: 1.35rem; color: ${dbConnected ? '#34d399' : '#fbbf24'};">
          ${dbStateText}
        </div>
        <div class="metric-sub">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.74rem;">${dbHost}</span>
        </div>
      </div>

      <!-- Service Uptime -->
      <div class="metric-card">
        <div class="metric-head">
          <span class="metric-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            System Uptime
          </span>
          <span class="metric-badge badge-ok">LIVE</span>
        </div>
        <div class="metric-value" id="uptimeCounter">
          ${uptimeFormatted}
        </div>
        <div class="metric-sub">
          <span>99.98% Service Level Objective</span>
        </div>
      </div>

      <!-- Memory Allocation -->
      <div class="metric-card">
        <div class="metric-head">
          <span class="metric-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            Heap Memory
          </span>
          <span class="metric-badge badge-ok">${heapPercent}%</span>
        </div>
        <div class="metric-value">
          ${heapUsedMb} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-muted);">/ ${heapTotalMb} MB</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width: ${heapPercent}%;"></div>
        </div>
        <div class="metric-sub" style="margin-top: 8px;">
          <span>RSS Footprint: ${rssMb} MB</span>
        </div>
      </div>

      <!-- Client Ingress -->
      <div class="metric-card">
        <div class="metric-head">
          <span class="metric-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            Client Gateway
          </span>
          <span class="metric-badge badge-ok">CORS OK</span>
        </div>
        <div class="metric-value" style="font-size: 1.15rem; word-break: break-all;">
          ${clientUrl.replace(/^https?:\/\//, '')}
        </div>
        <div class="metric-sub">
          <span>HTTP Cookies: Credentials Allowed</span>
        </div>
      </div>
    </div>

    <!-- Live API Diagnostics Console / Explorer -->
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
          <div>
            <div class="panel-title">Interactive API Diagnostics Console</div>
            <div class="panel-desc">Real-time telemetry and database ping tester for live infrastructure validation</div>
          </div>
        </div>
        <div>
          <button class="btn btn-secondary" id="executeRequestBtn" onclick="reRunCurrentDiagnostic()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            <span>Execute Request</span>
          </button>
        </div>
      </div>

      <div class="panel-body">
        <!-- Endpoint Tabs -->
        <div class="workbench-tabs">
          <button class="tab-btn active" data-url="/health" onclick="selectEndpointTab('/health', this)">
            <span class="method-pill pill-get">GET</span>
            <span>/health</span>
          </button>
          <button class="tab-btn" data-url="/health/live" onclick="selectEndpointTab('/health/live', this)">
            <span class="method-pill pill-get">GET</span>
            <span>/health/live</span>
          </button>
          <button class="tab-btn" data-url="/health/ready" onclick="selectEndpointTab('/health/ready', this)">
            <span class="method-pill pill-get">GET</span>
            <span>/health/ready</span>
          </button>
          <button class="tab-btn" data-url="/api/v1/products?limit=3" onclick="selectEndpointTab('/api/v1/products?limit=3', this)">
            <span class="method-pill pill-get">GET</span>
            <span>/api/v1/products</span>
          </button>
          <button class="tab-btn" data-url="/api/v1/categories" onclick="selectEndpointTab('/api/v1/categories', this)">
            <span class="method-pill pill-get">GET</span>
            <span>/api/v1/categories</span>
          </button>
          <button class="tab-btn" data-url="/api/v1/home" onclick="selectEndpointTab('/api/v1/home', this)">
            <span class="method-pill pill-get">GET</span>
            <span>/api/v1/home</span>
          </button>
        </div>

        <!-- URL Command Bar -->
        <div class="url-command-bar">
          <div class="url-input-container">
            <span class="method-pill pill-get">GET</span>
            <span class="host-prefix">${hostUrl}</span>
            <span class="path-active" id="activeUrlPath">/health</span>
          </div>
          <button class="btn btn-secondary" id="copyPayloadBtn" onclick="copyConsoleOutput()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy Response</span>
          </button>
        </div>

        <!-- Terminal Output Box -->
        <div class="terminal-window">
          <div class="terminal-header">
            <div class="terminal-meta-left">
              <span id="responseStatusBadge" class="resp-tag tag-wait">CONNECTING...</span>
              <span id="responseLatency" style="color: var(--text-muted);">-- ms</span>
              <span id="responseSize" style="color: var(--text-muted);">-- KB</span>
            </div>
            <div>
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: var(--text-muted);">application/json; charset=utf-8</span>
            </div>
          </div>
          <pre class="terminal-code" id="consoleOutput">Initiating telemetry diagnostics...</pre>
        </div>
      </div>
    </div>

    <!-- REST API Service Directory -->
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          <div>
            <div class="panel-title">REST API Service Inventory</div>
            <div class="panel-desc">Primary production endpoints exposed by this microservices gateway</div>
          </div>
        </div>
        <div>
          <span style="font-size: 0.78rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">Prefix: /api/v1</span>
        </div>
      </div>

      <div class="table-container">
        <table class="api-table">
          <thead>
            <tr>
              <th style="width: 80px;">Method</th>
              <th>Endpoint Route</th>
              <th>Service Domain</th>
              <th>Access Tier</th>
              <th>Caching Policy</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="method-pill pill-get">GET</span></td>
              <td class="path-cell">/health</td>
              <td>System Telemetry</td>
              <td><span class="auth-badge auth-public">Public</span></td>
              <td>Real-time (0s)</td>
              <td style="text-align: right;">
                <a class="test-action-link" onclick="selectEndpointTab('/health')">Inspect &rarr;</a>
              </td>
            </tr>
            <tr>
              <td><span class="method-pill pill-get">GET</span></td>
              <td class="path-cell">/health/live</td>
              <td>Kubernetes Liveness</td>
              <td><span class="auth-badge auth-public">Public</span></td>
              <td>Real-time (0s)</td>
              <td style="text-align: right;">
                <a class="test-action-link" onclick="selectEndpointTab('/health/live')">Inspect &rarr;</a>
              </td>
            </tr>
            <tr>
              <td><span class="method-pill pill-get">GET</span></td>
              <td class="path-cell">/health/ready</td>
              <td>MongoDB Cluster Probe</td>
              <td><span class="auth-badge auth-public">Public</span></td>
              <td>Real-time (0s)</td>
              <td style="text-align: right;">
                <a class="test-action-link" onclick="selectEndpointTab('/health/ready')">Inspect &rarr;</a>
              </td>
            </tr>
            <tr>
              <td><span class="method-pill pill-get">GET</span></td>
              <td class="path-cell">/api/v1/products</td>
              <td>Catalog & Merchandising</td>
              <td><span class="auth-badge auth-public">Public</span></td>
              <td>Client SWR (3m)</td>
              <td style="text-align: right;">
                <a class="test-action-link" onclick="selectEndpointTab('/api/v1/products?limit=3')">Inspect &rarr;</a>
              </td>
            </tr>
            <tr>
              <td><span class="method-pill pill-get">GET</span></td>
              <td class="path-cell">/api/v1/categories</td>
              <td>Taxonomy Engine</td>
              <td><span class="auth-badge auth-public">Public</span></td>
              <td>Client SWR (10m)</td>
              <td style="text-align: right;">
                <a class="test-action-link" onclick="selectEndpointTab('/api/v1/categories')">Inspect &rarr;</a>
              </td>
            </tr>
            <tr>
              <td><span class="method-pill pill-get">GET</span></td>
              <td class="path-cell">/api/v1/home</td>
              <td>Storefront Aggregation</td>
              <td><span class="auth-badge auth-public">Public</span></td>
              <td>Client SWR (3m)</td>
              <td style="text-align: right;">
                <a class="test-action-link" onclick="selectEndpointTab('/api/v1/home')">Inspect &rarr;</a>
              </td>
            </tr>
            <tr>
              <td><span class="method-pill pill-get">GET</span></td>
              <td class="path-cell">/api/v1/banners/active</td>
              <td>Hero Slider Engine</td>
              <td><span class="auth-badge auth-public">Public</span></td>
              <td>Client SWR (5m)</td>
              <td style="text-align: right;">
                <a class="test-action-link" onclick="selectEndpointTab('/api/v1/banners/active')">Inspect &rarr;</a>
              </td>
            </tr>
            <tr>
              <td><span class="method-pill pill-get">GET</span></td>
              <td class="path-cell">/api/v1/cart</td>
              <td>Commerce & Checkout</td>
              <td><span class="auth-badge auth-jwt">Session / JWT</span></td>
              <td>Strict No-Cache</td>
              <td style="text-align: right;"><span style="color: var(--text-muted);">&mdash;</span></td>
            </tr>
            <tr>
              <td><span class="method-pill pill-post">POST</span></td>
              <td class="path-cell">/api/v1/orders</td>
              <td>Order Processing Pipeline</td>
              <td><span class="auth-badge auth-jwt">Customer JWT</span></td>
              <td>Atomic Transacted</td>
              <td style="text-align: right;"><span style="color: var(--text-muted);">&mdash;</span></td>
            </tr>
            <tr>
              <td><span class="method-pill pill-get">GET</span></td>
              <td class="path-cell">/api/v1/admin/dashboard</td>
              <td>Seller Intelligence</td>
              <td><span class="auth-badge auth-admin">Admin RBAC</span></td>
              <td>Live Aggregated</td>
              <td style="text-align: right;"><span style="color: var(--text-muted);">&mdash;</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Security & Operational Compliance Overview -->
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <div>
            <div class="panel-title">Infrastructure & Security Governance</div>
            <div class="panel-desc">Compliance standards enforced at the network ingress and application boundary</div>
          </div>
        </div>
      </div>
      <div class="panel-body">
        <div class="checklist-grid">
          <div class="check-item">
            <div class="check-item-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>TLS 1.3 Transport</span>
            </div>
            <div class="check-item-desc">
              All communications encrypted in transit with enforced HTTPS and HSTS preloading headers.
            </div>
          </div>

          <div class="check-item">
            <div class="check-item-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>CORS Isolation</span>
            </div>
            <div class="check-item-desc">
              Strict origin matching with credentials allowed only for verified Vercel storefront domains.
            </div>
          </div>

          <div class="check-item">
            <div class="check-item-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Atomic Inventory</span>
            </div>
            <div class="check-item-desc">
              ACID transacted quantity validation preventing race conditions, over-selling, or stock drift.
            </div>
          </div>

          <div class="check-item">
            <div class="check-item-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Rate Limit Defense</span>
            </div>
            <div class="check-item-desc">
              100 requests per 15-minute sliding window with automatic client cold-start retry tolerance.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <div>
        <span>NovaStore Infrastructure Platform &bull; Production Gateway</span>
      </div>
      <div>
        <span>API Base: <code style="color: #cbd5e1; font-family: 'JetBrains Mono', monospace;">${hostUrl}/api/v1</code></span>
      </div>
    </footer>

  </main>

  <script>
    let currentEndpoint = '/health';

    function selectEndpointTab(endpoint, tabEl) {
      currentEndpoint = endpoint;
      document.getElementById('activeUrlPath').innerText = endpoint;

      // Update tab selection state
      document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('data-url') === endpoint || btn.innerText.includes(endpoint.split('?')[0])) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Scroll smoothly to workbench
      document.querySelector('.workbench-tabs').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Run test
      runDiagnostic(endpoint);
    }

    function reRunCurrentDiagnostic() {
      runDiagnostic(currentEndpoint);
    }

    // Syntax highlighter for clean enterprise code display
    function formatJsonSyntax(json) {
      if (typeof json !== 'string') {
        json = JSON.stringify(json, null, 2);
      }
      json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
      });
    }

    async function runDiagnostic(endpoint) {
      const statusBadge = document.getElementById('responseStatusBadge');
      const latencyEl = document.getElementById('responseLatency');
      const sizeEl = document.getElementById('responseSize');
      const consoleEl = document.getElementById('consoleOutput');

      statusBadge.className = 'resp-tag tag-wait';
      statusBadge.innerText = 'PINGING...';
      latencyEl.innerText = 'Measuring...';
      sizeEl.innerText = '-- KB';
      consoleEl.innerHTML = '<span style="color: #94a3b8;">Connecting to serverless API gateway & MongoDB cluster...</span>';

      const startTime = performance.now();
      try {
        const res = await fetch(endpoint);
        const duration = Math.round(performance.now() - startTime);
        const text = await res.text();
        const byteLength = new Blob([text]).size;
        const kbSize = (byteLength / 1024).toFixed(2);

        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }

        statusBadge.className = res.ok ? 'resp-tag tag-ok' : 'resp-tag tag-err';
        statusBadge.innerText = res.status + ' ' + (res.statusText || (res.ok ? 'OK' : 'FAIL'));
        latencyEl.innerText = duration + ' ms';
        sizeEl.innerText = kbSize + ' KB';

        consoleEl.innerHTML = formatJsonSyntax(parsed);
      } catch (err) {
        const duration = Math.round(performance.now() - startTime);
        statusBadge.className = 'resp-tag tag-err';
        statusBadge.innerText = 'CONNECTION ERROR';
        latencyEl.innerText = duration + ' ms';
        consoleEl.innerHTML = '<span style="color: #f87171;">Failed to connect to gateway: ' + err.message + '</span>';
      }
    }

    function copyConsoleOutput() {
      const consoleEl = document.getElementById('consoleOutput');
      const text = consoleEl.innerText;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyPayloadBtn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<span style="color: #34d399;">✓ Copied</span>';
        setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
      });
    }

    // Live Uptime Ticker
    let currentUptimeSec = ${uptimeSeconds};
    setInterval(() => {
      currentUptimeSec++;
      const h = Math.floor(currentUptimeSec / 3600);
      const m = Math.floor((currentUptimeSec % 3600) / 60);
      const s = currentUptimeSec % 60;
      const el = document.getElementById('uptimeCounter');
      if (el) el.innerText = h + 'h ' + m + 'm ' + s + 's';
    }, 1000);

    // Live UTC Clock
    function updateUtcClock() {
      const now = new Date();
      const iso = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      const el = document.getElementById('liveClockUtc');
      if (el) el.innerText = iso;
    }
    setInterval(updateUtcClock, 1000);
    updateUtcClock();

    // Initial Probe
    runDiagnostic('/health');
  </script>
</body>
</html>`;
};
