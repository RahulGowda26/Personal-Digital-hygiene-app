// Sentinel Web Protection - Content Script

function showWarning(url, reasons) {
  // Check if warning is already displayed
  if (document.getElementById('sentinel-warning-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'sentinel-warning-overlay';
  
  const reasonsHtml = reasons.map(r => `<li>${r}</li>`).join('');

  overlay.innerHTML = `
    <div id="sentinel-warning-card">
      <div id="sentinel-warning-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <path d="M12 9v4"></path>
          <path d="M12 17h.01"></path>
        </svg>
      </div>
      <h2 id="sentinel-warning-title">Suspicious Link Detected</h2>
      <p id="sentinel-warning-desc">Sentinel Web Protection has blocked this page because it exhibits characteristics common to phishing or malicious websites.</p>
      
      <div id="sentinel-warning-reasons">
        <h4>Risk Factors</h4>
        <ul>${reasonsHtml}</ul>
      </div>

      <div id="sentinel-actions">
        <button id="sentinel-btn-back" class="sentinel-btn sentinel-btn-primary">Go Back to Safety</button>
        <button id="sentinel-btn-proceed" class="sentinel-btn sentinel-btn-secondary">Proceed Anyway (Unsafe)</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Trigger animation
  setTimeout(() => {
    overlay.classList.add('sentinel-visible');
  }, 10);

  // Event Listeners
  document.getElementById('sentinel-btn-back').addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close(); // Close tab if there's no history
    }
  });

  document.getElementById('sentinel-btn-proceed').addEventListener('click', () => {
    overlay.classList.remove('sentinel-visible');
    setTimeout(() => {
      overlay.remove();
    }, 300);
  });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SENTINEL_SHOW_WARNING') {
    // We wait for DOMContentLoaded if body doesn't exist yet
    if (document.body) {
      showWarning(message.payload.url, message.payload.reasons);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        showWarning(message.payload.url, message.payload.reasons);
      });
    }
  }
});

// Fallback listener for script injection if message passing fails during load
document.addEventListener('sentinel-warning', () => {
  if (window.__SENTINEL_WARNING_DATA__) {
    if (document.body) {
      showWarning(window.location.href, window.__SENTINEL_WARNING_DATA__);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        showWarning(window.location.href, window.__SENTINEL_WARNING_DATA__);
      });
    }
  }
});
