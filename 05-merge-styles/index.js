// Используя диструктуризацию получаю стандартный поток вывода
const { stdout } = process;

// Подключаю модули
const path = require('path');
const { mkdir, copyFile, constants, rm, readdir, access } = require('node:fs/promises');

// Прописала пути(не путю^^) для исходой и новой папки
const sourcePath = path.join(__dirname, 'files');
const destinationPath = path.join(__dirname, 'files-copy');
