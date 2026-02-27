const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const bcryptjs = require('bcryptjs');
const { db, init } = require('./models/db');

const SECRET = 'supersecretjwtkey'; // in prod use env variable

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// helper functions
function findCustomer(query) {
  const q = query.trim().toLowerCase();
  return db.data.customers.find(c =>
    c.accNo.toLowerCase() === q ||
    c.name.toLowerCase() === q ||
    c.name.toLowerCase().includes(q)
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Missing authorization' });
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// routes
app.post('/api/signup', async (req, res) => {
  const { name, phone, dob, addr, password, lang, pin } = req.body;
  if (!name || !phone || !dob || !addr || !password || !pin) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  // check existing
  if (db.data.customers.find(c => c.name.toLowerCase() === name.toLowerCase())) {
    return res.status(400).json({ message: 'Name already registered' });
  }
  
  // Hash password with bcrypt
  const hashedPassword = await bcryptjs.hash(password, 10);
  
  const accNo = 'NB' + db.data.nextAccNo++;
  const newCust = {
    accNo,
    name,
    phone,
    dob,
    addr,
    balance: 10000,
    pin,
    passwordHash: hashedPassword,
    password: undefined, // remove plain text password
    lang,
    txns: [
      { date: new Date().toLocaleDateString('en-IN'), desc: 'Account Opening Bonus', mode: 'CREDIT', amount: 10000, type: 'CR', balance: 10000, status: 'Success' }
    ]
  };
  db.data.customers.push(newCust);
  await db.write();
  const token = jwt.sign({ accNo: newCust.accNo, name: newCust.name }, SECRET, { expiresIn: '2h' });
  res.json({ message: 'Account created', accNo, token, user: newCust });
});

app.post('/api/login', async (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) return res.status(400).json({ message: 'Missing credentials' });
  const cust = findCustomer(id);
  if (!cust) return res.status(404).json({ message: 'Customer not found' });
  
  // Verify password with bcrypt
  const isMatch = cust.passwordHash ? 
    await bcryptjs.compare(password, cust.passwordHash) :
    (cust.password === password); // fallback for old plaintext passwords
  
  if (!isMatch) return res.status(401).json({ message: 'Wrong password' });
  const token = jwt.sign({ accNo: cust.accNo, name: cust.name }, SECRET, { expiresIn: '2h' });
  res.json({ token, user: cust });
});

app.get('/api/customers/me', authMiddleware, (req, res) => {
  const cust = db.data.customers.find(c => c.accNo === req.user.accNo);
  if (!cust) return res.status(404).json({ message: 'Not found' });
  res.json(cust);
});

// open list of customers for voice-login demos
// NOTE: this exposes user info and would NOT be used in production
app.get('/api/customers/list', (req, res) => {
  const list = db.data.customers.map(c => {
    const { password, pin, ...rest } = c;
    return rest;
  });
  res.json(list);
});

// voice-login support (demo only, no password required)
app.post('/api/voice-login', (req, res) => {
  const { accNo } = req.body;
  const cust = db.data.customers.find(c => c.accNo === accNo);
  if (!cust) return res.status(404).json({ message: 'Customer not found' });
  const token = jwt.sign({ accNo: cust.accNo, name: cust.name }, SECRET, { expiresIn: '2h' });
  const { password, pin, ...safe } = cust;
  res.json({ token, user: safe });
});

// protected route for admin to fetch full customer records
app.get('/api/customers', authMiddleware, (req, res) => {
  // for admin – simplistic check: if accNo === 'ADMIN001'
  if (req.user.accNo !== 'ADMIN001') return res.status(403).json({ message: 'Forbidden' });
  res.json(db.data.customers);
});

app.get('/api/transactions/me', authMiddleware, (req, res) => {
  const cust = db.data.customers.find(c => c.accNo === req.user.accNo);
  if (!cust) return res.status(404).json({ message: 'Not found' });
  res.json(cust.txns || []);
});

app.post('/api/transfer', authMiddleware, async (req, res) => {
  const { to, amount, mode, pin } = req.body;
  const sender = db.data.customers.find(c => c.accNo === req.user.accNo);
  if (!sender) return res.status(404).json({ message: 'Sender not found' });
  if (sender.pin !== pin) return res.status(401).json({ message: 'Invalid PIN' });
  if (amount <= 0 || amount > sender.balance) return res.status(400).json({ message: 'Invalid amount or insufficient balance' });
  const receiver = findCustomer(to);
  if (!receiver && mode !== 'UPI') return res.status(404).json({ message: 'Beneficiary not found' });

  const now = new Date().toLocaleDateString('en-IN');
  sender.balance -= amount;
  sender.txns.unshift({ date: now, desc: `Transfer to ${receiver ? receiver.name : to}`, mode, amount, type: 'DR', balance: sender.balance, status: 'Success' });
  if (receiver) {
    receiver.balance += amount;
    receiver.txns.unshift({ date: now, desc: `Received from ${sender.name}`, mode, amount, type: 'CR', balance: receiver.balance, status: 'Success' });
  }
  db.data.transactions.push({ date: now, from: sender.accNo, to: receiver ? receiver.accNo : to, amount, mode, status: 'Success' });
  await db.write();
  res.json({ message: 'Transfer successful', sender, receiver });
});

// admin simple login
app.post('/api/admin/login', (req, res) => {
  const { id, password } = req.body;
  if (id === 'ADMIN001' && password === 'admin123') {
    const token = jwt.sign({ accNo: id, name: 'Admin' }, SECRET, { expiresIn: '2h' });
    return res.json({ token });
  }
  res.status(401).json({ message: 'Invalid admin credentials' });
});

// Admin middleware - verify admin access
function adminMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Missing authorization' });
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.accNo !== 'ADMIN001') return res.status(403).json({ message: 'Not an admin' });
    req.admin = decoded;
    next();
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// GET all customers (admin only)
app.get('/api/admin/customers', adminMiddleware, (req, res) => {
  const customers = db.data.customers.map(c => {
    const { passwordHash, password, ...safe } = c;
    return { ...safe, hashedPassword: '***' };
  });
  res.json(customers);
});

