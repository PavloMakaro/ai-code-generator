const axios = require('axios');

// Удаляем ключ по умолчанию
let OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function generateCode(prompt, model = 'anthropic/claude-3-sonnet-20240229:free') {
  try {
    console.log(`Генерация кода с использованием модели ${model}...`);
    
    // Используем константу OPENROUTER_API_KEY вместо локальной переменной
    const apiKey = OPENROUTER_API_KEY;
    
    // Проверяем наличие API ключа
    if (!apiKey || apiKey === '') {
      console.error('API ключ не настроен');
      return {
        success: false,
        error: 'API ключ не настроен. Пожалуйста, добавьте ваш API ключ OpenRouter в настройках приложения.'
      };
    }
    
    // Формируем URL для запроса
    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
    // Формируем заголовки запроса
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Code Generator'
    };
    
    // Логируем заголовки (без полного API ключа)
    console.log('Используемые заголовки:', {
      'Content-Type': headers['Content-Type'],
      'Authorization': `Bearer ${apiKey.substring(0, 10)}...`,
      'HTTP-Referer': headers['HTTP-Referer'],
      'X-Title': headers['X-Title']
    });
    
    // Адаптируем системный промпт под разные модели
    let systemPrompt = 'Вы - опытный программист, который помогает писать код. Отвечайте на русском языке. Предоставляйте подробные объяснения и примеры кода.';
    
    // Для моделей Google добавляем специфичные инструкции
    if (model.includes('google/gemini')) {
      systemPrompt += ' Пожалуйста, предоставляйте полные решения с объяснениями на русском языке.';
    }
    
    // Формируем тело запроса
    const requestBody = {
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };
    
    // Отправляем запрос к API с таймаутом
    console.log('Отправка запроса к OpenRouter API...');
    
    // Создаем контроллер для отмены запроса по таймауту
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 секунд таймаут
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      // Очищаем таймаут
      clearTimeout(timeoutId);
      
      // Проверяем статус ответа
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Ошибка API: ${response.status} ${response.statusText}`;
        
        try {
          // Пытаемся распарсить JSON с ошибкой
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
        } catch (e) {
          // Если не удалось распарсить JSON, используем текст ответа
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        }
        
        console.error(errorMessage);
        
        // Проверяем конкретные коды ошибок
        if (response.status === 401) {
          return {
            success: false,
            error: 'Ошибка авторизации API. Пожалуйста, проверьте ваш API ключ OpenRouter в настройках.'
          };
        } else if (response.status === 429) {
          return {
            success: false,
            error: 'Превышен лимит запросов к API. Пожалуйста, попробуйте позже или выберите другую модель.'
          };
        } else if (response.status === 404) {
          return {
            success: false,
            error: 'Модель не найдена. Пожалуйста, выберите другую модель в настройках.'
          };
        } else if (response.status >= 500) {
          return {
            success: false,
            error: 'Ошибка сервера API. Пожалуйста, попробуйте позже или выберите другую модель.'
          };
        }
        
        throw new Error(errorMessage);
      }
      
      // Получаем данные ответа
      const data = await response.json();
      console.log('Получен ответ от API:', data);
      
      // Извлекаем код из ответа
      return extractCodeFromResponse(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return {
          success: false,
          error: 'Превышено время ожидания ответа от API. Пожалуйста, попробуйте позже или выберите другую модель.'
        };
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('Ошибка при генерации кода:', error);
    return {
      success: false,
      error: error.message || 'Произошла неизвестная ошибка при генерации кода'
    };
  }
}

async function fixErrors(code, errorMessage, model = 'anthropic/claude-3-sonnet-20240229:free') {
  try {
    // Создаем системный промпт для исправления ошибок
    const systemPrompt = 'Вы опытный программист, который исправляет ошибки в коде. Ваша задача - проанализировать код, найти причину ошибки и предложить исправленную версию. Объясните причину ошибки и предоставьте полное решение.';
    
    // Формируем запрос с кодом и сообщением об ошибке
    const userPrompt = `Исправьте следующий код, в котором возникла ошибка:\n\nОшибка: ${errorMessage}\n\n\`\`\`\n${code}\n\`\`\`\n\nПожалуйста, объясните причину ошибки и предоставьте исправленный код.`;
    
    console.log('Отправка запроса на исправление ошибки:', {
      model,
      errorMessage: errorMessage.substring(0, 100) + (errorMessage.length > 100 ? '...' : ''),
      codeLength: code.length
    });
    
    const response = await axios.post(
      API_URL,
      {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Code Generator'
        }
      }
    );

    // Проверяем наличие ответа и его структуру
    if (!response || !response.data || !response.data.choices || !response.data.choices.length) {
      console.error('Некорректный ответ от API:', response);
      throw new Error('Получен некорректный ответ от API');
    }

    // Извлекаем ответ от модели
    const content = response.data.choices[0].message.content;
    console.log('Получен ответ от модели:', {
      contentLength: content ? content.length : 0,
      hasCodeBlocks: content ? content.includes('```') : false
    });
    
    return content;
  } catch (error) {
    console.error('Ошибка при исправлении кода:', error);
    
    // Возвращаем объект с информацией об ошибке вместо выбрасывания исключения
    return {
      success: false,
      error: error.message || 'Не удалось исправить код. Проверьте подключение и API ключ.'
    };
  }
}

function extractCodeFromResponse(response) {
  try {
    console.log('Извлечение кода из ответа API:', response);
    
    // Проверяем наличие ответа
    if (!response || !response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
      console.error('Некорректный формат ответа API:', response);
      return {
        success: false,
        error: 'Получен некорректный ответ от API. Пожалуйста, попробуйте еще раз.'
      };
    }
    
    // Получаем текст из первого выбора
    const choice = response.choices[0];
    
    // Проверяем наличие сообщения
    if (!choice.message || !choice.message.content) {
      console.error('В ответе API отсутствует содержимое сообщения:', choice);
      return {
        success: false,
        error: 'В ответе API отсутствует содержимое сообщения.'
      };
    }
    
    // Получаем текст сообщения
    const messageContent = choice.message.content;
    
    // Возвращаем успешный результат с кодом
    return {
      success: true,
      code: messageContent
    };
  } catch (error) {
    console.error('Ошибка при извлечении кода из ответа API:', error);
    return {
      success: false,
      error: `Ошибка при обработке ответа API: ${error.message}`
    };
  }
}

// Обновляем функцию проверки соединения
async function testConnection() {
  try {
    // Проверяем наличие API ключа
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === '') {
      console.error('API ключ не настроен');
      return false;
    }
    
    console.log('Проверка соединения с API OpenRouter...');
    
    // Используем fetch вместо axios для согласованности
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`
      }
    });
    
    if (!response.ok) {
      console.error(`Ошибка при проверке соединения: ${response.status} ${response.statusText}`);
      return false;
    }
    
    console.log('Соединение с API установлено успешно');
    return true;
  } catch (error) {
    console.error('Ошибка при проверке соединения с API:', error);
    return false;
  }
}

// Добавляем функцию для установки API ключа
function setApiKey(apiKey) {
  if (!apiKey) {
    console.warn('Попытка установить пустой API ключ');
    return false;
  }
  
  console.log('Установка нового API ключа');
  OPENROUTER_API_KEY = apiKey;
  
  // Для отладки (не показывайте полный ключ в логах)
  console.log('API ключ установлен:', OPENROUTER_API_KEY.substring(0, 5) + '...');
  
  return true;
}

module.exports = {
  generateCode,
  fixErrors,
  testConnection,
  setApiKey
}; 