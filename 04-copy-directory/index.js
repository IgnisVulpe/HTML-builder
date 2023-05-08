// Используя диструктуризацию получаю стандартный поток вывода
const { stdout } = process;

// Подключаю модули
const path = require('path');
const { mkdir, copyFile, constants, rm, readdir, access } = require('node:fs/promises');

// Прописала пути(не путю^^) для исходой и новой папки
const sourcePath = path.join(__dirname, 'files');
const destinationPath = path.join(__dirname, 'files-copy');

// Главная асинхронная функция
async function copyDir () {

  async function copyFiles() {
    // Получаю массив с именами файлов из исходной папки
    const filesNames = await readdir(sourcePath, 'utf-8');

    // В цикле перебираю имена файлов для создания пути исходного файла и пути назначения
    // Используя созданные пути, выполняю копирование
    filesNames.forEach((fileName) => {
      const fileSourcePath = path.join(sourcePath, fileName);
      const fileDestPath = path.join(destinationPath, fileName);
      copyFile(fileSourcePath, fileDestPath);
    });
    stdout.write('Копирование завершено');
  }

  // Попытка выпонить код
  try {
    // Проверка, слущаествует ли папка назначения, для этого для пути проверяем в функции
    // access состояние константы F_OK - флаг доступности файла
    // await - дожидается выполнения асинхронного кода, прежде, чем выполнять код дальше
    await access(destinationPath, constants.F_OK).then(
      () => {
        // Если access вернула promise, который перешёл в состояние 'успешно',
        // значит папка уже есть и нужно её удалить и сщздать заново.
        // Принудительно удаляю папку вместе с файлами
        // и создаю новую пустую после успешного удаления
        rm(destinationPath, {recursive: true, force: true}).then(() => {
          mkdir(destinationPath);
          copyFiles();
        });
      },

      () => {
        // Если access вернула promise, который перешёл в состояние 'не успешно',
        // значит папки нет и ее нужно создать
        mkdir(destinationPath);
        copyFiles();
      },
    );
  } catch (err) {
    // Если ошибка - выводит её в stdout
    stdout.write(err.toString());
  }
}

copyDir().then(() => {});
