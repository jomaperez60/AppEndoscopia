const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jsonwebtoken.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role, avatar }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ==========================================
// AUTHENTICATION
// ==========================================
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const user = userResult.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const tokenPayload = { id: user.id, username: user.username, role: user.role, avatar: user.avatar };
    const token = jsonwebtoken.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });
    
    // Log audit
    await db.query(
      'INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5)',
      [user.id, 'LOGIN', 'user', user.id, JSON.stringify({ ip: req.ip })]
    );

    res.json({ token, user: tokenPayload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// ==========================================
// USERS ENDPOINTS (ADMIN)
// ==========================================
app.get('/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await db.query('SELECT id, username, role, avatar, created_at FROM users ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.post('/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { username, password, role } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    await db.query(
      'INSERT INTO users (username, password_hash, role, avatar) VALUES ($1, $2, $3, $4)',
      [username, hash, role || 'user', 'Dr']
    );
    await db.query('INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)', [req.user.id, 'CREATE_USER', 'user', username]);
    res.json({ success: true });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Username already exists' });
    res.status(500).json({ error: 'Server Error' });
  }
});

app.delete('/users/:username', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  if (req.params.username === 'admin') return res.status(400).json({ error: 'Cannot delete default admin' });
  try {
    await db.query('DELETE FROM users WHERE username = $1', [req.params.username]);
    await db.query('INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)', [req.user.id, 'DELETE_USER', 'user', req.params.username]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.put('/users/:username/password', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.username !== req.params.username) return res.status(403).json({ error: 'Forbidden' });
  const { newPassword } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await db.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hash, req.params.username]);
    await db.query('INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)', [req.user.id, 'CHANGE_PASSWORD', 'user', req.params.username]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// ==========================================
// STUDIES ENDPOINTS
// ==========================================
// List all studies for history view
app.get('/studies', authMiddleware, async (req, res) => {
  const search = req.query.search || '';
  try {
    const studiesResult = await db.query(`
      SELECT s.id as study_id, s.created_at as fecha, 
             p.nombre as paciente_nombre, p.dni as paciente_dni,
             v.payload
      FROM studies s
      JOIN patients p ON s.patient_id = p.id
      JOIN study_versions v ON s.id = v.study_id AND s.current_version = v.version
      WHERE s.status != 'deleted' AND (p.nombre ILIKE $1 OR p.dni ILIKE $1)
      ORDER BY s.created_at DESC
    `, [`%${search}%`]);
    
    const mapped = studiesResult.rows.map(r => ({
      id: r.study_id,
      patient: { nombre: r.paciente_nombre, dni: r.paciente_dni },
      metadata: r.payload.metadata || {},
      findings: r.payload.findings || [],
      procedimientos: r.payload.procedimientos || [],
      plan: r.payload.plan || '',
      date: r.fecha
    }));

    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching studies' });
  }
});

// Export CSV
app.get('/studies/export/csv', authMiddleware, async (req, res) => {
  try {
    const studiesResult = await db.query(`
      SELECT s.id as study_id, s.created_at as fecha, 
             p.*, v.payload
      FROM studies s
      JOIN patients p ON s.patient_id = p.id
      JOIN study_versions v ON s.id = v.study_id AND s.current_version = v.version
      WHERE s.status != 'deleted'
      ORDER BY s.created_at DESC
    `);

    const headers = ["ID", "Fecha", "Nombre", "DNI", "Sexo", "Procedencia", "ASA", "Indicación", "Procedimientos", "Conclusión"];
    const rows = studiesResult.rows.map(r => {
      const payload = r.payload || {};
      const metadata = payload.metadata || {};
      const clinical = payload.clinical || {};
      return [
        r.study_id,
        new Date(r.fecha).toLocaleDateString('es-ES'),
        r.nombre,
        r.dni,
        r.sexo,
        `${r.municipio || ''}, ${r.departamento || ''}`,
        clinical.asa || '',
        metadata.indicacion || '',
        (payload.procedimientos || []).map(p => p.description).join(" | "),
        (payload.diagnoses || '').replace(/\n/g, " ")
      ];
    });

    let csv = "\uFEFF" + headers.join(";") + "\n";
    rows.forEach(row => csv += row.map(cell => `"${cell || ''}"`).join(";") + "\n");
    
    await db.query(
      'INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'EXPORT_CSV', 'system', 'all']
    );

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`Endoscopia_Export_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error exporting CSV' });
  }
});

// Get single study
app.get('/studies/:id', authMiddleware, async (req, res) => {
  try {
    const studyId = req.params.id;
    const studyResult = await db.query(`
      SELECT s.id, s.current_version, s.status, p.*, v.payload 
      FROM studies s
      JOIN patients p ON s.patient_id = p.id
      JOIN study_versions v ON s.id = v.study_id AND s.current_version = v.version
      WHERE s.id = $1
    `, [studyId]);

    if (studyResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const row = studyResult.rows[0];
    const payload = row.payload;
    payload.patient = {
      nombre: row.nombre,
      dni: row.dni,
      fnacimiento: row.fnacimiento,
      sexo: row.sexo,
      departamento: row.departamento,
      municipio: row.municipio,
      antecedentes: row.antecedentes
    };
    payload.currentStudyId = row.id;
    
    res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Create or update study
app.post('/studies', authMiddleware, async (req, res) => {
  // Check if study already exists (if payload has currentStudyId)
  const payload = req.body;
  const currentStudyId = payload.currentStudyId;
  const patientData = payload.patient;
  
  const client = await db.query('BEGIN'); // Using simple transaction logic via pool checkout or just BEGIN. However pool.query for transaction is better with checkout client.
  // Actually, we should get a client manually
  let pgClient;
  try {
    const Pool = require('pg').Pool;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pgClient = await pool.connect();
    
    await pgClient.query('BEGIN');

    // Handle Patient
    let patientId;
    if (patientData.dni) {
      const pRes = await pgClient.query('SELECT id FROM patients WHERE dni = $1', [patientData.dni]);
      if (pRes.rows.length > 0) {
        patientId = pRes.rows[0].id;
        // Update patient info
        await pgClient.query(
          'UPDATE patients SET nombre=$1, fnacimiento=$2, sexo=$3, departamento=$4, municipio=$5, antecedentes=$6, updated_at=now() WHERE id=$7',
          [patientData.nombre, patientData.fnacimiento, patientData.sexo, patientData.departamento, patientData.municipio, patientData.antecedentes, patientId]
        );
      } else {
        const pIns = await pgClient.query(
          'INSERT INTO patients (dni, nombre, fnacimiento, sexo, departamento, municipio, antecedentes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
          [patientData.dni, patientData.nombre, patientData.fnacimiento, patientData.sexo, patientData.departamento, patientData.municipio, patientData.antecedentes]
        );
        patientId = pIns.rows[0].id;
      }
    } else {
        // Without DNI - create anyway
        const pIns = await pgClient.query(
          'INSERT INTO patients (dni, nombre, fnacimiento, sexo, departamento, municipio, antecedentes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
          [`TEMPDNI-${Date.now()}`, patientData.nombre, patientData.fnacimiento, patientData.sexo, patientData.departamento, patientData.municipio, patientData.antecedentes]
        );
        patientId = pIns.rows[0].id;
    }

    let studyId = currentStudyId;
    let newVersion = 1;

    // Remove patient from payload to avoid duplication in version JSON
    const payloadCopy = { ...payload };
    delete payloadCopy.patient;
    delete payloadCopy.currentStudyId;

    if (!studyId) {
      // Create new study
      const sIns = await pgClient.query(
        'INSERT INTO studies (patient_id, created_by, current_version, status) VALUES ($1, $2, 1, $3) RETURNING id',
        [patientId, req.user.id, 'draft']
      );
      studyId = sIns.rows[0].id;
      
      await pgClient.query(
        'INSERT INTO study_versions (study_id, version, payload, created_by) VALUES ($1, $2, $3, $4)',
        [studyId, 1, JSON.stringify(payloadCopy), req.user.id]
      );
      
      await pgClient.query(
        'INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'CREATE_STUDY', 'study', studyId]
      );
    } else {
      // Update existing
      const sCheck = await pgClient.query('SELECT current_version FROM studies WHERE id = $1', [studyId]);
      if (sCheck.rows.length > 0) {
        newVersion = sCheck.rows[0].current_version + 1;
        await pgClient.query('UPDATE studies SET current_version = $1, updated_at = now() WHERE id = $2', [newVersion, studyId]);
        
        await pgClient.query(
          'INSERT INTO study_versions (study_id, version, payload, created_by) VALUES ($1, $2, $3, $4)',
          [studyId, newVersion, JSON.stringify(payloadCopy), req.user.id]
        );
        
        await pgClient.query(
          'INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5)',
          [req.user.id, 'UPDATE_STUDY', 'study', studyId, JSON.stringify({ version: newVersion })]
        );
      }
    }

    await pgClient.query('COMMIT');
    res.json({ success: true, studyId, version: newVersion });
  } catch (error) {
    if (pgClient) await pgClient.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Error saving study' });
  } finally {
    if (pgClient) pgClient.release();
  }
});

// Set study as deleted
app.delete('/studies/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const studyId = req.params.id;
    await db.query('UPDATE studies SET status = $1, updated_at = now() WHERE id = $2', ['deleted', studyId]);
    await db.query(
      'INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'DELETE_STUDY', 'study', studyId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting study' });
  }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
}

// Export for Vercel/Netlify Serverless Functions
module.exports = app;
module.exports.handler = serverless(app);
