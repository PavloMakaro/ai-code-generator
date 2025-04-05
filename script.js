// --- DOM Элементы (Общие и Игровые) ---
const sections = document.querySelectorAll('.game-section');
const navButtons = document.querySelectorAll('.nav-button');
const marketTabs = document.querySelectorAll('.market-tab-button');
const marketTabContents = document.querySelectorAll('.market-tab-content');

// Dashboard Elements
const currentHashrateEl = document.getElementById('current-hashrate');
const currentPowerEl = document.getElementById('current-power');
const energyCostHourEl = document.getElementById('energy-cost-hour');
const fiatBalanceEl = document.getElementById('fiat-balance');
const btcBalanceEl = document.getElementById('btc-balance');
const ethBalanceEl = document.getElementById('eth-balance');
const btcPriceEl = document.getElementById('btc-price');
const ethPriceEl = document.getElementById('eth-price');
const logOutputEl = document.getElementById('log-output');
const sellAllCryptoBtn = document.getElementById('sell-all-crypto');
const farmOverviewEl = document.getElementById('farm-overview').querySelector('.rig-visualization');

// Market Elements
const newItemsContainer = document.getElementById('new-items-container');
const usedItemsContainer = document.getElementById('used-items-container');
const sellItemsContainer = document.getElementById('sell-items-container');
const sellForm = document.getElementById('sell-form');
const sellItemNameEl = document.getElementById('sell-item-name');
const sellItemPriceInput = document.getElementById('sell-item-price');
const confirmSellItemBtn = document.getElementById('confirm-sell-item');
const cancelSellItemBtn = document.getElementById('cancel-sell-item');

// Rig Management Elements
const rigDisplayEl = document.getElementById('rig-display');
const gpuInventoryListEl = document.getElementById('gpu-inventory-list');
const otherInventoryListEl = document.getElementById('other-inventory-list');
const itemActionsEl = document.getElementById('selected-item-actions');

// --- DOM Элементы Админки (теперь в основном файле) ---
const adminSectionContainer = document.getElementById('admin-panel-section'); // Вся секция админки
const loginSection = document.getElementById('login-section');
const adminPanel = document.getElementById('admin-panel'); // Основной контент админки
const loginForm = document.getElementById('login-form');
const adminPasswordInput = document.getElementById('admin-password');
const loginErrorEl = document.getElementById('login-error');
const logoutButton = document.getElementById('logout-button');

// GPU Management (Admin)
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
const gpuStockInput = document.getElementById('gpu-stock');
const gpuWearRateInput = document.getElementById('gpu-wear-rate');
const gpuRequirementsInput = document.getElementById('gpu-requirements');
const saveGpuButton = document.getElementById('save-gpu-button');
const cancelGpuButton = document.getElementById('cancel-gpu-button');

// Crypto Management (Admin)
const cryptoListEl = document.getElementById('crypto-list');
const addCryptoButton = document.getElementById('add-crypto-button');
const cryptoForm = document.getElementById('crypto-form');
const cryptoFormTitle = document.getElementById('crypto-form-title');
const cryptoIdInput = document.getElementById('crypto-id');
const cryptoNameInput = document.getElementById('crypto-name');
const cryptoTickerInput = document.getElementById('crypto-ticker');
const cryptoAlgorithmSelect = document.getElementById('crypto-algorithm');
const cryptoHashUnitInput = document.getElementById('crypto-hash-unit'); // Добавлено поле
const cryptoBasePriceInput = document.getElementById('crypto-base-price');
const cryptoVolatilityInput = document.getElementById('crypto-volatility');
const saveCryptoButton = document.getElementById('save-crypto-button');
const cancelCryptoButton = document.getElementById('cancel-crypto-button');

// Settings Management (Admin)
const botActivityInput = document.getElementById('market-bot-activity');
const restockFreqInput = document.getElementById('market-restock-freq');
const startCapitalInput = document.getElementById('game-start-capital');
const energyCostInput = document.getElementById('game-energy-cost');
const saveMarketSettingsBtn = document.getElementById('save-market-settings');
const saveGameSettingsBtn = document.getElementById('save-game-settings');

// --- ОБЩИЕ ДАННЫЕ: Состояние Игры, Определения, Настройки ---
let gameState = { /* ... (остается как было в script.js) ... */
    player: { money: 1000, crypto: { BTC: 0, ETH: 0 }, inventory: { gpu: [] } },
    rigs: [{ name: "Стойка 1", slots: [null, null, null, null] }],
    market: { used: [] },
    cryptoPrices: { BTC: 50000, ETH: 3000 },
    // settings удалено отсюда, будет в общем объекте gameSettings
    gameTime: 0,
    eventLog: ["Игра началась!"],
    nextItemId: 1,
    nextListingId: 1
};

// Определения и Настройки (теперь общие, управляются админкой)
let gpuDefinitions = {}; // Загружаются/Сохраняются через админ-функции
let cryptoDefinitions = {}; // Загружаются/Сохраняются через админ-функции
let gameSettings = {      // Загружаются/Сохраняются через админ-функции
    botActivity: 5,
    restockFreq: 60, // в тиках/секундах
    startCapital: 1000,
    energyCostPerKWh: 0.15
};

const ADMIN_PASSWORD = 'qwe123'; // Пароль доступа

// --- Переменные для управления UI (остаются как были) ---
let selectedInventoryItem = null;
let selectedRigSlot = { rigIndex: -1, slotIndex: -1 };
let itemToSell = null;

// --- Инициализация Игры ---
document.addEventListener('DOMContentLoaded', initGame);

function initGame() {
    console.log("Инициализация игры...");
    loadAdminDefinitionsAndSettings(); // ЗАГРУЖАЕМ ОПРЕДЕЛЕНИЯ И НАСТРОЙКИ СНАЧАЛА
    loadGame();                     // Загружаем прогресс игрока (может зависеть от настроек)

    setupEventListeners();         // Основные игровые обработчики
    setupAdminEventListeners();    // Обработчики для админки

    updateUI();                    // Первоначальное отображение
    setInterval(gameTick, 1000);   // Запускаем игровой цикл
    console.log("Игра инициализирована.");
}

// --- Загрузка/Сохранение Данных ---

