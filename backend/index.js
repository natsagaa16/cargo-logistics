//backend/index.js - 1-Р ХЭСЭГ
import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ 
  credentials: true, 
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] 
}));

// ==================== DATABASE CONNECTION ====================
const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'cargo_logistics',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkConnection() {
  try {
    const connection = await dbPool.getConnection();
    console.log('✅ MySQL Connected successfully');
    connection.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err);
    process.exit(1);
  }
}
checkConnection();

// ==================== MIDDLEWARE ====================
const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ msg: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    res.status(401).json({ msg: 'Invalid token' });
  }
};

const getStatusLabel = (statusCode) => {
  const statusMap = {
    'registered': 'Бүртгэгдсэн',
    'shipped': 'Хөдөлж байгаа',
    'arrived': 'Ирсэн',
    'delivered': 'Хүргэгдсэн',
    'pending_distribution': 'Тараагдаагүй',
    'distributed': 'Тараагдсан',
    'on_hold': 'Саатсан',
    'customs_processing': 'Гааль дээр'
  };
  return statusMap[statusCode] || statusCode;
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        msg: 'Permission denied',
        required: allowedRoles,
        current: req.user.role 
      });
    }
    
    next();
  };
};

// ==================== FILE UPLOAD SETUP ====================
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cargo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Зөвхөн зураг файл оруулна уу! (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// ==================== IMAGE UPLOAD/DELETE ====================
app.post('/api/upload-image', authenticate, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, msg: 'Зураг сонгоно уу' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      message: 'Зураг амжилттай хуулагдлаа'
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ success: false, msg: error.message });
  }
});

app.delete('/api/delete-image', authenticate, (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, msg: 'Image URL шаардлагатай' });
    }
    
    const filename = imageUrl.split('/').pop();
    const filepath = path.join(__dirname, 'public', 'uploads', filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ success: true, message: 'Зураг устгагдлаа' });
    } else {
      res.status(404).json({ success: false, msg: 'Зураг олдсонгүй' });
    }
  } catch (error) {
    console.error('Image delete error:', error);
    res.status(500).json({ success: false, msg: error.message });
  }
});

// ==================== AUTHENTICATION ====================
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ msg: 'Username and password required' });
  }
  
  try {
    const [results] = await dbPool.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (results.length === 0) return res.status(401).json({ msg: 'Invalid credentials' });
    
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ msg: 'Invalid credentials' });
    
    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username }, 
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: '24h' }
    );
    
    res.cookie('token', token, { 
      httpOnly: true, 
      sameSite: 'lax', 
      maxAge: 86400000, 
      secure: process.env.NODE_ENV === 'production' 
    });
    
    res.json({ role: user.role, username: user.username, success: true });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Database error' });
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('token', { 
    httpOnly: true, 
    sameSite: 'lax', 
    secure: process.env.NODE_ENV === 'production' 
  });
  res.json({ msg: 'Logged out successfully', success: true });
});

app.get('/auth/check', authenticate, (req, res) => {
  res.json({ role: req.user.role, username: req.user.username, id: req.user.id });
});

app.get('/auth/me', authenticate, (req, res) => {
  res.json({ role: req.user.role, username: req.user.username, id: req.user.id });
});

