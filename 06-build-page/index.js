// Используя диструктуризацию получаю стандартный поток вывода
// noinspection DuplicatedCode

const { stdout } = process;

// Подключаю модули
const path = require('path');
const fs = require('fs');
const { constants, rm, readdir, access, mkdir, copyFile} = require('node:fs/promises');

// Прописала пути для папки с исходными стилями и для бандла
// офигенная лесенка :)
const sourceCSSPath = path.join(__dirname, 'styles');
const sourceHTMLPath = path.join(__dirname, 'template.html');
const sourceAssetsPath = path.join(__dirname, 'assets');
const destinationCSSPath = path.join(__dirname, 'project-dist', 'style.css');
const destinationSitePath = path.join(__dirname, 'project-dist');
const destinationAssetsPath = path.join(destinationSitePath, 'assets');
const sourceElementsHTMLPath = path.join(__dirname, 'components');

async function buildSite (
  sourceCSSPath,
  sourceAssetsPath,
  destinationSitePath,
  destinationAssetsPath,
) {
  // Нужно проверить есть ли папка project-dist, если есть удалить и пересоздать,
  // если нет просто создать
  await makeDelDir (destinationSitePath);

  stdout.write('Папка для файлов сайта содана!\n');

  // Скопировать ассеты
  await copyAssets (
    sourceAssetsPath,
    destinationAssetsPath,
  );

  stdout.write('Ассетты успешно скопированы!\n');

  // Сшить все файты css и положить в одну папку
  await mergeCSS(
    sourceCSSPath,
    destinationCSSPath,
  );

  // Обработать HTML шаблон, собрав по нему из компонентов новый файл и положить его в нужную папку
  await createNewHTML(
    sourceHTMLPath,
    sourceElementsHTMLPath,
    destinationSitePath,
  );

  stdout.write('HTML файл успешно построен!\n');

  stdout.write('Работа успешно завершена!\n');
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

async function mergeCSS(sourcePath, destinationPath) {
  try {
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

async function createNewHTML(
  sourceHTMLPath,
  sourceElementsHTMLPath,
  destinationSitePath,
) {
  // Объект для хранения компанентов HTML файла
  // Каждый ключ объекта - это имя компонента, а значение - данные из файла компонента в виде строки
  const elementsHTML = {};
  // Код HTML шаблона, считанный из файла шаблона и хранящийся как строка
  let templateHTMLString = '';
  // Переменная для хранения итогового HTML файла ввиде строки, подготовленного к записи в файл
  let indexHTMLString = '';
  // Путь конкретно до файла `index.html`, включая имя файла.
  const indexHTMLPath = path.join(destinationSitePath, 'index.html');

  // В массив получаем имена компонентов HTML файла
  const elementsNames = await readdir(sourceElementsHTMLPath, 'utf-8');

  // Прохожу по именам компонентов из массива имент компонентов
  for (const name of elementsNames) {
    // Получаю путь до текущего компонента
    const elementPath = path.join(sourceElementsHTMLPath, name);

    // Создаю self-executed функцию чтобы вернуть и нее promise в котором я получаю HTML код
    // из текущего компонента используя поток чтения и его слушатели
    // Promise из self-executed функции обрабатываю в then в обработчике возврящая еще один
    // promise, который будет ждать await. В последнем промисе, преобразую массив строк из
    // компонента в строку и кладу ее в объект с компонентами, создавая новый ключ по имени
    // текущего компонента
    await (function () {
      return new Promise((resolve, reject) => {
        const elementReadStream = fs.createReadStream(elementPath,'utf-8');
        const elementStringArr = [];

        elementReadStream.on('data', (data) => {
          elementStringArr.push(data.toString());
        });

        elementReadStream.on('end', () => {
          resolve(elementStringArr);
        });

        elementReadStream.on('error', (err) => {
          reject(err);
        });
      });
    })().then(

      (elementStringArr) => {
        return new Promise((resolve) => {
          const onlyName = path.parse(elementPath).name;
          elementsHTML[onlyName] = elementStringArr.join('');
          resolve();
        });
      },

      (err) => {
        stdout.write(err.toString());
      },
    );
  }

  // используя await и self-executed функцию, считываю через поток чтения HTML шаблон, управляю
  // промисем через события потока чтения
  templateHTMLString = await (function () {
    return new Promise((resolve, reject) => {
      const templateHTMLReadStream = fs.createReadStream(sourceHTMLPath, 'utf-8');
      const templateHTMLDataStringArr = [];

      templateHTMLReadStream.on('data', (data) => {
        templateHTMLDataStringArr.push(data.toString());
      });

      templateHTMLReadStream.on('end', () => {
        resolve(templateHTMLDataStringArr.join(''));
      });

      templateHTMLReadStream.on('error', (err) => {
        reject(err);
      });
    });
  })();

  // Перекладываю шаблон HTML в виде строки в переменную для храения HTML кода итогового HTML файла
  indexHTMLString = templateHTMLString;

  // Получаю массив ключей из объекта с компонетами HTML кода
  // Ключ = Имя компонента
  const elementsKeys = Object.keys(elementsHTML);

  // Испульзая цикл, перебираю имена компонентов. Внутри цикла для каждого имени компонента
  // создаю регулярное выражение, далее использую метод replace и регулярное выражение,
  // заменяю все шаблонные строки на компоненты
  for (const elementName of elementsKeys) {
    const regularForComponent = new RegExp(`\\{\\{${elementName}\\}\\}`, 'g');
    indexHTMLString = indexHTMLString.replace(regularForComponent, elementsHTML[elementName]);
  }

  // Ожидаю сразу промис (оказывается так можно), в котором происходит запис итогового HTML кода в
  // итоговый HTML файл по нужному пути
  await new Promise((resolve, reject) => {
    const indexHTMLWriteStream = fs.createWriteStream(indexHTMLPath, 'utf-8');

    indexHTMLWriteStream.on('error', (err) => {
      stdout.write(err.toString());
      reject(err);
    });

    indexHTMLWriteStream.write(indexHTMLString);
    resolve();
  });
}

buildSite (
  sourceCSSPath,
  sourceAssetsPath,
  destinationSitePath,
  destinationAssetsPath,
).then(() => {});

//полный ждец :)
//Спасибо за проверку!