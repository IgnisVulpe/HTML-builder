// Используя диструктуризацию получаю стандартный поток вывода
const { stdout } = process;

// Подключаю модули
const path = require('path');
const fs = require('fs');
const { mkdir, copyFile, constants, rm, readdir, access } = require('node:fs/promises');
const {json} = require("stream/consumers");

// Прописала пути для папки с исходными стилями и для бандла
const sourcePath = path.join(__dirname, 'styles');
const destinationPath = path.join(__dirname, 'project-dist', 'bundle.css');

async function bundleCSS () {
  try {
    // Проверка, слущаествует ли бандл по пути назначения, для этого для пути проверяем в функции
    // access состояние константы F_OK - флаг доступности файла
    // await - дожидается выполнения асинхронного кода, прежде, чем выполнять код дальше
    await access(destinationPath, constants.F_OK).then(
      () => {
        // Если access вернула promise, который перешёл в состояние 'успешно',
        // значит бандл уже есть и нужно его удалить
        // Используем return чтобы вернуть promise из rm в await
        return rm(destinationPath, {force: true});
      },
      () => {},
    );
    // Открываю поток на запись в файл бандла
    const bundleWriteStream = fs.createWriteStream(destinationPath, 'utf-8');
    // Получаю массив имен исходных CSS файлов
    const sourceFilesNames = await readdir(sourcePath, 'utf-8');

    sourceFilesNames.forEach((fileName) => {
      const fileSourcePath = path.join(sourcePath, fileName);
      fs.stat(fileSourcePath, (err, stats) => {
        if (err) {
          throw err;
        }

        if ((stats.isFile()) && (path.parse(fileSourcePath).ext === '.css')) {
          const sourceFileReadStream = fs.createReadStream(fileSourcePath, 'utf-8');
          sourceFileReadStream.pipe(bundleWriteStream);
          sourceFileReadStream.on('data', () => {
            bundleWriteStream.write('\n');
          });
          stdout.write(`Файл ${fileName} добавлен\n`);
        } else {
          stdout.write(`Файл ${fileName} проигнорирован\n`);
        }
      });
    });

  } catch (err) {
    stdout.write(err.toString());
  }
}

bundleCSS().then(() => {});