// Загружает определения и настройки (раньше было в admin.js и частично в script.js)
function loadAdminDefinitionsAndSettings() {
    const loadedGpuDefs = localStorage.getItem('cryptoTycoonGpuDefs');
    const loadedCryptoDefs = localStorage.getItem('cryptoTycoonCryptoDefs');
    const loadedSettings = localStorage.getItem('cryptoTycoonSettings');

    // Загрузка GPU
    if (loadedGpuDefs) {
        gpuDefinitions = JSON.parse(loadedGpuDefs);
    } else {
        // Дефолтные GPU
        gpuDefinitions = {
           'gpu-gtx1060': { id: 'gpu-gtx1060', name: "GTX 1060 6GB", hashrates: { ethash: 22, sha256: 0.3 }, power: 120, price: 200, imageUrl: "https://via.placeholder.com/150/CCCCCC/808080?text=GTX1060", requirements: "PCIe x16", wearRate: 0.1 },
           'gpu-rx580':   { id: 'gpu-rx580', name: "RX 580 8GB", hashrates: { ethash: 30, sha256: 0.4 }, power: 180, price: 250, imageUrl: "https://via.placeholder.com/150/FF7F7F/FFFFFF?text=RX580", requirements: "PCIe x16, 8pin", wearRate: 0.12 },
           'gpu-rtx3080': { id: 'gpu-rtx3080', name: "RTX 3080", hashrates: { ethash: 95, sha256: 1.2 }, power: 320, price: 1200, imageUrl: "https://via.placeholder.com/150/90EE90/000000?text=RTX3080", requirements: "PCIe x16, 2x8pin", wearRate: 0.08 },
        };
    }

    // Загрузка Криптовалют
    if (loadedCryptoDefs) {
        cryptoDefinitions = JSON.parse(loadedCryptoDefs);
    } else {
        // Дефолтные Крипты
        cryptoDefinitions = {
            'BTC': { name: "Bitcoin", ticker: "BTC", algorithm: "sha256", basePrice: 50000, volatility: 0.1, hashUnit: 'GH/s' },
            'ETH': { name: "Ethereum", ticker: "ETH", algorithm: "ethash", basePrice: 3000, volatility: 0.15, hashUnit: 'MH/s' },
        };
    }

    // Загрузка Настроек
    if (loadedSettings) {
        // Обновляем gameSettings загруженными значениями, сохраняя дефолтные, если что-то отсутствует
        gameSettings = { ...gameSettings, ...JSON.parse(loadedSettings) };
    }

    // Если нет сохраненных данных, сохраняем дефолтные
    if (!loadedGpuDefs || !loadedCryptoDefs || !loadedSettings) {
        saveAdminDefinitionsAndSettings();
    }

    console.log("Определения и настройки загружены/установлены.");
}

// Сохраняет определения и настройки (раньше было в admin.js)
function saveAdminDefinitionsAndSettings() {
    localStorage.setItem('cryptoTycoonGpuDefs', JSON.stringify(gpuDefinitions));
    localStorage.setItem('cryptoTycoonCryptoDefs', JSON.stringify(cryptoDefinitions));
    localStorage.setItem('cryptoTycoonSettings', JSON.stringify(gameSettings));
    console.log("Админ данные (определения и настройки) сохранены в localStorage.");
}


function loadGame() {
    const savedState = localStorage.getItem('cryptoTycoonSave');
    if (savedState) {
        gameState = JSON.parse(savedState);
        console.log("Сохраненная игра загружена.");
        // Валидация и инициализация отсутствующих полей
        gameState.eventLog = gameState.eventLog || [];
        gameState.market = gameState.market || { used: [] };
        gameState.rigs = gameState.rigs || [{ name: "Стойка 1", slots: [null, null, null, null] }];
        gameState.player.inventory.gpu = gameState.player.inventory.gpu || [];
        gameState.player.crypto = gameState.player.crypto || {};
        // Инициализация балансов для крипт из определений, если их нет в сейве
        Object.keys(cryptoDefinitions).forEach(ticker => {
            if (gameState.player.crypto[ticker] === undefined) {
                gameState.player.crypto[ticker] = 0;
            }
            if (gameState.cryptoPrices[ticker] === undefined) {
                 gameState.cryptoPrices[ticker] = cryptoDefinitions[ticker]?.basePrice || 1;
            }
        });

    } else {
        console.log("Сохраненная игра не найдена, используется начальное состояние.");
        // Устанавливаем стартовый капитал из настроек
        gameState.player.money = gameSettings.startCapital || 1000;
         // Устанавливаем начальные цены и балансы из определений
         Object.values(cryptoDefinitions).forEach(crypto => {
            gameState.cryptoPrices[crypto.ticker] = crypto.basePrice || 1;
            gameState.player.crypto[crypto.ticker] = 0;
         });
         addLog("Добро пожаловать! Начните строить свою ферму.");
    }
     // Очищаем лог при загрузке
     if (gameState.eventLog.length > 50) {
         gameState.eventLog = gameState.eventLog.slice(-50);
     }
}

function saveGame() {
    localStorage.setItem('cryptoTycoonSave', JSON.stringify(gameState));
    // console.log("Игра сохранена.");
}

// --- Игровой Цикл (Выполняется каждую секунду) ---
function gameTick() {
    gameState.gameTime++;
    updateMining();
    updateEnergyCost();
    updateWearAndTear();
    updateCryptoPrices();
    if (gameState.gameTime % gameSettings.restockFreq === 0) { // Используем частоту из настроек
        simulateUsedMarket();
    }
    if (gameState.gameTime % 30 === 0) { triggerRandomEvent(); }
    if (gameState.gameTime % 2 === 0) { updateUI(); }
    if (gameState.gameTime % 15 === 0) { saveGame(); }
}

// --- Основные Игровые Механики ---

function calculateTotalHashrate() {
    let totalHashrate = {}; // { ethash: 0, sha256: 0, ... }
    Object.keys(cryptoDefinitions).forEach(ticker => {
        totalHashrate[cryptoDefinitions[ticker].algorithm] = 0; // Инициализируем нулями для всех известных алгоритмов
    });

    for (const rig of gameState.rigs) {
        for (const gpu of rig.slots) {
            if (gpu && gpuDefinitions[gpu.definitionId]) {
                const def = gpuDefinitions[gpu.definitionId];
                const wearFactor = 1 - (gpu.wear / 150);
                for (const algo in def.hashrates) {
                    if (totalHashrate[algo] !== undefined) { // Считаем только для известных алгоритмов
                        totalHashrate[algo] += def.hashrates[algo] * Math.max(0.1, wearFactor);
                    }
                }
            }
        }
    }
    return totalHashrate;
}

function calculateTotalPower() { /* ... (остается как было) ... */
    let totalPower = 0;
    for (const rig of gameState.rigs) {
        for (const gpu of rig.slots) {
            if (gpu && gpuDefinitions[gpu.definitionId]) {
                totalPower += gpuDefinitions[gpu.definitionId].power;
            }
        }
    }
    return totalPower;
}

function updateMining() { /* ... (остается как было) ... */
    const hashrates = calculateTotalHashrate();
    for (const ticker in cryptoDefinitions) {
        const cryptoDef = cryptoDefinitions[ticker];
        const algo = cryptoDef.algorithm;
        if (hashrates[algo] && hashrates[algo] > 0) {
            const earnRate = 0.0000001; // Коэффициент нужно тщательно настроить!
            const earned = hashrates[algo] * earnRate;
            if (gameState.player.crypto[ticker] === undefined) gameState.player.crypto[ticker] = 0;
            gameState.player.crypto[ticker] += earned;
        }
    }
}

function updateEnergyCost() { /* Используем gameSettings */
    const totalPowerW = calculateTotalPower();
    const totalPowerKW = totalPowerW / 1000;
    const costPerSecond = (totalPowerKW * gameSettings.energyCostPerKWh) / 3600;
    gameState.player.money -= costPerSecond;
    if (gameState.player.money < 0) {
        gameState.player.money = 0;
        addLog("Недостаточно средств для оплаты электроэнергии!", "error");
        // TODO: Остановить майнинг?
    }
}

