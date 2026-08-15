// Sentinel Web Protection - Background Service Worker

const SUSPICIOUS_KEYWORDS = [
  'login', 'update', 'verify', 'secure', 'account', 'banking', 'wallet', 'free', 'gift', 'support'
];

const URL_SHORTENERS = [
  'bit.ly', 't.co', 'goo.gl', 'tinyurl.com', 'ow.ly', 'is.gd', 'buff.ly', 'adf.ly', 'bit.do', 'lc.chat'
];

// Simple heuristic analysis for URLs (matches the logic in the main app's urlScanner.ts)
function analyzeUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    const domain = url.hostname.toLowerCase();
    
    // Ignore internal pages
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { isRisky: false };
    }

    let riskScore = 0;
    const reasons = [];

    // 1. IP Address Domain (Very High Risk)
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(domain)) {
      riskScore += 80;
      reasons.push('Domain is an IP address');
    }

    // 2. URL Shortener (Medium Risk)
    if (URL_SHORTENERS.some(shortener => domain === shortener || domain.endsWith('.' + shortener))) {
      riskScore += 40;
      reasons.push('Uses a known URL shortener');
    }

    // 3. No HTTPS (High Risk)
    if (url.protocol !== 'https:') {
      riskScore += 50;
      reasons.push('Connection is not secure (HTTP instead of HTTPS)');
    }

    // 4. Excessive Subdomains (Medium Risk)
    const parts = domain.split('.');
    if (parts.length > 3 && domain.indexOf('www.') !== 0) {
      riskScore += 30;
      reasons.push('Unusually high number of subdomains');
    }

    // Explicit test domain
    if (domain === 'sentinel-test.com') {
      riskScore += 100;
      reasons.push('This is an explicit test domain for Sentinel Web Protection.');
    }

    // 5. Typosquatting / Suspicious Keywords (High Risk)
    // Checking if it contains a keyword but isn't the primary domain
    const suspiciousFound = SUSPICIOUS_KEYWORDS.filter(kw => domain.includes(kw));
    if (suspiciousFound.length > 0 && domain !== 'sentinel-test.com') {
      // It's fishy if 'login' is in the domain but it's not a standard major site
      // (This is a simplified heuristic)
      riskScore += 40;
      reasons.push(`Contains suspicious keyword(s): ${suspiciousFound.join(', ')}`);
    }

    return {
      isRisky: riskScore >= 50,
      score: riskScore,
      reasons: reasons
    };

  } catch (e) {
    return { isRisky: false };
  }
}

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return; // Only main frame
  
  const url = details.url;
  
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return;

  const analysis = analyzeUrl(url);

  if (analysis.isRisky) {
    console.log(`[Sentinel] Blocked malicious URL: ${url}`, analysis);

    // Redirect the tab to our local blocked page
    const blockedUrl = chrome.runtime.getURL(`blocked.html?url=${encodeURIComponent(url)}&reasons=${encodeURIComponent(JSON.stringify(analysis.reasons))}`);
    
    chrome.tabs.update(details.tabId, { url: blockedUrl })
      .catch(e => console.error('[Sentinel] Redirect error:', e));
  }
});
