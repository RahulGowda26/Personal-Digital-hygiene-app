import { useState, useEffect } from 'react';
import { Lock, Unlock, Plus, Copy, CheckCircle2, ShieldCheck, RefreshCw, KeySquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { encryptData, decryptData, generatePassword, type EncryptedPayload } from '@/lib/cryptoVault';

interface Credential {
  id: string;
  name: string;
  username: string;
  password: string;
  url?: string;
  createdAt: string;
}

export function VaultScreen() {
  const [hasVault, setHasVault] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // Auth state
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Vault state
  const [credentials, setCredentials] = useState<Credential[]>([]);
  
  // UI state
  const [isAdding, setIsAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New credential state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Initialization
  useEffect(() => {
    const storedVault = localStorage.getItem('sentinel_vault');
    if (storedVault) {
      setHasVault(true);
    }
  }, []);

  const saveVault = async (data: Credential[], pwd = masterPassword) => {
    const payload = await encryptData(JSON.stringify(data), pwd);
    localStorage.setItem('sentinel_vault', JSON.stringify(payload));
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPassword !== confirmPassword) {
      setAuthError("Passwords don't match");
      return;
    }
    if (masterPassword.length < 8) {
      setAuthError("Master password must be at least 8 characters");
      return;
    }

    setIsProcessing(true);
    setAuthError('');
    try {
      await saveVault([], masterPassword);
      setHasVault(true);
      setIsUnlocked(true);
    } catch (e) {
      setAuthError('Failed to setup vault');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setAuthError('');
    try {
      const stored = localStorage.getItem('sentinel_vault');
      if (!stored) throw new Error('Vault missing');
      
      const payload = JSON.parse(stored) as EncryptedPayload;
      const decrypted = await decryptData(payload, masterPassword);
      
      setCredentials(JSON.parse(decrypted));
      setIsUnlocked(true);
    } catch (e) {
      setAuthError('Incorrect master password');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUsername || !newPassword) return;

    const newCred: Credential = {
      id: crypto.randomUUID(),
      name: newName,
      username: newUsername,
      password: newPassword,
      createdAt: new Date().toISOString()
    };

    const updated = [...credentials, newCred];
    await saveVault(updated);
    setCredentials(updated);
    
    setNewName('');
    setNewUsername('');
    setNewPassword('');
    setIsAdding(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLock = () => {
    setCredentials([]);
    setIsUnlocked(false);
    setMasterPassword('');
  };

  if (!isUnlocked) {
    return (
      <div className="w-full pb-24 md:pb-8 text-slate-900 font-sans flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md p-8 rounded-[32px] border-slate-100 shadow-sm bg-white">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-4">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-bold">{hasVault ? 'Unlock Vault' : 'Setup Vault'}</h1>
            <p className="text-sm text-slate-500 mt-2">
              {hasVault 
                ? 'Enter your master password to decrypt your credentials. This happens locally on your device.' 
                : 'Create a master password to encrypt your vault. It cannot be recovered if lost.'}
            </p>
          </div>

          <form onSubmit={hasVault ? handleUnlock : handleSetup} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Master Password"
                value={masterPassword}
                onChange={e => setMasterPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            
            {!hasVault && (
              <div>
                <input
                  type="password"
                  placeholder="Confirm Master Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            )}

            {authError && <p className="text-red-500 text-sm font-medium">{authError}</p>}

            <Button type="submit" disabled={isProcessing || !masterPassword} className="w-full py-6 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
              {isProcessing ? 'Processing...' : hasVault ? 'Unlock' : 'Create Vault'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 md:pb-8 text-slate-900 font-sans">
      <div className="w-full pt-2 md:pt-4">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 md:mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Password Vault</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              End-to-end encrypted locally
            </p>
          </div>
          <button 
            onClick={handleLock}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-full font-semibold transition-colors"
          >
            <Lock size={16} />
            <span className="hidden md:inline">Lock Vault</span>
          </button>
        </div>

        {isAdding ? (
          <Card className="p-6 md:p-8 rounded-[32px] border-slate-100 shadow-sm bg-white mb-8">
            <h2 className="text-xl font-bold mb-6">Add Credential</h2>
            <form onSubmit={handleAddCredential} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-semibold mb-1">Website or App Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix, Github"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Username / Email</label>
                <input
                  type="text"
                  required
                  placeholder="name@example.com"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 flex justify-between">
                  Password
                  <button type="button" onClick={() => setNewPassword(generatePassword(16))} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    <RefreshCw size={14} /> Generate
                  </button>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">Save</Button>
              </div>
            </form>
          </Card>
        ) : (
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{credentials.length} Saved Credentials</h2>
            <Button onClick={() => setIsAdding(true)} className="bg-slate-900 text-white hover:bg-slate-800 rounded-full flex items-center gap-2 pr-5">
              <Plus size={18} /> Add New
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {credentials.map(cred => (
            <Card key={cred.id} className="p-5 rounded-[24px] border-slate-100 shadow-sm bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <KeySquare size={20} />
                </div>
                <h3 className="font-bold text-lg truncate">{cred.name}</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="overflow-hidden">
                    <p className="text-xs text-slate-500 font-semibold mb-0.5">Username</p>
                    <p className="text-sm truncate font-medium">{cred.username}</p>
                  </div>
                  <button onClick={() => handleCopy(cred.username, `${cred.id}-user`)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                    {copiedId === `${cred.id}-user` ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
                
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="overflow-hidden">
                    <p className="text-xs text-slate-500 font-semibold mb-0.5">Password</p>
                    <p className="text-sm truncate font-mono text-slate-400">••••••••••••</p>
                  </div>
                  <button onClick={() => handleCopy(cred.password, `${cred.id}-pass`)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                    {copiedId === `${cred.id}-pass` ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </Card>
          ))}
          
          {!isAdding && credentials.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              <KeySquare size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="font-medium text-lg text-slate-600">Your vault is empty</p>
              <p className="text-sm">Add a credential to safely store it.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
