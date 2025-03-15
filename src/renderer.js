// Получаем элементы DOM
const promptInput = document.getElementById('prompt-input');
const generateBtn = document.getElementById('generate-btn');
const errorInput = document.getElementById('error-input');
const statusMessage = document.getElementById('status-message');
const fileInput = document.getElementById('file');
const loadingContainer = document.getElementById('loading-container');
const messagesContainer = document.getElementById('messages');
const errorInputContainer = document.getElementById('error-input-container');
const submitErrorBtn = document.getElementById('submit-error-btn');
const cancelErrorBtn = document.getElementById('cancel-error-btn');
const closeBtn = document.getElementById('close-btn');
const minimizeBtn = document.getElementById('minimize-btn');
const maximizeBtn = document.getElementById('maximize-btn');
const sendIcon = document.getElementById('send-icon');
const miniLoader = document.getElementById('mini-loader');

// Добавляем элементы DOM для настроек
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const modalOverlay = document.getElementById('modal-overlay');
const closeSettingsBtn = document.getElementById('close-settings');
const cancelSettingsBtn = document.getElementById('cancel-settings');
const saveSettingsBtn = document.getElementById('save-settings');
const modelSelect = document.getElementById('model-select');
const themeSelect = document.getElementById('theme-select');

let currentCode = ''; // Хранит текущий сгенерированный код
let codeLanguage = ''; // Хранит язык текущего кода

// Настройки по умолчанию
let settings = {
  model: 'anthropic/claude-3-sonnet-20240229:free',
  theme: 'dark',
  apiKey: ''
};

// Функция для форматирования текста с поддержкой Markdown
function formatMarkdown(text) {
  // Заменяем переносы строк на <br>
  let formatted = text.replace(/\n/g, '<br>');
  
  // Форматирование кода (не в блоках кода)
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Форматирование жирного текста
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Форматирование курсива
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Форматирование ссылок
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  return formatted;
}

// Функция для определения типа кода
function detectCodeType(code) {
  code = code.trim();
  
  // Проверяем, является ли это консольной командой
  if (code.startsWith('pip ') || code.startsWith('pip3 ') || 
      code.startsWith('npm ') || code.startsWith('python ') || 
      code.startsWith('python3 ') || code.startsWith('node ') ||
      code.startsWith('dir ') || code.startsWith('ls ')) {
    return 'command';
  }
  
  // Проверяем язык программирования
  if (code.includes('def ') || code.includes('import ') || 
      code.includes('print(') || code.includes('class ') && !code.includes('{')) {
    return 'python';
  } else if (code.includes('function ') || code.includes('const ') || 
             code.includes('let ') || code.includes('var ') || 
             code.includes('console.log(')) {
    return 'javascript';
  } else if (code.includes('<html') || code.includes('<!doctype') || 
             (code.includes('<') && code.includes('</') && code.includes('>'))) {
    return 'html';
  } else if (code.includes('{') && code.includes(':') && code.includes(';') && 
             !code.includes('function ') && !code.includes('console.log(')) {
    return 'css';
  }
  
  // По умолчанию считаем, что это Python
  return 'python';
}

// Функция для добавления кнопок к блоку кода
function addRunButtonToCodeBlock(codeBlock, code, codeType) {
  // Добавляем кнопку запуска
  const runButton = document.createElement('button');
  runButton.className = 'code-run-button';
  runButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Запустить';
  
  // Добавляем кнопку копирования
  const copyButton = document.createElement('button');
  copyButton.className = 'code-copy-button';
  copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Копировать';
  
  // Добавляем кнопку сохранения
  const saveButton = document.createElement('button');
  saveButton.className = 'code-save-button';
  saveButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Сохранить';
  
  // Добавляем кнопку редактирования
  const editButton = document.createElement('button');
  editButton.className = 'code-edit-button';
  editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> Изменить';
  
  // Обработчик для кнопки сохранения
  saveButton.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      // Вызываем функцию сохранения файла
      const result = await window.electronAPI.saveFile(code, getFileExtension(codeType));
      
      if (result.success) {
        // Показываем уведомление об успешном сохранении
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.textContent = `Файл сохранен: ${result.filePath}`;
        
        document.body.appendChild(notification);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
          notification.classList.add('fade-out');
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 300);
        }, 2700);
      } else {
        // Показываем уведомление об ошибке
        const notification = document.createElement('div');
        notification.className = 'copy-notification error';
        notification.textContent = `Ошибка: ${result.error}`;
        
        document.body.appendChild(notification);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
          notification.classList.add('fade-out');
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 300);
        }, 2700);
      }
    } catch (error) {
      console.error('Ошибка при сохранении файла:', error);
      
      // Показываем уведомление об ошибке
      const notification = document.createElement('div');
      notification.className = 'copy-notification error';
      notification.textContent = `Ошибка: ${error.message}`;
      
      document.body.appendChild(notification);
      
      // Удаляем уведомление через 3 секунды
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 2700);
    }
  });
  
  // Обработчик для кнопки запуска
  runButton.addEventListener('click', async (event) => {
    // Предотвращаем всплытие события
    event.preventDefault();
    event.stopPropagation();
    
    // Сохраняем текущий код для возможного исправления
    currentCode = code;
    codeLanguage = codeType;
    
    // Проверяем, существует ли уже блок результата
    let resultBlock = codeBlock.nextElementSibling;
    if (!resultBlock || !resultBlock.classList.contains('code-result') && !resultBlock.classList.contains('error-block')) {
      // Создаем элемент для вывода результата
      resultBlock = document.createElement('div');
      resultBlock.className = 'code-result';
      // Добавляем блок результата после блока кода
      codeBlock.parentNode.insertBefore(resultBlock, codeBlock.nextSibling);
    }
    
    // Показываем индикатор загрузки в блоке результата
    resultBlock.innerHTML = `
      <div class="code-result-loading">
        <div class="mini-loader">
          <div class="bar1"></div>
          <div class="bar2"></div>
          <div class="bar3"></div>
          <div class="bar4"></div>
          <div class="bar5"></div>
          <div class="bar6"></div>
          <div class="bar7"></div>
          <div class="bar8"></div>
          <div class="bar9"></div>
          <div class="bar10"></div>
          <div class="bar11"></div>
          <div class="bar12"></div>
        </div>
        <div>Выполнение кода...</div>
      </div>
    `;
    
    try {
      let result;
      
      // Определяем тип кода и выполняем соответствующее действие
      if (codeType === 'command') {
        // Выполняем консольную команду
        result = await window.electronAPI.runCommand(code);
      } else if (codeType === 'python') {
        // Выполняем Python-код
        result = await window.electronAPI.runPython(code);
      } else {
        // Для других типов кода показываем сообщение
        result = { 
          success: false, 
          error: `Выполнение кода типа "${codeType}" пока не поддерживается.` 
        };
      }
      
      // Отображаем результат
      displayCodeResult(resultBlock, result);
      
      // Прокручиваем к результату
      setTimeout(() => {
        resultBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
      
    } catch (error) {
      console.error('Ошибка при выполнении кода:', error);
      
      // Отображаем ошибку
      displayCodeResult(resultBlock, { 
        success: false, 
        error: error.message 
      });
    }
  });
  
  // Обработчик для кнопки копирования
  copyButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    navigator.clipboard.writeText(code).then(() => {
      // Показываем уведомление о копировании
      const notification = document.createElement('div');
      notification.className = 'copy-notification';
      notification.textContent = 'Код скопирован';
      
      document.body.appendChild(notification);
      
      // Удаляем уведомление через 2 секунды
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 1700);
    }).catch(err => {
      console.error('Ошибка при копировании:', err);
    });
  });
  
  // Обработчик для кнопки редактирования
  editButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Заполняем поле ввода кодом для редактирования
    promptInput.value = `Отредактируй этот код: \n\n\`\`\`\n${code}\n\`\`\`\n\nИзменения, которые нужно внести:`;
    
    // Фокусируемся на поле ввода
    promptInput.focus();
    
    // Прокручиваем к полю ввода
    promptInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Устанавливаем курсор в конец текста
    promptInput.setSelectionRange(promptInput.value.length, promptInput.value.length);
  });
  
  // Добавляем кнопки к блоку кода
  codeBlock.appendChild(runButton);
  codeBlock.appendChild(copyButton);
  codeBlock.appendChild(saveButton);
  codeBlock.appendChild(editButton);
}

