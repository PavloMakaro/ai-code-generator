// --- DOM Элементы Админки ---
const loginSection = document.getElementById('login-section');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const adminPasswordInput = document.getElementById('admin-password');
const loginErrorEl = document.getElementById('login-error');
const logoutButton = document.getElementById('logout-button');

// GPU Management
const gpuListEl = document.getElementById('gpu-list');
const addGpuButton = document.getElementById('add-gpu-button');
const gpuForm = document.getElementById('gpu-form');
const gpuFormTitle = document.getElementById('gpu-form-title');
const gpuIdInput = document.getElementById('gpu-id');
const gpuNameInput = document.getElementById('gpu-name');
const gpuHashEthInput = document.getElementById('gpu-hashrate-ethash');
const gpuHashShaInput = document.getElementById('gpu-hashrate-sha256');
const gpuPowerInput = document.getElementById('gpu-power');
const gpuPriceInput = document.getElementById('gpu-price');
const gpuImageUrlInput = document.getElementById('gpu-image-url');
const gpuStockInput = document.getElementById('gpu-stock'); // Пока не используется в игре, но можно добавить
const gpuWearRateInput = document.getElementById('gpu-wear-rate');
const gpuRequirementsInput = document.getElementById('gpu-requirements');
const saveGpuButton = document.getElementById('save-gpu-button');
const cancelGpuButton = document.getElementById('cancel-gpu-button');

// Crypto Management
const cryptoListEl = document.getElementById('crypto-list');
const addCryptoButton = document.getElementById('add-crypto-button');
const cryptoForm = document.getElementById('crypto-form');
const cryptoFormTitle = document.getElementById('crypto-form-title');
const cryptoIdInput = document.getElementById('crypto-id'); // Используем Ticker как ID
const cryptoNameInput = document.getElementById('crypto-name');
const cryptoTickerInput = document.getElementById('crypto-ticker');
const cryptoAlgorithmSelect = document.getElementById('crypto-algorithm');
const cryptoBasePriceInput = document.getElementById('crypto-base-price');
const cryptoVolatilityInput = document.getElementById('crypto-volatility');
const saveCryptoButton = document.getElementById('save-crypto-button');
const cancelCryptoButton = document.getElementById('cancel-crypto-button');


// Settings Management
const botActivityInput = document.getElementById('market-bot-activity');
const restockFreqInput = document.getElementById('market-restock-freq'); // Пока не используется
const startCapitalInput = document.getElementById('game-start-capital');
const energyCostInput = document.getElementById('game-energy-cost');
const saveMarketSettingsBtn = document.getElementById('save-market-settings');
const saveGameSettingsBtn = document.getElementById('save-game-settings');


// --- Данные Админки (Хранятся в localStorage) ---
let gpuDefinitionsAdmin = {}; // Используем объект для легкого доступа по ID
let cryptoDefinitionsAdmin = {}; // Используем Ticker как ключ
let gameSettingsAdmin = {
    botActivity: 5,
    restockFreq: 24,
    startCapital: 1000,
    energyCostPerKWh: 0.15
};

const ADMIN_PASSWORD = 'qwe123'; // Пароль доступа

// --- Инициализация Админки ---
document.addEventListener('DOMContentLoaded', initAdmin);

function initAdmin() {
    console.log("Инициализация админ-панели...");
    loadAdminDefinitions(); // Загружаем данные из localStorage
    setupAdminEventListeners();
}

