const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));

const port = 5062;

const cors = require("cors");
app.use(cors());

const { Pool } = require("pg");
const pool = new Pool({
  // user: "user_5062",
  // host: "db",
  // database: "crm_5062",
  // password: "pass_5062",
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

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
