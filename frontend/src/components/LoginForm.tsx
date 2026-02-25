import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config';
import { Footer } from './Footer';
import type { StoredResult, UserProfile } from '../types';

interface LoginFormProps {
  onSuccess: (payload: {
    user: UserProfile;
    results: StoredResult[];
    profile?: { username: string; birthDate: string; gender: string; email: string };
  }) => void;
  onNavigateHome?: () => void;
}

const GENDERS = ['female', 'male', 'other', 'prefer_not'] as const;

export const LoginForm = ({ onSuccess, onNavigateHome }: LoginFormProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNavigateHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
      return;
    }
    navigate('/');
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedSurname = surname.trim();
    const parsedAge = Number.parseInt(age, 10);

    if (!trimmedName || !trimmedSurname || !age.trim() || !gender) {
      setError('Bütün sahələri doldurun.');
      return;
    }
    if (!Number.isInteger(parsedAge) || parsedAge < 5 || parsedAge > 120) {
      setError('Yaş 5 ilə 120 arasında olmalıdır.');
      return;
    }
    if (!GENDERS.includes(gender as (typeof GENDERS)[number])) {
      setError('Cins dəyəri düzgün deyil.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/api/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: trimmedName,
          surname: trimmedSurname,
          age: parsedAge,
          gender
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Daxil olmaq mümkün olmadı.');
      }

      onSuccess({
        user: payload.user as UserProfile,
        results: Array.isArray(payload.results) ? payload.results : []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Daxil olmaq mümkün olmadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page-shell">
      <div className="auth-shape auth-shape-teal" aria-hidden="true" />
      <div className="auth-shape auth-shape-orange" aria-hidden="true" />
      <div className="auth-shape auth-shape-ring" aria-hidden="true" />

      <div className="auth-content-grid auth-main-container">
        <section className="auth-card-wrap">
          <div className="quiz-card auth-card auth-card-register">
            <header>
              <h1>Daxil ol</h1>
            </header>

            <form className="login-form auth-register-form" onSubmit={handleSignIn} autoComplete="off">
              <div className="register-grid">
                <label className="input-label">
                  <span>Ad</span>
                  <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Adınız" />
                </label>

                <label className="input-label">
                  <span>Soyad</span>
                  <input type="text" value={surname} onChange={(event) => setSurname(event.target.value)} placeholder="Soyadınız" />
                </label>

                <label className="input-label">
                  <span>Yaş</span>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={age}
                    onChange={(event) => setAge(event.target.value)}
                    placeholder="Məsələn 18"
                  />
                </label>

                <label className="input-label">
                  <span>Cins</span>
                  <select value={gender} onChange={(event) => setGender(event.target.value)}>
                    <option value="">Seçin</option>
                    <option value="female">Qadın</option>
                    <option value="male">Kişi</option>
                    <option value="other">Digər</option>
                    <option value="prefer_not">Bildirmək istəmirəm</option>
                  </select>
                </label>
              </div>

              {error && <p className="error-text">{error}</p>}

              <button type="submit" className="primary-button" disabled={loading}>
                {loading ? 'Daxil olunur…' : 'Testə başla'}
              </button>
            </form>
          </div>
        </section>

        <aside className="auth-info-panel">
          <div>
            <h2>İxtisas seçimin üçün ilk addımı at!</h2>
            <p>Daha doğru seçim üçün daha aydın yol!</p>
          </div>
          <button type="button" className="home-brand auth-info-logo auth-brand-like-home" onClick={handleNavigateHome}>
            <span>ixtisas</span>
            <span className="home-modern-brand-dot">.ly</span>
          </button>
        </aside>
      </div>

      <Footer startTestPath="/login" />
    </section>
  );
};
