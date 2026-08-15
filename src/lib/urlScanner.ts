export interface LinkAnalysisResult {
  url: string;
  isSafe: boolean;
  score: number; // 0-100 (100 = safe)
  flags: string[];
}

const URL_SHORTENERS = [
  'bit.ly', 'goo.gl', 't.co', 'tinyurl.com', 'ow.ly', 'is.gd', 'buff.ly',
  'adf.ly', 'bit.do', 'lc.chat', 'soo.gd', 's2r.co', 'clicky.me'
];

const TARGET_BRANDS = [
  'paypal', 'apple', 'google', 'microsoft', 'amazon', 'netflix', 'facebook',
  'bankofamerica', 'chase', 'wellsfargo', 'citibank'
];

export async function analyzeLink(inputUrl: string): Promise<LinkAnalysisResult> {
  const flags: string[] = [];
  let score = 100;
  
  try {
    // Add protocol if missing for parsing
    let urlToParse = inputUrl;
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      urlToParse = 'http://' + inputUrl;
    }
    
    const url = new URL(urlToParse);
    const hostname = url.hostname.toLowerCase();

    // 1. Check HTTPS
    if (url.protocol !== 'https:') {
      flags.push('Uses insecure HTTP protocol');
      score -= 20;
    }

    // 2. Check for IP address instead of domain name
    // Simple regex for IPv4
    if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) {
      flags.push('Uses an IP address instead of a domain name (highly suspicious)');
      score -= 50;
    }

    // 3. Check for URL shorteners
    const isShortener = URL_SHORTENERS.some(shortener => hostname.includes(shortener));
    if (isShortener) {
      flags.push('Uses a URL shortener (frequently used to hide malicious links)');
      score -= 30;
    }

    // 4. Check for unusually long or complex subdomains
    const parts = hostname.split('.');
    if (parts.length > 3 && !hostname.includes('co.uk') && !hostname.includes('com.au')) {
      flags.push('Contains unusually deep subdomains (often used for phishing)');
      score -= 15;
    }

    // 5. Typosquatting / Brand impersonation check
    // e.g., paypal-update.com, secure-apple.com
    let impersonatedBrand = '';
    for (const brand of TARGET_BRANDS) {
      if (hostname.includes(brand) && hostname !== `${brand}.com` && hostname !== `www.${brand}.com`) {
        impersonatedBrand = brand;
        break;
      }
    }
    
    if (impersonatedBrand) {
      flags.push(`Suspicious domain pattern imitating ${impersonatedBrand.toUpperCase()}`);
      score -= 40;
    }

    // 6. Check for misleading characters (e.g., Cyrillic a)
    // Punycode domains usually start with xn--
    if (hostname.startsWith('xn--')) {
      flags.push('Uses internationalized domain name (Punycode) which can be used for homograph attacks');
      score -= 30;
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return {
      url: inputUrl,
      isSafe: score >= 70,
      score,
      flags
    };
  } catch (e) {
    return {
      url: inputUrl,
      isSafe: false,
      score: 0,
      flags: ['Invalid URL format']
    };
  }
}
