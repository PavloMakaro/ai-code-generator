document.addEventListener('DOMContentLoaded', () => {
    // --- Получение ссылок на важные DOM-элементы ---
    const tg = window.Telegram.WebApp;

    // Экраны
    const screens = document.querySelectorAll('.screen');
    const adminPanel = document.getElementById('admin-panel');

    // Навигация
    const navigationButtons = document.querySelectorAll('.navigation button');

    // Шапка (для обновления данных)
    const usdBalanceElement = document.getElementById('usd-balance');
    const cryptoBalancesContainer = document.getElementById('crypto-balances'); // Контейнер для крипто-балансов
    const totalHashrateElement = document.getElementById('total-hashrate');
    const totalPowerElement = document.getElementById('total-power');
    const profitRateElement = document.getElementById('profit-rate');

    // Элементы Админ-панели
    const adminPanelButton = document.getElementById('admin-panel-button'); // Кнопка в настройках для входа
    const adminPasswordInput = document.getElementById('admin-password');
    const adminLoginButton = document.getElementById('admin-login');
    const adminLogoutButton = document.getElementById('admin-logout-button');
    const adminContent = document.getElementById('admin-content');
    const adminLoginForm = document.getElementById('admin-login-form');
    const addGpuForm = document.getElementById('add-gpu-form');

    // --- Инициализация приложения ---
    function initializeApp() {
        tg.ready(); // Сообщаем Telegram, что приложение готово
        tg.expand(); // Раскрываем приложение на весь экран

        setupNavigation();
        setupAdminPanel();

        // Устанавливаем начальные значения (позже будут грузиться с бэка)
        updateBalances(1000.00, { sBTC: 0.0001, sETC: 0.5 }); // Пример данных
        updateFarmStats(50, 250, 0.15); // Пример данных (Hash MH/s, Power W, Profit $/hr)

        // Показываем стартовый экран
        showScreen('farm-screen');
        // Устанавливаем активную кнопку навигации
        updateActiveNavButton('farm-screen');

        console.log("CryptoFarm Tycoon App Initialized");

        // TODO: Загрузить реальные данные пользователя с бэкенда
        // fetchUserData().then(data => {
        //     updateBalances(data.usd_balance, data.crypto_balances);
        //     updateFarmStats(data.farm.hashrate, data.farm.power, calculateProfit(data.farm));
        //     // ... загрузить инвентарь, состояние фермы и т.д.
        // });
    }

    // --- Логика Навигации ---
    function showScreen(screenId) {
        // Сначала скрываем все экраны
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        // Показываем нужный экран
        const activeScreen = document.getElementById(screenId);
        if (activeScreen) {
            activeScreen.classList.add('active');
        } else {
            console.error(`Screen with ID "${screenId}" not found.`);
        }

         // Если переходим *не* в админку, убедимся, что она не активна и скрыта кнопка выхода
        if (screenId !== 'admin-panel') {
            adminPanel.classList.remove('active'); // На всякий случай
            // Можно скрыть кнопку выхода, если пользователь вышел из админки переходом
            // logoutAdmin(); // Или просто скрыть кнопку
             // adminLogoutButton.style.display = 'none';
        }

        // Скрываем админ-панель если был выполнен выход
        if (!adminPanel.classList.contains('logged-in') && screenId !== 'admin-panel'){
             adminPanel.classList.remove('active');
        }

        console.log(`Navigated to: ${screenId}`);
    }

    function updateActiveNavButton(screenId) {
        navigationButtons.forEach(button => {
            if (button.getAttribute('data-screen') === screenId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    function handleNavClick(event) {
        const button = event.target.closest('button'); // Ищем кнопку, даже если клик был по иконке внутри
        if (button && button.hasAttribute('data-screen')) {
            const screenId = button.getAttribute('data-screen');
            showScreen(screenId);
            updateActiveNavButton(screenId);
        }
    }

    function setupNavigation() {
        const navContainer = document.querySelector('.navigation');
        navContainer.addEventListener('click', handleNavClick);
    }

    // --- Логика Админ-Панели ---
    function setupAdminPanel() {
        // Кнопка в Настройках для перехода на экран админки
        adminPanelButton.addEventListener('click', () => {
            showScreen('admin-panel');
            updateActiveNavButton('settings-screen'); // Оставляем подсветку на Настройках
        });

        // Логин в админку
        adminLoginButton.addEventListener('click', () => {
            const password = adminPasswordInput.value;
            // !!! ВАЖНО: Это КЛИЕНТСКАЯ проверка. В реальном приложении
            // !!! пароль должен отправляться на БЭКЕНД для проверки!
            if (password === 'Qwe123') { // Захардкоженный пароль
                loginAdminSuccess();
            } else {
                alert('Неверный пароль!'); // Простое уведомление
                adminPasswordInput.value = '';
            }
        });

        // Выход из админки
        adminLogoutButton.addEventListener('click', () => {
            logoutAdmin();
            showScreen('settings-screen'); // Возвращаемся в настройки после выхода
            updateActiveNavButton('settings-screen');
        });

        // Обработка отправки формы добавления GPU (пример)
        addGpuForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Предотвращаем стандартную отправку формы
            const formData = new FormData(addGpuForm);
            const gpuData = Object.fromEntries(formData.entries());
            console.log("Submitting new GPU data (to backend):", gpuData);

            // TODO: Отправить gpuData на бэкенд (через api.js)
            // api.addGpu(gpuData).then(() => {
            //     alert('Видеокарта добавлена!');
            //     addGpuForm.reset(); // Очистить форму
            // }).catch(error => {
            //     alert('Ошибка добавления: ' + error.message);
            // });
             alert('Функция добавления GPU (отправка на бэкенд не реализована)');
             addGpuForm.reset();
        });
    }

    function loginAdminSuccess() {
        console.log("Admin login successful (client-side)");
        adminPanel.classList.add('logged-in'); // Добавляем класс для CSS
        adminPasswordInput.value = ''; // Очищаем поле пароля
        adminLogoutButton.style.display = 'inline-block'; // Показываем кнопку выхода
        adminPanelButton.style.display = 'none'; // Скрываем кнопку входа в настройках
    }

    function logoutAdmin() {
        console.log("Admin logged out");
        adminPanel.classList.remove('logged-in'); // Убираем класс
        adminLogoutButton.style.display = 'none'; // Скрываем кнопку выхода
        adminPanelButton.style.display = 'inline-block'; // Показываем кнопку входа обратно
        // Можно также принудительно скрыть весь экран админки
        // adminPanel.classList.remove('active');
    }

    // --- Функции Обновления Интерфейса ---
    function updateBalances(usd, cryptoBalances = {}) {
        if (usdBalanceElement) {
            usdBalanceElement.textContent = parseFloat(usd).toFixed(2);
        }
        if (cryptoBalancesContainer) {
             // Очищаем старые балансы
             cryptoBalancesContainer.innerHTML = '';
             // Добавляем новые
             for (const coin in cryptoBalances) {
                 const balance = parseFloat(cryptoBalances[coin]).toFixed(6); // Точность для крипты
                 const span = document.createElement('span');
                 span.classList.add('crypto-balance');
                 // Пример: sBTC: 0.000100
                 span.innerHTML = `${coin.toUpperCase()}: <span id="${coin.toLowerCase()}-balance">${balance}</span>`;
                 cryptoBalancesContainer.appendChild(span);
             }
        }
    }

    function updateFarmStats(hashrate, power, profit) {
        if (totalHashrateElement) {
            // Форматируем хешрейт (например, MH/s или TH/s)
            totalHashrateElement.textContent = `${parseFloat(hashrate).toFixed(2)} MH/s`; // Пример
        }
        if (totalPowerElement) {
            totalPowerElement.textContent = `${parseInt(power)} W`;
        }
        if (profitRateElement) {
            profitRateElement.textContent = `${parseFloat(profit).toFixed(2)}`;
        }
    }

    // --- Запуск Приложения ---
    initializeApp();

}); // Конец 'DOMContentLoaded'
