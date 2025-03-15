const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { generateCode, fixErrors, testConnection, setApiKey } = require('./openrouter-api');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const Store = require('electron-store');
const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    transparent: true,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    roundedCorners: true,
    hasShadow: true,
    icon: path.join(__dirname, '../assets/icon.png')
  });

  // Исправление бага с кнопками управления окном
  mainWindow.setMenuBarVisibility(false);
  
  // Устанавливаем прозрачность для всего окна
  mainWindow.setBackgroundColor('rgba(0, 0, 0, 0)');
  
  mainWindow.loadFile('src/index.html');
  
  // Открыть DevTools в режиме разработки для отладки
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  
  // Загружаем API ключ из хранилища
  const savedApiKey = store.get('apiKey');
  
  if (savedApiKey) {
    console.log('Загружен сохраненный API ключ');
    const { setApiKey } = require('./openrouter-api');
    setApiKey(savedApiKey);
  }
  
  // Проверяем соединение с API только если ключ установлен
  const { OPENROUTER_API_KEY, testConnection } = require('./openrouter-api');
  
  if (OPENROUTER_API_KEY) {
    testConnection().catch(error => {
      console.error('Ошибка соединения с API:', error);
    });
  } else {
    console.log('API ключ не настроен. Пропускаем проверку соединения.');
  }
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Обработка запросов на генерацию кода
ipcMain.handle('generate-code', async (event, prompt, model) => {
  try {
    console.log('Получен запрос на генерацию кода:', {
      promptLength: prompt.length,
      model
    });
    
    // Вызываем функцию генерации кода
    const result = await generateCode(prompt, model);
    
    // Проверяем, является ли результат объектом с ошибкой
    if (result && typeof result === 'object' && result.success === false) {
      console.error('Ошибка при генерации кода:', result.error);
      return result; // Возвращаем объект с ошибкой
    }
    
    // Иначе возвращаем успешный результат
    return {
      success: true,
      code: result.code || result // Поддерживаем оба формата ответа
    };
  } catch (error) {
    console.error('Ошибка при генерации кода:', error);
    return { 
      success: false, 
      error: error.message || 'Произошла неизвестная ошибка при генерации кода'
    };
  }
});

// Обработка запросов на исправление ошибок
ipcMain.handle('fix-code', async (event, code, errorMessage, model) => {
  try {
    console.log('Получен запрос на исправление кода:', {
      codeLength: code.length,
      errorMessageLength: errorMessage.length,
      model
    });
    
    // Вызываем функцию исправления ошибок
    const result = await fixErrors(code, errorMessage, model);
    
    // Проверяем, является ли результат объектом с ошибкой
    if (result && typeof result === 'object' && result.success === false) {
      return result; // Возвращаем объект с ошибкой
    }
    
    // Иначе возвращаем успешный результат
    return {
      success: true,
      code: result
    };
  } catch (error) {
    console.error('Ошибка при исправлении кода:', error);
    return { 
      success: false, 
      error: error.message || 'Произошла неизвестная ошибка при исправлении кода'
    };
  }
});