// Обновляем функцию добавления сообщения
function addMessage(content, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'system'}`;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  
  // Если это пользовательское сообщение, просто добавляем текст
  if (isUser) {
    messageContent.textContent = content;
  } else {
    // Если это ответ системы, обрабатываем форматирование
    
    // Проверяем, содержит ли ответ блоки кода
    if (content.includes('```')) {
      // Разбиваем на части: текст и блоки кода
      const parts = content.split(/(```[\s\S]*?```)/g);
      
      for (const part of parts) {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Это блок кода
          const codeContent = part.slice(3, -3).trim();
          
          // Определяем тип кода
          const codeType = detectCodeType(codeContent);
          
          // Извлекаем сам код (без первой строки, если она содержит название языка)
          const codeLines = codeContent.split('\n');
          let actualCode;
          
          if (codeLines[0].trim().match(/^[a-zA-Z0-9#.+]+$/)) {
            // Первая строка похожа на указание языка
            actualCode = codeLines.slice(1).join('\n');
          } else {
            actualCode = codeContent;
          }
          
          // Сохраняем код для использования в других функциях
          currentCode = actualCode;
          
          // Создаем элемент pre для отображения кода
          const pre = document.createElement('pre');
          pre.className = 'code-block';
          
          // Создаем элемент code для подсветки синтаксиса
          const code = document.createElement('code');
          code.textContent = actualCode;
          code.className = `language-${codeType}`;
          
          pre.appendChild(code);
          
          // Добавляем кнопки к блоку кода
          addRunButtonToCodeBlock(pre, actualCode, codeType);
          
          messageContent.appendChild(pre);
        } else if (part.trim()) {
          // Это обычный текст
          const textDiv = document.createElement('div');
          textDiv.innerHTML = formatMarkdown(part);
          messageContent.appendChild(textDiv);
        }
      }
    } else {
      // Нет блоков кода, просто форматируем текст
      messageContent.innerHTML = formatMarkdown(content);
    }
  }
  
  // Если это ответ системы и содержит сообщение об ошибке
  if (!isUser && content.includes('Ошибка:')) {
    // Создаем блок с ошибкой
    const errorBlock = document.createElement('div');
    errorBlock.className = 'error-block';
    
    // Извлекаем текст ошибки
    const errorMatch = content.match(/Ошибка:(.*?)(?:\n\n|$)/s);
    const errorMessage = errorMatch ? errorMatch[1].trim() : 'Неизвестная ошибка';
    
    // Добавляем текст ошибки
    const errorOutput = document.createElement('pre');
    errorOutput.className = 'error-output';
    errorOutput.textContent = errorMessage;
    
    errorBlock.appendChild(errorOutput);
    
    // Добавляем кнопку исправления ошибок
    addFixErrorButton(errorBlock, errorMessage);
    
    // Добавляем блок с ошибкой в сообщение
    messageContent.appendChild(errorBlock);
  }
  
  messageDiv.appendChild(messageContent);
  messagesContainer.appendChild(messageDiv);
  
  // Прокручиваем контейнер сообщений вниз с небольшой задержкой
  setTimeout(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 100);
}

// Загружаем настройки при запуске
function loadSettings() {
  const savedSettings = localStorage.getItem('aiCodeGeneratorSettings');
  if (savedSettings) {
    try {
      const parsedSettings = JSON.parse(savedSettings);
      settings = { ...settings, ...parsedSettings };
      
      // Применяем загруженные настройки
      if (settings.model) {
        modelSelect.value = settings.model;
      }
      
      if (settings.theme) {
        document.getElementById('theme-select').value = settings.theme;
        applyTheme(settings.theme);
      }
      
      // Устанавливаем API ключ, если он сохранен
      if (settings.apiKey) {
        document.getElementById('api-key-input').value = settings.apiKey;
        
        // Отправляем API ключ в main процесс
        window.electronAPI.setApiKey(settings.apiKey);
      }
    } catch (error) {
      console.error('Ошибка при загрузке настроек:', error);
    }
  }
}

