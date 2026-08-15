export async function checkPasswordBreach(password: string): Promise<number> {
  // 1. Hash the password using SHA-1
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  // 2. Split hash into prefix (5 chars) and suffix
  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  // 3. Query HIBP k-Anonymity API
  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  
  if (!response.ok) {
    throw new Error('Failed to securely check password status');
  }

  const text = await response.text();

  // 4. Check if our suffix is in the returned list
  const lines = text.split('\n');
  for (const line of lines) {
    const [lineSuffix, countStr] = line.trim().split(':');
    if (lineSuffix === suffix) {
      return parseInt(countStr, 10);
    }
  }

  return 0; // Not found
}
