'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://softwall-payroll-api-v2.onrender.com';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Unable to create account.');
      if (data.access_token || data.token) localStorage.setItem('softwall_token', data.access_token || data.token);
      router.push('/login?registered=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  }

  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f7f8fa',fontFamily:'Inter,system-ui,sans-serif',padding:24}}>
    <form onSubmit={submit} style={{width:'100%',maxWidth:440,background:'#fff',padding:32,borderRadius:16,border:'1px solid #e5e7eb',boxShadow:'0 12px 35px rgba(0,0,0,.06)'}}>
      <h1 style={{marginTop:0}}>Create your account</h1>
      <p style={{color:'#6b7280'}}>Start using Softwall Payroll AI.</p>
      {error && <div role="alert" style={{padding:12,margin:'16px 0',background:'#fee2e2',color:'#991b1b',borderRadius:8}}>{error}</div>}
      <label style={{display:'block',marginTop:16}}>Name<input required value={name} onChange={e=>setName(e.target.value)} style={input}/></label>
      <label style={{display:'block',marginTop:16}}>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} style={input}/></label>
      <label style={{display:'block',marginTop:16}}>Password<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} style={input}/></label>
      <button disabled={loading} type="submit" style={{width:'100%',marginTop:22,padding:14,border:0,borderRadius:9,background:'#111827',color:'#fff',fontWeight:700,cursor:loading?'wait':'pointer'}}>{loading?'Creating account…':'Create account'}</button>
      <p style={{textAlign:'center',marginBottom:0}}>Already have an account? <Link href="/login">Log in</Link></p>
    </form>
  </main>;
}

const input = {display:'block',width:'100%',boxSizing:'border-box' as const,marginTop:7,padding:12,border:'1px solid #d1d5db',borderRadius:8,fontSize:16};