function updateWearAndTear() { /* ... (остается как было) ... */
    for (const rig of gameState.rigs) {
        for (const gpu of rig.slots) {
            if (gpu && gpuDefinitions[gpu.definitionId]) {
                const def = gpuDefinitions[gpu.definitionId];
                gpu.wear += (def.wearRate || 0.05) * 0.1;
                if (gpu.wear >= 100 && Math.random() < 0.01) {
                    addLog(`Видеокарта ${def.name} (ID: ${gpu.id}) СЛОМАЛАСЬ из-за износа!`, "error");
                    // TODO: Реализовать поломку (удаление или статус 'broken')
                     // Например, найти и удалить:
                    // rig.slots[rig.slots.indexOf(gpu)] = null; // Удаляем из слота
                    // updateUI(); // Нужно обновить UI после удаления
                }
            }
        }
    }
}

function updateCryptoPrices() { /* ... (использует cryptoDefinitions) ... */
    for (const ticker in gameState.cryptoPrices) {
        if (cryptoDefinitions[ticker]) {
            const volatility = cryptoDefinitions[ticker].volatility || 0.1;
            const changePercent = (Math.random() - 0.5) * volatility * 0.1;
            gameState.cryptoPrices[ticker] *= (1 + changePercent);
            if (gameState.cryptoPrices[ticker] < 0.01) gameState.cryptoPrices[ticker] = 0.01;
        } else {
            // Если крипта была удалена в админке, удаляем и ее цену
             delete gameState.cryptoPrices[ticker];
        }
    }
}

function simulateUsedMarket() { /* Используем gameSettings */
    const botActivity = gameSettings.botActivity || 5;
    if (Math.random() < botActivity / 20) {
        const availableGpuDefs = Object.values(gpuDefinitions);
        if (availableGpuDefs.length === 0) return;

        const randomDef = availableGpuDefs[Math.floor(Math.random() * availableGpuDefs.length)];
        const wear = Math.random() * 50;
        const price = randomDef.price * (0.8 - wear / 150) * (0.8 + Math.random() * 0.4);

        const newItem = { id: `bot_gpu_${gameState.nextItemId++}`, definitionId: randomDef.id, wear: wear };
        const newListing = {
             listingId: `used_${gameState.nextListingId++}`,
             item: newItem,
             price: Math.max(10, Math.round(price)),
             seller: `MinerBot_${Math.floor(Math.random() * 100)}`
        };
        gameState.market.used.push(newListing);
        // addLog(`Новое предложение на Б/У рынке: ${randomDef.name} за $${newListing.price}`); // Можно раскомментировать
    }
    if (gameState.market.used.length > 20 + botActivity * 2) {
        gameState.market.used.shift();
    }
}

function triggerRandomEvent() { /* ... (остается как было) ... */
    const rand = Math.random();
    if (rand < 0.1 && Object.keys(cryptoDefinitions).length > 0) {
        const cryptoTickers = Object.keys(cryptoDefinitions);
        const randomTicker = cryptoTickers[Math.floor(Math.random() * cryptoTickers.length)];
        const change = (Math.random() - 0.4) * 0.5;
        gameState.cryptoPrices[randomTicker] *= (1 + change);
        if (gameState.cryptoPrices[randomTicker] < 0.01) gameState.cryptoPrices[randomTicker] = 0.01;
        addLog(`Рыночное колебание! Цена ${randomTicker} изменилась на ${(change * 100).toFixed(1)}%. Текущая цена: $${gameState.cryptoPrices[randomTicker]?.toFixed(2) || 'N/A'}`, change > 0 ? "success" : "warning");
    }
}


// --- Обновление Интерфейса (UI) ---

function updateUI() {
    // Dashboard
    const totalHash = calculateTotalHashrate();
    let hashString = Object.entries(totalHash)
        .filter(([algo, rate]) => rate > 0) // Показываем только ненулевые
        .map(([algo, rate]) => {
             const cryptoDef = Object.values(cryptoDefinitions).find(c => c.algorithm === algo);
             return `${algo}: ${formatHashrate(rate, cryptoDef?.hashUnit || 'H/s')}`;
        })
        .join(', ') || '0 H/s';
    currentHashrateEl.textContent = hashString;

    const totalPower = calculateTotalPower();
    currentPowerEl.textContent = totalPower.toFixed(0);
    energyCostHourEl.textContent = ((totalPower / 1000) * gameSettings.energyCostPerKWh).toFixed(3); // Стоимость в час
    fiatBalanceEl.textContent = Math.floor(gameState.player.money).toLocaleString();

    // Обновление всех балансов и цен криптовалют динамически
    Object.keys(cryptoDefinitions).forEach(ticker => {
        const crypto = cryptoDefinitions[ticker];
        // Баланс
        const balanceEl = document.getElementById(`${ticker.toLowerCase()}-balance`);
        if (balanceEl) {
             balanceEl.textContent = (gameState.player.crypto[ticker] || 0).toFixed(6);
        } else { // Если элемента нет, но крипта есть, создаем его (например, в статистике)
            const statsList = document.getElementById('main-stats')?.querySelector('ul');
             if (statsList && !document.getElementById(`${ticker.toLowerCase()}-balance`)) {
                 const li = document.createElement('li');
                 li.innerHTML = `Добыто ${ticker}: <span id="${ticker.toLowerCase()}-balance">0.000000</span>`;
                 statsList.appendChild(li);
             }
        }
        // Цена
        const priceEl = document.getElementById(`${ticker.toLowerCase()}-price`);
         if (priceEl) {
             priceEl.textContent = (gameState.cryptoPrices[ticker] || crypto.basePrice || 0).toFixed(2);
         } else { // Если элемента нет, создаем (например, в курсах)
            const pricesDiv = document.getElementById('crypto-prices')?.querySelector('.crypto-chart-placeholder');
             if (pricesDiv && !document.getElementById(`${ticker.toLowerCase()}-price`)) {
                 const p = document.createElement('p');
                 p.innerHTML = `График ${ticker}/USD: $<span id="${ticker.toLowerCase()}-price">0.00</span>`;
                 pricesDiv.appendChild(p);
             }
         }
    });
    // Удалить элементы для крипт, которых больше нет в определениях
    document.querySelectorAll('#main-stats span[id$="-balance"]').forEach(el => {
        const ticker = el.id.replace('-balance','').toUpperCase();
        if (!cryptoDefinitions[ticker]) el.closest('li')?.remove();
    });
     document.querySelectorAll('#crypto-prices span[id$="-price"]').forEach(el => {
        const ticker = el.id.replace('-price','').toUpperCase();
        if (!cryptoDefinitions[ticker]) el.closest('p')?.remove();
    });


    // Лог событий
    logOutputEl.innerHTML = gameState.eventLog.map(msg => `<li>${msg}</li>`).join('');
    logOutputEl.scrollTop = logOutputEl.scrollHeight;

    // Рынок
    renderMarket(); // Использует общие gpuDefinitions

    // Управление Фермой
    renderRigs();
    renderInventory();
    updateActionButtons();
}

function formatHashrate(rate, unit = 'H/s') {
    if (!rate || rate < 0.001) return `0 ${unit}`;
    return `${rate.toFixed(2)} ${unit}`;
}

