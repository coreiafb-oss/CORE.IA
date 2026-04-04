import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const { error: loginError } = await signIn(email.trim(), password);
    if (loginError) {
      setError(loginError);
      setIsSubmitting(false);
    }
    // If successful, AuthContext will update and App will re-render
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb--1" />
        <div className="login-bg-orb login-bg-orb--2" />
        <div className="login-bg-orb login-bg-orb--3" />
        <div className="login-bg-grid" />
        <div className="login-bg-noise" />
      </div>

      {/* Login card */}
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo / Brand */}
        <motion.div
          className="login-brand"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="login-logo">
            <div className="login-logo-icon">
              <Zap size={24} strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="login-title">LINE OS</h1>
          <p className="login-subtitle">Sistema operacional da Agência LINE</p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="login-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          {/* Email field */}
          <div className={`login-field ${focusedField === 'email' ? 'login-field--focused' : ''} ${email ? 'login-field--filled' : ''}`}>
            <label className="login-label" htmlFor="login-email">
              <Mail size={15} />
              <span>E-mail</span>
            </label>
            <input
              ref={emailRef}
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="seu@email.com"
              autoComplete="email"
              className="login-input"
              disabled={isSubmitting}
            />
          </div>

          {/* Password field */}
          <div className={`login-field ${focusedField === 'password' ? 'login-field--focused' : ''} ${password ? 'login-field--filled' : ''}`}>
            <label className="login-label" htmlFor="login-password">
              <Lock size={15} />
              <span>Senha</span>
            </label>
            <div className="login-input-wrapper">
              <input
                ref={passwordRef}
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="login-input"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-toggle-pw"
                tabIndex={-1}
                aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="login-error"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <AlertCircle size={14} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <motion.button
            type="submit"
            className="login-submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (
              <div className="login-spinner" />
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Footer */}
        <motion.div
          className="login-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="login-divider">
            <span>Acesso restrito à equipe LINE</span>
          </div>
          <p className="login-copyright">© {new Date().getFullYear()} Agência LINE · Todos os direitos reservados</p>
        </motion.div>
      </motion.div>

      <style>{`
        .login-page {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          min-height: 100dvh;
          padding: 24px;
          overflow: hidden;
          background: #050507;
        }

        /* ─── Animated Background ──────────────────────────────────────── */
        .login-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
        }
        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.35;
          animation: orbFloat 20s ease-in-out infinite;
        }
        .login-bg-orb--1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, #6366f1 0%, transparent 70%);
          top: -15%;
          left: -10%;
          animation-duration: 22s;
        }
        .login-bg-orb--2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
          bottom: -20%;
          right: -10%;
          animation-delay: -8s;
          animation-duration: 18s;
        }
        .login-bg-orb--3 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, #06b6d4 0%, transparent 70%);
          top: 50%;
          left: 60%;
          animation-delay: -14s;
          animation-duration: 25s;
          opacity: 0.2;
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -40px) scale(1.05); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(40px, 30px) scale(1.02); }
        }
        .login-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
        }
        .login-bg-noise {
          position: absolute;
          inset: 0;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* ─── Card ─────────────────────────────────────────────────────── */
        .login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          padding: 48px 40px 40px;
          background: rgba(12, 12, 16, 0.75);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 24px;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.03),
            0 24px 80px -12px rgba(0, 0, 0, 0.6),
            0 0 60px -10px rgba(99, 102, 241, 0.08);
        }

        /* ─── Brand ────────────────────────────────────────────────────── */
        .login-brand {
          text-align: center;
          margin-bottom: 36px;
        }
        .login-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        .login-logo-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
          border-radius: 16px;
          color: white;
          box-shadow:
            0 0 24px -4px rgba(99, 102, 241, 0.4),
            0 8px 16px -8px rgba(99, 102, 241, 0.3);
          position: relative;
        }
        .login-logo-icon::after {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 17px;
          background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent 50%);
          pointer-events: none;
        }
        .login-title {
          font-size: 26px;
          font-weight: 800;
          color: #fafafa;
          letter-spacing: -0.03em;
          margin: 0;
          line-height: 1.2;
        }
        .login-subtitle {
          font-size: 13px;
          color: rgba(161, 161, 170, 0.8);
          margin-top: 6px;
          font-weight: 400;
          letter-spacing: 0;
        }

        /* ─── Form ─────────────────────────────────────────────────────── */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .login-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .login-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          color: rgba(161, 161, 170, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: color 0.2s;
        }
        .login-field--focused .login-label {
          color: #818cf8;
        }
        .login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .login-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #fafafa;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s ease;
          outline: none;
        }
        .login-input::placeholder {
          color: rgba(161, 161, 170, 0.3);
        }
        .login-field--focused .login-input {
          border-color: rgba(99, 102, 241, 0.5);
          background: rgba(99, 102, 241, 0.04);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
        }
        .login-field--filled .login-input {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .login-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .login-input-wrapper .login-input {
          padding-right: 44px;
        }

        /* ─── Toggle PW ────────────────────────────────────────────────── */
        .login-toggle-pw {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(161, 161, 170, 0.5);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }
        .login-toggle-pw:hover {
          color: rgba(161, 161, 170, 0.9);
        }

        /* ─── Error ────────────────────────────────────────────────────── */
        .login-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.15);
          border-radius: 10px;
          color: #fca5a5;
          font-size: 13px;
          overflow: hidden;
        }
        .login-error svg {
          flex-shrink: 0;
        }

        /* ─── Submit ───────────────────────────────────────────────────── */
        .login-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 13px 20px;
          margin-top: 4px;
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          letter-spacing: -0.01em;
        }
        .login-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent 50%);
          pointer-events: none;
        }
        .login-submit:hover:not(:disabled) {
          box-shadow:
            0 0 24px -4px rgba(99, 102, 241, 0.4),
            0 8px 16px -8px rgba(99, 102, 241, 0.3);
        }
        .login-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ─── Spinner ──────────────────────────────────────────────────── */
        .login-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.25);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ─── Footer ──────────────────────────────────────────────────── */
        .login-footer {
          margin-top: 32px;
          text-align: center;
        }
        .login-divider {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
        }
        .login-divider span {
          padding: 0 14px;
          font-size: 11px;
          color: rgba(161, 161, 170, 0.4);
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 500;
        }
        .login-copyright {
          font-size: 11px;
          color: rgba(161, 161, 170, 0.25);
          margin: 0;
        }

        /* ─── Responsive ───────────────────────────────────────────────── */
        @media (max-width: 480px) {
          .login-card {
            padding: 36px 24px 32px;
            border-radius: 20px;
          }
          .login-title {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
