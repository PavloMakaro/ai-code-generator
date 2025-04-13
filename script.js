// Переключатель темы
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
});

// Инициализация темы
if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
}

// Загрузка моделей
async function loadModels() {
    const modelSelect = document.getElementById('model');

    try {
        const response = await fetch('models.json');
        if (!response.ok) throw new Error('Не удалось загрузить models.json');
        const jsonModels = await response.json();

        const customModels = JSON.parse(localStorage.getItem('customModels') || '[]');
        const allModels = [...jsonModels, ...customModels];

        modelSelect.innerHTML = '';
        allModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = `${model.name} (${model.provider})`;
            modelSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка загрузки моделей:', error);
        modelSelect.innerHTML = '<option value="auto">Автоматический выбор</option>';
    }
}

// Добавление кастомной модели
document.getElementById('custom-model-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const modelId = document.getElementById('model-id').value;
    const modelName = document.getElementById('model-name').value;
    const modelProvider = document.getElementById('model-provider').value;

    const customModels = JSON.parse(localStorage.getItem('customModels') || '[]');
    if (customModels.some(model => model.id === modelId)) {
        alert('Модель с таким ID уже существует!');
        return;
    }

    const newModel = { id: modelId, name: modelName, provider: modelProvider };
    customModels.push(newModel);
    localStorage.setItem('customModels', JSON.stringify(customModels));

    loadModels();
    displayCustomModels();
    e.target.reset();
    alert('Модель успешно добавлена!');
});

// Отправка запроса к API
document.getElementById('request-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const prompt = document.getElementById('prompt').value;
    const model = document.getElementById('model').value;
    const deepSearch = document.getElementById('deepsearch-toggle').checked;
    const responseSection = document.getElementById('response-section');
    const responseDiv = document.getElementById('response');

    const apiKey = 'sk-oWHssHofTC2g291Qu6wY/EkYrwQEBjxay1XR1lMg3YD7dP2ci4pQBm3SP3VVv+r7o8ksDq2HdQELruTSmkTtzjiEUX+ysYtiLVbPULHp2gw=';
    const apiUrl = 'https://app.requesty.ai/api/v1/request'; // Предполагаемый эндпоинт

    try {
        responseDiv.innerHTML = '';
        responseDiv.classList.add('skeleton');
        responseSection.classList.remove('hidden');

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                model: model === 'auto' ? null : model,
                deepSearch: deepSearch, // DeepSearch для Grok 3
            }),
        });

        if (!response.ok) throw new Error(`Ошибка API: ${response.status}`);

        const data = await response.json();

        responseDiv.classList.remove('skeleton');
        responseDiv.innerHTML = `
            <div class="prose dark:prose-invert">
                <h3>${deepSearch ? 'DeepSearch' : 'Ответ'} от Grok 3</h3>
                <p>${data.response || 'Ответ не получен'}</p>
                ${data.sources ? '<h4>Источники:</h4><ul>' + data.sources.map(s => `<li>${s}</li>`).join('') + '</ul>' : ''}
            </div>
        `;

        saveRequest(prompt, data.response || 'Ответ не получен', model, deepSearch);
        displayHistory();
    } catch (error) {
        responseDiv.classList.remove('skeleton');
        responseDiv.innerHTML = `<p class="text-red-600 dark:text-red-400">Ошибка: ${error.message}</p>`;
    }
});

// Сохранение запроса
function saveRequest(prompt, response, model, deepSearch) {
    const history = JSON.parse(localStorage.getItem('requestHistory') || '[]');
    history.push({ prompt, response, model, deepSearch, timestamp: new Date().toISOString() });
    localStorage.setItem('requestHistory', JSON.stringify(history));
}

// Отображение истории
function displayHistory() {
    const history = JSON.parse(localStorage.getItem('requestHistory') || '[]');
    const historySection = document.getElementById('history-section');
    historySection.innerHTML = '<h2 class="text-3xl font-bold mb-6">История запросов</h2>';

    if (history.length === 0) {
        historySection.innerHTML += '<p class="text-gray-600 dark:text-gray-400">Запросов пока нет.</p>';
        return;
    }

    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item border p-6 mb-4 rounded-xl bg-gray-50 dark:bg-gray-700';
        div.innerHTML = `
            <p><strong>Запрос:</strong> ${item.prompt}</p>
            <p><strong>Модель:</strong> ${item.model}</p>
            <p><strong>Режим:</strong> ${item.deepSearch ? 'DeepSearch' : 'Обычный'}</p>
            <p><strong>Ответ:</strong> ${item.response}</p>
            <p><strong>Время:</strong> ${new Date(item.timestamp).toLocaleString()}</p>
        `;
        historySection.appendChild(div);
    });
}

// Отображение кастомных моделей
function displayCustomModels() {
    const customModels = JSON.parse(localStorage.getItem('customModels') || '[]');
    const customModelSection = document.createElement('div');
    customModelSection.innerHTML = '<h2 class="text-3xl font-bold mb-6">Кастомные модели</h2>';

    if (customModels.length === 0) {
        customModelSection.innerHTML += '<p class="text-gray-600 dark:text-gray-400">Кастомных моделей пока нет.</p>';
    } else {
        customModels.forEach((model, index) => {
            const div = document.createElement('div');
            div.className = 'model-item border p-6 mb-4 rounded-xl bg-gray-50 dark:bg-gray-700 flex justify-between items-center';
            div.innerHTML = `
                <div>
                    <p><strong>ID:</strong> ${model.id}</p>
                    <p><strong>Название:</strong> ${model.name}</p>
                    <p><strong>Провайдер:</strong> ${model.provider}</p>
                </div>
                <button class="bg-red-600 text-white py-2 px-4 rounded-xl hover:bg-red-700 transition transform hover:scale-105" data-index="${index}">Удалить</button>
            `;
            customModelSection.appendChild(div);
        });
    }

    const existingSection = document.getElementById('custom-models-section');
    if (existingSection) existingSection.remove();
    customModelSection.id = 'custom-models-section';
    document.querySelector('main').insertBefore(customModelSection, document.getElementById('custom-model-form').parentElement);

    customModelSection.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            const index = button.dataset.index;
            customModels.splice(index, 1);
            localStorage.setItem('customModels', JSON.stringify(customModels));
            loadModels();
            displayCustomModels();
            alert('Модель удалена!');
        });
    });
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadModels();
    displayHistory();
    displayCustomModels();
});
