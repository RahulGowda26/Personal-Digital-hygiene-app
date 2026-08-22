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
      const response = await fetch(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`);
      
      let breachesList: string[] = [];
      if (response.ok) {
        const data = await response.json();
        if (data && data.breaches && data.breaches.length > 0) {
           breachesList = data.breaches[0];
        }
      } else if (response.status === 404) {
        // 404 means no breaches found
        breachesList = [];
      } else {
        throw new Error('Failed to fetch from Threat Intelligence service');
      }

      const breaches: BreachExposure[] = breachesList.map(name => ({
        id: name,
        name: name,
        title: name,
        domain: null,
        breachDate: 'Unknown',
        dataClasses: ['Email', 'Password'], // Assumed commonly exposed
        verified: true
      }));

      return {
        status: breaches.length > 0 ? 'breach_found' : 'no_breach',
        checkedAt: new Date().toISOString(),
        provider: 'XposedOrNot',
        accountIdentifierHash: await digestMessage(email),
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
        provider: 'XposedOrNot',
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



let providerInstance: ThreatIntelligenceProvider | null = null;

export function getThreatIntelligenceProvider(): ThreatIntelligenceProvider {
  if (!providerInstance) {
    providerInstance = new SupabaseThreatIntelligenceProvider();
  }
  return providerInstance;
}