// --- Загрузка/Сохранение Данных Админки ---
function loadAdminDefinitions() {
    const loadedGpuDefs = localStorage.getItem('cryptoTycoonGpuDefs');
    const loadedCryptoDefs = localStorage.getItem('cryptoTycoonCryptoDefs');
    const loadedSettings = localStorage.getItem('cryptoTycoonSettings');

    if (loadedGpuDefs) {
        gpuDefinitionsAdmin = JSON.parse(loadedGpuDefs);
    } else {
        // Заполняем дефолтными значениями, если пусто
        gpuDefinitionsAdmin = {
           'gpu-gtx1060': { id: 'gpu-gtx1060', name: "GTX 1060 6GB", hashrates: { ethash: 22, sha256: 0.3 }, power: 120, price: 200, imageUrl: "https://via.placeholder.com/150/CCCCCC/808080?text=GTX1060", requirements: "PCIe x16", wearRate: 0.1 },
           'gpu-rx580':   { id: 'gpu-rx580', name: "RX 580 8GB", hashrates: { ethash: 30, sha256: 0.4 }, power: 180, price: 250, imageUrl: "https://via.placeholder.com/150/FF7F7F/FFFFFF?text=RX580", requirements: "PCIe x16, 8pin", wearRate: 0.12 },
           'gpu-rtx3080': { id: 'gpu-rtx3080', name: "RTX 3080", hashrates: { ethash: 95, sha256: 1.2 }, power: 320, price: 1200, imageUrl: "https://via.placeholder.com/150/90EE90/000000?text=RTX3080", requirements: "PCIe x16, 2x8pin", wearRate: 0.08 },
        };
        saveAdminDefinitions(); // Сохраняем дефолтные
    }

     if (loadedCryptoDefs) {
         cryptoDefinitionsAdmin = JSON.parse(loadedCryptoDefs);
     } else {
         cryptoDefinitionsAdmin = {
            'BTC': { name: "Bitcoin", ticker: "BTC", algorithm: "sha256", basePrice: 50000, volatility: 0.1, hashUnit: 'GH/s' },
            'ETH': { name: "Ethereum", ticker: "ETH", algorithm: "ethash", basePrice: 3000, volatility: 0.15, hashUnit: 'MH/s' },
         };
         saveAdminDefinitions();
     }

    if (loadedSettings) {
        gameSettingsAdmin = JSON.parse(loadedSettings);
    }
     // Заполняем поля настроек при загрузке
     botActivityInput.value = gameSettingsAdmin.botActivity;
     restockFreqInput.value = gameSettingsAdmin.restockFreq;
     startCapitalInput.value = gameSettingsAdmin.startCapital;
     energyCostInput.value = gameSettingsAdmin.energyCostPerKWh;

    console.log("Админ данные загружены/установлены по умолчанию.");
}

function saveAdminDefinitions() {
    localStorage.setItem('cryptoTycoonGpuDefs', JSON.stringify(gpuDefinitionsAdmin));
    localStorage.setItem('cryptoTycoonCryptoDefs', JSON.stringify(cryptoDefinitionsAdmin));
    localStorage.setItem('cryptoTycoonSettings', JSON.stringify(gameSettingsAdmin));
    console.log("Админ данные сохранены в localStorage.");
}

// --- Обработчики Событий Админки ---
function setupAdminEventListeners() {
    loginForm.addEventListener('submit', handleAdminLogin);
    logoutButton.addEventListener('click', handleAdminLogout);

    // Кнопки Добавить
    addGpuButton.addEventListener('click', () => showGpuForm());
    addCryptoButton.addEventListener('click', () => showCryptoForm());

    // Кнопки Сохранить/Отмена в формах
    gpuForm.addEventListener('submit', handleSaveGpu);
    cancelGpuButton.addEventListener('click', hideGpuForm);
    cryptoForm.addEventListener('submit', handleSaveCrypto);
    cancelCryptoButton.addEventListener('click', hideCryptoForm);


    // Кнопки Редактировать/Удалить в списках (делегирование событий)
    gpuListEl.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-button')) {
            const gpuId = event.target.closest('li').dataset.gpuId;
            showGpuForm(gpuId);
        } else if (event.target.classList.contains('delete-button')) {
            const gpuId = event.target.closest('li').dataset.gpuId;
            handleDeleteGpu(gpuId);
        }
    });
     cryptoListEl.addEventListener('click', (event) => {
         if (event.target.classList.contains('edit-button')) {
             const cryptoTicker = event.target.closest('li').dataset.cryptoTicker;
             showCryptoForm(cryptoTicker);
         } else if (event.target.classList.contains('delete-button')) {
             const cryptoTicker = event.target.closest('li').dataset.cryptoTicker;
             handleDeleteCrypto(cryptoTicker);
         }
     });

     // Кнопки сохранения настроек
     saveMarketSettingsBtn.addEventListener('click', handleSaveMarketSettings);
     saveGameSettingsBtn.addEventListener('click', handleSaveGameSettings);
}

// --- Логин/Логаут ---
function handleAdminLogin(event) {
    event.preventDefault();
    if (adminPasswordInput.value === ADMIN_PASSWORD) {
        loginSection.style.display = 'none';
        adminPanel.style.display = 'block';
        loginErrorEl.style.display = 'none';
        adminPasswordInput.value = ''; // Очищаем пароль
        renderAdminLists(); // Отображаем списки после входа
    } else {
        loginErrorEl.style.display = 'block';
    }
}

