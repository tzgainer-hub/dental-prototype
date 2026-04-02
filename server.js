const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3456;

// Serve all static files from root
app.use(express.static(path.join(__dirname)));

// Default route serves index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Dental prototype running on port ${PORT}`);
});
