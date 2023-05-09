// Используя диструктуризацию получаю стандартный поток вывода
const { stdout } = process;

// Подключаю модули
const path = require('path');
const fs = require('fs');
const { constants, rm, readdir, access, mkdir} = require('node:fs/promises');

// Прописала пути для папки с исходными стилями и для бандла
const sourcePath = path.join(__dirname, 'styles');
const destinationPath = path.join(__dirname, 'project-dist');


async function buildSite (destinationPath) {
  // Нужно проверить есть ли папка project-dist, если есть удалить и пересоздать,
  // если нет просто создать
  await makeDelDir(destinationPath);

  // Скопировать ассеты
  await copyAssets();

  // Сшить все файты css и положить в одну папку
  // mergeCSS();

  // Обработать HTML шаблон, собрав по нему из компонентов новый файл и положить его в нужную папку
  // createNewHTML();
}

async function makeDelDir (destinationPath) {
  try {
    // Проверка, существует ли папка назначения, для этого для пути проверяем в функции
    // access состояние константы F_OK - флаг доступности файла
    // await - дожидается выполнения асинхронного кода, прежде, чем выполнять код дальше
    await access(destinationPath, constants.F_OK).then(
      () => {
        // Если access вернула promise, который перешёл в состояние 'успешно',
        // значит папка уже есть и нужно её удалить и создать заново.
        // Принудительно удаляю папку вместе с файлами
        // и создаю новую пустую после успешного удаления
        return rm(destinationPath, {recursive: true, force: true}).then(() => {
          return mkdir(destinationPath);
        });
      },

      () => {
        // Если access вернула promise, который перешёл в состояние 'не успешно',
        // значит папки нет и ее нужно создать
        return mkdir(destinationPath);
      },
    );
  } catch (err) {
    // Если ошибка - выводит её в stdout
    stdout.write(err.toString());
  }
}

async function copyAssets () {
  
}

buildSite(destinationPath).then(() => {});
