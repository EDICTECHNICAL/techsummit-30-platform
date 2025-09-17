// admin-hash.js
const bcrypt = require('bcryptjs');
const password = 'adminpass1';
const hash = bcrypt.hashSync(password, 10);
console.log('bcrypt hash for adminpass1:', hash);