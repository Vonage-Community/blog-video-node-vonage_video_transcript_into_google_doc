const express = require("express");
const app = express();
const PORT = 3000;

// Set up EJS as templating engine
app.set("view engine", "ejs");

// Serve static files (like CSS, JS) from a 'public' directory
app.use(express.static("public"));

// Example route for serving HTML using EJS
app.get("/", (req, res) => {
  res.render("index", { title: "Home Page" });
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