// ==================== DIRECTIONS APIs ====================
app.get('/api/directions', authenticate, async (req, res) => {
  try {
    const [rows] = await dbPool.query(
      'SELECT * FROM directions WHERE is_active = TRUE ORDER BY id DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Directions error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.post('/api/directions', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { direction_name, direction_code, from_location, to_location, description } = req.body;
  
  try {
    const [result] = await dbPool.query(
      `INSERT INTO directions (direction_name, from_location, to_location, direction_code, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [direction_name, from_location, to_location, direction_code, description]
    );
    
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Create direction error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.put('/api/directions/:id', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { id } = req.params;
  const { direction_name, direction_code, from_location, to_location, description } = req.body;
  
  try {
    await dbPool.query(
      `UPDATE directions SET direction_name=?, from_location=?, to_location=?, 
       direction_code=?, description=? WHERE id=?`,
      [direction_name, from_location, to_location, direction_code, description, id]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Update direction error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.delete('/api/directions/:id', authenticate, checkRole(['system_admin']), async (req, res) => {
  const { id } = req.params;
  
  try {
    const [check] = await dbPool.query(
      'SELECT COUNT(*) as count FROM containers_new WHERE direction_id = ?',
      [id]
    );
    
    if (check[0].count > 0) {
      return res.status(400).json({
        success: false,
        msg: 'Чиглэл чингэлэгт ашиглагдаж байгаа тул устгах боломжгүй'
      });
    }
    
    await dbPool.query('DELETE FROM directions WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete direction error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

// ==================== ROAD INFO APIs ====================
app.get('/api/road-info', authenticate, async (req, res) => {
  try {
    const [rows] = await dbPool.query(
      'SELECT * FROM road_info WHERE is_active = TRUE ORDER BY id DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Road info error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.post('/api/road-info', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { road_name, location, description } = req.body;
  
  try {
    const [result] = await dbPool.query(
      'INSERT INTO road_info (road_name, location, description) VALUES (?, ?, ?)',
      [road_name, location, description]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Create road error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.put('/api/road-info/:id', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { id } = req.params;
  const { road_name, location, description } = req.body;
  
  try {
    await dbPool.query(
      'UPDATE road_info SET road_name=?, location=?, description=? WHERE id=?',
      [road_name, location, description, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update road error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.delete('/api/road-info/:id', authenticate, checkRole(['system_admin']), async (req, res) => {
  const { id } = req.params;
  
  try {
    const [check] = await dbPool.query(
      'SELECT COUNT(*) as count FROM containers_new WHERE road_info_id = ?',
      [id]
    );
    
    if (check[0].count > 0) {
      return res.status(400).json({
        success: false,
        msg: 'Замын мэдээлэл чингэлэгт ашиглагдаж байгаа тул устгах боломжгүй'
      });
    }
    
    await dbPool.query('DELETE FROM road_info WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete road error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

// ==================== CONTAINER TYPES APIs ====================
app.get('/api/container-types', authenticate, async (req, res) => {
  try {
    const [rows] = await dbPool.query(`
      SELECT ct.*, pc.currency_code, pc.currency_name, pc.symbol
      FROM container_types ct
      LEFT JOIN payment_currencies pc ON ct.currency_id = pc.id
      WHERE ct.is_active = TRUE 
      ORDER BY ct.id DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Container types error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.post('/api/container-types', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { type_name, type_code, description, price_per_kg, price_per_cbm, currency_id } = req.body;
  
  try {
    const [result] = await dbPool.query(
      `INSERT INTO container_types (type_name, type_code, description, price_per_kg, price_per_cbm, currency_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [type_name, type_code, description, price_per_kg, price_per_cbm, currency_id || null]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Create container type error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.put('/api/container-types/:id', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { id } = req.params;
  const { type_name, type_code, description, price_per_kg, price_per_cbm, currency_id } = req.body;
  
  try {
    await dbPool.query(
      `UPDATE container_types SET type_name=?, type_code=?, description=?, 
       price_per_kg=?, price_per_cbm=?, currency_id=? WHERE id=?`,
      [type_name, type_code, description, price_per_kg, price_per_cbm, currency_id || null, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update container type error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.delete('/api/container-types/:id', authenticate, checkRole(['system_admin']), async (req, res) => {
  const { id } = req.params;
  
  try {
    const [check] = await dbPool.query(
      'SELECT COUNT(*) as count FROM containers_new WHERE container_type_id = ?',
      [id]
    );
    
    if (check[0].count > 0) {
      return res.status(400).json({
        success: false,
        msg: 'Чингэлэгийн төрөл ашиглагдаж байгаа тул устгах боломжгүй'
      });
    }
    
    await dbPool.query('DELETE FROM container_types WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete container type error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

// ==================== CONTAINER STATUSES APIs ====================
app.get('/api/container-statuses', authenticate, async (req, res) => {
  try {
    const [rows] = await dbPool.query(
      'SELECT * FROM container_statuses WHERE is_active = TRUE ORDER BY id DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Statuses error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.post('/api/container-statuses', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { status_code, status_name, description } = req.body;
  
  try {
    const [result] = await dbPool.query(
      `INSERT INTO container_statuses (status_code, status_name, description) 
       VALUES (?, ?, ?)`,
      [status_code, status_name, description]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Create status error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.put('/api/container-statuses/:id', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { id } = req.params;
  const { status_code, status_name, description } = req.body;
  
  try {
    await dbPool.query(
      `UPDATE container_statuses SET status_code=?, status_name=?, description=? WHERE id=?`,
      [status_code, status_name, description, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.delete('/api/container-statuses/:id', authenticate, checkRole(['system_admin']), async (req, res) => {
  const { id } = req.params;
  
  try {
    const [check] = await dbPool.query(
      'SELECT COUNT(*) as count FROM containers_new WHERE status = (SELECT status_code FROM container_statuses WHERE id = ?)',
      [id]
    );
    
    if (check[0].count > 0) {
      return res.status(400).json({
        success: false,
        msg: 'Төлөв ашиглагдаж байгаа тул устгах боломжгүй'
      });
    }
    
    await dbPool.query('DELETE FROM container_statuses WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete status error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

// ==================== STORAGE FEES APIs ====================
app.get('/api/storage-fees', authenticate, async (req, res) => {
  try {
    const [rows] = await dbPool.query(`
      SELECT sf.*, pc.currency_code, pc.currency_name, pc.symbol
      FROM storage_fees sf
      LEFT JOIN payment_currencies pc ON sf.currency_id = pc.id
      WHERE sf.is_active = TRUE 
      ORDER BY sf.id DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Storage fees error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.post('/api/storage-fees', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { fee_name, price_per_day, unit_type, currency_id, description } = req.body;
  
  try {
    const [result] = await dbPool.query(
      `INSERT INTO storage_fees (fee_name, price_per_day, unit_type, currency_id, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [fee_name, price_per_day, unit_type, currency_id || null, description || null]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Create storage fee error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.put('/api/storage-fees/:id', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { id } = req.params;
  const { fee_name, price_per_day, unit_type, currency_id, description } = req.body;
  
  try {
    await dbPool.query(
      `UPDATE storage_fees SET fee_name=?, price_per_day=?, unit_type=?, 
       currency_id=?, description=? WHERE id=?`,
      [fee_name, price_per_day, unit_type, currency_id || null, description || null, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update storage fee error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.delete('/api/storage-fees/:id', authenticate, checkRole(['system_admin']), async (req, res) => {
  const { id } = req.params;
  
  try {
    const [check] = await dbPool.query(
      'SELECT COUNT(*) as count FROM cargo_new WHERE storage_fee_id = ?',
      [id]
    );
    
    if (check[0].count > 0) {
      return res.status(400).json({
        success: false,
        msg: 'Хадгалалтын үнэ ачаанд ашиглагдаж байгаа тул устгах боломжгүй'
      });
    }
    
    await dbPool.query('DELETE FROM storage_fees WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete storage fee error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

// ==================== PAYMENT CURRENCIES APIs ====================
app.get('/api/payment-currencies', authenticate, async (req, res) => {
  try {
    const [rows] = await dbPool.query(
      'SELECT * FROM payment_currencies WHERE is_active = TRUE ORDER BY is_default DESC, currency_name ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Payment currencies error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.post('/api/payment-currencies', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { currency_code, currency_name, symbol, is_default, description } = req.body;
  
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();
    
    if (is_default) {
      await connection.query('UPDATE payment_currencies SET is_default = FALSE');
    }
    
    const [result] = await connection.query(
      `INSERT INTO payment_currencies (currency_code, currency_name, symbol, is_default, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [currency_code, currency_name, symbol, is_default || false, description || null]
    );
    
    await connection.commit();
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    await connection.rollback();
    console.error('Create payment currency error:', err);
    res.status(500).json({ success: false, msg: err.message });
  } finally {
    connection.release();
  }
});

app.put('/api/payment-currencies/:id', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { id } = req.params;
  const { currency_code, currency_name, symbol, is_default, description } = req.body;
  
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();
    
    if (is_default) {
      await connection.query('UPDATE payment_currencies SET is_default = FALSE WHERE id != ?', [id]);
    }
    
    await connection.query(
      `UPDATE payment_currencies SET currency_code=?, currency_name=?, symbol=?, 
       is_default=?, description=? WHERE id=?`,
      [currency_code, currency_name, symbol, is_default, description || null, id]
    );
    
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    console.error('Update payment currency error:', err);
    res.status(500).json({ success: false, msg: err.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/payment-currencies/:id', authenticate, checkRole(['system_admin']), async (req, res) => {
  const { id } = req.params;
  
  try {
    const [checkTypes] = await dbPool.query('SELECT COUNT(*) as count FROM container_types WHERE currency_id = ?', [id]);
    const [checkFees] = await dbPool.query('SELECT COUNT(*) as count FROM storage_fees WHERE currency_id = ?', [id]);
    const [checkLocations] = await dbPool.query('SELECT COUNT(*) as count FROM payment_locations WHERE currency_id = ?', [id]);
    
    if (checkTypes[0].count > 0 || checkFees[0].count > 0 || checkLocations[0].count > 0) {
      return res.status(400).json({
        success: false,
        msg: 'Энэ валют ашиглагдаж байгаа тул устгах боломжгүй'
      });
    }
    
    await dbPool.query('DELETE FROM payment_currencies WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete payment currency error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

// ==================== PAYMENT LOCATIONS APIs ====================
app.get('/api/payment-locations', authenticate, async (req, res) => {
  try {
    const [rows] = await dbPool.query(`
      SELECT pl.*, pc.currency_name, pc.currency_code, pc.symbol
      FROM payment_locations pl
      LEFT JOIN payment_currencies pc ON pl.currency_id = pc.id
      WHERE pl.is_active = TRUE 
      ORDER BY pl.id DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Payment locations error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.post('/api/payment-locations', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { location_name, location_code, currency_id, description } = req.body;
  
  try {
    const [result] = await dbPool.query(
      `INSERT INTO payment_locations (location_name, location_code, currency_id, description) 
       VALUES (?, ?, ?, ?)`,
      [location_name, location_code || null, currency_id, description || null]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Create payment location error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.put('/api/payment-locations/:id', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { id } = req.params;
  const { location_name, location_code, currency_id, description } = req.body;
  
  try {
    await dbPool.query(
      `UPDATE payment_locations SET location_name=?, location_code=?, currency_id=?, description=? WHERE id=?`,
      [location_name, location_code || null, currency_id, description || null, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update payment location error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.delete('/api/payment-locations/:id', authenticate, checkRole(['system_admin']), async (req, res) => {
  const { id } = req.params;
  
  try {
    const [check] = await dbPool.query('SELECT COUNT(*) as count FROM cargo_new WHERE payment_location_id = ?', [id]);
    
    if (check[0].count > 0) {
      return res.status(400).json({
        success: false,
        msg: 'Энэ байршил ачаанд ашиглагдаж байгаа тул устгах боломжгүй'
      });
    }
    
    await dbPool.query('DELETE FROM payment_locations WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete payment location error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

// ==================== CONTAINERS APIs ====================
async function generateContainerCode(direction_id, container_type_id) {
  try {
    const [[direction]] = await dbPool.query('SELECT direction_code FROM directions WHERE id = ?', [direction_id]);
    const [[type]] = await dbPool.query('SELECT type_code FROM container_types WHERE id = ?', [container_type_id]);
    
    if (!direction || !type) {
      throw new Error('Direction or type not found');
    }
    
    const dateStr = new Date().toISOString().slice(5,10).replace(/-/g, '');
    
    const [[{ count }]] = await dbPool.query(
      'SELECT COUNT(*) as count FROM containers_new WHERE DATE(created_at) = CURDATE()'
    );
    
    const sequence = "C" + (count + 1);
    
    return `${direction.direction_code}-${type.type_code}-${dateStr}-${sequence}`;
  } catch (err) {
    console.error('Generate code error:', err);
    throw err;
  }
}

app.get('/api/containers-new', authenticate, async (req, res) => {
  try {
    const { page = 1, page_size = 10, status, direction_id, type_id, search } = req.query;
    
    let query = `
      SELECT c.*, d.direction_name, ct.type_name, r.road_name
      FROM containers_new c
      LEFT JOIN directions d ON c.direction_id = d.id
      LEFT JOIN container_types ct ON c.container_type_id = ct.id
      LEFT JOIN road_info r ON c.road_info_id = r.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status && status !== 'all') {
      query += ' AND c.status = ?';
      params.push(status);
    }
    
    if (direction_id && direction_id !== 'all') {
      query += ' AND c.direction_id = ?';
      params.push(direction_id);
    }
    
    if (type_id && type_id !== 'all') {
      query += ' AND c.container_type_id = ?';
      params.push(type_id);
    }
    
    if (search) {
      query += ' AND (c.container_code LIKE ? OR c.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
    
    const [rows] = await dbPool.query(query, params);
    
    const [[{ total }]] = await dbPool.query(
      'SELECT COUNT(*) as total FROM containers_new'
    );
    
    res.json({ 
      success: true, 
      data: rows,
      total_pages: Math.ceil(total / page_size),
      total_items: total
    });
  } catch (err) {
    console.error('Containers error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.get('/api/containers-new/available', authenticate, async (req, res) => {
  try {
    const [rows] = await dbPool.query(`
      SELECT c.*, d.direction_name, ct.type_name, ct.price_per_kg, ct.price_per_cbm, 
             ct.currency_id, r.road_name
      FROM containers_new c
      LEFT JOIN directions d ON c.direction_id = d.id
      LEFT JOIN container_types ct ON c.container_type_id = ct.id
      LEFT JOIN road_info r ON c.road_info_id = r.id
      WHERE c.status = 'open_registration'
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Available containers error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.post('/api/containers-new', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { 
    name,
    direction_id, 
    container_type_id, 
    road_info_id, 
    registration_date,
    departure_date,
    arrival_date,
    description
  } = req.body;
  
  const connection = await dbPool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const container_code = await generateContainerCode(direction_id, container_type_id);
    
    const [result] = await connection.query(
      `INSERT INTO containers_new (container_code, name, direction_id, container_type_id, 
       road_info_id, registration_date, departure_date, arrival_date, description, created_by, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open_registration')`,
      [container_code, name || null, direction_id, container_type_id, road_info_id, 
       registration_date, departure_date, arrival_date, description || null, req.user.id]
    );
    
    const containerId = result.insertId;
    
    await connection.query(
      `INSERT INTO container_status_history (container_id, old_status, new_status, changed_by, notes)
       VALUES (?, NULL, 'open_registration', ?, 'Чингэлэг үүсгэгдсэн')`,
      [containerId, req.user.id]
    );
    
    await connection.commit();
    
    res.json({ success: true, id: containerId, container_code });
  } catch (err) {
    await connection.rollback();
    console.error('Create container error:', err);
    res.status(500).json({ success: false, msg: err.message });
  } finally {
    connection.release();
  }
});

app.put('/api/containers-new/:id', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { id } = req.params;
  let { name, road_info_id, departure_date, arrival_date, description } = req.body;
  
  road_info_id = road_info_id && road_info_id !== '' ? road_info_id : null;
  departure_date = departure_date && departure_date !== '' ? departure_date : null;
  arrival_date = arrival_date && arrival_date !== '' ? arrival_date : null;
  name = name && name.trim() !== '' ? name.trim() : null;
  description = description && description.trim() !== '' ? description.trim() : null;
  
  try {
    await dbPool.query(
      `UPDATE containers_new SET 
       name = ?, road_info_id = ?, departure_date = ?, arrival_date = ?, 
       description = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, road_info_id, departure_date, arrival_date, description, id]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Update container error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.delete('/api/containers-new/:id', authenticate, checkRole(['system_admin']), async (req, res) => {
  const { id } = req.params;
  
  try {
    const [check] = await dbPool.query(
      'SELECT COUNT(*) as count FROM cargo_new WHERE container_id = ?',
      [id]
    );
    
    if (check[0].count > 0) {
      return res.status(400).json({
        success: false,
        msg: 'Чингэлэгт ачаа байгаа тул устгах боломжгүй'
      });
    }
    
    await dbPool.query('DELETE FROM containers_new WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete container error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.patch('/api/containers-new/:id/status', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const connection = await dbPool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const [[container]] = await connection.query(
      'SELECT status FROM containers_new WHERE id = ?',
      [id]
    );
    
    if (!container) {
      await connection.rollback();
      return res.status(404).json({ success: false, msg: 'Чингэлэг олдсонгүй' });
    }
    
    await connection.query(
      `UPDATE containers_new SET status = ?, status_changed_at = NOW(), 
       status_changed_by = ?, updated_at = NOW() WHERE id = ?`,
      [status, req.user.id, id]
    );
    
    await connection.query(
      `INSERT INTO container_status_history (container_id, old_status, new_status, changed_by, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [id, container.status, status, req.user.id, `Төлөв ${container.status} -> ${status} руу өөрчлөгдлөө`]
    );
    
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    console.error('Update container status error:', err);
    res.status(500).json({ success: false, msg: err.message });
  } finally {
    connection.release();
  }
});

app.patch('/api/containers-new/:id/start-distribution', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { id } = req.params;
  const connection = await dbPool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const [[container]] = await connection.query(
      'SELECT * FROM containers_new WHERE id = ?',
      [id]
    );
    
    if (!container) {
      await connection.rollback();
      return res.status(404).json({ success: false, msg: 'Чингэлэг олдсонгүй' });
    }
    
    if (container.status === 'open_distribution') {
      await connection.rollback();
      return res.status(400).json({ success: false, msg: 'Чингэлэг аль хэдийн тараалтад орсон байна' });
    }
    
    const [[{ totalCargos }]] = await connection.query(
      'SELECT COUNT(DISTINCT batch_number) as totalCargos FROM cargo_new WHERE container_id = ?',
      [id]
    );
    
    await connection.query(`
      UPDATE containers_new 
      SET status = 'open_distribution',
          distribution_start_date = NOW(),
          status_changed_at = NOW(),
          status_changed_by = ?
      WHERE id = ?
    `, [req.user.id, id]);
    
    const [updateResult] = await connection.query(`
      UPDATE cargo_new 
      SET status = 'pending_distribution',
          distribution_available_date = NOW(),
          updated_by = ?,
          updated_at = NOW()
      WHERE container_id = ? AND status != 'distributed'
    `, [req.user.id, id]);

    const [uniqueBatches] = await connection.query(`
      SELECT 
        MIN(id) as cargo_id,
        batch_number,
        MIN(status) as old_status,
        COUNT(*) as piece_count
      FROM cargo_new 
      WHERE container_id = ? AND status = 'pending_distribution'
      GROUP BY batch_number
    `, [id]);

    for (let batch of uniqueBatches) {
      await connection.query(
        `INSERT INTO cargo_status_history (cargo_id, batch_number, old_status, new_status, changed_by, notes)
        VALUES (?, ?, ?, 'pending_distribution', ?, ?)`,
        [batch.cargo_id, batch.batch_number, batch.old_status, req.user.id, 
        `Чингэлэг тараалтад орсон (${batch.piece_count} ширхэг)`]
      );
    }
    
    await connection.query(
      `INSERT INTO container_status_history (container_id, old_status, new_status, changed_by, notes)
       VALUES (?, ?, 'open_distribution', ?, ?)`,
      [id, container.status, req.user.id, `Тараалт эхлүүлсэн. ${updateResult.affectedRows} ачаа шинэчлэгдсэн (Нийт ${totalCargos} багц)`]
    );
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      message: 'Чингэлэг тараалтад орлоо',
      updated_cargo_count: updateResult.affectedRows,
      total_cargo_count: totalCargos
    });
  } catch (err) {
    await connection.rollback();
    console.error('Start distribution error:', err);
    res.status(500).json({ success: false, msg: err.message });
  } finally {
    connection.release();
  }
});

app.get('/api/containers-new/:id/detail', authenticate, async (req, res) => {
  const { id } = req.params;
  
  try {
    const [[container]] = await dbPool.query(`
      SELECT c.*, 
             d.direction_name, d.from_location, d.to_location,
             ct.type_name, ct.price_per_kg, ct.price_per_cbm,
             pc.currency_code, pc.currency_name, pc.symbol,
             r.road_name,
             u.username as created_by_name,
             u2.username as status_changed_by_name
      FROM containers_new c
      LEFT JOIN directions d ON c.direction_id = d.id
      LEFT JOIN container_types ct ON c.container_type_id = ct.id
      LEFT JOIN payment_currencies pc ON ct.currency_id = pc.id
      LEFT JOIN road_info r ON c.road_info_id = r.id
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN users u2 ON c.status_changed_by = u2.id
      WHERE c.id = ?
    `, [id]);
    
    if (!container) {
      return res.status(404).json({ success: false, msg: 'Чингэлэг олдсонгүй' });
    }
    
    const [cargos] = await dbPool.query(`
      SELECT cn.*,
             sf.fee_name as storage_fee_name, 
             sf.price_per_day as storage_price,
             sf.unit_type as storage_unit_type,
             sfc.currency_code as storage_currency_code,
             pl.location_name as payment_location_name,
             u.username as registered_by_name
      FROM cargo_new cn
      LEFT JOIN storage_fees sf ON cn.storage_fee_id = sf.id
      LEFT JOIN payment_currencies sfc ON sf.currency_id = sfc.id
      LEFT JOIN payment_locations pl ON cn.payment_location_id = pl.id
      LEFT JOIN users u ON cn.registered_by = u.id
      WHERE cn.container_id = ?
      ORDER BY cn.registered_date DESC
    `, [id]);
    
    const cargosWithStorage = await Promise.all(cargos.map(async (cargo) => {
      const storageInfo = await calculateStorageFee(cargo);
      return {
        ...cargo,
        storage_days: storageInfo.storage_days,
        storage_fee_amount: storageInfo.storage_fee_amount,
        total_with_storage: storageInfo.total_with_storage,
        images: cargo.images ? JSON.parse(cargo.images) : []
      };
    }));
    
    const batchMap = {};
    cargosWithStorage.forEach(cargo => {
      const batchKey = cargo.batch_number || cargo.cargo_code;
      if (!batchMap[batchKey]) {
        batchMap[batchKey] = cargo;
      }
    });
    
    const uniqueCargos = Object.values(batchMap);
    
    const totalCargoPrice = uniqueCargos.reduce((sum, c) => {
      const basePrice = c.is_manual_price ? parseFloat(c.manual_price || 0) : parseFloat(c.price || 0);
      return sum + basePrice;
    }, 0);
    
    const totalStorageFee = uniqueCargos.reduce((sum, c) => {
      return sum + parseFloat(c.storage_fee_amount || 0);
    }, 0);
    
    const senderStats = uniqueCargos.reduce((acc, cargo) => {
      const sender = cargo.sender_name;
      if (!acc[sender]) {
        acc[sender] = { count: 0, total_price: 0 };
      }
      acc[sender].count += 1;
      const basePrice = cargo.is_manual_price ? parseFloat(cargo.manual_price || 0) : parseFloat(cargo.price || 0);
      acc[sender].total_price += basePrice + parseFloat(cargo.storage_fee_amount || 0);
      return acc;
    }, {});
    
    res.json({
      success: true,
      container,
      cargos: cargosWithStorage,
      statistics: {
        total_cargo_count: cargos.length,
        total_cargo_price: totalCargoPrice,
        total_storage_fee: totalStorageFee,
        grand_total: totalCargoPrice + totalStorageFee,
        currency_code: container.currency_code || 'KRW',
        sender_stats: Object.entries(senderStats).map(([name, data]) => ({
          sender_name: name,
          cargo_count: data.count,
          total_amount: data.total_price
        }))
      }
    });
  } catch (err) {
    console.error('Container detail error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.get('/api/containers-new/:id/history', authenticate, async (req, res) => {
  const { id } = req.params;
  
  try {
    const [history] = await dbPool.query(`
      SELECT 
        csh.id,
        csh.old_status,
        csh.new_status,
        csh.changed_at,
        csh.notes,
        COALESCE(u.username, 'System') as changed_by
      FROM container_status_history csh
      LEFT JOIN users u ON csh.changed_by = u.id
      WHERE csh.container_id = ?
      ORDER BY csh.changed_at DESC
      LIMIT 50
    `, [id]);
    
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ success: false, msg: error.message });
  }
});

// ==================== ХАДГАЛАЛТЫН ХӨЛС ТООЦООЛОХ ФУНКЦ ====================
async function calculateStorageFee(cargo) {
  if (cargo.status === 'distributed') {
    // ЗАСВАР: distributed бол stored value ашигла
    return {
      storage_days: cargo.storage_days || 0,
      storage_fee_amount: cargo.storage_fee_amount || 0,
      total_with_storage: parseFloat(cargo.price || cargo.manual_price || 0) + (cargo.storage_fee_amount || 0)
    };
  }

  if (!cargo.distribution_available_date) {
    return {
      storage_days: 0,
      storage_fee_amount: 0,
      total_with_storage: parseFloat(cargo.price || cargo.manual_price || 0)
    };
  }
 
  const distributionDate = new Date(cargo.distribution_available_date);
  const currentDate = new Date();
  const timeDiff = currentDate - distributionDate;
  const hoursDiff = timeDiff / (1000 * 60 * 60);
 
  if (hoursDiff <= 168) {
    return {
      storage_days: 0,
      storage_fee_amount: 0,
      total_with_storage: parseFloat(cargo.price || cargo.manual_price || 0)
    };
  }
 
  const excessHours = hoursDiff - 168;
  const storageDays = Math.ceil(excessHours / 24);
 
  if (!cargo.storage_fee_id) {
    return {
      storage_days: storageDays,
      storage_fee_amount: 0,
      total_with_storage: parseFloat(cargo.price || cargo.manual_price || 0)
    };
  }
 
  const [[storageFee]] = await dbPool.query(
    'SELECT * FROM storage_fees WHERE id = ?',
    [cargo.storage_fee_id]
  );
 
  if (!storageFee) {
    return {
      storage_days: storageDays,
      storage_fee_amount: 0,
      total_with_storage: parseFloat(cargo.price || cargo.manual_price || 0)
    };
  }
 
  let storageFeeAmount = 0;
  const pricePerDay = parseFloat(storageFee.price_per_day);
 
  switch (storageFee.unit_type) {
    case 'per_piece':
      storageFeeAmount = storageDays * pricePerDay * (parseInt(cargo.total_pieces) || 1);
      break;
    case 'per_kg':
      storageFeeAmount = storageDays * pricePerDay * (parseFloat(cargo.weight_kg) || 0);
      break;
    case 'per_cbm':
      storageFeeAmount = storageDays * pricePerDay * (parseFloat(cargo.volume_cbm) || 0);
      break;
  }
 
  const basePrice = cargo.is_manual_price ?
    parseFloat(cargo.manual_price || 0) :
    parseFloat(cargo.price || 0);
 
  return {
    storage_days: storageDays,
    storage_fee_amount: parseFloat(storageFeeAmount.toFixed(2)),
    total_with_storage: parseFloat((basePrice + storageFeeAmount).toFixed(2))
  };
}
//backend/index.js - 2-Р ХЭСЭГ (1-р хэсгийн үргэлжлэл)

// ==================== CARGO APIs - ЗӨВИЙН ДАРААЛАЛТАЙ ====================

async function generateCargoCode(container_id, total_pieces) {
  try {
    const [[container]] = await dbPool.query(`
      SELECT c.*, d.direction_code, ct.type_code 
      FROM containers_new c
      JOIN directions d ON c.direction_id = d.id
      JOIN container_types ct ON c.container_type_id = ct.id
      WHERE c.id = ?
    `, [container_id]);
    
    if (!container) throw new Error('Container not found');
    
    const dateStr = new Date().toISOString().slice(5,10).replace(/-/g, '');
    
    const [[{ batchCount }]] = await dbPool.query(
      `SELECT COUNT(DISTINCT batch_number) as batchCount 
       FROM cargo_new 
       WHERE container_id = ?`,
      [container_id]
    );
    
    const batchNum = batchCount + 1;
    const batchNumber = `${container.direction_code}-${container.type_code}-${dateStr}-${batchNum}`;
    
    const cargoCodes = [];
    for (let i = 0; i < total_pieces; i++) {
      cargoCodes.push(`${batchNumber} ${total_pieces}-${i + 1}`);
    }
    
    return { batchNumber, cargoCodes };
  } catch (err) {
    console.error('Generate cargo code error:', err);
    throw err;
  }
}

// 1️⃣ ТАРААГДААГҮЙ АЧААНЫ ЖАГСААЛТ (ЭХЭНД)
app.get('/api/cargo-new/pending', authenticate, async (req, res) => {
  try {
    const { container_id, search } = req.query;
    console.log('📦 Pending cargos API called:', { container_id, search });
    
    let query = `
  SELECT
    MIN(cn.id) as id,
    cn.batch_number,
    MIN(cn.sender_name) as sender_name,
    MIN(cn.sender_phone) as sender_phone,
    MIN(cn.receiver_name) as receiver_name,
    MIN(cn.receiver_phone) as receiver_phone,
    MIN(cn.price) as cargo_price,
    MIN(cn.is_manual_price) as is_manual_price,
    MIN(cn.manual_price) as manual_price,
    MIN(pc.currency_code) as currency_code,
    MIN(cn.container_id) as container_id,
    MIN(cn.status) as status,
    MIN(cn.distribution_available_date) as distribution_available_date,
    MIN(cn.storage_fee_id) as storage_fee_id,
    COUNT(*) as total_pieces
  FROM cargo_new cn
  LEFT JOIN containers_new c ON cn.container_id = c.id
  LEFT JOIN container_types ct ON c.container_type_id = ct.id
  LEFT JOIN payment_currencies pc ON ct.currency_id = pc.id
  WHERE cn.status = 'pending_distribution'
    AND cn.batch_number IS NOT NULL
`;
    const params = [];
    
    if (container_id && container_id !== 'all') {
      query += ' AND cn.container_id = ?';
      params.push(container_id);
    }
    
    if (search) {
      query += ' AND (cn.batch_number LIKE ? OR cn.sender_name LIKE ? OR cn.receiver_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' GROUP BY cn.batch_number ORDER BY MIN(cn.registered_date) DESC';
    
    console.log('🔍 Query:', query);
    console.log('📋 Params:', params);
    
    const [cargos] = await dbPool.query(query, params);
    console.log('✅ Found cargos:', cargos.length);
    
    const cargosWithFees = await Promise.all(cargos.map(async (cargo) => {
      const [[fullCargo]] = await dbPool.query(
        `SELECT * FROM cargo_new WHERE batch_number = ? LIMIT 1`,
        [cargo.batch_number]
      );
      
      const storageInfo = await calculateStorageFee(fullCargo);
      
      const basePrice = cargo.is_manual_price ? 
        parseFloat(cargo.manual_price || 0) : 
        parseFloat(cargo.cargo_price || 0);
      
      return {
        ...cargo,
        cargo_price: basePrice,
        storage_fee: storageInfo.storage_fee_amount,
        total_amount: basePrice + parseFloat(storageInfo.storage_fee_amount)
      };
    }));
    
    console.log('💰 Cargos with fees:', cargosWithFees.length);
    res.json({ success: true, data: cargosWithFees });
  } catch (error) {
    console.error('❌ Pending cargos error:', error);
    res.status(500).json({ success: false, msg: error.message });
  }
});

// 2️⃣ АЧААНЫ ЕРӨНХИЙ ЖАГСААЛТ
app.get('/api/cargo-new', authenticate, async (req, res) => {
  try {
    const { container_id, search, status, page = 1, page_size = 20 } = req.query;
   
    let query = `
      SELECT MIN(cn.id) as id, cn.batch_number as cargo_code,
             MIN(cn.sender_name) as sender_name, MIN(cn.sender_phone) as sender_phone,
             MIN(cn.receiver_name) as receiver_name, MIN(cn.receiver_phone) as receiver_phone,
             MIN(cn.cargo_type) as cargo_type, MIN(cn.weight_kg) as weight_kg,
             MIN(cn.volume_cbm) as volume_cbm, MIN(cn.price) as price,
             MIN(c.container_code) as container_code, MIN(cn.status) as status,
             COUNT(*) as total_pieces, MIN(cn.cargo_name) as cargo_name,
             MIN(cn.sender_address) as sender_address, MIN(cn.receiver_address) as receiver_address,
             MIN(sf.fee_name) as storage_fee_name, MIN(u.username) as registered_by_name,
             MIN(cn.images) as images, MIN(ct.currency_id) as currency_id,
             MIN(pc.currency_code) as price_currency_code,
             MIN(cn.storage_fee_amount) as storage_fee,
             MIN(cn.storage_days) as storage_days
      FROM cargo_new cn
      LEFT JOIN containers_new c ON cn.container_id = c.id
      LEFT JOIN container_types ct ON c.container_type_id = ct.id
      LEFT JOIN payment_currencies pc ON ct.currency_id = pc.id
      LEFT JOIN storage_fees sf ON cn.storage_fee_id = sf.id
      LEFT JOIN users u ON cn.registered_by = u.id
      WHERE 1=1
    `;
    const params = [];
   
    if (req.user.role !== 'system_admin' && req.user.role !== 'staff') {
      query += ' AND cn.registered_by = ?';
      params.push(req.user.id);
    }
   
    if (container_id && container_id !== 'all') {
      query += ' AND cn.container_id = ?';
      params.push(container_id);
    }
   
    if (status && status !== 'all') {
      query += ' AND cn.status = ?';
      params.push(status);
    }
   
    if (search) {
      query += ' AND (cn.batch_number LIKE ? OR cn.cargo_name LIKE ? OR cn.sender_name LIKE ? OR cn.receiver_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
   
    query += ' GROUP BY cn.batch_number';
   
    const countQuery = `SELECT COUNT(DISTINCT cn.batch_number) as total FROM cargo_new cn WHERE 1=1${
      query.split('WHERE 1=1')[1].split('GROUP')[0]
    }`;
    const [[{ total }]] = await dbPool.query(countQuery, params);
   
    query += ' ORDER BY MIN(cn.registered_date) DESC LIMIT ? OFFSET ?';
    params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
   
    const [rows] = await dbPool.query(query, params);
   
    // ЗАСВАР: cargosWithFees-д storage_fee тооцож нэмэх
    const cargosWithFees = await Promise.all(rows.map(async (cargo) => {
      const storageInfo = await calculateStorageFee(cargo);
      return {
        ...cargo,
        cargo_price: cargo.is_manual_price ? cargo.manual_price : cargo.price,
        storage_fee: storageInfo.storage_fee_amount,
        total_amount: storageInfo.total_with_storage
      };
    }));
   
    res.json({
      success: true,
      data: cargosWithFees,
      total_pages: Math.ceil(total / page_size),
      total_items: total,
      current_page: parseInt(page)
    });
  } catch (err) {
    console.error('Cargo list error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

// 3️⃣ НЭГЖ АЧААНЫ ДЭЛГЭРЭНГҮЙ (:id параметртэй маршрут СҮҮЛД)
app.get('/api/cargo-new/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  
  try {
    const [[cargo]] = await dbPool.query(`
      SELECT cn.*, 
             c.container_code, c.status as container_status,
             ct.type_name, ct.price_per_kg, ct.price_per_cbm,
             d.direction_name, d.from_location, d.to_location,
             sf.fee_name as storage_fee_name, sf.price_per_day as storage_price,
             pl.location_name as payment_location_name, pl.currency_id as payment_currency_id,
             pc.currency_name as payment_currency_name, pc.symbol as payment_currency_symbol,
             cpc.currency_code as price_currency_code,
             u.username as registered_by_name,
             u2.username as updated_by_name,
             r.road_name as container_road_name
      FROM cargo_new cn
      LEFT JOIN containers_new c ON cn.container_id = c.id
      LEFT JOIN container_types ct ON c.container_type_id = ct.id
      LEFT JOIN payment_currencies cpc ON ct.currency_id = cpc.id
      LEFT JOIN directions d ON c.direction_id = d.id
      LEFT JOIN storage_fees sf ON cn.storage_fee_id = sf.id
      LEFT JOIN payment_locations pl ON cn.payment_location_id = pl.id
      LEFT JOIN payment_currencies pc ON pl.currency_id = pc.id
      LEFT JOIN users u ON cn.registered_by = u.id
      LEFT JOIN users u2 ON cn.updated_by = u2.id
      LEFT JOIN road_info r ON c.road_info_id = r.id
      WHERE cn.id = ?
    `, [id]);
    
    if (!cargo) {
      return res.status(404).json({ success: false, msg: 'Ачаа олдсонгүй' });
    }
    
    if (req.user.role !== 'system_admin' && req.user.role !== 'staff' && cargo.registered_by !== req.user.id) {
      return res.status(403).json({ success: false, msg: 'Эрх хүрэхгүй байна' });
    }
    
    if (cargo.images) {
      try {
        cargo.images = JSON.parse(cargo.images);
      } catch (e) {
        cargo.images = [];
      }
    } else {
      cargo.images = [];
    }
    
    const storageInfo = await calculateStorageFee(cargo);
    cargo.storage_days = storageInfo.storage_days;
    cargo.storage_fee_amount = storageInfo.storage_fee_amount;
    cargo.total_with_storage = storageInfo.total_with_storage;
    
    let batchCargos = [];
    if (cargo.batch_number) {
      const [batchData] = await dbPool.query(
        'SELECT * FROM cargo_new WHERE batch_number = ? ORDER BY piece_number',
        [cargo.batch_number]
      );
      batchCargos = batchData;
    }
    
    res.json({ 
      success: true, 
      data: cargo,
      batch_cargos: batchCargos
    });
  } catch (err) {
    console.error('Get cargo detail error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.post('/api/cargo-new', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const {
    container_id, cargo_name, sender_name, sender_phone, sender_address,
    receiver_name, receiver_phone, receiver_address,
    cargo_type, weight_kg, length_cm, width_cm, height_cm,
    total_pieces, storage_fee_id, payment_location_id, description, images,
    is_manual_price = false, manual_price
  } = req.body;
 
  const connection = await dbPool.getConnection();
 
  try {
    await connection.beginTransaction();
   
    const [[container]] = await connection.query(`
      SELECT c.*, ct.price_per_kg, ct.price_per_cbm, ct.type_name
      FROM containers_new c
      JOIN container_types ct ON c.container_type_id = ct.id
      WHERE c.id = ? AND c.status = 'open_registration'
    `, [container_id]);
   
    if (!container) {
      await connection.rollback();
      return res.status(400).json({ success: false, msg: 'Чингэлэг олдсонгүй эсвэл хаагдсан' });
    }
   
    let unitPrice = 0;
    let volume_cbm = null;
   
    if (is_manual_price) {
      unitPrice = parseFloat(manual_price || 0);
    } else {
      if (cargo_type === 'weight') {
        unitPrice = parseFloat(weight_kg || 0) * parseFloat(container.price_per_kg);
      } else if (cargo_type === 'volume') {
        volume_cbm = (parseFloat(length_cm || 0) * parseFloat(width_cm || 0) * parseFloat(height_cm || 0)) / 1000000;
        unitPrice = volume_cbm * parseFloat(container.price_per_cbm);
      }
    }
   
    const totalPrice = unitPrice;
   
    const { batchNumber, cargoCodes } = await generateCargoCode(container_id, parseInt(total_pieces || 1));
   
    const cargoIds = [];
    const pieceCount = parseInt(total_pieces || 1);
   
    const imagesJson = images && images.length > 0 ? JSON.stringify(images) : null;
   
    for (let i = 0; i < pieceCount; i++) {
      const [result] = await connection.query(`
        INSERT INTO cargo_new (
          cargo_code, cargo_name, batch_number, piece_number, total_pieces,
          container_id, sender_name, sender_phone, sender_address,
          receiver_name, receiver_phone, receiver_address,
          cargo_type, weight_kg, length_cm, width_cm, height_cm,
          volume_cbm, price, currency, storage_fee_id, payment_location_id, description,
          registered_by, barcode_data, qr_code_data, images,
          manual_price, is_manual_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        cargoCodes[i],
        cargo_name || null,
        batchNumber,
        i + 1,
        pieceCount,
        container_id,
        sender_name,
        sender_phone || null,
        sender_address || null,
        receiver_name,
        receiver_phone || null,
        receiver_address || null,
        cargo_type,
        cargo_type === 'weight' ? weight_kg : null,
        cargo_type === 'volume' ? length_cm : null,
        cargo_type === 'volume' ? width_cm : null,
        cargo_type === 'volume' ? height_cm : null,
        volume_cbm,
        unitPrice,
        'KRW',
        storage_fee_id || null,
        payment_location_id || null,
        description || null,
        req.user.id,
        cargoCodes[i],
        JSON.stringify({
          code: cargoCodes[i],
          sender: sender_name,
          receiver: receiver_name,
          container: container.container_code
        }),
        imagesJson,
        is_manual_price ? unitPrice : null,
        is_manual_price ? 1 : 0
      ]);
     
      cargoIds.push(result.insertId);
    }
   
    await connection.query(
      'UPDATE containers_new SET current_count = current_count + ? WHERE id = ?',
      [pieceCount, container_id]
    );
   
    await connection.query(
      `INSERT INTO cargo_status_history (cargo_id, batch_number, old_status, new_status, changed_by, notes)
       VALUES (?, ?, NULL, 'registered', ?, ?)`,
      [cargoIds[0], batchNumber, req.user.id, `Багц бүртгэгдсэн: ${pieceCount} ширхэг ачаа`]
    );
    await connection.commit();
   
    res.json({
      success: true,
      cargo_ids: cargoIds,
      batch_number: batchNumber,
      cargo_codes: cargoCodes,
      total_price: totalPrice,
      unit_price: unitPrice,
      message: `${pieceCount} ширхэг ачаа амжилттай бүртгэгдлээ`
    });
  } catch (err) {
    await connection.rollback();
    console.error('Create cargo error:', err);
    res.status(500).json({ success: false, msg: err.message });
  } finally {
    connection.release();
  }
});

app.patch('/api/cargo-new/:id/status', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { id } = req.params;
  const { status, payment_method, receiver_phone_verified } = req.body;
  
  const connection = await dbPool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const [[cargo]] = await connection.query(
      'SELECT * FROM cargo_new WHERE id = ?',
      [id]
    );
    
    if (!cargo) {
      await connection.rollback();
      return res.status(404).json({ success: false, msg: 'Ачаа олдсонгүй' });
    }
    
    const oldStatus = cargo.status;
    
    if (cargo.status === 'distributed') {
      await connection.rollback();
      return res.status(403).json({ 
        success: false, 
        msg: '⚠️ Тараагдсан ачааны төлөв энэ цонхоор өөрчлөх боломжгүй!\n\nSystem admin "Тараалт буцаах" (↶) товчийг ашиглана уу.' 
      });
    }

    await connection.query(
      'UPDATE cargo_new SET status = ?, updated_by = ?, updated_at = NOW() WHERE batch_number = ?',
      [status, req.user.id, cargo.batch_number]
    );
    
    await connection.query(
      `INSERT INTO cargo_status_history (cargo_id, batch_number, old_status, new_status, changed_by, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cargo.id, cargo.batch_number, oldStatus, status, req.user.id, null]
    );

    if (status === 'distributed' && oldStatus !== 'distributed') {
      if (!payment_method) {
        await connection.rollback();
        return res.status(400).json({ 
          success: false, 
          msg: 'Төлбөрийн хэлбэр сонгоно уу' 
        });
      }
      
      const [[firstCargo]] = await connection.query(`
        SELECT cn.*, 
               ct.currency_id,
               pc.currency_code
        FROM cargo_new cn
        LEFT JOIN containers_new c ON cn.container_id = c.id
        LEFT JOIN container_types ct ON c.container_type_id = ct.id
        LEFT JOIN payment_currencies pc ON ct.currency_id = pc.id
        WHERE cn.batch_number = ?
        LIMIT 1
      `, [cargo.batch_number]);
      
      const storageInfo = await calculateStorageFee(firstCargo);
      
      const cargoPrice = firstCargo.is_manual_price ? 
        parseFloat(firstCargo.manual_price || 0) : 
        parseFloat(firstCargo.price || 0);
      
      const totalAmount = cargoPrice + parseFloat(storageInfo.storage_fee_amount || 0);
      
      await connection.query(`
        INSERT INTO payment_records (
          cargo_id, cargo_batch_number, cargo_code,
          sender_name, receiver_name,
          cargo_price, storage_fee, total_amount,
          currency_code, payment_date, payment_type,
          container_id, recorded_by, payment_method, receiver_phone_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'revenue', ?, ?, ?, ?)
      `, [
        firstCargo.id,
        firstCargo.batch_number,
        firstCargo.cargo_code,
        firstCargo.sender_name,
        firstCargo.receiver_name,
        cargoPrice,
        storageInfo.storage_fee_amount,
        totalAmount,
        firstCargo.currency_code || 'KRW',
        firstCargo.container_id,
        req.user.id,
        payment_method,
        receiver_phone_verified || cargo.receiver_phone
      ]);
    }
    
    await connection.commit();
    res.json({ 
      success: true, 
      message: 'Төлөв амжилттай шинэчлэгдлээ',
      payment_recorded: status === 'distributed' && oldStatus !== 'distributed'
    });
  } catch (err) {
    await connection.rollback();
    console.error('Update cargo status error:', err);
    res.status(500).json({ success: false, msg: err.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/cargo-new/:id', authenticate, checkRole(['system_admin']), async (req, res) => {
  const { id } = req.params;
  
  const connection = await dbPool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const [[cargo]] = await connection.query(
      'SELECT container_id, batch_number, total_pieces FROM cargo_new WHERE id = ?',
      [id]
    );
    
    if (!cargo) {
      await connection.rollback();
      return res.status(404).json({ success: false, msg: 'Ачаа олдсонгүй' });
    }
    
    await connection.query('DELETE FROM cargo_new WHERE batch_number = ?', [cargo.batch_number]);
    
    await connection.query(
      'UPDATE containers_new SET current_count = current_count - ? WHERE id = ?',
      [cargo.total_pieces, cargo.container_id]
    );
    
    await connection.commit();
    
    res.json({ success: true, message: 'Ачаа амжилттай устгагдлаа' });
  } catch (err) {
    await connection.rollback();
    console.error('Delete cargo error:', err);
    res.status(500).json({ success: false, msg: err.message });
  } finally {
    connection.release();
  }
});

app.get('/api/cargo-new/:id/history', authenticate, async (req, res) => {
  const { id } = req.params;
  
  try {
    const [[cargo]] = await dbPool.query(
      'SELECT batch_number FROM cargo_new WHERE id = ?',
      [id]
    );
    
    if (!cargo) {
      return res.status(404).json({ success: false, msg: 'Ачаа олдсонгүй' });
    }
    
    const [history] = await dbPool.query(`
      SELECT 
        csh.id,
        csh.old_status,
        csh.new_status,
        csh.changed_at,
        csh.notes,
        COALESCE(u.username, 'System') as changed_by
      FROM cargo_status_history csh
      LEFT JOIN users u ON csh.changed_by = u.id
      WHERE csh.batch_number = ?
      ORDER BY csh.changed_at DESC
      LIMIT 50
    `, [cargo.batch_number]);
    
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Cargo history fetch error:', error);
    res.status(500).json({ success: false, msg: error.message });
  }
});

app.patch('/api/cargo-new/:id/distribute', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { id } = req.params;
  const { payment_method, receiver_phone_verified } = req.body;
 
  const connection = await dbPool.getConnection();
 
  try {
    await connection.beginTransaction();
   
    const [[cargo]] = await connection.query('SELECT * FROM cargo_new WHERE id = ?', [id]);
   
    if (!cargo) {
      await connection.rollback();
      return res.status(404).json({ success: false, msg: 'Ачаа олдсонгүй' });
    }
   
    if (cargo.status === 'distributed') {
      await connection.rollback();
      return res.status(400).json({ success: false, msg: 'Ачаа аль хэдийн тараагдсан' });
    }
   
    await connection.query(
      'UPDATE cargo_new SET status = ?, updated_by = ?, updated_at = NOW() WHERE batch_number = ?',
      ['distributed', req.user.id, cargo.batch_number]
    );
   
    await connection.query(
      `INSERT INTO cargo_status_history (cargo_id, batch_number, old_status, new_status, changed_by, notes)
       VALUES (?, ?, ?, 'distributed', ?, 'Төлбөр авч тараасан')`,
      [cargo.id, cargo.batch_number, cargo.status, req.user.id]
    );
   
    const storageInfo = await calculateStorageFee(cargo);
    const cargoPrice = cargo.is_manual_price ? parseFloat(cargo.manual_price || 0) : parseFloat(cargo.price || 0);
    const totalAmount = cargoPrice + parseFloat(storageInfo.storage_fee_amount || 0);
   
    // ЗАСВАР: storage_fee_amount, storage_days-г cargo_new-д хадгалах
    await connection.query(
      'UPDATE cargo_new SET storage_fee_amount = ?, storage_days = ? WHERE batch_number = ?',
      [storageInfo.storage_fee_amount, storageInfo.storage_days, cargo.batch_number]
    );
   
    const [[containerInfo]] = await connection.query(`
      SELECT pc.currency_code
      FROM containers_new c
      LEFT JOIN container_types ct ON c.container_type_id = ct.id
      LEFT JOIN payment_currencies pc ON ct.currency_id = pc.id
      WHERE c.id = ?
    `, [cargo.container_id]);
   
    const currencyCode = containerInfo?.currency_code || 'KRW';
   
    await connection.query(`
      INSERT INTO payment_records (
        cargo_id, cargo_batch_number, cargo_code,
        sender_name, receiver_name, cargo_price, storage_fee, total_amount,
        currency_code, payment_date, payment_type, container_id,
        recorded_by, payment_method, receiver_phone_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'revenue', ?, ?, ?, ?)
    `, [
      cargo.id, cargo.batch_number, cargo.cargo_code,
      cargo.sender_name, cargo.receiver_name, cargoPrice,
      storageInfo.storage_fee_amount, totalAmount, currencyCode,
      cargo.container_id, req.user.id, payment_method,
      receiver_phone_verified || cargo.receiver_phone
    ]);
   
    await connection.commit();
    res.json({ success: true, message: 'Төлбөр амжилттай бүртгэгдлээ' });
  } catch (err) {
    await connection.rollback();
    console.error('Distribute cargo error:', err);
    res.status(500).json({ success: false, msg: err.message });
  } finally {
    connection.release();
  }
});

app.patch('/api/cargo-new/:id/reverse-distribution', authenticate, checkRole(['system_admin']), async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  const connection = await dbPool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const [[cargo]] = await connection.query('SELECT * FROM cargo_new WHERE id = ?', [id]);
    
    if (!cargo) {
      await connection.rollback();
      return res.status(404).json({ success: false, msg: 'Ачаа олдсонгүй' });
    }
    
    if (cargo.status !== 'distributed') {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        msg: 'Зөвхөн тараагдсан төлөвт байгаа ачааг буцаах боломжтой' 
      });
    }
    
    const [deleteResult] = await connection.query(
      'DELETE FROM payment_records WHERE cargo_batch_number = ?',
      [cargo.batch_number]
    );
    
    await connection.query(
      'UPDATE cargo_new SET status = ?, updated_by = ?, updated_at = NOW() WHERE batch_number = ?',
      ['pending_distribution', req.user.id, cargo.batch_number]
    );
    
    await connection.query(
      `INSERT INTO cargo_status_history (cargo_id, batch_number, old_status, new_status, changed_by, notes)
       VALUES (?, ?, 'distributed', 'pending_distribution', ?, ?)`,
      [cargo.id, cargo.batch_number, req.user.id, reason || 'Тараалт буцаагдсан']
    );
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      message: 'Тараалт амжилттай буцаагдлаа',
      payment_deleted: deleteResult.affectedRows > 0
    });
  } catch (err) {
    await connection.rollback();
    console.error('Reverse distribution error:', err);
    res.status(500).json({ success: false, msg: err.message });
  } finally {
    connection.release();
  }
});

// ==================== PAYMENT APIs ====================
app.post('/api/payment/expense', authenticate, checkRole(['system_admin', 'staff']), async (req, res) => {
  const { container_id, amount, currency_code, payment_method, description } = req.body;
 
  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ success: false, msg: 'Дүн зөв оруулна уу' });
  }
 
  if (!description || !description.trim()) {
    return res.status(400).json({ success: false, msg: 'Тайлбар оруулна уу' });
  }
 
  try {
    const [result] = await dbPool.query(`
  INSERT INTO payment_records (
    container_id, total_amount, currency_code,
    payment_method, payment_type, notes,
    payment_date, recorded_by
  ) VALUES (?, ?, ?, ?, 'expense', ?, NOW(), ?)
`, [
  container_id || null,
  parseFloat(amount),
  currency_code || 'KRW',
  payment_method || 'cash',
  description.trim(),
  req.user.id
]);
   
    res.json({
      success: true,
      id: result.insertId,
      message: 'Зарлага амжилттай бүртгэгдлээ'
    });
  } catch (error) {
    console.error('Expense record error:', error);
    res.status(500).json({ success: false, msg: error.message });
  }
});

app.get('/api/payment/stats', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE payment_date BETWEEN ? AND ?';
      params.push(start_date + ' 00:00:00', end_date + ' 23:59:59');
    }
    
    const [[{ pending_count }]] = await dbPool.query(`
      SELECT COUNT(DISTINCT batch_number) as pending_count 
      FROM cargo_new 
      WHERE status = 'pending_distribution'
    `);
    
    const [[{ today_distributed }]] = await dbPool.query(`
      SELECT COUNT(DISTINCT batch_number) as today_distributed
      FROM cargo_new
      WHERE status = 'distributed' 
        AND DATE(updated_at) = CURDATE()
    `);
    
    const [[{ open_distribution }]] = await dbPool.query(`
      SELECT COUNT(*) as open_distribution
      FROM containers_new
      WHERE status = 'open_distribution'
    `);
    
    const [[revenue]] = await dbPool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN payment_type = 'revenue' THEN total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_type = 'expense' THEN total_amount ELSE 0 END), 0) as total_expense,
        COUNT(DISTINCT CASE WHEN payment_type = 'revenue' THEN cargo_batch_number END) as revenue_count,
        SUM(CASE WHEN payment_type = 'revenue' AND payment_method = 'cash' THEN total_amount ELSE 0 END) as cash_revenue,
        SUM(CASE WHEN payment_type = 'revenue' AND payment_method = 'transfer' THEN total_amount ELSE 0 END) as transfer_revenue
      FROM payment_records
      ${dateFilter}
    `, params);
    
    const [byCurrency] = await dbPool.query(`
      SELECT 
        currency_code,
        SUM(CASE WHEN payment_type = 'revenue' THEN total_amount ELSE 0 END) as revenue,
        SUM(CASE WHEN payment_type = 'expense' THEN total_amount ELSE 0 END) as expense,
        SUM(CASE WHEN payment_type = 'revenue' THEN cargo_price ELSE 0 END) as cargo_price_sum,
        SUM(CASE WHEN payment_type = 'revenue' THEN storage_fee ELSE 0 END) as storage_fee_sum
      FROM payment_records
      ${dateFilter}
      GROUP BY currency_code
    `, params);
    
    res.json({
      success: true,
      stats: {
        pending_distribution_count: pending_count,
        today_distributed_count: today_distributed,
        open_distribution_containers: open_distribution,
        total_revenue: parseFloat(revenue.total_revenue || 0),
        total_expense: parseFloat(revenue.total_expense || 0),
        net_income: parseFloat(revenue.total_revenue || 0) - parseFloat(revenue.total_expense || 0),
        revenue_count: revenue.revenue_count || 0,
        cash_revenue: parseFloat(revenue.cash_revenue || 0),
        transfer_revenue: parseFloat(revenue.transfer_revenue || 0)
      },
      by_currency: byCurrency
    });
  } catch (error) {
    console.error('Payment stats error:', error);
    res.status(500).json({ success: false, msg: error.message });
  }
});

app.get('/api/payment/records', authenticate, async (req, res) => {
  try {
    const { start_date, end_date, payment_type, payment_method, container_id, page = 1, page_size = 20 } = req.query;
    
    let query = `
      SELECT pr.*, 
             pr.notes as description,
             u.username as recorded_by_name,
             c.container_code
      FROM payment_records pr
      LEFT JOIN users u ON pr.recorded_by = u.id
      LEFT JOIN containers_new c ON pr.container_id = c.id
      WHERE 1=1
    `;
    const params = [];
    
    if (start_date && end_date) {
      query += ' AND pr.payment_date BETWEEN ? AND ?';
      params.push(start_date + ' 00:00:00', end_date + ' 23:59:59');
    }
    
    if (payment_type && payment_type !== 'all') {
      query += ' AND pr.payment_type = ?';
      params.push(payment_type);
    }
    
    if (payment_method && payment_method !== 'all') {
      query += ' AND pr.payment_method = ?';
      params.push(payment_method);
    }
    
    if (container_id && container_id !== 'all') {
      query += ' AND pr.container_id = ?';
      params.push(container_id);
    }
    
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM payment_records pr
      WHERE 1=1
      ${start_date && end_date ? ' AND pr.payment_date BETWEEN ? AND ?' : ''}
      ${payment_type && payment_type !== 'all' ? ' AND pr.payment_type = ?' : ''}
      ${payment_method && payment_method !== 'all' ? ' AND pr.payment_method = ?' : ''}
      ${container_id && container_id !== 'all' ? ' AND pr.container_id = ?' : ''}
    `;

    const countParams = [];
    if (start_date && end_date) {
      countParams.push(start_date + ' 00:00:00', end_date + ' 23:59:59');
    }
    if (payment_type && payment_type !== 'all') {
      countParams.push(payment_type);
    }
    if (payment_method && payment_method !== 'all') {
      countParams.push(payment_method);
    }
    if (container_id && container_id !== 'all') {
      countParams.push(container_id);
    }

    const [[countResult]] = await dbPool.query(countQuery, countParams);
    const total = countResult?.total || 0;
    
    query += ' ORDER BY pr.payment_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
    
    const [records] = await dbPool.query(query, params);
    
    res.json({
      success: true,
      data: records,
      total_pages: Math.ceil(total / page_size),
      total_items: total
    });
  } catch (error) {
    console.error('Payment records error:', error);
    res.status(500).json({ success: false, msg: error.message });
  }
});

// ==================== DASHBOARD APIs ====================
app.get('/api/dashboard/stats', authenticate, async (req, res) => {
  try {
    const stats = {};
    
    const [[{ newCargo }]] = await dbPool.query(`
      SELECT COUNT(*) as newCargo
      FROM cargo_new 
      WHERE DATE(registered_date) = CURDATE()
    `);
    stats.newCargo = newCargo || 0;
    
    const [[{ openContainers }]] = await dbPool.query(`
      SELECT COUNT(*) as openContainers
      FROM containers_new 
      WHERE status = 'open_registration'
    `);
    stats.distribution = openContainers || 0;
    
    const [[{ totalUsers }]] = await dbPool.query(`
      SELECT COUNT(*) as totalUsers
      FROM users 
      WHERE role != 'system_admin'
    `);
    stats.totalUsers = totalUsers || 0;
    
    const [[{ activeOrders }]] = await dbPool.query(`
      SELECT COUNT(*) as activeOrders
      FROM cargo_new 
      WHERE status IN ('registered', 'shipped', 'pending_distribution')
    `);
    stats.activeOrders = activeOrders || 0;
    
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    msg: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));