// Сохраняем настройки в localStorage
async function saveSettings() {
  const apiKey = document.getElementById('api-key-input').value;
  const model = modelSelect.value;
  const theme = themeSelect.value;
  
  // Сохраняем настройки
  settings = {
    model,
    theme,
    apiKey
  };
  
  console.log('Сохраняем настройки:', {
    model,
    theme,
    apiKey: apiKey ? '***' : 'не задан'
  });
  
  // Отправляем API ключ в main процесс
  try {
    const result = await window.electronAPI.setApiKey(apiKey);
    
    if (result.success) {
      console.log('API ключ успешно установлен');
      
      // Проверяем соединение с API
      const connectionResult = await window.electronAPI.testApiConnection();
      
      if (connectionResult.success) {
        showNotification('Настройки сохранены. Соединение с API установлено успешно.', 'success');
      } else {
        showNotification('Настройки сохранены, но соединение с API не установлено. Проверьте ваш API ключ.', 'warning');
      }
    } else {
      showNotification('Ошибка при установке API ключа: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('Ошибка при сохранении API ключа:', error);
    showNotification('Ошибка при сохранении настроек', 'error');
  }
  
  // Применяем тему
  applyTheme(theme);
  
  // Закрываем модальное окно
  closeSettingsModal();
}

// Применяем тему
function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  } else if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  } else if (theme === 'system') {
    // Определяем системную тему
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }
}

// Открываем модальное окно настроек
function openSettingsModal() {
  settingsModal.classList.add('active');
  modalOverlay.classList.add('active');
}

// Закрываем модальное окно настроек
function closeSettingsModal() {
  settingsModal.classList.remove('active');
  modalOverlay.classList.remove('active');
}

// Обработчики событий для модального окна настроек
settingsBtn.addEventListener('click', openSettingsModal);
closeSettingsBtn.addEventListener('click', closeSettingsModal);
cancelSettingsBtn.addEventListener('click', closeSettingsModal);
saveSettingsBtn.addEventListener('click', saveSettings);
modalOverlay.addEventListener('click', closeSettingsModal);

// Загружаем настройки при запуске
loadSettings();

// Обновляем функцию генерации кода для использования выбранной модели
async function generateCodeWithSettings(prompt) {
  try {
    return await window.electronAPI.generateCode(prompt, settings.model);
  } catch (error) {
    throw error;
  }
}

// Функция для переключения состояния интерфейса при генерации
function toggleLoadingState(isLoading) {
  const loadingIndicator = document.getElementById('loading-indicator');
  const voiceInputWrapper = document.getElementById('voice-input-wrapper');
  const promptInput = document.getElementById('prompt-input');
  
  if (isLoading) {
    // Переключаем видимость элементов
    loadingIndicator.classList.add('action-visible');
    
    voiceInputWrapper.classList.remove('action-visible');
    voiceInputWrapper.classList.add('action-hidden');
    
    // Делаем поле ввода неактивным
    promptInput.disabled = true;
    promptInput.style.opacity = '0.7';
    
    // Добавляем пульсирующий эффект для поля ввода
    document.querySelector('.messageBox').classList.add('loading-pulse');
  } else {
    // Возвращаем исходное состояние
    loadingIndicator.classList.remove('action-visible');
    
    voiceInputWrapper.classList.remove('action-hidden');
    voiceInputWrapper.classList.add('action-visible');
    
    // Возвращаем активность поля ввода
    promptInput.disabled = false;
    promptInput.style.opacity = '1';
    
    // Убираем пульсирующий эффект
    document.querySelector('.messageBox').classList.remove('loading-pulse');
  }
}

// Обновляем обработчик события для отправки через Enter
promptInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    
    const prompt = promptInput.value.trim();
    if (prompt === '') return;
    
    // Имитируем клик по кнопке генерации
    generateCode();
  }
});

// Выносим логику генерации кода в отдельную функцию
async function generateCode() {
  const prompt = promptInput.value.trim();
  
  if (prompt === '') return;
  
  // Добавляем сообщение пользователя в чат
  addMessage(prompt, 'user');
  
  // Очищаем поле ввода
  promptInput.value = '';
  
  // Показываем состояние загрузки
  toggleLoadingState(true);
  
  try {
    // Получаем выбранную модель
    const model = modelSelect.value;
    
    // Показываем уведомление
    showNotification('Генерация кода...', 'info');
    
    // Отправляем запрос на генерацию кода
    const response = await window.electronAPI.generateCode(prompt, model);
    
    // Скрываем состояние загрузки
    toggleLoadingState(false);
    
    if (response.success) {
      // Добавляем ответ в чат
      addMessage(response.code);
      
      // Прокручиваем к новому сообщению
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    } else {
      // Показываем сообщение об ошибке
      addMessage(`Ошибка при генерации кода: ${response.error}`);
      
      // Показываем уведомление об ошибке
      showNotification(`Ошибка: ${response.error}`, 'error');
    }
  } catch (error) {
    console.error('Ошибка при генерации кода:', error);
    
    // Скрываем состояние загрузки
    toggleLoadingState(false);
    
    // Показываем сообщение об ошибке
    addMessage(`Произошла ошибка: ${error.message}`);
    
    // Показываем уведомление об ошибке
    showNotification(`Ошибка: ${error.message}`, 'error');
  }
}

// Обновляем обработчик события для кнопки генерации (если она все еще нужна)
if (generateBtn) {
  generateBtn.addEventListener('click', generateCode);
}

// Функция для отображения анимации загрузки
function showLoading() {
  loadingContainer.style.display = 'flex';
}

// Функция для скрытия анимации загрузки
function hideLoading() {
  loadingContainer.style.display = 'none';
}

// Функция для переключения мини-лоадера
function toggleMiniLoader(show) {
  if (show) {
    sendIcon.style.display = 'none';
    miniLoader.style.display = 'block';
  } else {
    sendIcon.style.display = 'block';
    miniLoader.style.display = 'none';
  }
}

// Обновляем функцию исправления ошибок для использования выбранной модели
async function fixCodeWithSettings(code, errorMessage) {
  try {
    return await window.electronAPI.fixCode(code, errorMessage, settings.model);
  } catch (error) {
    throw error;
  }
}