function handleAdminLogout() {
    adminPanel.style.display = 'none';
    loginSection.style.display = 'block';
}

// --- Отображение Списков в Админке ---
function renderAdminLists() {
    renderGpuList();
    renderCryptoList();
}

function renderGpuList() {
    gpuListEl.innerHTML = ''; // Очищаем список
    Object.values(gpuDefinitionsAdmin).forEach(gpu => {
        const li = document.createElement('li');
        li.dataset.gpuId = gpu.id;
        li.innerHTML = `
            <div class="list-item-info">
                <strong>${gpu.name} (ID: ${gpu.id})</strong><br>
                <span>ETH: ${gpu.hashrates?.ethash || 0} MH/s</span>
                <span>SHA256: ${gpu.hashrates?.sha256 || 0} GH/s</span>
                <span>Power: ${gpu.power}W</span>
                <span>Price: $${gpu.price}</span>
                <span>Wear: ${gpu.wearRate || 0.1}</span>
            </div>
            <div class="list-actions">
                <button class="edit-button">Edit</button>
                <button class="delete-button">Delete</button>
            </div>
        `;
        gpuListEl.appendChild(li);
    });
     if (Object.keys(gpuDefinitionsAdmin).length === 0) {
         gpuListEl.innerHTML = '<li>Нет добавленных видеокарт.</li>';
     }
}

function renderCryptoList() {
     cryptoListEl.innerHTML = '';
     Object.values(cryptoDefinitionsAdmin).forEach(crypto => {
         const li = document.createElement('li');
         li.dataset.cryptoTicker = crypto.ticker;
         li.innerHTML = `
             <div class="list-item-info">
                 <strong>${crypto.name} (${crypto.ticker})</strong><br>
                 <span>Algo: ${crypto.algorithm}</span>
                 <span>Start Price: $${crypto.basePrice}</span>
                 <span>Volatility: ${crypto.volatility || 0.1}</span>
                 <span>Unit: ${crypto.hashUnit || 'N/A'}</span>
             </div>
             <div class="list-actions">
                 <button class="edit-button">Edit</button>
                 <button class="delete-button">Delete</button>
             </div>
         `;
         cryptoListEl.appendChild(li);
     });
     if (Object.keys(cryptoDefinitionsAdmin).length === 0) {
         cryptoListEl.innerHTML = '<li>Нет добавленных криптовалют.</li>';
     }
}


// --- Управление Формами ---
function showGpuForm(gpuId = null) {
    if (gpuId) { // Редактирование
        const gpu = gpuDefinitionsAdmin[gpuId];
        if (!gpu) return;
        gpuFormTitle.textContent = `Редактировать: ${gpu.name}`;
        gpuIdInput.value = gpu.id; // Скрытое поле ID
        gpuNameInput.value = gpu.name;
        gpuHashEthInput.value = gpu.hashrates?.ethash || 0;
        gpuHashShaInput.value = gpu.hashrates?.sha256 || 0;
        gpuPowerInput.value = gpu.power;
        gpuPriceInput.value = gpu.price;
        gpuImageUrlInput.value = gpu.imageUrl || '';
        gpuStockInput.value = gpu.stock || 10;
        gpuWearRateInput.value = gpu.wearRate || 0.1;
        gpuRequirementsInput.value = gpu.requirements || '';
    } else { // Добавление
        gpuFormTitle.textContent = "Добавить Новую Видеокарту";
        gpuForm.reset(); // Очищаем форму
        gpuIdInput.value = ''; // Убедимся что ID пуст
    }
    gpuForm.style.display = 'block';
}

function hideGpuForm() {
    gpuForm.style.display = 'none';
    gpuForm.reset();
}

function showCryptoForm(ticker = null) {
     if (ticker) {
         const crypto = cryptoDefinitionsAdmin[ticker];
         if (!crypto) return;
         cryptoFormTitle.textContent = `Редактировать: ${crypto.name}`;
         cryptoIdInput.value = crypto.ticker; // Используем Ticker как ID
         cryptoNameInput.value = crypto.name;
         cryptoTickerInput.value = crypto.ticker;
         cryptoTickerInput.readOnly = true; // Нельзя менять тикер при редактировании
         cryptoAlgorithmSelect.value = crypto.algorithm;
         cryptoBasePriceInput.value = crypto.basePrice;
         cryptoVolatilityInput.value = crypto.volatility || 0.1;
          // Поле для единицы измерения хешрейта (если нужно будет добавить)
          // cryptoHashUnitInput.value = crypto.hashUnit || '';
     } else {
         cryptoFormTitle.textContent = "Добавить Криптовалюту";
         cryptoForm.reset();
         cryptoTickerInput.readOnly = false;
         cryptoIdInput.value = '';
     }
     cryptoForm.style.display = 'block';
 }

 function hideCryptoForm() {
     cryptoForm.style.display = 'none';
     cryptoForm.reset();
     cryptoTickerInput.readOnly = false; // Возвращаем возможность редактирования тикера
 }

