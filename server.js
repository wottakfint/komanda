const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config({ path: 'bd.env' });

const app = express();
const port = process.env.PORT || 3000;

// Настройка подключения к базе данных MySQL
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
};

// Создание пула соединений
const pool = mysql.createPool(dbConfig);

// Вывод информации о подключении
console.log('Попытка подключения к базе данных...');
console.log('Параметры подключения:');
console.log('- Пользователь:', dbConfig.user);
console.log('- Хост:', dbConfig.host);
console.log('- База данных:', dbConfig.database);
console.log('- Пароль:', dbConfig.password.replace(/./g, '*'));
console.log('- Порт:', dbConfig.port);

// Тестирование подключения к базе данных
async function testConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Успешное подключение к базе данных!');
    
    const [rows] = await connection.execute('SELECT NOW() as `timestamp`');
    console.log('Время на сервере базы данных:', rows[0].timestamp);
    
    await connection.end();
  } catch (err) {
    console.error('❌ ОШИБКА ПОДКЛЮЧЕНИЯ К БАЗЕ ДАННЫХ:', err);
    console.log('Проверьте, правильно ли указаны параметры подключения');
  }
}

// Настройка хранилища для загружаемых файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'public', 'uploads', 'documents');
    
    // Создаем директорию, если она не существует
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB максимальный размер файла
  },
  fileFilter: function (req, file, cb) {
    // Проверка типа файла
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый тип файла. Разрешены только PDF, DOC, DOCX, JPG и PNG.'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(cors());
app.options('*', cors());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));
app.use(session({
  secret: 'medcard_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // true в продакшне с SSL
}));

// Middleware для проверки авторизации
const checkAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Необходима авторизация' });
  }
};

// API маршруты

// Авторизация
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Users WHERE username = ?', 
      [username]
    );
    
    if (rows.length > 0) {
      const user = rows[0];
      if (password === 'test123') { // Для тестирования
        req.session.user = {
          id: user.user_id,
          username: user.username,
          role: user.role
        };
        await pool.query(
          'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
          [user.user_id, 'login', 'Вход в систему', req.ip]
        );
        res.json({ success: true, user: req.session.user });
      } else {
        res.status(401).json({ success: false, message: 'Неверный пароль' });
      }
    } else {
      res.status(401).json({ success: false, message: 'Пользователь не найден' });
    }
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Выход из системы
app.post('/api/logout', checkAuth, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [req.session.user.id, 'logout', 'Выход из системы', req.ip]
    );
    
    req.session.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при выходе:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Получение списка всех военнослужащих