// Обработчик для исправления ошибок
submitErrorBtn.addEventListener('click', async () => {
  const errorMessage = errorInput.value.trim();
  
  if (!errorMessage) {
    addMessage('Пожалуйста, опишите ошибку', false);
    return;
  }
  
  // Скрываем поле ввода ошибки
  errorInputContainer.style.display = 'none';
  
  // Показываем анимацию загрузки
  loadingContainer.style.display = 'flex';
  
  try {
    // Используем настройки для исправления кода
    const result = await fixCodeWithSettings(currentCode, errorMessage);
    
    if (result.success) {
      // Добавляем ответ в чат
      addMessage(`Исправленный код:\n\n${result.code}`);
    } else {
      addMessage(`Произошла ошибка: ${result.error}`);
    }
  } catch (error) {
    console.error('Ошибка при исправлении кода:', error);
    addMessage(`Произошла ошибка: ${error.message}`);
  } finally {
    // Скрываем анимацию загрузки
    loadingContainer.style.display = 'none';
  }
});

// Обработчик для отмены исправления
cancelErrorBtn.addEventListener('click', () => {
  errorInputContainer.style.display = 'none';
  errorInput.value = '';
});

// Обработчик для копирования кода
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(currentCode)
    .then(() => {
      addMessage('Код скопирован в буфер обмена!', false);
    })
    .catch(err => {
      addMessage(`Не удалось скопировать: ${err}`, false);
    });
});

// Обновляем обработчик события для кнопки запуска
runBtn.addEventListener('click', async (event) => {
  // Предотвращаем всплытие события
  event.preventDefault();
  event.stopPropagation();
  
  if (!currentCode.trim()) {
    alert('Нет кода для запуска');
    return;
  }
  
  try {
    // Определяем тип кода
    const codeType = detectCodeType(currentCode);
    console.log('Запуск кода типа:', codeType);
    
    // Показываем индикатор загрузки
    const resultBlock = document.createElement('div');
    resultBlock.className = 'code-result';
    resultBlock.innerHTML = '<div class="code-result-loading">Выполнение...</div>';
    
    // Добавляем блок результата после кнопки
    codeDisplay.appendChild(resultBlock);
    
    let result;
    
    if (codeType === 'command') {
      // Выполняем консольную команду
      result = await window.electronAPI.runCommand(currentCode);
    } else if (codeType === 'python') {
      // Выполняем Python-код
      result = await window.electronAPI.runPython(currentCode);
    } else if (codeType === 'javascript') {
      // Выполняем JavaScript-код
      try {
        const output = [];
        // Переопределяем console.log для перехвата вывода
        const originalLog = console.log;
        console.log = (...args) => {
          output.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
          originalLog(...args);
        };
        
        // Выполняем код
        eval(currentCode);
        
        // Восстанавливаем console.log
        console.log = originalLog;
        
        result = { success: true, output: output.join('\n') || '(Нет вывода)' };
      } catch (error) {
        result = { success: false, error: error.message };
      }
    } else if (codeType === 'html') {
      // Для HTML открываем новое окно
      const newWindow = window.open('', '_blank', 'width=800,height=600');
      newWindow.document.write(currentCode);
      newWindow.document.close();
      
      result = { success: true, output: 'HTML-код открыт в новом окне' };
    } else {
      result = { success: false, error: `Запуск кода типа ${codeType} не поддерживается` };
    }
    
    console.log('Результат выполнения:', result);
    
    // Отображаем результат
    if (result.success) {
      resultBlock.innerHTML = `
        <div class="code-result-header success">Результат выполнения</div>
        <pre class="code-result-output">${result.output || '(Нет вывода)'}</pre>
      `;
    } else {
      resultBlock.innerHTML = `
        <div class="code-result-header error">Ошибка</div>
        <pre class="code-result-output error">${result.error}</pre>
      `;
    }
    
    // Прокручиваем к результату
    setTimeout(() => {
      resultBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
  } catch (error) {
    console.error('Ошибка при выполнении кода:', error);
    alert(`Ошибка при выполнении кода: ${error.message}`);
  }
});

// Добавляем обработчик для отладки
promptInput.addEventListener('keyup', function(event) {
  console.log('Клавиша отпущена:', event.key);
});

// Обработчик для загрузки файла
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      promptInput.value = `Анализируй этот код и предложи улучшения: ${content}`;
    };
    reader.readAsText(file);
  }
});