// --- CRUD Операции ---
function handleSaveGpu(event) {
    event.preventDefault();
    const gpuId = gpuIdInput.value || `gpu_${Date.now()}`; // Генерируем ID если новый

    // Простая валидация
    if (!gpuNameInput.value || !gpuPowerInput.value || !gpuPriceInput.value) {
        alert("Заполните обязательные поля: Название, Мощность, Цена.");
        return;
    }


    gpuDefinitionsAdmin[gpuId] = {
        id: gpuId,
        name: gpuNameInput.value.trim(),
        hashrates: {
            ethash: parseFloat(gpuHashEthInput.value) || 0,
            sha256: parseFloat(gpuHashShaInput.value) || 0
        },
        power: parseInt(gpuPowerInput.value),
        price: parseInt(gpuPriceInput.value),
        imageUrl: gpuImageUrlInput.value.trim(),
        stock: parseInt(gpuStockInput.value) || 10,
        wearRate: parseFloat(gpuWearRateInput.value) || 0.1,
        requirements: gpuRequirementsInput.value.trim()
    };

    saveAdminDefinitions();
    renderGpuList();
    hideGpuForm();
}

function handleDeleteGpu(gpuId) {
    if (confirm(`Вы уверены, что хотите удалить видеокарту с ID: ${gpuId}?`)) {
        delete gpuDefinitionsAdmin[gpuId];
        saveAdminDefinitions();
        renderGpuList();
    }
}

 function handleSaveCrypto(event) {
     event.preventDefault();
     const ticker = cryptoTickerInput.value.toUpperCase().trim();
     const existingId = cryptoIdInput.value; // ID при редактировании

     if (!ticker || !cryptoNameInput.value || !cryptoBasePriceInput.value) {
         alert("Заполните обязательные поля: Тикер, Название, Базовая Цена.");
         return;
     }

     // Проверка на уникальность тикера при добавлении
     if (!existingId && cryptoDefinitionsAdmin[ticker]) {
         alert(`Криптовалюта с тикером ${ticker} уже существует!`);
         return;
     }

     cryptoDefinitionsAdmin[ticker] = {
         name: cryptoNameInput.value.trim(),
         ticker: ticker,
         algorithm: cryptoAlgorithmSelect.value,
         basePrice: parseFloat(cryptoBasePriceInput.value),
         volatility: parseFloat(cryptoVolatilityInput.value) || 0.1,
          // hashUnit: cryptoHashUnitInput.value.trim() || 'H/s' // Если добавлено поле
     };

     // Если это было редактирование и тикер НЕ менялся (он и не должен),
     // старое значение existingId совпадает с ticker.
     // Если бы мы разрешили менять тикер при редактировании, нужно было бы удалить старую запись:
     // if (existingId && existingId !== ticker) {
     //     delete cryptoDefinitionsAdmin[existingId];
     // }

     saveAdminDefinitions();
     renderCryptoList();
     hideCryptoForm();
 }


 function handleDeleteCrypto(ticker) {
     if (confirm(`Вы уверены, что хотите удалить криптовалюту ${ticker}?`)) {
         delete cryptoDefinitionsAdmin[ticker];
         saveAdminDefinitions();
         renderCryptoList();
     }
 }

// --- Сохранение Настроек ---
function handleSaveMarketSettings() {
    gameSettingsAdmin.botActivity = parseInt(botActivityInput.value);
    gameSettingsAdmin.restockFreq = parseInt(restockFreqInput.value);
    saveAdminDefinitions(); // Настройки сохраняются вместе с определениями
    alert("Настройки рынка сохранены!");
}

function handleSaveGameSettings() {
    gameSettingsAdmin.startCapital = parseInt(startCapitalInput.value);
    gameSettingsAdmin.energyCostPerKWh = parseFloat(energyCostInput.value);
    saveAdminDefinitions();
    alert("Общие настройки игры сохранены!");
}