function renderMarket() { /* Использует общие gpuDefinitions */
    // Новые товары
    newItemsContainer.innerHTML = '';
    Object.values(gpuDefinitions).forEach(def => { // Теперь итерируем по значениям
        // Собираем строку с хешрейтами
        let hashrateString = Object.entries(def.hashrates || {})
            .map(([algo, rate]) => {
                 const cryptoDef = Object.values(cryptoDefinitions).find(c => c.algorithm === algo);
                 return `<p>Хешрейт (${algo}): <span>${formatHashrate(rate, cryptoDef?.hashUnit || 'H/s')}</span></p>`;
            }).join('');
        if (!hashrateString) hashrateString = '<p>Хешрейт: <span>N/A</span></p>';

        const cardHtml = `
            <div class="market-listing-card new-gpu">
                <img src="${def.imageUrl || 'placeholder-gpu.png'}" alt="${def.name}" class="gpu-image">
                <div class="gpu-info">
                    <h3>${def.name}</h3>
                    ${hashrateString}
                    <p>Потребление: <span>${def.power} W</span></p>
                    <p>Требования: <span>${def.requirements || 'Нет данных'}</span></p>
                </div>
                <div class="gpu-price-action">
                    <p class="price">$${def.price.toLocaleString()}</p>
                    <button class="buy-button" data-item-id="${def.id}" data-type="new">Купить</button>
                </div>
            </div>`;
        newItemsContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
    if (Object.keys(gpuDefinitions).length === 0) {
        newItemsContainer.innerHTML = '<p>Нет данных о видеокартах. Зайдите в админку и добавьте их.</p>';
    }

    // Б/У товары
    usedItemsContainer.innerHTML = '';
    gameState.market.used.forEach(listing => {
        const def = gpuDefinitions[listing.item.definitionId];
        if (!def) return;

        const wearFactor = 1 - (listing.item.wear / 150);
        // Собираем строку с хешрейтами для Б/У
        let usedHashrateString = Object.entries(def.hashrates || {})
             .map(([algo, rate]) => {
                 const cryptoDef = Object.values(cryptoDefinitions).find(c => c.algorithm === algo);
                 const currentRate = rate * Math.max(0.1, wearFactor);
                 return `<p>Хешрейт (${algo}): ~<span>${formatHashrate(currentRate, cryptoDef?.hashUnit || 'H/s')}</span></p>`;
             }).join('');
         if (!usedHashrateString) usedHashrateString = '<p>Хешрейт: <span>N/A</span></p>';

        const cardHtml = `
            <div class="market-listing-card used-gpu">
                <img src="${def.imageUrl || 'placeholder-gpu.png'}" alt="${def.name}" class="gpu-image">
                <div class="gpu-info">
                    <h3>${def.name}</h3>
                    ${usedHashrateString}
                    <p>Износ: <span class="wear-tear">${listing.item.wear.toFixed(1)}%</span></p>
                    <p>Потребление: <span>${def.power} W</span></p>
                    <p>Продавец: <span class="seller-name">${listing.seller}</span></p>
                </div>
                <div class="gpu-price-action">
                    <p class="price">$${listing.price.toLocaleString()}</p>
                    <button class="buy-button" data-item-id="${listing.listingId}" data-type="used">Купить</button>
                </div>
            </div>`;
        usedItemsContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
    if (gameState.market.used.length === 0) {
        usedItemsContainer.innerHTML = '<p>На Б/У рынке пока пусто...</p>';
    }

    // Товары игрока на продажу
    renderPlayerSellList();
}

function renderPlayerSellList() { /* Использует общие gpuDefinitions */
    sellItemsContainer.innerHTML = '';
    gameState.player.inventory.gpu.forEach(gpu => {
        const def = gpuDefinitions[gpu.definitionId];
        if (!def) return;
        const cardHtml = `
             <div class="market-listing-card player-gpu-for-sale">
                 <img src="${def.imageUrl || 'placeholder-gpu.png'}" alt="${def.name}" class="gpu-image">
                 <div class="gpu-info">
                     <h3>${def.name} (ID: ${gpu.id})</h3>
                     <p>Износ: <span class="wear-tear">${gpu.wear.toFixed(1)}%</span></p>
                 </div>
                 <div class="gpu-price-action">
                    <button class="sell-action-button" data-item-id="${gpu.id}">Выставить</button>
                 </div>
             </div>`;
        sellItemsContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
    if (gameState.player.inventory.gpu.length === 0) {
        sellItemsContainer.innerHTML = '<p>У вас нет видеокарт в инвентаре для продажи.</p>';
    }
}

function renderRigs() { /* ... (остается как было) ... */
    rigDisplayEl.innerHTML = '<h3>Ваши Стойки/Корпуса</h3>';
    if (gameState.rigs.length === 0) {
         rigDisplayEl.innerHTML += '<p>У вас пока нет стоек.</p><button id="add-rig-btn">Добавить стойку</button>'; // Добавим кнопку
         // Обработчик для новой кнопки нужно добавить в setupEventListeners
         const addRigBtn = document.getElementById('add-rig-btn');
         if (addRigBtn) addRigBtn.addEventListener('click', handleAddRig);
         return;
     }
    gameState.rigs.forEach((rig, rigIndex) => {
        const rigDiv = document.createElement('div');
        rigDiv.classList.add('rig-container');
        rigDiv.innerHTML = `<h4>${rig.name}</h4>`;
        rig.slots.forEach((gpu, slotIndex) => {
            const slotDiv = document.createElement('div');
            slotDiv.classList.add('rig-slot');
            slotDiv.dataset.rigIndex = rigIndex;
            slotDiv.dataset.slotIndex = slotIndex;
            const isSelected = selectedRigSlot.rigIndex === rigIndex && selectedRigSlot.slotIndex === slotIndex;
            if (isSelected) slotDiv.classList.add('selected');
            if (gpu) {
                const def = gpuDefinitions[gpu.definitionId];
                slotDiv.classList.add('occupied');
                slotDiv.innerHTML = `<b>${def ? def.name : 'Неизвестно'} (ID: ${gpu.id})</b><br>Износ: ${gpu.wear.toFixed(1)}%`;
            } else {
                slotDiv.textContent = `Слот ${slotIndex + 1} (пусто)`;
            }
            rigDiv.appendChild(slotDiv);
        });
        rigDisplayEl.appendChild(rigDiv);
    });
     // Кнопка добавления стойки (если они уже есть)
     rigDisplayEl.insertAdjacentHTML('beforeend', '<button id="add-rig-btn" style="margin-top: 15px;">Добавить стойку</button>');
     const addRigBtn = document.getElementById('add-rig-btn');
     if (addRigBtn) addRigBtn.addEventListener('click', handleAddRig);
}

function renderInventory() { /* ... (остается как было) ... */
    gpuInventoryListEl.innerHTML = '';
    gameState.player.inventory.gpu.forEach(gpu => {
        const def = gpuDefinitions[gpu.definitionId];
        const li = document.createElement('li');
        li.textContent = `${def ? def.name : 'Неизвестно'} (ID: ${gpu.id}, Износ: ${gpu.wear.toFixed(1)}%)`;
        li.dataset.itemId = gpu.id;
        li.dataset.itemType = 'gpu';
        if (selectedInventoryItem && selectedInventoryItem.id === gpu.id) {
            li.classList.add('selected');
        }
        gpuInventoryListEl.appendChild(li);
    });
    if (gameState.player.inventory.gpu.length === 0) {
        gpuInventoryListEl.innerHTML = '<li>Нет карт в инвентаре</li>';
    }
    // otherInventoryListEl пока не используется активно
}

function updateActionButtons() { /* ... (остается как было) ... */
    itemActionsEl.innerHTML = '<h3>Действия с Выбранным</h3>';
    const hasSelectedSlot = selectedRigSlot.rigIndex !== -1;
    const hasSelectedItem = selectedInventoryItem !== null;
    const isSlotSelected = hasSelectedSlot && selectedRigSlot.slotIndex !== -1; // Уточнили проверку слота
    const selectedSlotIsEmpty = isSlotSelected && gameState.rigs[selectedRigSlot.rigIndex].slots[selectedRigSlot.slotIndex] === null;
    const selectedSlotIsOccupied = isSlotSelected && !selectedSlotIsEmpty;

    if (selectedSlotIsEmpty && hasSelectedItem && selectedInventoryItem.type === 'gpu') {
        const installBtn = createActionButton('install-gpu', 'Установить Карту', handleInstallGpu);
        itemActionsEl.appendChild(installBtn);
    }
    if (selectedSlotIsOccupied) {
        const gpuInSlot = gameState.rigs[selectedRigSlot.rigIndex].slots[selectedRigSlot.slotIndex];
        const removeBtn = createActionButton('remove-gpu', 'Снять Карту', handleRemoveGpu);
        removeBtn.style.backgroundColor = 'var(--error-color)';
        itemActionsEl.appendChild(removeBtn);

        if (gpuInSlot.wear > 10) {
            const repairCost = calculateRepairCost(gpuInSlot);
            const repairBtn = createActionButton('repair-gpu', `Ремонтировать ($${repairCost})`, handleRepairGpu);
            repairBtn.style.backgroundColor = 'var(--warning-color)';
            if (gameState.player.money < repairCost) repairBtn.disabled = true;
            itemActionsEl.appendChild(repairBtn);
        }
    }
    if (!isSlotSelected && !hasSelectedItem) {
        itemActionsEl.insertAdjacentHTML('beforeend', '<p>Выберите слот на ферме или предмет в инвентаре.</p>');
    }
}

function createActionButton(id, text, handler) { /* ... (остается как было) ... */
    const button = document.createElement('button');
    button.id = id;
    button.textContent = text;
    button.addEventListener('click', handler);
    return button;
}

function calculateRepairCost(gpu) { /* Использует общие gpuDefinitions */
    if (!gpu || !gpuDefinitions[gpu.definitionId]) return 0;
    const def = gpuDefinitions[gpu.definitionId];
    return Math.round(def.price * 0.05 + def.price * (gpu.wear / 500));
}


// --- Обработчики Событий (Игровые) ---

function setupEventListeners() {
    // Навигация по секциям (обновленная)
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSectionId = button.dataset.section;

            // Скрываем все секции
            sections.forEach(section => section.classList.remove('active-section'));

            // Показываем нужную секцию
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                targetSection.classList.add('active-section');
            }

            // Обновляем активную кнопку
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Логика для админки при переключении на нее
            if (targetSectionId === 'admin-panel-section') {
                const isAdminPanelVisible = adminPanel.style.display === 'block';
                loginSection.style.display = isAdminPanelVisible ? 'none' : 'block';
                // adminPanel остается видимым, если уже был залогинен
            }
        });
    });

    // Переключение вкладок на рынке
    marketTabs.forEach(button => { /* ... (остается как было) ... */
        button.addEventListener('click', () => {
            const targetTabId = button.dataset.marketTab;
            marketTabContents.forEach(content => content.classList.toggle('active', content.id === `market-${targetTabId}`));
            marketTabs.forEach(btn => btn.classList.toggle('active', btn === button));
        });
    });

    // Делегирование кликов для кнопок Купить/Выставить
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('buy-button')) {
            const itemId = event.target.dataset.itemId;
            const type = event.target.dataset.type;
            handleBuyItem(itemId, type);
        }
         else if (event.target.classList.contains('sell-action-button')) {
             const gpuId = event.target.dataset.itemId;
             handleInitiateSell(gpuId);
         }
    });

     // Форма продажи
     confirmSellItemBtn.addEventListener('click', handleConfirmSell);
     cancelSellItemBtn.addEventListener('click', handleCancelSell);

    // Клик по слоту на ферме
    rigDisplayEl.addEventListener('click', (event) => { /* ... (остается как было) ... */
        const slot = event.target.closest('.rig-slot');
        if (slot) {
            handleSelectSlot(parseInt(slot.dataset.rigIndex), parseInt(slot.dataset.slotIndex));
        }
         // Обработчик кнопки добавления стойки (если она отрендерилась)
         if (event.target.id === 'add-rig-btn') {
             handleAddRig();
         }
    });

    // Клик по предмету в инвентаре
    gpuInventoryListEl.addEventListener('click', (event) => { /* ... (остается как было) ... */
        const itemLi = event.target.closest('li');
        if (itemLi && itemLi.dataset.itemId) {
            handleSelectInventoryItem(itemLi.dataset.itemId, 'gpu');
        }
    });

    // Продажа крипты
    sellAllCryptoBtn.addEventListener('click', handleSellAllCrypto);
}