// Обработка запросов на запуск Python-кода
ipcMain.handle('run-python', async (event, code) => {
  try {
    // Создаем временный файл для Python-кода
    const tempDir = os.tmpdir();
    const fileName = `python_code_${uuidv4()}.py`;
    const filePath = path.join(tempDir, fileName);
    
    // Записываем код во временный файл
    fs.writeFileSync(filePath, code);
    
    // Запускаем Python-скрипт
    return new Promise((resolve, reject) => {
      exec(`python "${filePath}"`, (error, stdout, stderr) => {
        // Удаляем временный файл
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error('Ошибка при удалении временного файла:', err);
        }
        
        if (error) {
          resolve({ success: false, error: stderr || error.message });
        } else {
          resolve({ success: true, output: stdout });
        }
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Обработка запросов на выполнение команд
ipcMain.handle('run-command', async (event, command) => {
  try {
    console.log('Получен запрос на выполнение команды:', command);
    
    // Проверяем безопасность команды
    if (!isCommandSafe(command)) {
      return { 
        success: false, 
        error: 'Команда не разрешена по соображениям безопасности.' 
      };
    }
    
    // Проверяем, является ли это командой установки pip
    const isPipInstall = command.trim().toLowerCase().startsWith('pip install') || 
                         command.trim().toLowerCase().startsWith('pip3 install');
    
    if (isPipInstall) {
      // Извлекаем имя пакета для установки
      const packageName = command.split('install')[1].trim().split(' ')[0];
      
      // Выполняем команду через командную строку
      return new Promise((resolve) => {
        // Используем cmd /c для Windows или bash -c для Unix
        const cmdPrefix = process.platform === 'win32' ? 'cmd /c ' : '';
        exec(cmdPrefix + command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Ошибка при установке пакета ${packageName}:`, error);
            resolve({ 
              success: false, 
              error: stderr || error.message,
              packageName
            });
          } else {
            console.log(`Пакет ${packageName} успешно установлен`);
            resolve({ 
              success: true, 
              output: stdout,
              packageName
            });
          }
        });
      });
    }
    
    // Для других команд используем существующую логику
    return new Promise((resolve) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Ошибка при выполнении команды:', error);
          resolve({ success: false, error: stderr || error.message });
        } else {
          resolve({ success: true, output: stdout });
        }
      });
    });
  } catch (error) {
    console.error('Ошибка при выполнении команды:', error);
    return { success: false, error: error.message };
  }
});

// Функция для проверки безопасности команды
function isCommandSafe(command) {
  // Разрешаем только определенные команды
  const safeCommands = [
    'pip', 'pip3', 'python', 'python3', 'npm', 'node', 'dir', 'ls'
  ];
  
  // Проверяем, начинается ли команда с разрешенного префикса
  const commandStart = command.trim().split(' ')[0].toLowerCase();
  
  // Специальная обработка для команд pip
  if (commandStart === 'pip' || commandStart === 'pip3') {
    // Проверяем, что это команда установки
    const parts = command.trim().split(' ');
    if (parts.length >= 2 && (parts[1] === 'install' || parts[1] === 'uninstall' || parts[1] === 'list')) {
      return true; // Разрешаем pip install/uninstall/list
    }
    return false; // Запрещаем другие команды pip
  }
  
  return safeCommands.some(cmd => 
    commandStart === cmd || 
    commandStart === `"${cmd}"` || 
    commandStart === `'${cmd}'`
  );
}

// Обработчики для управления окном
ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Обработчик для сохранения файла
ipcMain.handle('save-file', async (event, content, extension) => {
  try {
    // Открываем диалог сохранения файла
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Сохранить файл',
      defaultPath: `code${extension}`,
      filters: [
        { name: 'Все файлы', extensions: ['*'] }
      ]
    });
    
    if (canceled) {
      return { success: false, error: 'Сохранение отменено' };
    }
    
    // Записываем содержимое в файл
    fs.writeFileSync(filePath, content);
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Ошибка при сохранении файла:', error);
    return { success: false, error: error.message };
  }
});

// Добавляем новый обработчик для установки Python-модулей
ipcMain.handle('install-python-module', async (event, moduleName) => {
  try {
    console.log(`Получен запрос на установку Python-модуля: ${moduleName}`);
    
    // Проверяем безопасность имени модуля
    if (!isModuleNameSafe(moduleName)) {
      return { 
        success: false, 
        error: 'Имя модуля содержит недопустимые символы', 
        packageName: moduleName 
      };
    }
    
    // Формируем команду установки
    const installCommand = process.platform === 'win32' 
      ? `cmd /c pip install ${moduleName}` 
      : `pip install ${moduleName}`;
    
    // Выполняем команду через системную оболочку
    return new Promise((resolve) => {
      exec(installCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`Ошибка при установке модуля ${moduleName}:`, error);
          
          // Пробуем альтернативный метод с pip3
          const altCommand = process.platform === 'win32' 
            ? `cmd /c pip3 install ${moduleName}` 
            : `pip3 install ${moduleName}`;
          
          exec(altCommand, (altError, altStdout, altStderr) => {
            if (altError) {
              // Исправляем синтаксическую ошибку в функции установки Python-модуля
              const userCommand = process.platform === 'win32' 
                ? `cmd /c pip install --user ${moduleName}` 
                : `pip install --user ${moduleName}`;

              exec(userCommand, (userError, userStdout, userStderr) => {
                if (userError) {
                  resolve({ 
                    success: false, 
                    error: `Не удалось установить модуль. Попробуйте выполнить команду вручную в командной строке:\n\npip install ${moduleName}\n\nИли:\n\npip3 install ${moduleName}\n\nОшибка: ${userStderr || userError.message}`, 
                    packageName: moduleName 
                  });
                } else {
                  resolve({ 
                    success: true, 
                    output: userStdout, 
                    packageName: moduleName,
                    method: 'pip install --user'
                  });
                }
              });
            } else {
              resolve({ 
                success: true, 
                output: altStdout, 
                packageName: moduleName,
                method: 'pip3 install'
              });
            }
          });
        } else {
          resolve({ 
            success: true, 
            output: stdout, 
            packageName: moduleName,
            method: 'pip install'
          });
        }
      });
    });
  } catch (error) {
    console.error('Ошибка при установке модуля:', error);
    return { success: false, error: error.message };
  }
});

// Обновляем обработчик для установки API ключа
ipcMain.handle('set-api-key', async (event, apiKey) => {
  try {
    console.log('Получен запрос на установку API ключа');
    
    // Устанавливаем API ключ в модуле API
    const { setApiKey } = require('./openrouter-api');
    const result = setApiKey(apiKey);
    
    // Сохраняем API ключ в хранилище
    if (result) {
      store.set('apiKey', apiKey);
      console.log('API ключ сохранен в хранилище');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка при установке API ключа:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});