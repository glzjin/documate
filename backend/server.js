const express = require('express');
const handleUpload = require('./upload');
const handleAsk = require('./ask');

const app = express();
app.use(express.json());

app.post('/upload', handleUpload);
app.post('/ask', handleAsk);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 