// Игровые действия
function handleBuyItem(itemId, type) { /* Использует общие gpuDefinitions */
    let itemDefinitionOrListing;
    let price;
    let itemToBuy = null; // Конкретный экземпляр для Б/У

    if (type === 'new') {
        itemDefinitionOrListing = gpuDefinitions[itemId];
        if (!itemDefinitionOrListing) { addLog("Ошибка: Товар не найден.", "error"); return; }
        price = itemDefinitionOrListing.price;
    } else { // used
        itemDefinitionOrListing = gameState.market.used.find(l => l.listingId === itemId);
        if (!itemDefinitionOrListing) { addLog("Ошибка: Предложение на Б/У рынке не найдено.", "error"); return; }
        const def = gpuDefinitions[itemDefinitionOrListing.item.definitionId];
        if (!def) { addLog("Ошибка: Определение Б/У товара не найдено.", "error"); return; }
        price = itemDefinitionOrListing.price;
        itemToBuy = itemDefinitionOrListing.item; // Конкретный Б/У экземпляр
    }

    if (gameState.player.money >= price) {
        gameState.player.money -= price;
        const definitionForInstance = type === 'new' ? itemDefinitionOrListing : gpuDefinitions[itemToBuy.definitionId];
        const newGpuInstance = {
            id: itemToBuy ? itemToBuy.id : `gpu_${gameState.nextItemId++}`,
            definitionId: definitionForInstance.id,
            wear: itemToBuy ? itemToBuy.wear : 0
        };
        gameState.player.inventory.gpu.push(newGpuInstance);

        if (type === 'used') {
            gameState.market.used = gameState.market.used.filter(l => l.listingId !== itemId);
        }
        addLog(`Куплена ${definitionForInstance.name} за $${price.toLocaleString()}`, "success");
        updateUI();
    } else {
        addLog("Недостаточно средств!", "warning");
    }
}

