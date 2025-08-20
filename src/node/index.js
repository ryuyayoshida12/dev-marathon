const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//クロスオリジンの設定
const cors = require('cors');
app.use(cors({
  // 許可するオリジンを指定
  origin: process.env.CLIENT_ORIGIN,
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
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB, // PostgreSQLのデータベース名に置き換えてください
  password: process.env.POSTGRES_PASSWORD, // PostgreSQLのパスワードに置き換えてください
  port: 5432,
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

//--- 全顧客を取得するエンドポイント ---
app.get("/customers", async (req, res) => {
  try {
    const customerData = await pool.query("SELECT * FROM customers ORDER BY customer_id asc");
    res.send(customerData.rows);
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

app.get('/test', (req, res) => {
  res.send('Test OK');
});

//--- customer_idから顧客情報を取得するエンドポイント ---
app.get('/customer/:customerId', async (req, res) => {

  //パラメータからcustomerId取得
  const id = req.params.customerId; 

  //idから顧客を取得するSQL文作成
  const sql = "SELECT * FROM customers WHERE customer_id = $1";
  const value = [id];
  try {

    //DBからデータ取得
    const customerData = await pool.query(sql, value);

    //jsonでレスポンス
    res.json(customerData.rows[0] || {} );
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

//--- 顧客情報をセッションに保存するエンドポイント ---
app.post('/save-session', (req, res) => {
  try {
  req.session.customer = req.body;   // データをセッションに保存
  // console.log(req.session.customer);
  res.json({ success: true });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
});

//--- セッション情報を渡すエンドポイント ---
app.get('/get-session', (req, res) => {
  // console.log(req.session.customer);
  const sessionData = req.session.customer || {};
  res.json({ customer: sessionData });
});

//--- 顧客情報をDBに登録するエンドポイント ---
app.post("/add-customer", async (req, res) => {
  try {
    const { company_name, industry, contact, location } = req.body;
    const newCustomer = await pool.query(
      "INSERT INTO customers (company_name, industry, contact, location) VALUES ($1, $2, $3, $4) RETURNING *",
      [company_name, industry, contact, location]
    );
    res.json({ success: true, customer: newCustomer.rows[0] });
    delete req.session.customer;
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

//--- 顧客情報を更新するエンドポイント ---
app.post("/update-customer/:customerId", async (req, res)=> {

  const {company_name, industry, contact, location} = req.body;
  const id = req.params.customerId;
  const value = [company_name, industry, contact, location, id];

  //SQL文
  const sql = `
      UPDATE customers 
      SET company_name = $1,
          industry = $2,
          contact = $3,
          location = $4
      WHERE customer_id = $5;
      `
    try {
      await pool.query(sql, value);
      res.json({ success: true });
    } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});
//--- 顧客情報を削除するエンドポイント ---
app.delete("/customers/:customerId", async (req, res) => {

  //idを取得
  const id = req.params.customerId;

  //SQL文
  const sql = "DELETE FROM customers WHERE customer_id = $1";
  value = [id];

  try {
    const customerData = await pool.query(sql, value);

    res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.json({ success: false });
    }
});

app.use(express.static("public"));
