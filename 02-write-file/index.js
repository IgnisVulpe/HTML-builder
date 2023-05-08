// Используя диструктуризацию получаю стандартный поток вывода
const { stdin, stdout } = process;

// Подключаю модули
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, 'text.txt');
const writeStream = fs.createWriteStream(filePath, 'utf-8');

stdout.write('Введите текст и нажмите Enter для его записи в файл:\n');
stdout.write('Для выхода из программы нажмите комбинацию Ctrl + C ' +
  'или введите exit в поле для ввода.\n');

stdin.on('data', (data) => {
  if (data.toString().trim() === 'exit') {
    process.exit();
  } else {
    writeStream.write(data);
  }
});

process.on('SIGINT', () => {process.exit();});
process.on('exit', () => stdout.write('До свидания!'));