function handleInitiateSell(gpuId) { /* ... (остается как было) ... */
    itemToSell = gameState.player.inventory.gpu.find(gpu => gpu.id === gpuId);
    if (!itemToSell || !gpuDefinitions[itemToSell.definitionId]) return;
    const def = gpuDefinitions[itemToSell.definitionId];
    sellItemNameEl.textContent = `${def.name} (ID: ${itemToSell.id}, Износ: ${itemToSell.wear.toFixed(1)}%)`;
    const suggestedPrice = Math.round(def.price * (0.7 - itemToSell.wear / 200));
    sellItemPriceInput.value = Math.max(1, suggestedPrice);
    sellForm.style.display = 'block';
    sellItemPriceInput.focus();
}

function handleConfirmSell() { /* ... (остается как было) ... */
    if (!itemToSell || !gpuDefinitions[itemToSell.definitionId]) return;
    const price = parseInt(sellItemPriceInput.value);
    if (isNaN(price) || price <= 0) { addLog("Введите корректную цену.", "warning"); return; }
    gameState.player.inventory.gpu = gameState.player.inventory.gpu.filter(gpu => gpu.id !== itemToSell.id);
    const newListing = {
        listingId: `used_${gameState.nextListingId++}`,
        item: itemToSell,
        price: price,
        seller: "Вы"
    };
    gameState.market.used.push(newListing);
    addLog(`${gpuDefinitions[itemToSell.definitionId].name} выставлена на продажу за $${price.toLocaleString()}`, "success");
    itemToSell = null;
    sellForm.style.display = 'none';
    updateUI();
}

function handleCancelSell() { /* ... (остается как было) ... */
    itemToSell = null;
    sellForm.style.display = 'none';
}

function handleSelectSlot(rigIndex, slotIndex) { /* ... (остается как было) ... */
    selectedInventoryItem = null;
    document.querySelectorAll('#gpu-inventory-list li.selected').forEach(el => el.classList.remove('selected'));
    const prevSelected = document.querySelector('.rig-slot.selected');
    if (prevSelected) prevSelected.classList.remove('selected');
    selectedRigSlot = { rigIndex, slotIndex };
    const newSelected = document.querySelector(`.rig-slot[data-rig-index="${rigIndex}"][data-slot-index="${slotIndex}"]`);
    if (newSelected) newSelected.classList.add('selected');
    updateActionButtons();
}

function handleSelectInventoryItem(itemId, itemType) { /* ... (остается как было) ... */
    selectedRigSlot = { rigIndex: -1, slotIndex: -1 };
    document.querySelectorAll('.rig-slot.selected').forEach(el => el.classList.remove('selected'));
    const prevSelected = document.querySelector('#gpu-inventory-list li.selected');
    if (prevSelected) prevSelected.classList.remove('selected');
    if (itemType === 'gpu') {
        selectedInventoryItem = gameState.player.inventory.gpu.find(gpu => gpu.id === itemId);
        if (selectedInventoryItem) selectedInventoryItem.type = 'gpu';
    }
    const newSelected = document.querySelector(`#gpu-inventory-list li[data-item-id="${itemId}"]`);
    if (newSelected) newSelected.classList.add('selected');
    updateActionButtons();
}

function handleInstallGpu() { /* ... (остается как было) ... */
    if (!selectedInventoryItem || selectedInventoryItem.type !== 'gpu' || selectedRigSlot.rigIndex === -1 || selectedRigSlot.slotIndex === -1) {
         addLog("Ошибка: не выбрана карта или слот.", "error"); return;
    }
    const rigIndex = selectedRigSlot.rigIndex;
    const slotIndex = selectedRigSlot.slotIndex;
    if (gameState.rigs[rigIndex].slots[slotIndex] !== null) {
        addLog("Слот уже занят!", "warning"); return;
    }
    gameState.rigs[rigIndex].slots[slotIndex] = selectedInventoryItem;
    gameState.player.inventory.gpu = gameState.player.inventory.gpu.filter(gpu => gpu.id !== selectedInventoryItem.id);
    addLog(`${gpuDefinitions[selectedInventoryItem.definitionId].name} установлена в Стойку ${rigIndex + 1}, Слот ${slotIndex + 1}`, "success");
    selectedInventoryItem = null;
    selectedRigSlot = { rigIndex: -1, slotIndex: -1 };
    updateUI();
}

function handleRemoveGpu() { /* ... (остается как было) ... */
    if (selectedRigSlot.rigIndex === -1 || selectedRigSlot.slotIndex === -1) {
        addLog("Ошибка: не выбран слот.", "error"); return;
    }
    const rigIndex = selectedRigSlot.rigIndex;
    const slotIndex = selectedRigSlot.slotIndex;
    const gpuToRemove = gameState.rigs[rigIndex].slots[slotIndex];
    if (!gpuToRemove) { addLog("Слот пуст.", "warning"); return; }
    gameState.player.inventory.gpu.push(gpuToRemove);
    gameState.rigs[rigIndex].slots[slotIndex] = null;
    addLog(`${gpuDefinitions[gpuToRemove.definitionId].name} снята из Стойки ${rigIndex + 1}, Слот ${slotIndex + 1}`, "success");
    selectedRigSlot = { rigIndex: -1, slotIndex: -1 };
    updateUI();
}

function handleRepairGpu() { /* ... (остается как было) ... */
    if (selectedRigSlot.rigIndex === -1 || selectedRigSlot.slotIndex === -1) {
        addLog("Ошибка: не выбран слот.", "error"); return;
    }
    const rigIndex = selectedRigSlot.rigIndex;
    const slotIndex = selectedRigSlot.slotIndex;
    const gpuToRepair = gameState.rigs[rigIndex].slots[slotIndex];
    if (!gpuToRepair) { addLog("Слот пуст.", "warning"); return; }
    const repairCost = calculateRepairCost(gpuToRepair);
    if (gameState.player.money >= repairCost) {
        gameState.player.money -= repairCost;
        const wearReduction = gpuToRepair.wear * (0.5 + Math.random() * 0.4);
        gpuToRepair.wear = Math.max(0, gpuToRepair.wear - wearReduction);
        addLog(`${gpuDefinitions[gpuToRepair.definitionId].name} отремонтирована за $${repairCost}. Износ: ${gpuToRepair.wear.toFixed(1)}%`, "success");
        updateUI();
    } else {
        addLog(`Недостаточно средств для ремонта ($${repairCost})`, "warning");
    }
}

function handleSellAllCrypto() { /* ... (остается как было) ... */
    let totalEarned = 0;
    for (const ticker in gameState.player.crypto) {
        if (gameState.player.crypto[ticker] > 0 && gameState.cryptoPrices[ticker]) {
            totalEarned += gameState.player.crypto[ticker] * gameState.cryptoPrices[ticker];
            gameState.player.crypto[ticker] = 0;
        }
    }
    if (totalEarned > 0) {
        gameState.player.money += totalEarned;
        addLog(`Вся криптовалюта продана за $${totalEarned.toFixed(2)}`, "success");
        updateUI();
    } else {
        addLog("Нет криптовалюты для продажи.", "info");
    }
}

