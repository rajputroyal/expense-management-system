import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to login');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      <form className="panel auth" onSubmit={submit}>
        <h1>Expense Manager</h1>
        <p>Sign in to manage your expenses</p>
        {error && <div className="error">{error}</div>}
        <label>
          Email
          <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        <button disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </main>
  );
}