// Функция для отображения статусных сообщений
function setStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-${type}`;
  
  if (type !== 'loading') {
    setTimeout(() => {
      statusMessage.textContent = '';
      statusMessage.className = '';
    }, 5000);
  }
}

// Обновляем функцию настройки кнопок управления окном
function setupWindowControls() {
  console.log('Настройка кнопок управления окном');
  
  // Получаем кнопки управления окном
  const closeBtn = document.getElementById('close-btn');
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  
  // Проверяем наличие кнопок
  if (!closeBtn || !minimizeBtn || !maximizeBtn) {
    console.error('Не найдены кнопки управления окном');
    return;
  }
  
  // Проверяем наличие API
  if (!window.windowControls) {
    console.error('API управления окном не доступен');
    return;
  }
  
  // Добавляем обработчики событий
  closeBtn.addEventListener('click', () => {
    console.log('Нажата кнопка закрытия');
    window.windowControls.close();
  });
  
  minimizeBtn.addEventListener('click', () => {
    console.log('Нажата кнопка минимизации');
    window.windowControls.minimize();
  });
  
  maximizeBtn.addEventListener('click', () => {
    console.log('Нажата кнопка максимизации');
    window.windowControls.maximize();
  });
  
  console.log('Кнопки управления окном настроены');
}

// Вызываем функцию после загрузки DOM
document.addEventListener('DOMContentLoaded', setupWindowControls);

// Также вызываем функцию сразу, если DOM уже загружен
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  setupWindowControls();
}

// Функция для получения информации о модели
function getModelInfo(modelId) {
  const modelInfo = {
    // Claude
    'anthropic/claude-3-opus-20240229:free': { name: 'Claude 3 Opus', context: '200K токенов' },
    'anthropic/claude-3-sonnet-20240229:free': { name: 'Claude 3 Sonnet', context: '200K токенов' },
    'anthropic/claude-3-haiku-20240307:free': { name: 'Claude 3 Haiku', context: '200K токенов' },
    
    // Google
    'google/gemini-2.0-pro-exp-02-05:free': { name: 'Gemini 2.0 Pro', context: '32K токенов' },
    'google/gemini-2.0-flash-thinking-exp-1219:free': { name: 'Gemini 2.0 Flash Thinking', context: '32K токенов' },
    'google/gemini-2.0-flash-lite-preview-02-05:free': { name: 'Gemini 2.0 Flash Lite', context: '32K токенов' },
    
    // Meta
    'meta-llama/llama-3.3-70b-instruct:free': { name: 'Llama 3.3 70B', context: '128K токенов' },
    
    // Mistral
    'mistralai/mistral-small-24b-instruct-2501:free': { name: 'Mistral Small 24B', context: '32K токенов' },
    
    // DeepSeek
    'deepseek/deepseek-r1:free': { name: 'DeepSeek R1', context: '32K токенов' },
    'deepseek/deepseek-chat:free': { name: 'DeepSeek Chat', context: '32K токенов' }
  };
  
  return modelInfo[modelId] || { name: 'Неизвестная модель', context: 'Неизвестно' };
}

// Обновляем функцию для отображения информации о текущей модели
function updateModelInfo() {
  const modelSelect = document.getElementById('model-select');
  const modelInfo = document.getElementById('model-info');
  
  if (!modelSelect || !modelInfo) return;
  
  const selectedOption = modelSelect.options[modelSelect.selectedIndex];
  const modelName = selectedOption.text;
  
  // Получаем информацию о модели
  let modelDescription = '';
  
  if (modelName.includes('Claude')) {
    modelDescription = 'Мощная модель для генерации кода с хорошим пониманием контекста';
  } else if (modelName.includes('Gemini')) {
    modelDescription = 'Быстрая модель от Google с хорошей поддержкой кода';
  } else if (modelName.includes('Llama')) {
    modelDescription = 'Открытая модель с хорошей производительностью';
  } else if (modelName.includes('Mistral')) {
    modelDescription = 'Эффективная модель для генерации кода';
  } else if (modelName.includes('DeepSeek')) {
    modelDescription = 'Специализированная модель для программирования';
  }
  
  modelInfo.textContent = modelDescription ? `${modelName} - ${modelDescription}` : modelName;
}

// Вызываем функцию при загрузке страницы и при изменении модели
document.addEventListener('DOMContentLoaded', updateModelInfo);
modelSelect.addEventListener('change', () => {
  updateModelInfo();
});

// Функция для определения языка программирования из блока кода
function detectLanguage(codeBlock) {
  const firstLine = codeBlock.trim().split('\n')[0].toLowerCase();
  
  // Проверяем, является ли это консольной командой
  if (firstLine.startsWith('pip ') || firstLine.startsWith('pip3 ') || 
      firstLine.startsWith('npm ') || firstLine.startsWith('python ') || 
      firstLine.startsWith('python3 ') || firstLine.startsWith('node ') ||
      firstLine.startsWith('dir ') || firstLine.startsWith('ls ')) {
    return 'shell';
  }
  
  if (firstLine.includes('python') || firstLine.includes('.py') || 
      codeBlock.includes('def ') || codeBlock.includes('import ')) {
    return 'python';
  } else if (firstLine.includes('javascript') || firstLine.includes('.js') || 
             codeBlock.includes('function ') || codeBlock.includes('const ') || 
             codeBlock.includes('let ') || codeBlock.includes('var ')) {
    return 'javascript';
  } else if (firstLine.includes('html') || firstLine.includes('.html') || 
             codeBlock.includes('<html') || codeBlock.includes('<!doctype')) {
    return 'html';
  } else if (firstLine.includes('css') || firstLine.includes('.css') || 
             codeBlock.includes('{') && codeBlock.includes(':') && codeBlock.includes(';')) {
    return 'css';
  } else if (firstLine.includes('java') || firstLine.includes('.java') || 
             codeBlock.includes('public class ') || codeBlock.includes('private class ')) {
    return 'java';
  } else if (firstLine.includes('c++') || firstLine.includes('.cpp') || 
             codeBlock.includes('#include <iostream>')) {
    return 'cpp';
  } else if (firstLine.includes('c#') || firstLine.includes('.cs') || 
             codeBlock.includes('namespace ') || codeBlock.includes('using System;')) {
    return 'csharp';
  } else if (firstLine.includes('php') || firstLine.includes('.php') || 
             codeBlock.includes('<?php')) {
    return 'php';
  }
  
  // Если не удалось определить язык, возвращаем plaintext
  return 'plaintext';
}

// Альтернативный обработчик для поля ввода
document.addEventListener('DOMContentLoaded', function() {
  const inputField = document.getElementById('prompt-input');
  const sendButton = document.getElementById('generate-btn');
  
  if (inputField && sendButton) {
    // Удаляем старый обработчик, если он есть
    const oldClone = inputField.cloneNode(true);
    inputField.parentNode.replaceChild(oldClone, inputField);
    
    // Добавляем новый обработчик
    oldClone.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        console.log('Enter нажат (альтернативный обработчик)');
        if (this.value.trim() !== '') {
          sendButton.click();
        }
      }
    });
    
    // Обновляем ссылку на элемент
    window.promptInput = oldClone;
  }
});

// Функция для добавления кнопки исправления ошибок к блоку с ошибкой
function addFixErrorButton(errorBlock, errorMessage) {
  // Создаем заголовок с кнопкой
  const errorHeader = document.createElement('div');
  errorHeader.className = 'error-header';
  
  // Добавляем текст ошибки
  const errorTitle = document.createElement('div');
  errorTitle.textContent = 'Ошибка';
  errorHeader.appendChild(errorTitle);
  
  // Добавляем кнопку исправления
  const fixButton = document.createElement('button');
  fixButton.className = 'fix-error-button';
  fixButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> Отправить AI';
  
  // Добавляем обработчик события для кнопки
  fixButton.addEventListener('click', async () => {
    // Проверяем, есть ли код для исправления
    if (!currentCode) {
      alert('Нет кода для исправления');
      return;
    }
    
    // Показываем индикатор загрузки
    loadingContainer.style.display = 'flex';
    
    try {
      // Отправляем запрос на исправление кода с текущим кодом и сообщением об ошибке
      const response = await window.electronAPI.fixCode(currentCode, errorMessage, settings.model);
      
      // Скрываем индикатор загрузки
      loadingContainer.style.display = 'none';
      
      if (response && response.success) {
        // Добавляем исправленный код в чат
        addMessage(`Исправление ошибки:\n\n${response.code}`);
        
        // Прокручиваем к новому сообщению
        setTimeout(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
      } else {
        // Показываем сообщение об ошибке
        const errorMsg = response && response.error 
          ? response.error 
          : 'Не удалось получить ответ от ИИ';
        
        addMessage(`Ошибка при исправлении кода: ${errorMsg}`);
      }
    } catch (error) {
      // Скрываем индикатор загрузки
      loadingContainer.style.display = 'none';
      
      // Показываем сообщение об ошибке
      addMessage(`Произошла ошибка: ${error.message}`);
    }
  });
  
  errorHeader.appendChild(fixButton);
  
  // Добавляем заголовок к блоку с ошибкой
  errorBlock.insertBefore(errorHeader, errorBlock.firstChild);
}

// Функция для отображения информации об ошибке
function displayCodeResult(resultBlock, result) {
  if (result.success) {
    resultBlock.innerHTML = `
      <div class="code-result-header success">Результат выполнения</div>
      <pre class="code-result-output">${result.output || '(Нет вывода)'}</pre>
    `;
  } else {
    // Проверяем, связана ли ошибка с pip
    const isPipError = result.error.includes('pip') || 
                       result.error.includes('SyntaxError') && 
                       (result.error.includes('install') || result.error.includes('uninstall'));
    
    resultBlock.innerHTML = `
      <div class="code-result-header error">Ошибка</div>
      <pre class="code-result-error">${result.error}</pre>
      <button class="fix-error-btn">Исправить ИИ</button>
    `;
    
    // Если ошибка связана с pip, добавляем подсказку
    if (isPipError) {
      const helpDiv = document.createElement('div');
      helpDiv.className = 'pip-install-help';
      helpDiv.innerHTML = `
        <h4>Как установить Python-модули</h4>
        <p>Для установки модулей Python используйте команду в отдельном блоке кода с типом <code>command</code>:</p>
        <pre><code>pip install имя_пакета</code></pre>
        <p>Если возникают проблемы, попробуйте:</p>
        <ul>
          <li>Использовать <code>pip3</code> вместо <code>pip</code></li>
          <li>Добавить флаг <code>--user</code>: <code>pip install --user имя_пакета</code></li>
          <li>Запустить командную строку от имени администратора</li>
        </ul>
      `;
      resultBlock.appendChild(helpDiv);
    }
    
    // Добавляем обработчик для кнопки исправления ошибки
    const fixButton = resultBlock.querySelector('.fix-error-btn');
    if (fixButton) {
      fixButton.addEventListener('click', () => {
        showErrorFixInput(code, result.error);
      });
    }
  }
}

// Функция для определения расширения файла по типу кода
function getFileExtension(codeType) {
  switch (codeType) {
    case 'python':
      return '.py';
    case 'javascript':
      return '.js';
    case 'html':
      return '.html';
    case 'css':
      return '.css';
    case 'java':
      return '.java';
    case 'c':
      return '.c';
    case 'cpp':
      return '.cpp';
    case 'csharp':
      return '.cs';
    case 'php':
      return '.php';
    case 'ruby':
      return '.rb';
    case 'go':
      return '.go';
    case 'rust':
      return '.rs';
    case 'typescript':
      return '.ts';
    case 'swift':
      return '.swift';
    case 'kotlin':
      return '.kt';
    case 'sql':
      return '.sql';
    default:
      return '.txt';
  }
}

// Обновляем функцию для добавления блока кода
function addCodeBlock(message, codeType) {
  // Создаем контейнер для блока кода
  const codeDisplay = document.createElement('div');
  codeDisplay.className = 'code-display';
  
  // Создаем контейнер для кнопок
  const codeButtons = document.createElement('div');
  codeButtons.className = 'code-buttons';
  
  // Создаем блок с кодом
  const codeBlock = document.createElement('pre');
  const codeElement = document.createElement('code');
  codeElement.className = codeType || '';
  codeElement.textContent = message;
  codeBlock.appendChild(codeElement);
  
  // Добавляем кнопки к контейнеру кнопок
  addButtonsToCodeBlock(codeButtons, message, codeType);
  
  // Добавляем контейнер кнопок и блок кода к контейнеру
  codeDisplay.appendChild(codeButtons);
  codeDisplay.appendChild(codeBlock);
  
  // Подсвечиваем синтаксис
  hljs.highlightElement(codeElement);
  
  return codeDisplay;
}

// Обновляем функцию для добавления кнопок к блоку кода
function addButtonsToCodeBlock(buttonsContainer, code, codeType) {
  // Создаем кнопку запуска
  const runButton = document.createElement('button');
  runButton.className = 'code-run-button';
  runButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
  runButton.title = 'Запустить код';
  
  // Обработчик для кнопки запуска
  runButton.addEventListener('click', async () => {
    // Находим или создаем блок для результата
    let resultBlock = buttonsContainer.parentElement.querySelector('.code-result');
    if (!resultBlock) {
      resultBlock = document.createElement('div');
      resultBlock.className = 'code-result';
      buttonsContainer.parentElement.appendChild(resultBlock);
    }
    
    // Показываем индикатор загрузки
    resultBlock.innerHTML = '<div class="code-loading">Выполнение кода...</div>';
    
    try {
      // Определяем, является ли это командой pip install
      const isPipInstall = /^pip\s+install\s+(\S+)/i.test(code) || 
                          /^pip3\s+install\s+(\S+)/i.test(code);
      
      // Если это команда pip install, меняем тип на command
      if (isPipInstall && codeType === 'python') {
        codeType = 'command';
      }
      
      // Выполняем код с обновленной функцией
      const result = await executeCode(code, codeType);
      
      // Отображаем результат
      if (result.success) {
        resultBlock.innerHTML = `
          <div class="code-result-header success">Результат выполнения</div>
          <pre class="code-result-output">${result.output || '(Нет вывода)'}</pre>
        `;
      } else {
        resultBlock.innerHTML = `
        <div class="code-result-header error">Ошибка</div>
        <pre class="code-result-error">${result.error}</pre>
      `;
      }
    } catch (error) {
      resultBlock.innerHTML = `
        <div class="code-result-header error">Ошибка</div>
        <pre class="code-result-error">${error.message}</pre>
      `;
    }
  });
  
  // Добавляем кнопку запуска в контейнер
  buttonsContainer.appendChild(runButton);
  
  // Добавляем остальные кнопки...
}

// Улучшаем функцию для выполнения кода или команды
async function executeCode(code, codeType) {
  try {
    // Проверяем, является ли это командой установки pip
    const isPipInstall = /^pip\s+install\s+(\S+)/i.test(code) || 
                         /^pip3\s+install\s+(\S+)/i.test(code);
    
    if (isPipInstall) {
      // Показываем уведомление пользователю
      showNotification('Команды pip не могут быть выполнены напрямую в Python. Выполняем через командную строку...', 'info');
      
      // Извлекаем имя пакета из команды
      const match = code.match(/^pip\d?\s+install\s+(\S+)/i);
      if (match && match[1]) {
        const packageName = match[1];
        
        // Используем специальный метод для установки модуля
        const result = await window.electronAPI.installPythonModule(packageName);
        
        if (result.success) {
          return {
            success: true,
            output: `✅ Модуль ${result.packageName} успешно установлен с помощью ${result.method}.\n\n${result.output}`
          };
        } else {
          return {
            success: false,
            error: `❌ Ошибка при установке модуля ${result.packageName}.\n\n${result.error}`
          };
        }
      }
    }
    
    // Для обычного Python-кода
    if (codeType === 'python') {
      // Проверяем, не содержит ли код команды pip
      if (code.includes('pip ') || code.includes('pip3 ')) {
        return {
          success: false,
          error: 'Ошибка: Команды pip не могут быть выполнены напрямую в Python-коде.\n\nИспользуйте команду в формате "pip install имя_пакета" в отдельном блоке кода с типом "command".'
        };
      }
      
      // Выполняем обычный Python-код
      return await window.electronAPI.runPython(code);
    } 
    // Для консольных команд
    else if (codeType === 'command') {
      return await window.electronAPI.runCommand(code);
    } 
    // Для других типов кода
    else {
      return { 
        success: false, 
        error: `Выполнение кода типа "${codeType}" пока не поддерживается.` 
      };
    }
  } catch (error) {
    console.error('Ошибка при выполнении кода:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Улучшаем функцию голосового ввода
function setupVoiceInput() {
  const voiceInputBtn = document.getElementById('voice-input-btn');
  
  // Проверяем поддержку Web Speech API
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    // Если API не поддерживается, показываем уведомление
    showNotification('Голосовой ввод не поддерживается в вашем браузере', 'warning');
    
    if (voiceInputBtn) {
      voiceInputBtn.style.display = 'none';
    }
    console.warn('Голосовой ввод не поддерживается в этом браузере');
    return;
  }
  
  // Создаем объект распознавания речи
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  // Настраиваем параметры
  recognition.lang = 'ru-RU'; // Язык распознавания (русский)
  recognition.continuous = false; // Не продолжать распознавание после паузы
  recognition.interimResults = true; // Включаем промежуточные результаты
  
  // Переменная для отслеживания состояния записи
  let isRecording = false;
  
  // Обработчик события начала записи
  recognition.onstart = function() {
    isRecording = true;
    
    // Изменяем внешний вид кнопки
    voiceInputBtn.classList.add('recording');
    
    // Показываем индикатор записи
    showRecordingIndicator();
    
    // Показываем уведомление о начале записи
    showNotification('Говорите на русском языке...', 'info');
    
    console.log('Запись голоса началась...');
  };
  
  // Обработчик промежуточных результатов
  recognition.onresult = function(event) {
    // Получаем последний результат
    const resultIndex = event.results.length - 1;
    const transcript = event.results[resultIndex][0].transcript;
    
    // Обновляем текст в индикаторе записи
    updateRecordingText(transcript);
    
    // Если это финальный результат
    if (event.results[resultIndex].isFinal) {
      console.log('Распознанный текст:', transcript);
      
      // Вставляем распознанный текст в поле ввода
      const promptInput = document.getElementById('prompt-input');
      promptInput.value = transcript;
      
      // Фокусируемся на поле ввода
      promptInput.focus();
    }
  };
  
  // Обработчик события окончания записи
  recognition.onend = function() {
    isRecording = false;
    
    // Возвращаем обычный вид кнопки
    voiceInputBtn.classList.remove('recording');
    
    // Скрываем индикатор записи
    hideRecordingIndicator();
    
    console.log('Запись голоса завершена');
  };
  
  // Обработчик ошибок
  recognition.onerror = function(event) {
    console.error('Ошибка распознавания речи:', event.error);
    
    // Показываем уведомление об ошибке
    let errorMessage = 'Ошибка распознавания речи';
    
    // Переводим стандартные ошибки на русский
    switch(event.error) {
      case 'no-speech':
        errorMessage = 'Речь не обнаружена. Попробуйте снова.';
        break;
      case 'aborted':
        errorMessage = 'Распознавание прервано.';
        break;
      case 'audio-capture':
        errorMessage = 'Не удалось получить доступ к микрофону.';
        break;
      case 'network':
        errorMessage = 'Проблема с сетевым подключением.';
        break;
      case 'not-allowed':
        errorMessage = 'Доступ к микрофону запрещен.';
        break;
      case 'service-not-allowed':
        errorMessage = 'Сервис распознавания речи недоступен.';
        break;
      case 'bad-grammar':
        errorMessage = 'Проблема с грамматикой распознавания.';
        break;
      case 'language-not-supported':
        errorMessage = 'Русский язык не поддерживается.';
        break;
      default:
        errorMessage = `Ошибка распознавания: ${event.error}`;
    }
    
    showNotification(errorMessage, 'error');
    
    // Возвращаем обычный вид кнопки
    voiceInputBtn.classList.remove('recording');
    
    // Скрываем индикатор записи
    hideRecordingIndicator();
    
    isRecording = false;
  };
  
  // Обработчик нажатия на кнопку голосового ввода
  voiceInputBtn.addEventListener('click', function() {
    if (isRecording) {
      // Если уже идет запись, останавливаем
      recognition.stop();
    } else {
      // Иначе начинаем запись
      recognition.start();
    }
  });
  
  // Добавляем подсказку при наведении
  voiceInputBtn.addEventListener('mouseover', function() {
    showTooltip(voiceInputBtn, 'Голосовой ввод (русский)');
  });
  
  voiceInputBtn.addEventListener('mouseout', function() {
    hideTooltip();
  });
  
  // Функция для отображения индикатора записи
  function showRecordingIndicator() {
    // Создаем индикатор, если его еще нет
    let recordingIndicator = document.getElementById('recording-indicator');
    
    if (!recordingIndicator) {
      recordingIndicator = document.createElement('div');
      recordingIndicator.id = 'recording-indicator';
      recordingIndicator.className = 'recording-indicator';
      recordingIndicator.innerHTML = `
        <div class="recording-pulse"></div>
        <div class="recording-text">
          <span class="recording-label">Говорите на русском...</span>
          <span class="recording-transcript"></span>
        </div>
      `;
      document.body.appendChild(recordingIndicator);
    }
    
    // Показываем индикатор
    recordingIndicator.style.display = 'flex';
    
    // Анимируем появление
    setTimeout(() => {
      recordingIndicator.style.opacity = '1';
      recordingIndicator.style.transform = 'translateY(0)';
    }, 10);
  }
  
  // Функция для обновления текста в индикаторе записи
  function updateRecordingText(text) {
    const transcriptElement = document.querySelector('.recording-transcript');
    if (transcriptElement) {
      transcriptElement.textContent = text;
    }
  }
  
  // Функция для скрытия индикатора записи
  function hideRecordingIndicator() {
    const recordingIndicator = document.getElementById('recording-indicator');
    
    if (recordingIndicator) {
      // Анимируем исчезновение
      recordingIndicator.style.opacity = '0';
      recordingIndicator.style.transform = 'translateY(20px)';
      
      // Удаляем элемент после завершения анимации
      setTimeout(() => {
        recordingIndicator.style.display = 'none';
      }, 300);
    }
  }
  
  // Функция для отображения всплывающей подсказки
  function showTooltip(element, text) {
    let tooltip = document.getElementById('custom-tooltip');
    
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'custom-tooltip';
      tooltip.className = 'custom-tooltip';
      document.body.appendChild(tooltip);
    }
    
    tooltip.textContent = text;
    
    // Позиционируем подсказку над элементом
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
    
    // Показываем подсказку
    tooltip.style.opacity = '1';
    tooltip.style.visibility = 'visible';
  }
  
  // Функция для скрытия всплывающей подсказки
  function hideTooltip() {
    const tooltip = document.getElementById('custom-tooltip');
    if (tooltip) {
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
    }
  }
}

// Функция для отображения уведомлений
function showNotification(message, type = 'info') {
  // Создаем элемент уведомления
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Добавляем уведомление на страницу
  document.body.appendChild(notification);
  
  // Анимируем появление
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 10);
  
  // Автоматически скрываем через 3 секунды
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    
    // Удаляем элемент после завершения анимации
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Инициализируем голосовой ввод при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  // ... существующий код инициализации ...
  
  // Инициализируем голосовой ввод
  setupVoiceInput();
});

// Добавляем обработчик для кнопки показа/скрытия пароля
document.addEventListener('DOMContentLoaded', function() {
  // ... существующий код ...
  
  // Обработчик для кнопки показа/скрытия API ключа
  const toggleApiKeyBtn = document.getElementById('toggle-api-key');
  const apiKeyInput = document.getElementById('api-key-input');
  
  if (toggleApiKeyBtn && apiKeyInput) {
    toggleApiKeyBtn.addEventListener('click', function() {
      const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
      apiKeyInput.setAttribute('type', type);
    });
  }
  
  // Загружаем настройки
  loadSettings();
});

// Функция для проверки API ключа при загрузке
async function checkApiKey() {
  const apiKey = document.getElementById('api-key-input').value;
  
  if (!apiKey) {
    showNotification('API ключ не настроен. Пожалуйста, добавьте ключ в настройках.', 'warning');
    return;
  }
  
  try {
    const result = await window.electronAPI.testApiConnection();
    
    if (result.success) {
      showNotification('Соединение с API установлено успешно', 'success');
    } else {
      showNotification('Ошибка соединения с API. Проверьте ваш API ключ.', 'error');
    }
  } catch (error) {
    console.error('Ошибка при проверке API ключа:', error);
    showNotification('Ошибка при проверке API ключа', 'error');
  }
}

// Добавляем функцию для тестирования соединения с API
document.addEventListener('DOMContentLoaded', function() {
  // ... существующий код ...
  
  // Добавляем кнопку для тестирования API ключа
  const apiKeyInput = document.getElementById('api-key-input');
  const apiKeyContainer = document.querySelector('.api-key-container');
  
  if (apiKeyContainer) {
    const testApiBtn = document.createElement('button');
    testApiBtn.className = 'test-api-btn';
    testApiBtn.textContent = 'Проверить';
    testApiBtn.title = 'Проверить соединение с API';
    
    apiKeyContainer.appendChild(testApiBtn);
    
    testApiBtn.addEventListener('click', function() {
      const apiKey = apiKeyInput.value;
      
      if (!apiKey) {
        showNotification('Пожалуйста, введите API ключ', 'warning');
        return;
      }
      
      // Отправляем API ключ в main процесс
      window.electronAPI.setApiKey(apiKey);
      
      // Проверяем соединение
      checkApiKey();
    });
  }
});

// Функция для проверки наличия API ключа при загрузке
function checkApiKeyOnStartup() {
  const apiKey = document.getElementById('api-key-input').value;
  
  if (!apiKey) {
    // Показываем уведомление с задержкой, чтобы оно появилось после загрузки интерфейса
    setTimeout(() => {
      showNotification('API ключ не настроен. Пожалуйста, добавьте ключ в настройках.', 'warning');
      
      // Добавляем индикатор на кнопку настроек
      const settingsBtn = document.getElementById('settings-btn');
      if (settingsBtn) {
        settingsBtn.classList.add('needs-attention');
        
        // Добавляем стили для индикатора, если их еще нет
        if (!document.getElementById('settings-indicator-style')) {
          const style = document.createElement('style');
          style.id = 'settings-indicator-style';
          style.textContent = `
            .needs-attention {
              position: relative;
            }
            .needs-attention::after {
              content: '';
              position: absolute;
              top: 3px;
              right: 3px;
              width: 8px;
              height: 8px;
              background-color: #e74c3c;
              border-radius: 50%;
              animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
              0% { transform: scale(0.8); opacity: 0.8; }
              50% { transform: scale(1.2); opacity: 1; }
              100% { transform: scale(0.8); opacity: 0.8; }
            }
          `;
          document.head.appendChild(style);
        }
      }
    }, 1000);
  }
}

// Вызываем функцию проверки API ключа при загрузке
document.addEventListener('DOMContentLoaded', function() {
  // ... существующий код ...
  
  // Проверяем API ключ при загрузке
  checkApiKeyOnStartup();
}); 