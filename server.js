// Citation Scope: Setting up Node app, connecting database, and implementing CRUD operations
// Date: 05/04/2025
// Originality: Adapted
// Source: https://github.com/osu-cs340-ecampus/nodejs-starter-app/

// Setup
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mysql = require("mysql2");
const bodyParser = require("body-parser");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

// database connection
const db = mysql.createPool({
  connectionLimit: process.env.DB_CONN_LIMIT,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// fetch donations by user_id
app.get("/donations/:user_id", (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).send("User ID is required.");
  }

  db.query(
    "SELECT * FROM donations WHERE donation_user_id = ? ORDER BY created_at DESC",
    [user_id], // Passing userId as a parameter to avoid SQL injection
    (err, results) => {
      if (err) {
        console.error("Error fetching donations:", err);
        return res.status(500).send("Failed to fetch donations.");
      }
      res.json(results);
    }
  );
});

// add donations to database
app.post("/donations", async (req, res) => {
  const user_id = req.body.user_id;
  const amount = req.body.amount;
  const category = req.body.category;

  console.log(req.body);

  db.query(
    "INSERT INTO donations (donation_user_id, amount, donation_category) VALUES (?, ?, ?)",
    [user_id, amount, category],
    (err, result) => {
      if (err) {
        res.status(418).send("Couldn't add to database");
      } else {
        res.send("Successful donation.");
      }
    }
  );
});

// fetch total-donation amount for year by user
app.get("/dashboard/total-donations/:user_id", (req, res) => {
  const { user_id } = req.params;

  const query = `
    SELECT COALESCE(SUM(amount), 0) AS total_donations
    FROM donations
    WHERE donation_user_id = ? AND YEAR(created_at) = YEAR(CURDATE())
  `;

  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error("Error fetching total donations:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch total donations." });
    }

    const totalDonations = results[0]?.total_donations || 0;
    res.json({ total_donations: totalDonations });
  });
});

// fetches recent transactions by user_id
app.get("/dashboard/recent-transactions/:user_id", (req, res) => {
  const { user_id } = req.params;

  // SQL query to fetch recent donations for the user
  const query = `
    SELECT donation_id, amount, payment_method, donation_category, created_at
    FROM donations
    WHERE donation_user_id = ? AND created_at >= CURDATE() - INTERVAL 1 MONTH
    ORDER BY created_at DESC
  `;

  // Execute the query
  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error("Error fetching recent transactions:", err);
      return res.status(500).json({
        error: "An error occurred while fetching recent transactions",
      });
    }

    // Send the results back to the client
    console.log(results);
    res.json(results);
  });
});

// listener
app.listen(8081, () => {
  console.log("server listening on port 8081");
});

module.exports.db = db;