function handleAddRig() {
     // Примерная стоимость стойки
     const rigCost = 50;
     if (gameState.player.money >= rigCost) {
         gameState.player.money -= rigCost;
         const newRigName = `Стойка ${gameState.rigs.length + 1}`;
         // Добавляем стойку с N слотами (например, 6)
         gameState.rigs.push({ name: newRigName, slots: Array(6).fill(null) });
         addLog(`Куплена новая стойка "${newRigName}" за $${rigCost}`, "success");
         updateUI(); // Перерисовать управление фермой
     } else {
         addLog(`Недостаточно средств для покупки стойки ($${rigCost})`, "warning");
     }
 }


// --- Вспомогательные Функции ---
function addLog(message, type = "info") { /* ... (остается как было) ... */
    const time = new Date().toLocaleTimeString();
    let styledMessage = message;
    if (type === "success") styledMessage = `<span style="color: green;">${message}</span>`;
    if (type === "warning") styledMessage = `<span style="color: orange;">${message}</span>`;
    if (type === "error") styledMessage = `<span style="color: red;">${message}</span>`;

    gameState.eventLog.push(`[${time}] ${styledMessage}`);
    if (gameState.eventLog.length > 100) { gameState.eventLog.shift(); }
    // Обновляем только лог
    logOutputEl.innerHTML = gameState.eventLog.map(msg => `<li>${msg}</li>`).join('');
    logOutputEl.scrollTop = logOutputEl.scrollHeight;
}


// ======================================================
// ========== ЛОГИКА АДМИН-ПАНЕЛИ (ИНТЕГРИРОВАНА) ==========
// ======================================================

// --- Обработчики Событий Админки ---
function setupAdminEventListeners() {
    loginForm.addEventListener('submit', handleAdminLogin);
    logoutButton.addEventListener('click', handleAdminLogout);

    // Кнопки Добавить
    addGpuButton.addEventListener('click', () => showGpuForm());
    addCryptoButton.addEventListener('click', () => showCryptoForm());

    // Формы
    gpuForm.addEventListener('submit', handleSaveGpu);
    cancelGpuButton.addEventListener('click', hideGpuForm);
    cryptoForm.addEventListener('submit', handleSaveCrypto);
    cancelCryptoButton.addEventListener('click', hideCryptoForm);

    // Делегирование для списков Edit/Delete
    gpuListEl.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-button')) {
            showGpuForm(event.target.closest('li').dataset.gpuId);
        } else if (event.target.classList.contains('delete-button')) {
            handleDeleteGpu(event.target.closest('li').dataset.gpuId);
        }
    });
    cryptoListEl.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-button')) {
            showCryptoForm(event.target.closest('li').dataset.cryptoTicker);
        } else if (event.target.classList.contains('delete-button')) {
            handleDeleteCrypto(event.target.closest('li').dataset.cryptoTicker);
        }
    });

    // Сохранение настроек
    saveMarketSettingsBtn.addEventListener('click', handleSaveMarketSettings);
    saveGameSettingsBtn.addEventListener('click', handleSaveGameSettings);
}

// --- Логин/Логаут Админки ---
function handleAdminLogin(event) {
    event.preventDefault();
    if (adminPasswordInput.value === ADMIN_PASSWORD) {
        loginSection.style.display = 'none';
        adminPanel.style.display = 'block'; // Показываем основную часть админки
        loginErrorEl.style.display = 'none';
        adminPasswordInput.value = '';
        renderAdminLists(); // Отображаем актуальные списки
        // Заполняем поля настроек текущими значениями
        botActivityInput.value = gameSettings.botActivity;
        restockFreqInput.value = gameSettings.restockFreq;
        startCapitalInput.value = gameSettings.startCapital;
        energyCostInput.value = gameSettings.energyCostPerKWh;
    } else {
        loginErrorEl.style.display = 'block';
    }
}

function handleAdminLogout() {
    adminPanel.style.display = 'none';
    loginSection.style.display = 'block';
    // Опционально: переключить на главную панель игры
    // document.querySelector('button[data-section="dashboard-section"]').click();
}

// --- Отображение Списков в Админке ---
function renderAdminLists() {
    renderGpuList();
    renderCryptoList();
}

function renderGpuList() { /* Использует общие gpuDefinitions */
    gpuListEl.innerHTML = '';
    Object.values(gpuDefinitions).forEach(gpu => {
        const li = document.createElement('li');
        li.dataset.gpuId = gpu.id;
        // Собираем хешрейты
        let hashInfo = Object.entries(gpu.hashrates || {})
            .map(([algo, rate]) => {
                 const cryptoDef = Object.values(cryptoDefinitions).find(c => c.algorithm === algo);
                 return `${algo.toUpperCase()}: ${formatHashrate(rate, cryptoDef?.hashUnit || 'H/s')}`;
            })
            .join(' | ');
        if (!hashInfo) hashInfo = 'N/A';

        li.innerHTML = `
            <div class="list-item-info">
                <strong>${gpu.name} (ID: ${gpu.id})</strong><br>
                <span>${hashInfo}</span><br>
                <span>Power: ${gpu.power}W</span> |
                <span>Price: $${gpu.price}</span> |
                <span>Wear Rate: ${gpu.wearRate || 0.1}</span>
            </div>
            <div class="list-actions">
                <button class="edit-button">Edit</button>
                <button class="delete-button">Delete</button>
            </div>
        `;
        gpuListEl.appendChild(li);
    });
    if (Object.keys(gpuDefinitions).length === 0) {
        gpuListEl.innerHTML = '<li>Нет добавленных видеокарт.</li>';
    }
}

function renderCryptoList() { /* Использует общие cryptoDefinitions */
    cryptoListEl.innerHTML = '';
    Object.values(cryptoDefinitions).forEach(crypto => {
        const li = document.createElement('li');
        li.dataset.cryptoTicker = crypto.ticker;
        li.innerHTML = `
             <div class="list-item-info">
                 <strong>${crypto.name} (${crypto.ticker})</strong><br>
                 <span>Algo: ${crypto.algorithm}</span> |
                 <span>Unit: ${crypto.hashUnit || 'N/A'}</span> |
                 <span>Start Price: $${crypto.basePrice}</span> |
                 <span>Volatility: ${crypto.volatility || 0.1}</span>
             </div>
             <div class="list-actions">
                 <button class="edit-button">Edit</button>
                 <button class="delete-button">Delete</button>
             </div>
         `;
        cryptoListEl.appendChild(li);
    });
    if (Object.keys(cryptoDefinitions).length === 0) {
        cryptoListEl.innerHTML = '<li>Нет добавленных криптовалют.</li>';
    }
}


// --- Управление Формами Админки ---
function showGpuForm(gpuId = null) { /* Использует общие gpuDefinitions */
    if (gpuId) { // Редактирование
        const gpu = gpuDefinitions[gpuId];
        if (!gpu) return;
        gpuFormTitle.textContent = `Редактировать: ${gpu.name}`;
        gpuIdInput.value = gpu.id;
        gpuNameInput.value = gpu.name;
        gpuHashEthInput.value = gpu.hashrates?.ethash || 0;
        gpuHashShaInput.value = gpu.hashrates?.sha256 || 0;
        // TODO: Динамически добавлять поля для хешрейтов других алгоритмов, если они есть
        gpuPowerInput.value = gpu.power;
        gpuPriceInput.value = gpu.price;
        gpuImageUrlInput.value = gpu.imageUrl || '';
        gpuStockInput.value = gpu.stock || 10;
        gpuWearRateInput.value = gpu.wearRate || 0.1;
        gpuRequirementsInput.value = gpu.requirements || '';
    } else { // Добавление
        gpuFormTitle.textContent = "Добавить Новую Видеокарту";
        gpuForm.reset();
        gpuIdInput.value = ''; // Важно сбросить скрытый ID
    }
    gpuForm.style.display = 'block';
}

