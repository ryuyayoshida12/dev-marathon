const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//クロスオリジンの設定
const cors = require('cors');
app.use(cors({
  // 許可するオリジンを指定
  origin: 'http://localhost',
  // Cookie 等の認証情報を許可 //sessionでデータの受け渡しに必要
  credentials: true,            
}));

//セッションの設定
const session = require("express-session");
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));


const port = 5062;


const { Pool } = require("pg");
const pool = new Pool({
  user: process.env.POSTGRES_USER, // PostgreSQLのユーザー名に置き換えてください
  host: "db",
  database: process.env.POSTGRES_DB, // PostgreSQLのデータベース名に置き換えてください
  password: process.env.POSTGRES_PASSWORD, // PostgreSQLのパスワードに置き換えてください
  port: 5432,
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get("/customers", async (req, res) => {
  try {
    const customerData = await pool.query("SELECT * FROM customers");
    res.send(customerData.rows);
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});




//確認画面へのデータ受け渡し用エンドポイント
app.post('/add-confirm', (req, res) => {
  req.session.customer = req.body;   // データをセッションに保存
  // req.session.save(err => {
  //   if (err) {
  //     return res.status(500).json({ error: 'Session save failed' });
  //   }
  // });
  console.log(req.session.customer);
  res.json({ success: true });
  // res.redirect('/add-confirm'); // 確認画面へリダイレクト
});

//確認画面へセッション情報を渡す
app.get('/add-confirm', (req, res) => {
  // res.json({ customer: req.session });
  console.log(req.session.customer);
  const sessionCustomer = req.session.customer || {};
  res.json({ customer: sessionCustomer });
});

//顧客情報をDBに登録するエンドポイント
app.post("/add-customer", async (req, res) => {
  try {
    const { companyName, industry, contact, location } = req.body;
    const newCustomer = await pool.query(
      "INSERT INTO customers (company_name, industry, contact, location) VALUES ($1, $2, $3, $4) RETURNING *",
      [companyName, industry, contact, location]
    );
    res.json({ success: true, customer: newCustomer.rows[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.use(express.static("public"));
