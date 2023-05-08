// Используя диструктуризацию получаю стандартный поток вывода
const { stdout } = process;

// Подключаю модули
const path = require('path');
const fs = require('fs');

// Прописала путь до файлов
const filesPath = path.join(__dirname, 'secret-folder');

function getFilesInfo () {

  // Получила массив с именами файлов и папок из указанной папки и обрабатала его в callback
  fs.readdir(filesPath, 'utf-8', (err, filesNames) => {
    if (err) {
      throw err;
    }

    // Перебираю все файли и папки
    filesNames.forEach((element) => {
      const filePath = path.join(filesPath, element);

      // Получаю текущую информацию о файле или папке
      fs.stat(filePath, (err, stats) => {
        if (err) {
          throw err;
        }

        if (stats.isFile()) {
          const fileName = path.parse(filePath).name;
          const fileExt = path.parse(filePath).ext.slice(1);
          const fileSize = stats.size;

          stdout.write(`${fileName} - ${fileExt} - ${fileSize} bytes\n`);
          // console.log(path.parse(filePath));
        }
      });
    });

    // Получаю характеристики файлов

  });
}

getFilesInfo.bind(this)();
