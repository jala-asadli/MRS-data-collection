import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { riasecItems } from './riasecItems.js';
import { loadMajorsFromWorkbook, getAllMajors, getRecommendations } from './majorService.js';
import {
  initUserStore,
  getOrCreateUser,
  getUserById,
  getUserResults,
  recordUserResult,
  getTotalResultsCount,
  updateUserProfile
} from './userStore.js';
import { runMigrations, getDb, withTransaction } from './db.js';
import { countUserRecords } from './models/usersModel.js';
import { saveQuizSubmission } from './services/quizPersistenceService.js';
import { initAuthStore } from './authStore.js';
import { Console } from 'console';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5001;
const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/images', express.static(path.resolve(__dirname, '../assets/images')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/stats/tests', async (req, res) => {
  try {
    const totalTests = await countUserRecords();
    res.json({ totalTests });
  } catch (error) {
    res.json({ totalTests: await getTotalResultsCount() });
  }
});

app.get('/api/questions', (req, res) => {
  res.json({ total: riasecItems.length, questions: riasecItems });
});

app.get('/api/majors/all', (req, res) => {
  const majors = getAllMajors();
  res.json({ total: majors.length, majors });
});

app.post('/api/login', async (req, res) => {
  try {
    const { name, surname, age, gender } = req.body || {};
    const normalizedName = normalizeText(name);
    const normalizedSurname = normalizeText(surname);
    const normalizedGender = normalizeText(gender);
    const parsedAge = Number.parseInt(String(age ?? '').trim(), 10);
    const ALLOWED_GENDERS = new Set(['male', 'female', 'other', 'prefer_not']);

    if (!normalizedName || !normalizedSurname) {
      return res.status(400).json({ error: 'Name and surname are required.' });
    }
    if (!Number.isInteger(parsedAge) || parsedAge < 5 || parsedAge > 120) {
      return res.status(400).json({ error: 'Age must be an integer between 5 and 120.' });
    }
    if (!ALLOWED_GENDERS.has(normalizedGender)) {
      return res.status(400).json({ error: 'Gender must be one of: male, female, other, prefer_not.' });
    }

    const db = await getDb();
    const user = await getOrCreateUser(normalizedName, normalizedSurname);
    await db.run('UPDATE users SET age = ?, gender = ? WHERE user_id = ?', [parsedAge, normalizedGender, user.id]);
    const results = await getUserResults(user.id);
    res.json({
      user: { id: user.id, name: user.name, surname: user.surname },
      results,
      profile: {
        age: parsedAge,
        gender: normalizedGender
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Unable to login' });
  }
});

app.post('/register', async (req, res) => {
  try {
    const {
      user_id,
      first_name,
      last_name,
      age,
      gender,
      education_level,
      favorite_subject_1,
      favorite_subject_2
    } = req.body || {};

    const userId = String(user_id || '').trim();
    const firstName = String(first_name || '').trim();
    const lastName = String(last_name || '').trim();
    const normalizedAgeRaw = age == null ? '' : String(age).trim();
    const normalizedAge = normalizedAgeRaw ? Number.parseInt(normalizedAgeRaw, 10) : null;
    const normalizedGender = gender == null ? null : String(gender).trim() || null;
    const normalizedEducationLevel = education_level == null ? null : String(education_level).trim() || null;
    const normalizedFavoriteSubject1 = favorite_subject_1 == null ? null : String(favorite_subject_1).trim() || null;
    const normalizedFavoriteSubject2 = favorite_subject_2 == null ? null : String(favorite_subject_2).trim() || null;

    if (!userId || !firstName || !lastName) {
      return res.status(400).json({ error: 'user_id, first_name, and last_name are required.' });
    }
    if (normalizedAge != null && (!Number.isInteger(normalizedAge) || normalizedAge < 5 || normalizedAge > 120)) {
      return res.status(400).json({ error: 'age must be an integer between 5 and 120.' });
    }

    const db = await getDb();
    const existing = await db.get('SELECT user_id FROM users WHERE user_id = ?', [userId]);
    if (existing) {
      return res.status(409).json({ error: 'User with this user_id already exists.' });
    }

    await db.run(
      `INSERT INTO users (
        user_id,
        first_name,
        last_name,
        age,
        gender,
        education_level,
        favorite_subject_1,
        favorite_subject_2,
        R_score,
        I_score,
        A_score,
        S_score,
        E_score,
        C_score,
        riasec_profile
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, NULL)`,
      [
        userId,
        firstName,
        lastName,
        normalizedAge,
        normalizedGender,
        normalizedEducationLevel,
        normalizedFavoriteSubject1,
        normalizedFavoriteSubject2
      ]
    );

    return res.status(201).json({
      ok: true,
      message: 'User registered successfully.',
      user: {
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        age: normalizedAge,
        gender: normalizedGender,
        education_level: normalizedEducationLevel,
        favorite_subject_1: normalizedFavoriteSubject1,
        favorite_subject_2: normalizedFavoriteSubject2,
        riasec_profile: null
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unable to register user.' });
  }
});

app.get('/api/users/:userId/results', async (req, res) => {
  try {
    const { userId } = req.params;
    const results = await getUserResults(userId);
    res.json({ results });
  } catch (err) {
    res.status(404).json({ error: err.message || 'Unable to load results' });
  }
});

app.get('/api/users/:userId/quiz-status', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await getDb();
    const existingUser = await db.get('SELECT user_id FROM users WHERE user_id = ?', [userId]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    const attempt = await db.get('SELECT 1 AS has_attempt FROM user_major_recommendations WHERE user_id = ? LIMIT 1', [userId]);
    return res.json({ hasAttempt: Boolean(attempt) });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to determine quiz status' });
  }
});

app.put('/api/users/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, surname, gender } = req.body || {};

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const normalizedName = normalizeText(name);
    const normalizedSurname = normalizeText(surname);
    if (!normalizedName || !normalizedSurname) {
      return res.status(400).json({ error: 'Name and surname are required.' });
    }

    const updatedUser = await updateUserProfile(userId, {
      name: normalizedName,
      surname: normalizedSurname
    });
    const db = await getDb();
    const normalizedGender = normalizeText(gender);
    if (normalizedGender) {
      await db.run('UPDATE users SET gender = ? WHERE user_id = ?', [normalizedGender, userId]);
    }

    const results = await getUserResults(userId);
    return res.json({
      ok: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        surname: updatedUser.surname
      },
      profile: {
        username: '',
        birthDate: '',
        gender: normalizedGender || '',
        email: '',
        completedTests: Array.isArray(results) ? results.length : 0
      }
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Unable to update profile' });
  }
});

app.get('/api/users/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const db = await getDb();
    const userRow = await db.get('SELECT gender FROM users WHERE user_id = ?', [userId]);
    const results = await getUserResults(userId);
    const fullName = `${user.name || ''} ${user.surname || ''}`.trim();

    return res.json({
      profile: {
        full_name: fullName,
        username: '',
        email: '',
        birthdate: '',
        gender: userRow?.gender || '',
        completed_tests: Array.isArray(results) ? results.length : 0
      }
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Unable to load profile' });
  }
});

app.get('/api/users/:userId/assessment-profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const db = await getDb();
    const userRow = await db.get(
      `SELECT
        user_id, R_score, I_score, A_score, S_score, E_score, C_score,
        riasec_profile, chosen_major, satisfaction_score, created_at
       FROM users
       WHERE user_id = ?`,
      [userId]
    );
    const recommendations = await db.all(
      `SELECT major_name, recommendation_rank, recommendation_score, created_at
       FROM user_major_recommendations
       WHERE user_id = ?
       ORDER BY recommendation_rank ASC
       LIMIT 10`,
      [userId]
    );

    return res.json({
      profile: {
        user_id: userId,
        scores: {
          R: Number(userRow?.R_score || 0),
          I: Number(userRow?.I_score || 0),
          A: Number(userRow?.A_score || 0),
          S: Number(userRow?.S_score || 0),
          E: Number(userRow?.E_score || 0),
          C: Number(userRow?.C_score || 0)
        },
        riasec_profile: userRow?.riasec_profile || '',
        chosen_major: userRow?.chosen_major || null,
        satisfaction_score: userRow?.satisfaction_score == null ? null : Number(userRow.satisfaction_score),
        recommendations: recommendations.map((row) => ({
          major_name: row.major_name,
          recommendation_rank: Number(row.recommendation_rank || 0),
          recommendation_score: Number(row.recommendation_score || 0)
        })),
        completed: recommendations.length > 0,
        created_at: userRow?.created_at || null
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unable to load assessment profile' });
  }
});

app.post('/api/users/:userId/pre-quiz', async (req, res) => {
  try {
    const { userId } = req.params;
    const educationLevelRaw = typeof req.body?.education_level === 'string' ? req.body.education_level.trim() : '';
    const favoriteSubject1Raw = typeof req.body?.favorite_subject_1 === 'string' ? req.body.favorite_subject_1.trim() : '';
    const favoriteSubject2Raw = typeof req.body?.favorite_subject_2 === 'string' ? req.body.favorite_subject_2.trim() : '';

    const EDUCATION_LEVELS = new Set([
      'İbtidai təhsil',
      'Orta təhsil',
      'Tam orta təhsil',
      'Subbakalavr',
      'Bakalavr',
      'Magistr'
    ]);
    const SUBJECTS = new Set([
      'Texnologiya',
      'Fiziki tərbiyə',
      'Çağırışaqədərki hazırlıq',
      'Riyaziyyat',
      'Fizika',
      'Kimya',
      'Biologiya',
      'İnformatika',
      'Musiqi',
      'Təsviri incəsənət',
      'Ədəbiyyat',
      'Həyat bilgisi',
      'Azərbaycan dili',
      'Ümumi tarix',
      'Xarici dil',
      'Azərbaycan tarixi'
    ]);

    if (!educationLevelRaw || !EDUCATION_LEVELS.has(educationLevelRaw)) {
      return res.status(400).json({ error: 'Təhsil səviyyəsini düzgün seçin.' });
    }
    if (!favoriteSubject1Raw || !SUBJECTS.has(favoriteSubject1Raw)) {
      return res.status(400).json({ error: 'Sevimli fənn 1 mütləq seçilməlidir.' });
    }
    if (favoriteSubject2Raw && !SUBJECTS.has(favoriteSubject2Raw)) {
      return res.status(400).json({ error: 'Sevimli fənn 2 düzgün seçilməlidir.' });
    }

    const accountUser = await getUserById(userId);
    if (!accountUser) {
      return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });
    }

    const db = await getDb();
    await db.run(
      `UPDATE users
       SET education_level = ?, favorite_subject_1 = ?, favorite_subject_2 = ?
       WHERE user_id = ?`,
      [educationLevelRaw, favoriteSubject1Raw, favoriteSubject2Raw || null, userId]
    );

    return res.json({
      ok: true,
      message: 'Məlumatlar yadda saxlanıldı.',
      pre_quiz: {
        education_level: educationLevelRaw,
        favorite_subject_1: favoriteSubject1Raw,
        favorite_subject_2: favoriteSubject2Raw || null
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Məlumatlar yadda saxlanılarkən xəta baş verdi.' });
  }
});

app.post('/api/users/:userId/results', async (req, res) => {
  try {
    const { userId } = req.params;
    const { answers } = req.body || {};
    const accountUser = await getUserById(userId);
    if (!accountUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const saveSummary = await saveQuizSubmission({
      accountUser,
      answers: answers && typeof answers === 'object' ? answers : {},
      responseTimesSec: req.body?.responseTimesSec,
      userMeta: req.body?.userMeta
    });

    const finalizedUserSnapshot = saveSummary?.user;
    if (!finalizedUserSnapshot) {
      return res.status(500).json({ error: 'Unable to persist finalized user snapshot' });
    }

    const stored = await recordUserResult(userId, {
      userSnapshot: finalizedUserSnapshot,
      answers: answers && typeof answers === 'object' ? answers : {},
      recommendations: []
    });
    res.json({ result: stored });
  } catch (err) {
    if (err?.code === 'QUIZ_ALREADY_COMPLETED') {
      return res.status(409).json({ error: err.message || 'Quiz already completed', code: err.code });
    }
    res.status(400).json({ error: err.message || 'Unable to save result' });
  }
});

app.post('/api/users/:userId/feedback', async (req, res) => {
  try {
    const { userId } = req.params;
    const chosenMajorRaw = typeof req.body?.chosen_major === 'string' ? req.body.chosen_major.trim() : '';
    const hasSatisfaction = req.body?.satisfaction_score != null && req.body?.satisfaction_score !== '';
    const satisfaction = hasSatisfaction ? Number.parseInt(String(req.body?.satisfaction_score), 10) : null;

    if (!chosenMajorRaw || !hasSatisfaction) {
      return res.status(400).json({ error: 'Zəhmət olmasa ixtisas və məmnunluq dərəcəsini seçin.' });
    }
    if (!Number.isInteger(satisfaction) || satisfaction < 1 || satisfaction > 5) {
      return res.status(400).json({ error: 'Məmnunluq dərəcəsi 1-5 aralığında olmalıdır.' });
    }

    const accountUser = await getUserById(userId);
    if (!accountUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await withTransaction(async (db) => {
      const existing = await db.get('SELECT user_id, chosen_major FROM users WHERE user_id = ?', [userId]);
      if (!existing) {
        throw new Error('İstifadəçi tapılmadı.');
      }

      if (existing.chosen_major && String(existing.chosen_major).trim()) {
        const alreadyChosen = String(existing.chosen_major).trim();
        if (alreadyChosen === chosenMajorRaw) {
          throw new Error('Bu ixtisas artıq təsdiqlənib.');
        }
        throw new Error('İxtisas seçimi artıq təsdiqlənib. Yenidən dəyişmək mümkün deyil.');
      }

      const recommended = await db.get(
        `SELECT major_name FROM user_major_recommendations WHERE user_id = ? AND major_name = ? LIMIT 1`,
        [userId, chosenMajorRaw]
      );
      if (!recommended) {
        throw new Error('Yalnız tövsiyə olunan ixtisaslardan seçim edə bilərsiniz.');
      }

      const chosenMajorToSave = chosenMajorRaw;
      await db.run(
        `UPDATE users
         SET chosen_major = ?, satisfaction_score = ?
         WHERE user_id = ?`,
        [chosenMajorToSave, satisfaction, userId]
      );

      const maxRankRow = await db.get(
        `SELECT COALESCE(MAX(recommendation_rank), 0) AS max_rank
         FROM user_major_recommendations
         WHERE user_id = ?`,
        [userId]
      );
      const nextRank = Number(maxRankRow?.max_rank || 0) + 1;

      await db.run(
        `INSERT INTO user_major_recommendations (user_id, major_name, recommendation_rank, recommendation_score)
         VALUES (?, ?, ?, 0)
         ON CONFLICT (user_id, major_name) DO NOTHING`,
        [userId, chosenMajorToSave, nextRank]
      );

      const updatedRow = await db.get(
        `SELECT user_id, chosen_major, satisfaction_score
         FROM users
         WHERE user_id = ?`,
        [userId]
      );

      await db.run(
        `UPDATE user_major_recommendations
         SET recommendation_score = CASE
           WHEN recommendation_score IS NULL OR recommendation_score < ? THEN ?
           ELSE recommendation_score
         END
         WHERE user_id = ? AND major_name = ?`,
        [satisfaction, satisfaction, userId, chosenMajorToSave]
      );

      return updatedRow;
    });

    return res.json({
      ok: true,
      feedback: {
        user_id: updated.user_id,
        chosen_major: updated.chosen_major || null,
        satisfaction_score: updated.satisfaction_score
      }
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Seçim yadda saxlanılarkən xəta baş verdi.' });
  }
});

app.post('/api/recommend', (req, res) => {
  const { profile, limit = 15 } = req.body || {};
  console.log("Received profile from frontend:", profile);
  if (!profile || typeof profile !== 'string') {
    return res.status(400).json({ error: 'profile string is required' });
  }
  const formattedProfile = profile.toUpperCase().replace(/[^RIASEC]/g, '').slice(0, 6);
  if (!formattedProfile) {
    return res.status(400).json({ error: 'profile must contain RIASEC letters' });
  }

  const recommendations = getRecommendations(formattedProfile, limit);
  res.json({ profile: formattedProfile, recommendations });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload.' });
  }
  console.error('Unhandled route error:', err);
  return res.status(500).json({ error: 'Internal server error.' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

async function bootstrap() {
  loadMajorsFromWorkbook();
  await runMigrations();
  await initUserStore();
  await initAuthStore();
  await getDb();

  const server = app.listen(PORT, HOST, () => {
    console.log(`RIASEC backend running on http://${HOST}:${PORT}`);
  });

  server.on('error', (error) => {
    console.error('Server listen error:', error);
  });
}

bootstrap().catch((error) => {
  console.error('Server bootstrap failed:', error);
  process.exit(1);
});
app.listen(PORT, () => {
  console.log('RIASEC backend running on ${PORT}');
});

