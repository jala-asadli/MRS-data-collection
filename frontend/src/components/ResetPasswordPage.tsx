import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { buildApiUrl } from '../config';
import { Footer } from './Footer';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenChecking, setTokenChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  useEffect(() => {
    let cancelled = false;

    const validateToken = async () => {
      if (!email || !token) {
        if (!cancelled) {
          setTokenValid(false);
          setError('Bərpa linki etibarsızdır. Yenidən cəhd edin.');
          setTokenChecking(false);
        }
        return;
      }

      try {
        setTokenChecking(true);
        const response = await fetch(
          buildApiUrl(`/api/auth/reset-password/validate?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`)
        );
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || 'Bərpa linki etibarsızdır.');
        }
        if (!cancelled) {
          setTokenValid(true);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setTokenValid(false);
          setError(err instanceof Error ? err.message : 'Bərpa linki etibarsızdır.');
        }
      } finally {
        if (!cancelled) {
          setTokenChecking(false);
        }
      }
    };

    validateToken();

    return () => {
      cancelled = true;
    };
  }, [email, token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!tokenValid) {
      setError('Bərpa linki etibarsızdır. Yenidən cəhd edin.');
      return;
    }
    if (!password.trim() || !confirmPassword.trim()) {
      setError('Bütün sahələri doldurun.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Şifrələr eyni deyil.');
      return;
    }
    if (!email || !token) {
      setError('Bərpa linki etibarsızdır. Yenidən cəhd edin.');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          token,
          password
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Şifrə yenilənmədi.');
      }
      setSuccess(true);
      window.setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifrə yenilənmədi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page-shell auth-page-shell-register">
      <div className="auth-shape auth-shape-teal" aria-hidden="true" />
      <div className="auth-shape auth-shape-orange" aria-hidden="true" />
      <div className="auth-shape auth-shape-ring" aria-hidden="true" />

      <div className="auth-content-grid auth-main-container auth-content-grid-register">
        <section className="auth-card-wrap">
          <div className="quiz-card auth-card auth-card-register">
            <header>
              <h1>Yeni şifrə təyin edin</h1>
            </header>
            <form className="login-form auth-register-form" onSubmit={handleSubmit}>
              {tokenChecking && <p className="info-text">Bərpa linki yoxlanılır…</p>}
              <div className="register-grid">
                <label className="input-label">
                  <span>Yeni şifrə</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="********"
                    disabled={tokenChecking || !tokenValid || success}
                  />
                </label>
                <label className="input-label">
                  <span>Şifrənin təkrarı</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="********"
                    disabled={tokenChecking || !tokenValid || success}
                  />
                </label>
              </div>
              {error && <p className="error-text">{error}</p>}
              {success && <p className="info-text">Şifrə yeniləndi. Giriş səhifəsinə yönləndirilirsiniz…</p>}
              <button type="submit" className="primary-button" disabled={loading || tokenChecking || !tokenValid || success}>
                {loading ? 'Yenilənir…' : 'Şifrəni yenilə'}
              </button>
              <p className="auth-switch-copy">
                <Link to="/login" className="auth-inline-link">
                  Daxil ol səhifəsinə qayıt
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>

      <Footer startTestPath="/login" />
    </section>
  );
};
