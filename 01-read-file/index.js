console.log('Читаю файл:');

// Используя диструктуризацию получаю стандартный поток вывода
const { stdout } = process;

// Подключаем модули
const path = require('path');
const fs = require('fs');

function readFile () {
  const filePath = path.join(__dirname, 'text.txt');
  const readFileStream = fs.createReadStream(filePath, 'utf-8');

  readFileStream.pipe(stdout);
}

readFile();