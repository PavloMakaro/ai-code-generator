const { contextBridge, ipcRenderer } = require('electron');

// Экспортируем API для доступа из renderer.js
contextBridge.exposeInMainWorld('electronAPI', {
  // Функция для генерации кода
  generateCode: (prompt, model) => ipcRenderer.invoke('generate-code', prompt, model),
  
  // Функция для исправления ошибок в коде
  fixCode: (code, errorMessage, model) => ipcRenderer.invoke('fix-code', code, errorMessage, model),
  
  // Функция для выполнения Python-кода
  runPython: (code) => ipcRenderer.invoke('run-python', code),
  
  // Функция для выполнения консольных команд
  runCommand: (command) => ipcRenderer.invoke('run-command', command),
  
  // Новая функция для сохранения файла
  saveFile: (content, extension) => ipcRenderer.invoke('save-file', content, extension),
  
  // Функции для управления окном
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  
  // Функция для установки Python-модуля
  installPythonModule: (moduleName) => ipcRenderer.invoke('install-python-module', moduleName),
  
  // Функция для установки API ключа
  setApiKey: (apiKey) => ipcRenderer.invoke('set-api-key', apiKey),
  
  // Функция для проверки соединения с API
  testApiConnection: () => ipcRenderer.invoke('test-api-connection')
});

// Экспортируем API для доступа из renderer.js
contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window')
});

// Добавляем обработчик для логирования ошибок
window.addEventListener('error', (event) => {
  console.error('Ошибка в renderer процессе:', event.error);
  ipcRenderer.send('renderer-error', {
    message: event.error.message,
    stack: event.error.stack
  });
});

// Добавляем обработчик для логирования необработанных промисов
window.addEventListener('unhandledrejection', (event) => {
  console.error('Необработанное отклонение промиса:', event.reason);
  ipcRenderer.send('unhandled-rejection', {
    message: event.reason.message,
    stack: event.reason.stack
  });
}); 