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


  return (
    <div className="w-full pb-24 md:pb-8 text-cyber-text font-sans relative">
      <div className="w-full pt-2 md:pt-4">
        
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-outline font-bold tracking-widest uppercase text-white mb-2 shadow-cyber">Secure Vault</h1>
          <p className="text-cyber-textMuted font-medium font-mono text-sm uppercase tracking-wide">Encrypted zero-knowledge storage</p>
        </div>

        {!hasVault ? (
          <Card className="max-w-md mx-auto p-8 rounded-[24px] border border-cyber-neon/20 shadow-[0_0_20px_rgba(255,42,66,0.1)] bg-cyber-surface text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,42,66,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,42,66,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-cyber-bg border border-cyber-neon/30 text-cyber-neon rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(255,42,66,0.2)]">
                <Lock size={32} className="stroke-[2.5]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 tracking-wide font-outline uppercase">Initialize Vault</h2>
              <p className="text-xs font-mono text-cyber-textMuted mb-8 leading-relaxed">
                Your vault is encrypted locally using AES-GCM. We never see or store your master password. If you lose it, your data is gone forever.
              </p>
              
              <form onSubmit={handleSetup} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold font-mono text-cyber-neon/80 uppercase mb-2">Master Password</label>
                  <input
                    type="password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-cyber-bg/80 border border-cyber-neon/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyber-neon focus:border-cyber-neon text-white font-mono transition-all"
                    placeholder="Minimum 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold font-mono text-cyber-neon/80 uppercase mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-cyber-bg/80 border border-cyber-neon/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyber-neon focus:border-cyber-neon text-white font-mono transition-all"
                    placeholder="Repeat master password"
                  />
                </div>
                
                {authError && <p className="text-red-400 text-xs font-mono mt-2">{authError}</p>}
                
                <Button 
                  type="submit" 
                  disabled={isProcessing || !masterPassword || !confirmPassword}
                  className="w-full mt-6 bg-cyber-neon/10 text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg border border-cyber-neon/50 disabled:opacity-50 flex items-center justify-center gap-2 px-6 rounded-lg shadow-[0_0_15px_rgba(255,42,66,0.2)] uppercase tracking-widest font-bold text-xs h-12"
                >
                  {isProcessing ? 'Encrypting...' : 'Create Vault'}
                </Button>
              </form>
            </div>
          </Card>
        ) : !isUnlocked ? (
          <Card className="max-w-md mx-auto p-8 rounded-[24px] border border-cyber-neon/20 shadow-[0_0_20px_rgba(255,42,66,0.1)] bg-cyber-surface text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,42,66,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,42,66,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-cyber-bg border border-cyber-neon/30 text-cyber-neon rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(255,42,66,0.2)]">
                <Lock size={32} className="stroke-[2.5]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 tracking-wide font-outline uppercase">Vault Locked</h2>
              <p className="text-xs font-mono text-cyber-textMuted mb-8">Enter your master password to decrypt.</p>
              
              <form onSubmit={handleUnlock} className="space-y-4 text-left">
                <div>
                  <input
                    type="password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-cyber-bg/80 border border-cyber-neon/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyber-neon focus:border-cyber-neon text-white font-mono text-center tracking-widest transition-all"
                    placeholder="• • • • • • • •"
                    autoFocus
                  />
                </div>
                
                {authError && <p className="text-red-400 text-xs font-mono mt-2 text-center">{authError}</p>}
                
                <Button 
                  type="submit" 
                  disabled={isProcessing || !masterPassword}
                  className="w-full mt-4 bg-cyber-neon/10 text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg border border-cyber-neon/50 disabled:opacity-50 flex items-center justify-center gap-2 px-6 rounded-lg shadow-[0_0_15px_rgba(255,42,66,0.2)] uppercase tracking-widest font-bold text-xs h-12"
                >
                  {isProcessing ? 'Decrypting...' : 'Unlock Vault'}
                </Button>
              </form>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-cyber-surface/50 border border-cyber-neon/20 p-4 rounded-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,42,66,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,42,66,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-cyber-bg border border-cyber-neon/30 text-cyber-neon rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(255,42,66,0.2)]">
                  <Unlock size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-white uppercase tracking-wide">Vault Unlocked</h3>
                  <p className="text-xs font-mono text-emerald-400 mt-0.5">AES-GCM ENCRYPTED</p>
                </div>
              </div>
              <Button 
                onClick={() => setIsAdding(!isAdding)}
                className="relative z-10 bg-cyber-neon/10 text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg border border-cyber-neon/50 rounded-lg flex items-center gap-2 px-4 h-10 uppercase tracking-widest font-bold text-[10px]"
              >
                {isAdding ? 'Cancel' : <><Plus size={16} /> Add New</>}
              </Button>
            </div>

            {isAdding && (
              <Card className="p-6 rounded-[24px] border border-cyber-neon/20 bg-cyber-surface shadow-[0_0_20px_rgba(255,42,66,0.1)] relative z-10">
                <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wide font-outline">New Credential</h3>
                <form onSubmit={handleAddCredential} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-mono text-cyber-neon/80 uppercase mb-2">Service Name</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-cyber-bg/80 border border-cyber-neon/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyber-neon focus:border-cyber-neon text-white font-mono transition-all"
                        placeholder="e.g. Netflix"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold font-mono text-cyber-neon/80 uppercase mb-2">Username / Email</label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full px-4 py-2.5 bg-cyber-bg/80 border border-cyber-neon/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyber-neon focus:border-cyber-neon text-white font-mono transition-all"
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold font-mono text-cyber-neon/80 uppercase mb-2">Password</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-cyber-bg/80 border border-cyber-neon/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyber-neon focus:border-cyber-neon text-white font-mono transition-all"
                        placeholder="Password"
                        required
                      />
                      <Button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="bg-cyber-surface border border-cyber-neon/20 hover:border-cyber-neon/50 text-cyber-textMuted hover:text-cyber-neon px-4 rounded-xl flex items-center justify-center transition-colors"
                        title="Generate strong password"
                      >
                        <RefreshCw size={18} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <Button 
                      type="submit" 
                      className="bg-cyber-neon/10 text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg border border-cyber-neon/50 flex items-center gap-2 px-6 rounded-lg uppercase tracking-widest font-bold text-xs h-10 transition-all shadow-[0_0_10px_rgba(255,42,66,0.2)]"
                    >
                      <Lock size={16} />
                      Save Securely
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {credentials.length === 0 && !isAdding ? (
              <div className="py-16 text-center border-2 border-dashed border-cyber-neon/10 rounded-[24px] bg-cyber-surface/30">
                <div className="w-16 h-16 bg-cyber-bg border border-cyber-neon/20 text-cyber-textMuted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <KeySquare size={32} />
                </div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2 font-outline">Vault is Empty</h3>
                <p className="text-cyber-textMuted max-w-sm mx-auto font-mono text-xs">
                  Add your first credential to store it securely on your device.
                </p>
                <Button 
                  onClick={() => setIsAdding(true)}
                  className="mt-6 bg-cyber-neon/10 text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg border border-cyber-neon/50 rounded-lg inline-flex items-center gap-2 px-6 h-10 uppercase tracking-widest font-bold text-xs shadow-[0_0_15px_rgba(255,42,66,0.2)]"
                >
                  <Plus size={16} /> Add Credential
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {credentials.map((cred) => (
                  <Card key={cred.id} className="p-5 rounded-[20px] border border-cyber-neon/20 shadow-[0_0_15px_rgba(255,42,66,0.05)] bg-cyber-surface flex flex-col hover:border-cyber-neon/40 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-white font-outline uppercase tracking-wide">{cred.name}</h4>
                        <p className="text-sm text-cyber-textMuted font-mono mt-0.5 truncate max-w-[200px]">{cred.username}</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-cyber-bg border border-cyber-neon/30 flex items-center justify-center text-cyber-neon shrink-0">
                        <KeySquare size={16} />
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-cyber-neon/10 flex justify-between items-center">
                      <div className="font-mono text-lg text-cyber-neon/50 tracking-[0.2em] select-none">
                        ••••••••
                      </div>
                      <button
                        onClick={() => copyPassword(cred.password, cred.id)}
                        className={`p-2 rounded-lg transition-colors border ${
                          copiedId === cred.id 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                            : 'bg-cyber-bg text-cyber-textMuted hover:text-cyber-neon hover:border-cyber-neon/50 border-cyber-neon/20'
                        }`}
                        title="Copy Password"
                      >
                        {copiedId === cred.id ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