// GET single customer (admin only)
app.get('/api/admin/customers/:accNo', adminMiddleware, (req, res) => {
  const cust = db.data.customers.find(c => c.accNo === req.params.accNo);
  if (!cust) return res.status(404).json({ message: 'Customer not found' });
  const { passwordHash, password, ...safe } = cust;
  res.json(safe);
});

// UPDATE customer (admin can edit any field except password)
app.put('/api/admin/customers/:accNo', adminMiddleware, async (req, res) => {
  const cust = db.data.customers.find(c => c.accNo === req.params.accNo);
  if (!cust) return res.status(404).json({ message: 'Customer not found' });
  
  // Allow updating: name, phone, dob, addr, balance, pin, lang, status
  const { name, phone, dob, addr, balance, pin, lang, status } = req.body;
  
  if (name) cust.name = name;
  if (phone) cust.phone = phone;
  if (dob) cust.dob = dob;
  if (addr) cust.addr = addr;
  if (balance !== undefined) cust.balance = balance;
  if (pin) cust.pin = pin;
  if (lang) cust.lang = lang;
  if (status) cust.status = status;
  
  await db.write();
  res.json({ message: 'Customer updated', customer: cust });
});

// ADD new customer (admin can create accounts)
app.post('/api/admin/customers', adminMiddleware, async (req, res) => {
  const { name, phone, dob, addr, password, pin, lang, balance } = req.body;
  
  if (!name || !phone || !dob || !addr || !password || !pin) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // check existing
  if (db.data.customers.find(c => c.name.toLowerCase() === name.toLowerCase())) {
    return res.status(400).json({ message: 'Name already registered' });
  }
  
  const hashedPassword = await bcryptjs.hash(password, 10);
  const accNo = 'NB' + db.data.nextAccNo++;
  
  const newCust = {
    accNo,
    id: 'C' + String(db.data.customers.length + 1).padStart(3, '0'),
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@bankuser.com`,
    phone,
    dob,
    addr,
    balance: balance || 10000,
    pin,
    passwordHash: hashedPassword,
    lang: lang || 'en',
    status: 'Active',
    kyc: 'Complete',
    monthlyIncome: 50000,
    accountType: 'Savings',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    txns: [
      { date: new Date().toLocaleDateString('en-IN'), desc: 'Account Created by Admin', mode: 'CREDIT', amount: balance || 10000, type: 'CR', balance: balance || 10000, status: 'Success' }
    ]
  };
  
  db.data.customers.push(newCust);
  await db.write();
  
  res.json({ message: 'Customer created successfully', customer: newCust });
});

// DELETE customer (admin only)
app.delete('/api/admin/customers/:accNo', adminMiddleware, async (req, res) => {
  const index = db.data.customers.findIndex(c => c.accNo === req.params.accNo);
  if (index === -1) return res.status(404).json({ message: 'Customer not found' });
  
  const deleted = db.data.customers.splice(index, 1);
  await db.write();
  
  res.json({ message: 'Customer deleted', customer: deleted[0] });
});

// GET transaction logs (admin can view all)
app.get('/api/admin/transactions', adminMiddleware, (req, res) => {
  res.json(db.data.transactions || []);
});

// start
init().then(() => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log('Backend running on', port));
});
