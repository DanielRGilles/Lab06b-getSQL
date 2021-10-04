const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); // http logging

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});
app.get('/categories/:id', async(req, res) => {
  try {
    const data = await client.query(
      `SELECT category_name
      FROM categories
      WHERE id=$1`, [req.params.id]);
      
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});
app.get('/categories', async(req, res) => {
  try {
    const data = await client.query(
      `SELECT category_name
      FROM categories
      `);
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.get('/edible-plants', async(req, res) => {
  try {
    const data = await client.query(
      `SELECT b.id, b.plantid,
        b.name,
        b.category,
        b.growzonenumber,
        b.wateringinterval,
        c.category_name,
        b.imageurl,
        b.edible,
        b.description,
        u.email,
        b.owner_id
      FROM edible_plants as b
      JOIN categories as c 
      ON b.category = c.id 
      JOIN users as u
      ON b.owner_id = u.id
      `);
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.get('/edible-plants/:id', async(req, res) => {
  try {
    const data = await client.query(`SELECT b.id, b.plantid,
     b.name,
     b.category,
     b.growzonenumber,
     b.wateringinterval,
     c.category_name,
     b.imageurl,
     b.edible,
     b.description,
     u.email,
     b.owner_id
   FROM edible_plants as b
   JOIN categories as c 
   ON b.category = c.id 
   JOIN users as u
   ON b.owner_id = u.id
   WHERE b.id=$1`, [req.params.id]);
    
    res.json(data.rows[0]);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.post('/edible-plants/', async(req, res) => {
  try {
    const data = await client.query(`INSERT INTO edible_plants (plantid, name, category, growzonenumber, wateringinterval, imageurl, edible, description, owner_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
    `, [req.body.plantid, req.body.name, req.body.category, req.body.growzonenumber, req.body.wateringinterval, req.body.imageurl, req.body.edible, req.body.description, 1]);
    
    res.json(data.rows[0]);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.put('/edible-plants/:id', async(req, res) => {
  try {
    const data = await client.query(`UPDATE edible_plants 
    SET plantid = $1, name = $2, category = $3, growzonenumber = $4, wateringinterval = $5, imageurl = $6, edible = $7, description = $8
    WHERE id = $9
    RETURNING * 
    `, [req.body.plantid, req.body.name, req.body.category, req.body.growzonenumber, req.body.wateringinterval, req.body.imageurl, req.body.edible, req.body.description, req.params.id]);
    
    res.json(data.rows[0]);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});


app.delete('/edible-plants/:id', async(req, res) => {
  try {
    const data = await client.query('DELETE from edible_plants WHERE id = $1;', [req.params.id]);
    
    res.json(data.rows[0]);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
