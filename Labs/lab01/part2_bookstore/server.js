const http = require('http');
const fs = require('fs');
const path = require('path');

const routes = {
    '/': 'pages/index.html',
    '/about': 'pages/about.html',
    '/contact': 'pages/contact.html',
  };  

  function sendFile(res, filePath, statusCode = 200) {
    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(statusCode, { 'Content-Type': 'text/html' });
      res.end(data);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server Error');
    }
  }

const app = http.createServer((req, res) => {
  const { method, url } = req;

  if (method === 'GET') {
    const filePath = routes[url] || 'pages/404.html';
    const statusCode = routes[url] ? 200 : 404;

    sendFile(res, path.join(__dirname, filePath), statusCode);
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end(`Method ${method} not allowed`);
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});