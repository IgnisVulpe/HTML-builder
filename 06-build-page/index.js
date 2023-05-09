// Используя диструктуризацию получаю стандартный поток вывода
const { stdout } = process;

// Подключаю модули
const path = require('path');
const fs = require('fs');
const { constants, rm, readdir, access, mkdir, copyFile} = require('node:fs/promises');

// Прописала пути для папки с исходными стилями и для бандла
const sourceCSSPath = path.join(__dirname, 'styles');
const sourceAssetsPath = path.join(__dirname, 'assets');
const destinationSitePath = path.join(__dirname, 'project-dist');
const destinationAssetsPath = path.join(destinationSitePath, 'assets');


async function buildSite (
  sourceCSSPath,
  sourceAssetsPath,
  destinationSitePath,
  destinationAssetsPath,
) {
  // Нужно проверить есть ли папка project-dist, если есть удалить и пересоздать,
  // если нет просто создать
  await makeDelDir (destinationSitePath);

  // Скопировать ассеты
  await copyAssets (
    sourceAssetsPath,
    destinationAssetsPath,
  );

  // Сшить все файты css и положить в одну папку
  // mergeCSS();

  // Обработать HTML шаблон, собрав по нему из компонентов новый файл и положить его в нужную папку
  // createNewHTML();
}

async function makeDelDir (destinationSitePath) {
  try {
    // Проверка, существует ли папка назначения, для этого для пути проверяем в функции
    // access состояние константы F_OK - флаг доступности файла
    // await - дожидается выполнения асинхронного кода, прежде, чем выполнять код дальше
    await access(destinationSitePath, constants.F_OK).then(
      () => {
        // Если access вернула promise, который перешёл в состояние 'успешно',
        // значит папка уже есть и нужно её удалить и создать заново.
        // Принудительно удаляю папку вместе с файлами
        // и создаю новую пустую после успешного удаления
        return rm(destinationSitePath, {recursive: true, force: true}).then(() => {
          return mkdir(destinationSitePath);
        });
      },

      () => {
        // Если access вернула promise, который перешёл в состояние 'не успешно',
        // значит папки нет и ее нужно создать
        return mkdir(destinationSitePath);
      },
    );
  } catch (err) {
    // Если ошибка - выводит её в stdout
    stdout.write(err.toString());
  }
}

// Создаю рекурсивную функцию для копирования папки вместе с подпапками и всеми файлами
async function copyAssets (
  sourceAssetsPath,
  destinationAssetsPath,
) {

  if (path.parse(sourceAssetsPath).name === 'assets') {
    await mkdir(destinationAssetsPath);
  }

  // Получила массив имен файлов и папок в текущей папке
  const currDirElem = await readdir(sourceAssetsPath, 'utf-8');
  // Перебираю все имена всех файлов и папок из массива имен файлов и папок
  for (const elem of currDirElem) {
    // Путь до папки или файла в текущей папке
    const elemSourcePath = path.join(sourceAssetsPath, elem);
    // Путь назначения для паки или файла в текущей папке
    const elemDestPath = path.join(destinationAssetsPath, elem);

    // Вызываю fs stat для получения информации о файле или папке в текущей папке,
    // в callback определяю, является ли текущий элемент файлом или папкой и исходя
    // из этого что делать дальше
    fs.stat(elemSourcePath, (err, stats) => {
      if (err) {
        throw err;
      }

      if (stats.isFile()) {
        // Если текущий элемент внутри текущей папки это файл, то копируем его в по пути назначения
        copyFile(elemSourcePath, elemDestPath);
      } else {
        mkdir(elemDestPath);
        copyAssets(elemSourcePath, elemDestPath);
      }
    });

  }
}

buildSite (
  sourceCSSPath,
  sourceAssetsPath,
  destinationSitePath,
  destinationAssetsPath,
).then(() => {});
