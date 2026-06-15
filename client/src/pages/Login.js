import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, useT } from '../context/LanguageContext';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login, loading, error, setError } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const { setLang } = useLanguage();
  const t = useT();
  const navigate = useNavigate();

  useEffect(() => { setLang('en'); }, []); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(username.trim(), password);
    if (result.success) navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-top-controls">
        <button className="login-theme-btn" onClick={toggleTheme}>
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-mark">
            <img src="/webetu.jpeg" alt="WebEtu" className="login-logo-img" />
          </div>
          <div className="login-logo-subtitle">
            <strong>{t.login.portalTitle || 'Student Portal'}</strong>
            {t.login.ministry || 'وزارة التعليم العالي والبحث العلمي'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-banner">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">{t.login.username}</label>
            <div className="input-wrap">
              <span className="input-icon"><UserIcon /></span>
              <input
                id="username" type="text" dir="ltr"
                placeholder={t.login.usernamePlaceholder}
                value={username} onChange={e => setUsername(e.target.value)}
                required autoComplete="username" autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">{t.login.password}</label>
            <div className="input-wrap">
              <span className="input-icon"><LockIcon /></span>
              <input
                id="password" type={showPass ? 'text' : 'password'} dir="ltr"
                placeholder={t.login.passwordPlaceholder}
                value={password} onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password"
                style={{ paddingRight: '3rem' }}
              />
              <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : t.login.submit}
          </button>
        </form>

        <div className="login-footer">
          <div>{t.login.footer}</div>
          <div className="login-footer-copy">Copyright © 2026</div>
        </div>
      </div>
    </div>
  );
}

function UserIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function LockIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function EyeIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function EyeOffIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}
function MoonIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}
function SunIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
}
