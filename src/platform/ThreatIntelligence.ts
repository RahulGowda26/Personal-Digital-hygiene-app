import { supabase } from '@/lib/supabase';

export interface BreachExposure {
  id: string;
  name: string;
  title: string;
  domain: string | null;
  breachDate: string;
  dataClasses: string[];
  verified: boolean;
}

export interface BreachCheckResult {
  status: 'no_breach' | 'breach_found' | 'error';
  checkedAt: string;
  provider: string;
  accountIdentifierHash: string; // The email hash or just a placeholder for now since the edge function receives the email
  breachCount: number;
  breaches: BreachExposure[];
  confidence: 'high' | 'medium' | 'low';
  error?: string;
}

export interface PasswordExposureCheckResult {
  status: 'clean' | 'exposed' | 'error' | 'rate_limit';
  occurrenceCount: number;
  checkedAt: string;
  error?: string;
}

export interface ThreatIntelligenceProvider {
  checkAccountExposure(email: string): Promise<BreachCheckResult>;
  checkPasswordExposure(password: string): Promise<PasswordExposureCheckResult>;
}

async function digestMessage(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function digestSha1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message); // Do NOT lowercase or trim passwords, preserve exactly
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export class SupabaseThreatIntelligenceProvider implements ThreatIntelligenceProvider {
  async checkAccountExposure(email: string): Promise<BreachCheckResult> {
    try {
      const { data, error } = await supabase.functions.invoke('check-breach', {
        body: { email }
      });

      if (error) {
        throw new Error(error.message || 'Error calling threat intelligence service');
      }

      const breaches: BreachExposure[] = data.breaches || [];

      return {
        status: breaches.length > 0 ? 'breach_found' : 'no_breach',
        checkedAt: new Date().toISOString(),
        provider: 'Have I Been Pwned',
        accountIdentifierHash: data.emailHash || await digestMessage(email), // Fallback if missing
        breachCount: breaches.length,
        breaches,
        confidence: 'high',
      };
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Threat Intelligence Error:', e);
      return {
        status: 'error',
        checkedAt: new Date().toISOString(),
        provider: 'Have I Been Pwned',
        accountIdentifierHash: await digestMessage(email),
        breachCount: 0,
        breaches: [],
        confidence: 'low',
        error: e.message || 'Threat intelligence service is temporarily unavailable.',
      };
    }
  }

  async checkPasswordExposure(password: string): Promise<PasswordExposureCheckResult> {
    try {
      const fullHash = await digestSha1(password);
      const prefix = fullHash.substring(0, 5);
      const suffix = fullHash.substring(5);

      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      
      if (response.status === 429) {
        return {
          status: 'rate_limit',
          occurrenceCount: 0,
          checkedAt: new Date().toISOString(),
          error: 'Rate limit exceeded. Please try again later.',
        };
      }

      if (!response.ok) {
        throw new Error(`HIBP API returned status ${response.status}`);
      }

      const text = await response.text();
      
      // HIBP returns lines like:
      // 0018A45C4D1DEF81644B54AB7F969B88D83:1
      // 00D4F6E8FA6EECAD2A3AA415EEC418D38EC:2
      
      const lines = text.split('\n');
      
      let occurrenceCount = 0;
      let status: 'clean' | 'exposed' = 'clean';

      for (const line of lines) {
        const [returnedSuffix, count] = line.trim().split(':');
        if (returnedSuffix === suffix) {
          status = 'exposed';
          occurrenceCount = parseInt(count, 10) || 0;
          break;
        }
      }

      return {
        status,
        occurrenceCount,
        checkedAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Password Exposure Check Error:', e);
      return {
        status: 'error',
        occurrenceCount: 0,
        checkedAt: new Date().toISOString(),
        error: e.message || 'Password exposure service is temporarily unavailable.',
      };
    }
  }
}

export class MockThreatIntelligenceProvider implements ThreatIntelligenceProvider {
  async checkAccountExposure(email: string): Promise<BreachCheckResult> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1500));
    
    const emailHash = await digestMessage(email);

    // Mock behaviors based on email address for testing:
    // error@test.com -> Error state
    // clean@test.com -> No breaches
    // pwned@test.com -> Multiple breaches with passwords

    if (email === 'error@test.com') {
      return {
        status: 'error',
        checkedAt: new Date().toISOString(),
        provider: 'Mock Provider',
        accountIdentifierHash: emailHash,
        breachCount: 0,
        breaches: [],
        confidence: 'low',
        error: 'Breach intelligence is temporarily unavailable. Your previous results have not been changed.',
      };
    }

    if (email === 'clean@test.com') {
      return {
        status: 'no_breach',
        checkedAt: new Date().toISOString(),
        provider: 'Mock Provider',
        accountIdentifierHash: emailHash,
        breachCount: 0,
        breaches: [],
        confidence: 'high',
      };
    }

    // Default: return mock breaches
    const mockBreaches: BreachExposure[] = [
      {
        id: 'MockBreach1',
        name: 'MockBreach1',
        title: 'Example Data Corp',
        domain: 'example.com',
        breachDate: '2023-08-15',
        dataClasses: ['Email addresses', 'Passwords', 'Usernames'],
        verified: true,
      },
      {
        id: 'MockBreach2',
        name: 'MockBreach2',
        title: 'Old Forum site',
        domain: 'forum.example.net',
        breachDate: '2019-02-10',
        dataClasses: ['Email addresses', 'IP addresses'],
        verified: true,
      },
    ];

    return {
      status: 'breach_found',
      checkedAt: new Date().toISOString(),
      provider: 'Mock Provider',
      accountIdentifierHash: emailHash,
      breachCount: mockBreaches.length,
      breaches: mockBreaches,
      confidence: 'high',
    };
  }

  async checkPasswordExposure(password: string): Promise<PasswordExposureCheckResult> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1000));

    // Mock behaviors based on password string
    if (password === 'PASSWORD_SERVICE_ERROR') {
      return {
        status: 'error',
        occurrenceCount: 0,
        checkedAt: new Date().toISOString(),
        error: 'Service temporarily unavailable.',
      };
    }

    if (password === 'PASSWORD_RATE_LIMIT') {
      return {
        status: 'rate_limit',
        occurrenceCount: 0,
        checkedAt: new Date().toISOString(),
        error: 'Rate limit exceeded.',
      };
    }

    if (password === 'PASSWORD_EXPOSED') {
      return {
        status: 'exposed',
        occurrenceCount: 42,
        checkedAt: new Date().toISOString(),
      };
    }

    if (password === 'PASSWORD_HIGH_OCCURRENCE') {
      return {
        status: 'exposed',
        occurrenceCount: 15432,
        checkedAt: new Date().toISOString(),
      };
    }

    // Default: clean
    return {
      status: 'clean',
      occurrenceCount: 0,
      checkedAt: new Date().toISOString(),
    };
  }
}

let providerInstance: ThreatIntelligenceProvider | null = null;

export function getThreatIntelligenceProvider(): ThreatIntelligenceProvider {
  if (!providerInstance) {
    // Use Demo Mode if explicitly enabled, otherwise use the real Supabase implementation
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      console.warn('Using MOCK Threat Intelligence Provider (Demo Mode)');
      providerInstance = new MockThreatIntelligenceProvider();
    } else {
      providerInstance = new SupabaseThreatIntelligenceProvider();
    }
  }
  return providerInstance;
}
