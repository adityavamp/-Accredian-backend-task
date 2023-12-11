const express = require('express');
const axios =require('axios')
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const PORT =4000;

const pool = new Pool({
  user: '123',
  host: 'hyping-beagle-7560.8nk.cockroachlabs.cloud',
  database: 'defaultdb',
  password: 'hmLAWmV1lBCj4c-4mltUEw',
  port: 26257,
  ssl: {
    rejectUnauthorized: false,
  },
});
const RECAPTCHA_SECRET_KEY="6Le-eywpAAAAAPeE6udVa56XZg3RGrgu8vLMBTZO"
app.use(cors());

app.use(express.json());

app.get('/data', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM your_table');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    

    if (result.rows.length === 1) {
      const hashedPassword = result.rows[0].password;
      const passwordMatch = await bcrypt.compare(password, hashedPassword);

      if (passwordMatch) {
        res.json({ message: 'Login successful' });
      } else {
        res.status(201).json({ error: 'Invalid password' });
      }
    } else {
      res.status(201).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(201).json({ error: 'Internal Server Error' });
  }
});
app.post('/register', async (req, res) => {
 
  const { username, email, password, confirmPassword } = req.body;
  // Check if passwords match
  if(!username)
  {
    return res.status(201).json({ error: 'Username is required' });
  }
  if(!password)
  {
    return res.status(201).json({ error: 'Password is required' });
  }
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(201).json({ error: 'Invalid Password' });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(201).json({ error: 'Invalid email format' });
  }
  if (password !== confirmPassword) {
    return res.status(201).json({ error: 'Passwords do not match' });
  }
  

  // Check if username already exists
  const usernameCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  if (usernameCheck.rows.length > 0) {
    return res.status(201).json({ error: 'Username already exists' });
  }

  // Check if email already exists
  const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (emailCheck.rows.length > 0) {
    return res.status(201).json({ error: 'Email already exists' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user details into the database
  try {
    await pool.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [username, email, hashedPassword]);
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
  
});

app.listen(PORT, () => {
});
