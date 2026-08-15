document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const blockedUrl = urlParams.get('url');
  let reasons = [];
  try {
    reasons = JSON.parse(urlParams.get('reasons') || '[]');
  } catch (e) {
    console.error('Failed to parse reasons', e);
  }

  if (blockedUrl) {
    document.getElementById('blocked-url').textContent = blockedUrl;
  }

  const reasonsList = document.getElementById('risk-factors');
  if (reasons.length > 0) {
    reasonsList.innerHTML = reasons.map(r => `<li style="margin-bottom:8px;">${r}</li>`).join('');
  } else {
    reasonsList.innerHTML = '<li>Exhibits malicious characteristics</li>';
  }

  document.getElementById('sent-btn-back').onclick = () => {
    // If there is history (meaning we were redirected here), go back twice to avoid a loop
    if (window.history.length > 2) {
      window.history.go(-2);
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
    }
  };
});