app.get('/api/soldiers', checkAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.soldier_id, s.full_name, s.personal_number, s.rank, s.unit, 
             mr.health_status, mr.last_examination_date
      FROM Soldiers s
      LEFT JOIN MedicalRecords mr ON s.soldier_id = mr.soldier_id
      ORDER BY s.unit, s.rank, s.full_name
    `);
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Ошибка при загрузке списка военнослужащих:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Поиск военнослужащих
app.get('/api/soldiers/search', checkAuth, async (req, res) => {
  const searchTerm = req.query.term;
  
  try {
    const [rows] = await pool.query(`
      SELECT s.soldier_id, s.full_name, s.personal_number, s.rank, s.unit, 
             mr.health_status, mr.last_examination_date
      FROM Soldiers s
      LEFT JOIN MedicalRecords mr ON s.soldier_id = mr.soldier_id
      WHERE LOWER(s.full_name) LIKE LOWER(?) OR LOWER(s.personal_number) LIKE LOWER(?) OR LOWER(s.unit) LIKE LOWER(?)
      ORDER BY s.unit, s.rank, s.full_name
    `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Ошибка при поиске военнослужащих:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Получение данных одного военнослужащего
app.get('/api/soldiers/:id', checkAuth, async (req, res) => {
  const soldierId = req.params.id;
  
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Soldiers WHERE soldier_id = ?',
      [soldierId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Военнослужащий не найден' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Ошибка при получении данных военнослужащего:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Добавление нового военнослужащего
app.post('/api/soldiers', checkAuth, async (req, res) => {
  try {
    const soldierData = req.body;
    
    // Транзакция для создания записей в обеих таблицах
    await pool.query('START TRANSACTION');
    
    // Рассчитываем ИМТ, если есть рост и вес
    let bmi = null;
    if (soldierData.height && soldierData.weight) {
      const heightM = soldierData.height / 100;
      bmi = soldierData.weight / (heightM * heightM);
    }
    
    // 1. Вставляем данные в таблицу Soldiers
    const [soldierResult] = await pool.query(
      'INSERT INTO Soldiers (full_name, personal_number, rank, unit, birth_date, blood_type, rhesus_factor, emergency_contact, emergency_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        soldierData.full_name,
        soldierData.personal_number,
        soldierData.rank,
        soldierData.unit,
        soldierData.birth_date,
        soldierData.blood_type,
        soldierData.rhesus_factor,
        soldierData.emergency_contact,
        soldierData.emergency_phone
      ]
    );
    
    const soldierId = soldierResult.insertId;
    
    // 2. Вставляем медицинские данные в MedicalRecords
    await pool.query(
      'INSERT INTO MedicalRecords (soldier_id, height, weight, bmi, fitness_category, health_status, last_examination_date) VALUES (?, ?, ?, ?, ?, ?, CURDATE())',
      [
        soldierId,
        soldierData.height,
        soldierData.weight,
        bmi,
        soldierData.fitness_category,
        'Удовлетворительное' // Значение по умолчанию
      ]
    );
    
    await pool.query('COMMIT');
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'add_soldier', 
        `Добавление нового военнослужащего: ${soldierData.full_name} (${soldierData.personal_number})`,
        req.ip
      ]
    );
    
    res.json({ 
      success: true, 
      message: 'Военнослужащий успешно добавлен',
      data: { soldier_id: soldierId }
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Ошибка при добавлении военнослужащего:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Обновление данных военнослужащего
app.put('/api/soldiers/:id', checkAuth, async (req, res) => {
  try {
    const soldierId = req.params.id;
    const soldierData = req.body;
    
    // Транзакция для обновления записей в обеих таблицах
    await pool.query('START TRANSACTION');
    
    // Рассчитываем ИМТ, если есть рост и вес
    let bmi = null;
    if (soldierData.height && soldierData.weight) {
      const heightM = soldierData.height / 100;
      bmi = soldierData.weight / (heightM * heightM);
    }
    
    // 1. Обновляем данные в таблице Soldiers
    await pool.query(
      `UPDATE Soldiers SET
        full_name = ?,
        personal_number = ?,
        rank = ?,
        unit = ?,
        birth_date = ?,
        blood_type = ?,
        rhesus_factor = ?,
        emergency_contact = ?,
        emergency_phone = ?
      WHERE soldier_id = ?`,
      [
        soldierData.full_name,
        soldierData.personal_number,
        soldierData.rank,
        soldierData.unit,
        soldierData.birth_date,
        soldierData.blood_type,
        soldierData.rhesus_factor,
        soldierData.emergency_contact,
        soldierData.emergency_phone,
        soldierId
      ]
    );
    
    // 2. Обновляем медицинские данные в MedicalRecords
    const [checkResult] = await pool.query('SELECT record_id FROM MedicalRecords WHERE soldier_id = ?', [soldierId]);
    
    if (checkResult.length > 0) {
      // Запись существует, обновляем ее
      await pool.query(
        `UPDATE MedicalRecords SET
          height = ?,
          weight = ?,
          bmi = ?,
          fitness_category = ?,
          last_update = CURRENT_TIMESTAMP
        WHERE soldier_id = ?`,
        [
          soldierData.height,
          soldierData.weight,
          bmi,
          soldierData.fitness_category,
          soldierId
        ]
      );
    } else {
      // Записи нет, создаем новую
      await pool.query(
        'INSERT INTO MedicalRecords (soldier_id, height, weight, bmi, fitness_category, health_status, last_examination_date) VALUES (?, ?, ?, ?, ?, ?, CURDATE())',
        [
          soldierId,
          soldierData.height,
          soldierData.weight,
          bmi,
          soldierData.fitness_category,
          'Удовлетворительное' // Значение по умолчанию
        ]
      );
    }
    
    await pool.query('COMMIT');
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'update_soldier', 
        `Обновление данных военнослужащего: ${soldierData.full_name} (ID: ${soldierId})`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Данные военнослужащего обновлены' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Ошибка при обновлении данных:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Обновление физических данных (рост, вес, ИМТ)
app.put('/api/soldiers/:id/physical', checkAuth, async (req, res) => {
  const soldierId = req.params.id;
  const { height, weight } = req.body;
  
  try {
    // Рассчитываем ИМТ
    let bmi = null;
    if (height && weight) {
      const heightM = height / 100;
      bmi = weight / (heightM * heightM);
    }
    
    // Начинаем транзакцию
    await pool.query('START TRANSACTION');
    
    // Обновляем данные в MedicalRecords
    const [checkResult] = await pool.query('SELECT record_id FROM MedicalRecords WHERE soldier_id = ?', [soldierId]);
    
    if (checkResult.length > 0) {
      await pool.query(
        'UPDATE MedicalRecords SET height = ?, weight = ?, bmi = ? WHERE soldier_id = ?',
        [height, weight, bmi, soldierId]
      );
    } else {
      await pool.query(
        'INSERT INTO MedicalRecords (soldier_id, height, weight, bmi, health_status) VALUES (?, ?, ?, ?, "Удовлетворительное")',
        [soldierId, height, weight, bmi]
      );
    }
    
    await pool.query('COMMIT');
    
    res.json({ success: true, message: 'Физические данные обновлены' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Ошибка при обновлении физических данных:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Получение полных данных медкарты по ID военнослужащего
app.get('/api/medcard/:id', checkAuth, async (req, res) => {
  const soldierId = req.params.id;
  
  try {
    // Получаем данные солдата и его медкарты
    const [soldierRows] = await pool.query(`
      SELECT 
        s.*, 
        mr.health_status, 
        mr.height, 
        mr.weight, 
        mr.bmi, 
        mr.fitness_category, 
        mr.last_examination_date
      FROM Soldiers s
      LEFT JOIN MedicalRecords mr ON s.soldier_id = mr.soldier_id
      WHERE s.soldier_id = ?
    `, [soldierId]);
    
    if (soldierRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Военнослужащий не найден' });
    }
    
    // Отладочная информация
    console.log('Данные бойца из БД:', soldierRows[0]);
    console.log('Рост из MedicalRecords:', soldierRows[0].height);
    console.log('Вес из MedicalRecords:', soldierRows[0].weight);
    console.log('ИМТ из MedicalRecords:', soldierRows[0].bmi);
    
    // Получаем заболевания
    const [conditions] = await pool.query(`
      SELECT c.*, u.username as doctor_name
      FROM Conditions c
      LEFT JOIN MedicalRecords mr ON c.record_id = mr.record_id
      LEFT JOIN Users u ON c.doctor_id = u.user_id
      WHERE mr.soldier_id = ?
      ORDER BY c.start_date DESC
    `, [soldierId]);
    
    // Получаем аллергии
    const [allergies] = await pool.query(`
      SELECT a.*
      FROM Allergies a
      LEFT JOIN MedicalRecords mr ON a.record_id = mr.record_id
      WHERE mr.soldier_id = ?
    `, [soldierId]);
    
    // Получаем лекарства
    const [medications] = await pool.query(`
      SELECT m.*, u.username as prescribed_by
      FROM Medications m
      LEFT JOIN MedicalRecords mr ON m.record_id = mr.record_id
      LEFT JOIN Users u ON m.prescriber_id = u.user_id
      WHERE mr.soldier_id = ?
      ORDER BY m.start_date DESC
    `, [soldierId]);
    
    // Получаем вакцинации
    const [vaccinations] = await pool.query(`
      SELECT v.*, u.username as doctor_name
      FROM Vaccinations v
      LEFT JOIN MedicalRecords mr ON v.record_id = mr.record_id
      LEFT JOIN Users u ON v.doctor_id = u.user_id
      WHERE mr.soldier_id = ?
      ORDER BY v.vaccination_date DESC
    `, [soldierId]);
    
    // Получаем документы
    const [documents] = await pool.query(`
      SELECT d.*, u.username as uploader_name
      FROM Documents d
      LEFT JOIN MedicalRecords mr ON d.record_id = mr.record_id
      LEFT JOIN Users u ON d.uploader_id = u.user_id
      WHERE mr.soldier_id = ?
      ORDER BY d.upload_date DESC
    `, [soldierId]);
    
    // Логируем доступ
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'view_record', 
        `Просмотр медкарты военнослужащего с ID ${soldierId}`,
        req.ip
      ]
    );
    
    res.json({
      success: true,
      data: {
        soldier: soldierRows[0],
        conditions: conditions,
        allergies: allergies,
        medications: medications,
        vaccinations: vaccinations,
        documents: documents
      }
    });
  } catch (error) {
    console.error('Ошибка при получении медкарты:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Обновление статуса здоровья
app.put('/api/medrecords/:id/status', checkAuth, async (req, res) => {
  const soldierId = req.params.id;
  const { health_status } = req.body;
  
  if (!health_status) {
    return res.status(400).json({ success: false, message: 'Не указан статус здоровья' });
  }
  
  try {
    await pool.query(
      `UPDATE MedicalRecords SET
        health_status = ?,
        last_examination_date = NOW()
      WHERE soldier_id = ?`,
      [health_status, soldierId]
    );
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'update_health_status', 
        `Обновление статуса здоровья военнослужащего (ID: ${soldierId}) на "${health_status}"`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Статус здоровья обновлен' });
  } catch (error) {
    console.error('Ошибка при обновлении статуса здоровья:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Обновление категории годности
app.put('/api/medrecords/:id/fitness', checkAuth, async (req, res) => {
  const soldierId = req.params.id;
  const { fitness_category } = req.body;
  
  if (!fitness_category) {
    return res.status(400).json({ success: false, message: 'Не указана категория годности' });
  }
  
  try {
    await pool.query(
      `UPDATE MedicalRecords SET
        fitness_category = ?,
        last_examination_date = NOW()
      WHERE soldier_id = ?`,
      [fitness_category, soldierId]
    );
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'update_fitness_category', 
        `Обновление категории годности военнослужащего (ID: ${soldierId}) на "${fitness_category}"`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Категория годности обновлена' });
  } catch (error) {
    console.error('Ошибка при обновлении категории годности:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Эндпоинты для работы с заболеваниями/травмами
app.post('/api/conditions', checkAuth, async (req, res) => {
  const conditionData = req.body;
  
  try {
    // Получаем ID медицинской карты
    const [mrRows] = await pool.query(
      'SELECT record_id FROM MedicalRecords WHERE soldier_id = ?',
      [conditionData.soldier_id]
    );
    
    if (mrRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Медицинская карта не найдена' });
    }
    
    const recordId = mrRows[0].record_id;
    
    // Создаем новую запись в таблице Conditions
    await pool.query(
      `INSERT INTO Conditions (
        record_id, condition_type, description, start_date, end_date, doctor_id
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        recordId,
        conditionData.condition_type,
        conditionData.description,
        conditionData.start_date,
        conditionData.end_date,
        req.session.user.id // ID текущего пользователя как врача
      ]
    );
    
    // Обновляем дату последнего осмотра
    await pool.query(
      'UPDATE MedicalRecords SET last_examination_date = NOW() WHERE record_id = ?',
      [recordId]
    );
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'add_condition', 
        `Добавление заболевания/травмы для военнослужащего (ID: ${conditionData.soldier_id})`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Заболевание/травма добавлены' });
  } catch (error) {
    console.error('Ошибка при добавлении заболевания/травмы:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

app.get('/api/conditions/:id', checkAuth, async (req, res) => {
  const conditionId = req.params.id;
  
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Conditions WHERE condition_id = ?',
      [conditionId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Запись не найдена' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Ошибка при получении данных о заболевании/травме:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

app.put('/api/conditions/:id', checkAuth, async (req, res) => {
  const conditionId = req.params.id;
  const conditionData = req.body;
  
  try {
    await pool.query(
      `UPDATE Conditions SET
        condition_type = ?,
        description = ?,
        start_date = ?,
        end_date = ?
      WHERE condition_id = ?`,
      [
        conditionData.condition_type,
        conditionData.description,
        conditionData.start_date,
        conditionData.end_date,
        conditionId
      ]
    );
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'update_condition', 
        `Обновление данных о заболевании/травме (ID: ${conditionId})`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Данные обновлены' });
  } catch (error) {
    console.error('Ошибка при обновлении данных о заболевании/травме:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

app.delete('/api/conditions/:id', checkAuth, async (req, res) => {
  const conditionId = req.params.id;
  
  try {
    const [result] = await pool.query(
      'DELETE FROM Conditions WHERE condition_id = ?',
      [conditionId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Запись не найдена' });
    }
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'delete_condition', 
        `Удаление заболевания/травмы (ID: ${conditionId})`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Запись удалена' });
  } catch (error) {
    console.error('Ошибка при удалении заболевания/травмы:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Эндпоинты для работы с аллергиями
app.post('/api/allergies', checkAuth, async (req, res) => {
  const allergyData = req.body;
  
  try {
    // Получаем ID медицинской карты
    const [mrRows] = await pool.query(
      'SELECT record_id FROM MedicalRecords WHERE soldier_id = ?',
      [allergyData.soldier_id]
    );
    
    if (mrRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Медицинская карта не найдена' });
    }
    
    const recordId = mrRows[0].record_id;
    
    // Создаем новую запись в таблице Allergies
    await pool.query(
      `INSERT INTO Allergies (
        record_id, allergy_type, description, severity, recommendations
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        recordId,
        allergyData.allergy_type,
        allergyData.description,
        allergyData.severity,
        allergyData.recommendations
      ]
    );
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'add_allergy', 
        `Добавление аллергии для военнослужащего (ID: ${allergyData.soldier_id})`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Аллергия добавлена' });
  } catch (error) {
    console.error('Ошибка при добавлении аллергии:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

app.get('/api/allergies/:id', checkAuth, async (req, res) => {
  const allergyId = req.params.id;
  
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Allergies WHERE allergy_id = ?',
      [allergyId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Аллергия не найдена' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Ошибка при получении данных об аллергии:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

app.put('/api/allergies/:id', checkAuth, async (req, res) => {
  const allergyId = req.params.id;
  const allergyData = req.body;
  
  try {
    await pool.query(
      `UPDATE Allergies SET
        allergy_type = ?,
        description = ?,
        severity = ?,
        recommendations = ?
      WHERE allergy_id = ?`,
      [
        allergyData.allergy_type,
        allergyData.description,
        allergyData.severity,
        allergyData.recommendations,
        allergyId
      ]
    );
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'update_allergy', 
        `Обновление данных об аллергии (ID: ${allergyId})`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Данные обновлены' });
  } catch (error) {
    console.error('Ошибка при обновлении данных об аллергии:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

app.delete('/api/allergies/:id', checkAuth, async (req, res) => {
  const allergyId = req.params.id;
  
  try {
    const [result] = await pool.query(
      'DELETE FROM Allergies WHERE allergy_id = ?',
      [allergyId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Аллергия не найдена' });
    }
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'delete_allergy', 
        `Удаление аллергии (ID: ${allergyId})`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Аллергия удалена' });
  } catch (error) {
    console.error('Ошибка при удалении аллергии:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Эндпоинты для работы с лекарствами
app.post('/api/medications', checkAuth, async (req, res) => {
  const medicationData = req.body;
  
  try {
    // Получаем ID медицинской карты
    const [mrRows] = await pool.query(
      'SELECT record_id FROM MedicalRecords WHERE soldier_id = ?',
      [medicationData.soldier_id]
    );
    
    if (mrRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Медицинская карта не найдена' });
    }
    
    const recordId = mrRows[0].record_id;
    
    // Создаем новую запись в таблице Medications
    await pool.query(
      `INSERT INTO Medications (
        record_id, medication_name, dosage, frequency, start_date, end_date, notes, prescriber_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId,
        medicationData.medication_name,
        medicationData.dosage,
        medicationData.frequency,
        medicationData.start_date,
        medicationData.end_date,
        medicationData.notes,
        req.session.user.id // ID текущего пользователя как врача
      ]
    );
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'add_medication', 
        `Добавление лекарства для военнослужащего (ID: ${medicationData.soldier_id})`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Лекарство добавлено' });
  } catch (error) {
    console.error('Ошибка при добавлении лекарства:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

app.get('/api/medications/:id', checkAuth, async (req, res) => {
  const medicationId = req.params.id;
  
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Medications WHERE medication_id = ?',
      [medicationId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Лекарство не найдено' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Ошибка при получении данных о лекарстве:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

app.put('/api/medications/:id', checkAuth, async (req, res) => {
  const medicationId = req.params.id;
  const medicationData = req.body;
  
  try {
    await pool.query(
      `UPDATE Medications SET
        medication_name = ?,
        dosage = ?,
        frequency = ?,
        start_date = ?,
        end_date = ?,
        notes = ?
      WHERE medication_id = ?`,
      [
        medicationData.medication_name,
        medicationData.dosage,
        medicationData.frequency,
        medicationData.start_date,
        medicationData.end_date,
        medicationData.notes,
        medicationId
      ]
    );
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'update_medication', 
        `Обновление данных о лекарстве (ID: ${medicationId})`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Данные обновлены' });
  } catch (error) {
    console.error('Ошибка при обновлении данных о лекарстве:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

app.delete('/api/medications/:id', checkAuth, async (req, res) => {
  const medicationId = req.params.id;
  
  try {
    const [result] = await pool.query(
      'DELETE FROM Medications WHERE medication_id = ?',
      [medicationId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Лекарство не найдено' });
    }
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'delete_medication', 
        `Удаление лекарства (ID: ${medicationId})`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Лекарство удалено' });
  } catch (error) {
    console.error('Ошибка при удалении лекарства:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Эндпоинты для работы с вакцинациями
app.post('/api/vaccinations', checkAuth, async (req, res) => {
  const vaccinationData = req.body;
  
  try {
    // Получаем ID медицинской карты
    const [mrRows] = await pool.query(
      'SELECT record_id FROM MedicalRecords WHERE soldier_id = ?',
      [vaccinationData.soldier_id]
    );
    
    if (mrRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Медицинская карта не найдена' });
    }
    
    const recordId = mrRows[0].record_id;
    
    // Создаем новую запись в таблице Vaccinations
    await pool.query(
      `INSERT INTO Vaccinations (
        record_id, vaccine_name, vaccination_date, expiration_date, batch_number, notes, doctor_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId,
        vaccinationData.vaccine_name,
        vaccinationData.vaccination_date,
        vaccinationData.expiration_date,
        vaccinationData.batch_number,
        vaccinationData.notes,
        req.session.user.id // ID текущего пользователя как врача
      ]
    );
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'add_vaccination', 
        `Добавление вакцинации для военнослужащего (ID: ${vaccinationData.soldier_id})`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Вакцинация добавлена' });
  } catch (error) {
    console.error('Ошибка при добавлении вакцинации:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

app.get('/api/vaccinations/:id', checkAuth, async (req, res) => {
  const vaccinationId = req.params.id;
  
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Vaccinations WHERE vaccination_id = ?',
      [vaccinationId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Вакцинация не найдена' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Ошибка при получении данных о вакцинации:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

app.put('/api/vaccinations/:id', checkAuth, async (req, res) => {
  const vaccinationId = req.params.id;
  const vaccinationData = req.body;
  
  try {
    await pool.query(
      `UPDATE Vaccinations SET
        vaccine_name = ?,
        vaccination_date = ?,
        expiration_date = ?,
        batch_number = ?,
        notes = ?
      WHERE vaccination_id = ?`,
      [
        vaccinationData.vaccine_name,
        vaccinationData.vaccination_date,
        vaccinationData.expiration_date,
        vaccinationData.batch_number,
        vaccinationData.notes,
        vaccinationId
      ]
    );
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'update_vaccination', 
        `Обновление данных о вакцинации (ID: ${vaccinationId})`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Данные обновлены' });
  } catch (error) {
    console.error('Ошибка при обновлении данных о вакцинации:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

app.delete('/api/vaccinations/:id', checkAuth, async (req, res) => {
  const vaccinationId = req.params.id;
  
  try {
    const [result] = await pool.query(
      'DELETE FROM Vaccinations WHERE vaccination_id = ?',
      [vaccinationId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Вакцинация не найдена' });
    }
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'delete_vaccination', 
        `Удаление вакцинации (ID: ${vaccinationId})`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Вакцинация удалена' });
  } catch (error) {
    console.error('Ошибка при удалении вакцинации:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Эндпоинты для работы с документами
app.post('/api/documents', checkAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Файл не загружен' });
    }
    
    const documentData = req.body;
    
    // Получаем ID медицинской карты
    const [mrRows] = await pool.query(
      'SELECT record_id FROM MedicalRecords WHERE soldier_id = ?',
      [documentData.soldier_id]
    );
    
    if (mrRows.length === 0) {
      // Удаляем загруженный файл, если карты не существует
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Медицинская карта не найдена' });
    }
    
    const recordId = mrRows[0].record_id;
    const filePath = '/uploads/documents/' + path.basename(req.file.path);
    
    // Создаем новую запись в таблице Documents
    await pool.query(
      `INSERT INTO Documents (
        record_id, document_type, document_name, file_path, uploader_id, upload_date
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        recordId,
        documentData.document_type,
        documentData.document_name,
        filePath,
        req.session.user.id // ID текущего пользователя
      ]
    );
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'upload_document', 
        `Загрузка документа "${documentData.document_name}" для военнослужащего (ID: ${documentData.soldier_id})`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Документ загружен' });
  } catch (error) {
    console.error('Ошибка при загрузке документа:', error);
    
    // Удаляем загруженный файл в случае ошибки
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

app.delete('/api/documents/:id', checkAuth, async (req, res) => {
  const documentId = req.params.id;
  
  try {
    // Сначала находим путь к файлу
    const [fileRows] = await pool.query(
      'SELECT file_path FROM Documents WHERE document_id = ?',
      [documentId]
    );
    
    if (fileRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Документ не найден' });
    }
    
    const filePath = path.join(__dirname, 'public', fileRows[0].file_path);
    
    // Удаляем файл с диска
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Удаляем запись из базы данных
    const [result] = await pool.query(
      'DELETE FROM Documents WHERE document_id = ?',
      [documentId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Документ не найден' });
    }
    
    await pool.query(
      'INSERT INTO ActivityLog (user_id, action_type, action_description, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.session.user.id, 
        'delete_document', 
        `Удаление документа (ID: ${documentId})`,
        req.ip
      ]
    );
    
    res.json({ success: true, message: 'Документ удален' });
  } catch (error) {
    console.error('Ошибка при удалении документа:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// 404 обработчик
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Запрашиваемый ресурс не найден' });
});

// Обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
  testConnection(); // Вызов тестирования подключения при запуске
});