function hideGpuForm() {
    gpuForm.style.display = 'none';
    gpuForm.reset();
}

function showCryptoForm(ticker = null) { /* Использует общие cryptoDefinitions */
     if (ticker) { // Редактирование
         const crypto = cryptoDefinitions[ticker];
         if (!crypto) return;
         cryptoFormTitle.textContent = `Редактировать: ${crypto.name}`;
         cryptoIdInput.value = crypto.ticker; // Сохраняем тикер для логики сохранения
         cryptoNameInput.value = crypto.name;
         cryptoTickerInput.value = crypto.ticker;
         cryptoTickerInput.readOnly = true; // Не даем менять тикер при редактировании
         cryptoAlgorithmSelect.value = crypto.algorithm;
         cryptoHashUnitInput.value = crypto.hashUnit || '';
         cryptoBasePriceInput.value = crypto.basePrice;
         cryptoVolatilityInput.value = crypto.volatility || 0.1;
     } else { // Добавление
         cryptoFormTitle.textContent = "Добавить Криптовалюту";
         cryptoForm.reset();
         cryptoTickerInput.readOnly = false;
         cryptoIdInput.value = ''; // Сбрасываем ID
     }
     cryptoForm.style.display = 'block';
 }

 function hideCryptoForm() {
     cryptoForm.style.display = 'none';
     cryptoForm.reset();
     cryptoTickerInput.readOnly = false;
 }

// --- CRUD Операции Админки ---
function handleSaveGpu(event) { /* Обновляет общие gpuDefinitions */
    event.preventDefault();
    // Генерируем ID на основе названия + времени, если это новая карта
    const newGpuId = `gpu-${gpuNameInput.value.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`;
    const gpuId = gpuIdInput.value || newGpuId; // Используем существующий ID или генерируем

    if (!gpuNameInput.value || !gpuPowerInput.value || !gpuPriceInput.value) {
        alert("Заполните Название, Мощность, Цену."); return;
    }

    gpuDefinitions[gpuId] = {
        id: gpuId, // Сохраняем ID внутри объекта
        name: gpuNameInput.value.trim(),
        hashrates: { // Собираем хешрейты из формы
            ethash: parseFloat(gpuHashEthInput.value) || 0,
            sha256: parseFloat(gpuHashShaInput.value) || 0
            // TODO: Считывать другие поля хешрейтов, если они добавлены
        },
        power: parseInt(gpuPowerInput.value),
        price: parseInt(gpuPriceInput.value),
        imageUrl: gpuImageUrlInput.value.trim(),
        stock: parseInt(gpuStockInput.value) || 10,
        wearRate: parseFloat(gpuWearRateInput.value) || 0.1,
        requirements: gpuRequirementsInput.value.trim()
    };

    saveAdminDefinitionsAndSettings(); // Сохраняем всё в localStorage
    renderGpuList();                 // Обновляем список в админке
    hideGpuForm();
    updateUI();                      // Обновляем основной UI игры
    addLog(`Данные GPU ${gpuDefinitions[gpuId].name} сохранены.`, "success");
}

function handleDeleteGpu(gpuId) { /* Обновляет общие gpuDefinitions */
    if (gpuDefinitions[gpuId] && confirm(`Удалить ${gpuDefinitions[gpuId].name}?`)) {
        delete gpuDefinitions[gpuId];
        saveAdminDefinitionsAndSettings();
        renderGpuList();
        updateUI();
         addLog(`GPU ${gpuId} удалена.`, "warning");
    }
}

 function handleSaveCrypto(event) { /* Обновляет общие cryptoDefinitions */
     event.preventDefault();
     const ticker = cryptoTickerInput.value.toUpperCase().trim();
     const isEditing = !!cryptoIdInput.value; // Редактируем, если ID был установлен

     if (!ticker || !cryptoNameInput.value || !cryptoBasePriceInput.value || !cryptoHashUnitInput.value) {
         alert("Заполните Тикер, Название, Цену и Единицу Хешрейта."); return;
     }
     if (!isEditing && cryptoDefinitions[ticker]) {
         alert(`Тикер ${ticker} уже используется!`); return;
     }

     cryptoDefinitions[ticker] = {
         name: cryptoNameInput.value.trim(),
         ticker: ticker,
         algorithm: cryptoAlgorithmSelect.value,
         hashUnit: cryptoHashUnitInput.value.trim(),
         basePrice: parseFloat(cryptoBasePriceInput.value),
         volatility: parseFloat(cryptoVolatilityInput.value) || 0.1,
     };

     // Инициализируем баланс и цену в gameState, если это новая крипта
     if (!isEditing) {
          if (gameState.player.crypto[ticker] === undefined) gameState.player.crypto[ticker] = 0;
          if (gameState.cryptoPrices[ticker] === undefined) gameState.cryptoPrices[ticker] = cryptoDefinitions[ticker].basePrice;
     }


     saveAdminDefinitionsAndSettings();
     renderCryptoList();
     hideCryptoForm();
     updateUI(); // Обновить списки крипты в UI
     addLog(`Данные криптовалюты ${ticker} сохранены.`, "success");
 }

 function handleDeleteCrypto(ticker) { /* Обновляет общие cryptoDefinitions */
     if (cryptoDefinitions[ticker] && confirm(`Удалить криптовалюту ${ticker}? Это также удалит ее из баланса и цен.`)) {
         delete cryptoDefinitions[ticker];
         // Удаляем также из игрового состояния
         delete gameState.player.crypto[ticker];
         delete gameState.cryptoPrices[ticker];

         saveAdminDefinitionsAndSettings();
         saveGame(); // Сохраняем игру, чтобы удалить крипту из сейва
         renderCryptoList();
         updateUI(); // Убрать крипту из UI
         addLog(`Криптовалюта ${ticker} удалена.`, "warning");
     }
 }

// --- Сохранение Настроек Админки ---
function handleSaveMarketSettings() { /* Обновляет общие gameSettings */
    gameSettings.botActivity = parseInt(botActivityInput.value) || 5;
    gameSettings.restockFreq = parseInt(restockFreqInput.value) || 60;
    saveAdminDefinitionsAndSettings();
    addLog("Настройки рынка сохранены!", "success");
    // updateUI(); // Не обязательно, т.к. прямо не влияет на видимые элементы
}

function handleSaveGameSettings() { /* Обновляет общие gameSettings */
    gameSettings.startCapital = parseInt(startCapitalInput.value) || 1000;
    gameSettings.energyCostPerKWh = parseFloat(energyCostInput.value) || 0.15;
    saveAdminDefinitionsAndSettings();
    addLog("Общие настройки игры сохранены!", "success");
    updateUI(); // Обновить UI, т.к. стоимость энергии влияет на дашборд
}

// ======================================================
// ========== КОНЕЦ ЛОГИКИ АДМИН-ПАНЕЛИ ==========
// ======================================================
