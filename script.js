```javascript
// script.js - Расширенная версия с плейсхолдерами

"use strict"; // Используем строгий режим для лучшего контроля ошибок

// --- Глобальные Переменные и Константы ---
const ADMIN_PASSWORD = 'qwe123';
const TICK_INTERVAL_MS = 1000; // 1 секунда на игровой тик по умолчанию

// --- DOM Элементы (Глобальные и Навигация) ---
const bodyElement = document.body;
const appContainer = document.querySelector('.app-container');
const allSections = document.querySelectorAll('.game-section');
const navButtons = document.querySelectorAll('.main-nav .nav-button');
const gameTimeDisplay = document.getElementById('game-time-display');
const fiatBalanceHeader = document.getElementById('fiat-balance-header');
const cryptoBalanceSummaryValue = document.getElementById('crypto-balance-summary-value');
// Доп. DOM элементы, которые могут понадобиться (для админки, форм и т.д.)
const adminPanel = document.getElementById('admin-panel');
const loginSection = document.getElementById('login-section');
const loginForm = document.getElementById('login-form');
const adminPasswordInput = document.getElementById('admin-password');
const loginErrorEl = document.getElementById('login-error');
const logoutButton = document.getElementById('logout-button');
const logOutputEl = document.getElementById('log-output'); // Элемент для лога в дашборде
const sellForm = document.getElementById('sell-item-form');
const sellItemNameEl = document.getElementById('sell-item-name');
const sellItemPriceInput = document.getElementById('sell-item-price');
const confirmSellItemBtn = document.getElementById('confirm-sell-item-btn');
const cancelSellItemBtn = document.getElementById('cancel-sell-item-btn');
const gpuForm = document.getElementById('gpu-form'); // Пример формы компонента
const cancelGpuButton = document.getElementById('cancel-gpu-button'); // Пример кнопки отмены
const cryptoForm = document.getElementById('crypto-form');
const cryptoFormTitle = document.getElementById('crypto-form-title');
const cryptoIdInput = document.getElementById('crypto-id');
const cryptoNameInput = document.getElementById('crypto-name');
const cryptoTickerInput = document.getElementById('crypto-ticker');
const cryptoAlgorithmSelect = document.getElementById('crypto-algorithm');
const cryptoHashUnitInput = document.getElementById('crypto-hash-unit');
const cryptoBasePriceInput = document.getElementById('crypto-base-price');
const cryptoVolatilityInput = document.getElementById('crypto-volatility');
const cryptoDifficultyInput = document.getElementById('crypto-difficulty');
const cryptoBlockRewardInput = document.getElementById('crypto-block-reward');
const cryptoIconInput = document.getElementById('crypto-icon');
const cancelCryptoButton = document.getElementById('cancel-crypto-button');
const startCapitalInput = document.getElementById('start-capital');
const energyCostInput = document.getElementById('energy-cost');
const botActivityInput = document.getElementById('bot-activity');
const restockFreqInput = document.getElementById('restock-freq');
const saveMarketSettingsBtn = document.getElementById('save-market-settings-btn');
const saveGameSettingsBtn = document.getElementById('save-game-settings-btn');


// --- Состояние Игры (Обширная структура) ---
let gameState = {
    // Игрок
    player: {
        money: 1000,
        crypto: { /* BTC: 0, ETH: 0, ... */ },
        inventory: {
            gpu: [ /* { id: 'gpu_1', definitionId: 'gpu-rtx3080', wear: 0, coreClockOffset: 0, memClockOffset: 0, powerLimit: 100, temperature: 25 } */ ],
            psu: [ /* { id: 'psu_1', definitionId: 'psu-corsair1200', wear: 0 } */ ],
            mobo: [ /* { id: 'mobo_1', definitionId: 'mobo-asusb250' } */ ],
            cooling: [ /* { id: 'cool_1', definitionId: 'cool-fan-p12', wear: 0 } */ ],
            racks: [ /* { id: 'rack_1', definitionId: 'rack-basic6' } */ ],
            other: []
        },
        portfolioValueHistory: [], // Для графика портфеля
        achievements: { /* achievementId: { unlocked: false, progress: 0, target: 10 } */ },
        completedResearch: [], // ['soft_opt_1', ...]
        hiredStaff: [ /* { id: 'staff_1', definitionId: 'ivan_t', assignment: 'repair_rig_1', salary: 15, skills: {...}, assignedRigId: 'rig_1' } */ ]
    },
    // Мир/Симуляция
    rigs: [
        // { id: 'rig_1', name: "Ферма 1", definitionId: 'rack-basic6', slots: { psu: [null], mobo: [null], gpu: [null,...], cooling: [null,...] }, status: 'ok', temp: 30, power: 0, totalHashrate: {} }
    ],
    market: {
        used: { // Теперь по типам
            gpu: [], psu: [], mobo: [], cooling: [], racks: [], other: []
        },
        orders: { // Ордера на покупку/продажу оборудования
            gpu: { buy: [], sell: [] }, // [{ orderId: '...', price: 250, amount: 5, itemId: 'gpu-rtx3080', creator: 'player/bot', timestamp: ...}, ...]
            psu: { buy: [], sell: [] },
            mobo: { buy: [], sell: [] },
            cooling: { buy: [], sell: [] },
            racks: { buy: [], sell: [] },
            other: { buy: [], sell: [] }
        },
        cryptoExchange: { // Стаканы для криптобиржи
            // 'BTC/USD': { bids: [[price, amount], ...], asks: [[price, amount], ...] }
        }
    },
    cryptoPrices: { /* BTC: 50000, ETH: 3000, ... */ },
    cryptoPriceHistory: { /* BTC: [{time: 123, price: 50k}, ...], ... */}, // Для графиков
    newsFeed: [ /* { time: '14:30', headline: '...', impact: '...', type: 'positive' } */ ],
    activeResearch: null, // { researchId: 'soft_opt_1', startTime: 12345, duration: 3600 }
    availableStaffPool: [ /* { id: 'ivan_t', name: 'Иван...', skills: { repair: 3, optimize: 1, research: 0 }, salary: 15 } */ ],
    availableEvents: { /* eventTypeId: { probability: 0.1, headline: '...', impactDescription: '...', effect: {...}, type: 'positive' } */ },
    // Время и Настройки Симуляции
    gameTime: 0, // Игровые "секунды"
    gameSpeed: 1, // Множитель скорости времени
    sessionStartTime: Date.now(),
    eventLog: ["Симуляция запущена!"],
    // ID Генераторы
    nextItemId: 1,
    nextListingId: 1,
    nextOrderId: 1,
    nextStaffId: 1,
    nextRigId: 1,
    // Состояние UI
    uiState: {
        activeSection: 'dashboard-section',
        activeMarketCategory: 'hardware',
        activeComponentType: 'gpu',
        activeMarketSubtab: 'new',
        activeRigTab: null, // 'rig_1'
        selectedWalletCrypto: 'BTC',
        selectedAdminTab: 'components',
        selectedAdminComponentType: 'gpu',
        isLoggedInAdmin: false,
        selectedInventoryItem: null, // { type: 'gpu', id: 'gpu_123' }
        selectedRigSlot: { rigId: null, slotType: null, slotIndex: -1 }, // { rigId: 'rig_1', slotType: 'gpu', slotIndex: 0 }
    }
};

// --- Определения (Загружаются/Сохраняются Админкой) ---
let gpuDefinitions = {}; // { 'gpu-rtx3080': { id:.., type:'gpu', name:.., hashrates:{algo:rate,...}, power:.., price:.., wearRate:.., imageUrl:..., minPsu: ..., requirements: ... } }
let psuDefinitions = {}; // { 'psu-corsair1200': { id:.., type:'psu', name:.., powerOutput: 1200, efficiency: 90, price:.., imageUrl:..., requirements: ... } }
let moboDefinitions = {}; // { 'mobo-asusb250': { id:.., type:'mobo', name:.., gpuSlots: 19, psuSlots: 3, price:.., imageUrl:..., power: 10, requirements: ... } }
let coolingDefinitions = {}; // { 'cool-fan-p12': { id:.., type:'cooling', name:.., coolingPower: 5, power: 2, price:.., imageUrl:..., requirements: ... } }
let rackDefinitions = {}; // { 'rack-basic6': { id:.., type:'racks', name:.., gpuSlots: 6, cost: 50, baseCooling: 2, imageUrl:..., requirements: ... } }
let otherDefinitions = {}; // Прочее оборудование
// Объединим для удобства доступа
const componentDefinitions = { // Ссылка на все определения
    gpu: gpuDefinitions,
    psu: psuDefinitions,
    mobo: moboDefinitions,
    cooling: coolingDefinitions,
    racks: rackDefinitions,
    other: otherDefinitions
};

let cryptoDefinitions = {}; // { 'BTC': { name:.., ticker:.., algorithm:.., hashUnit: 'GH/s', basePrice:.., volatility:.., difficulty:..., blockReward:..., icon:'fab fa-btc', ... } }
let researchDefinitions = {}; // { 'soft_opt_1': { id:.., name:.., description:.., cost:.., duration:.., requires:[], effect: { type: '...', value: ... } } }
let achievementDefinitions = {}; // { 'first_blood': { id:.., name:.., description:.., target: 1, condition: ()=>{...}, reward: {text: '...', money: 100} } }
let staffDefinitions = {}; // Определения типов персонала или базовые профили (если не генерировать случайно)

// --- Настройки Игры (Загружаются/Сохраняются Админкой) ---
let gameSettings = {
    energyCostPerKWh: 0.15,
    botActivity: 5,
    marketRestockFreq: 60, // тиков
    startCapital: 1000,
    initialRigSlots: 6,
    rigCost: 50,
    theme: 'light',
    enableAnimations: true,
    showTooltips: true,
    notifyOverheat: true,
    notifyBreakdown: true,
    notifyDeals: false,
    enableSound: false,
    autosaveInterval: 5 // минут
};

// --- Переменные Игрового Цикла ---
let gameLoopIntervalId = null;
let lastTickTime = 0;
let lastSaveTime = 0;

// --- Переменные UI состояния (специфичные для форм/диалогов) ---
let itemToSell = null; // { type: 'gpu', id: 'gpu_123', definitionId: '...', wear: ... }

// --- Инициализация ---
document.addEventListener('DOMContentLoaded', initGame);

function initGame() {
    console.log("Инициализация Crypto Empire Tycoon...");
    loadDefinitionsAndSettings(); // Загружаем все определения и настройки ИЗНАЧАЛЬНО
    loadGame(); // Загружаем прогресс игрока
    setupEventListeners(); // Устанавливаем обработчики
    setupAdminEventListeners(); // Обработчики для админки
    selectInitialSection(); // Показываем первую секцию
    renderUI(); // Первоначальная отрисовка всего интерфейса
    applyGameSettings(); // Применить настройки темы и т.д. при старте
    renderAdminPanel(); // Первичный рендер админки (списков и форм настроек)
    startGameLoop(); // Запускаем игровой цикл
    console.log("Игра инициализирована и запущена.");
}

// --- Загрузка / Сохранение ---

function loadDefinitionsAndSettings() {
    console.log("Загрузка определений и настроек...");
    // GPU
    const loadedGpu = localStorage.getItem('cryptoEmpireGpuDefs');
    gpuDefinitions = loadedGpu ? JSON.parse(loadedGpu) : getDefaultGpuDefs();
    componentDefinitions.gpu = gpuDefinitions; // Обновляем ссылку

    // PSU
    const loadedPsu = localStorage.getItem('cryptoEmpirePsuDefs');
    psuDefinitions = loadedPsu ? JSON.parse(loadedPsu) : getDefaultPsuDefs();
    componentDefinitions.psu = psuDefinitions;

    // Mobo
    const loadedMobo = localStorage.getItem('cryptoEmpireMoboDefs');
    moboDefinitions = loadedMobo ? JSON.parse(loadedMobo) : getDefaultMoboDefs();
    componentDefinitions.mobo = moboDefinitions;

    // Cooling
    const loadedCooling = localStorage.getItem('cryptoEmpireCoolingDefs');
    coolingDefinitions = loadedCooling ? JSON.parse(loadedCooling) : getDefaultCoolingDefs();
    componentDefinitions.cooling = coolingDefinitions;

    // Racks
    const loadedRacks = localStorage.getItem('cryptoEmpireRackDefs');
    rackDefinitions = loadedRacks ? JSON.parse(loadedRacks) : getDefaultRackDefs();
    componentDefinitions.racks = rackDefinitions;

    // Other (пока пусто)
    // const loadedOther = localStorage.getItem('cryptoEmpireOtherDefs');
    // otherDefinitions = loadedOther ? JSON.parse(loadedOther) : {};
    // componentDefinitions.other = otherDefinitions;

    // Crypto
    const loadedCrypto = localStorage.getItem('cryptoEmpireCryptoDefs');
    cryptoDefinitions = loadedCrypto ? JSON.parse(loadedCrypto) : getDefaultCryptoDefs();

    // Research (пока нет дефолтных)
    const loadedResearch = localStorage.getItem('cryptoEmpireResearchDefs');
    researchDefinitions = loadedResearch ? JSON.parse(loadedResearch) : {};

    // Achievements (пока нет дефолтных)
    const loadedAchDefs = localStorage.getItem('cryptoEmpireAchDefs');
    achievementDefinitions = loadedAchDefs ? JSON.parse(loadedAchDefs) : {};

    // Settings
    const loadedSettings = localStorage.getItem('cryptoEmpireSettings');
    gameSettings = loadedSettings ? { ...gameSettings, ...JSON.parse(loadedSettings) } : gameSettings;

    // Сохраняем дефолтные, если ничего не было загружено
    if (!loadedGpu || !loadedPsu || !loadedMobo || !loadedCooling || !loadedRacks || !loadedCrypto || !loadedSettings) {
        console.warn("Некоторые определения или настройки не найдены, используются/сохраняются дефолтные.");
        saveDefinitionsAndSettings();
    }

     // applyGameSettings(); // Применяем загруженные настройки (тема и т.д.) - Перенесено в initGame
    console.log("Определения и настройки загружены.");
}

function saveDefinitionsAndSettings() {
    try {
        localStorage.setItem('cryptoEmpireGpuDefs', JSON.stringify(gpuDefinitions));
        localStorage.setItem('cryptoEmpirePsuDefs', JSON.stringify(psuDefinitions));
        localStorage.setItem('cryptoEmpireMoboDefs', JSON.stringify(moboDefinitions));
        localStorage.setItem('cryptoEmpireCoolingDefs', JSON.stringify(coolingDefinitions));
        localStorage.setItem('cryptoEmpireRackDefs', JSON.stringify(rackDefinitions));
        // localStorage.setItem('cryptoEmpireOtherDefs', JSON.stringify(otherDefinitions));
        localStorage.setItem('cryptoEmpireCryptoDefs', JSON.stringify(cryptoDefinitions));
        localStorage.setItem('cryptoEmpireResearchDefs', JSON.stringify(researchDefinitions));
        localStorage.setItem('cryptoEmpireAchDefs', JSON.stringify(achievementDefinitions));
        localStorage.setItem('cryptoEmpireSettings', JSON.stringify(gameSettings));
        console.log("Определения и настройки сохранены в localStorage.");
    } catch (error) {
        console.error("Ошибка сохранения определений/настроек:", error);
        addLog("Ошибка сохранения настроек игры!", "error");
    }
}

function loadGame() {
    const savedState = localStorage.getItem('cryptoEmpireSave');
    if (savedState) {
        try {
            const loadedGameState = JSON.parse(savedState);
            // Аккуратно мержим состояние, чтобы не потерять новые поля из дефолтного gameState
            gameState = deepMerge(gameState, loadedGameState);
            // Восстанавливаем объекты Date, если они сохранялись как строки (лучше хранить timestamp)
            gameState.sessionStartTime = Date.now() - (gameState.gameTime * 1000 / gameState.gameSpeed); // Восстанавливаем время начала сессии
            addLog("Сохраненная игра загружена.");
        } catch (error) {
            console.error("Ошибка загрузки сохранения:", error);
            addLog("Ошибка загрузки сохранения! Используется начальное состояние.", "error");
            initializeNewGame(); // Начинаем новую игру при ошибке
        }
    } else {
        initializeNewGame();
    }
    // Валидация и инициализация после загрузки
    validateGameState();
    // Обновляем счетчики ID, чтобы избежать коллизий
    updateIdCounters();
}

function saveGame() {
    try {
        const saveTimestamp = Date.now();
        localStorage.setItem('cryptoEmpireSave', JSON.stringify(gameState));
        lastSaveTime = saveTimestamp;
        // Обновить время последнего сохранения в UI (если есть элемент)
         const lastSaveEl = document.getElementById('last-save-time');
         if(lastSaveEl) lastSaveEl.textContent = new Date(saveTimestamp).toLocaleString();
        // console.log("Игра сохранена."); // Можно раскомментировать для отладки
    } catch (error) {
        console.error("Ошибка сохранения игры:", error);
        addLog("Ошибка сохранения прогресса игры!", "error");
    }
}

function initializeNewGame() {
    console.log("Начало новой игры.");
    // Создаем новый объект gameState из дефолтного, чтобы не мутировать оригинал при ошибках загрузки
    const initialGameState = {
        player: {
            money: gameSettings.startCapital,
            crypto: {},
            inventory: { gpu: [], psu: [], mobo: [], cooling: [], racks: [], other: [] },
            achievements: {},
            completedResearch: [],
            hiredStaff: []
        },
        rigs: [],
        market: {
             used: { gpu: [], psu: [], mobo: [], cooling: [], racks: [], other: [] },
             orders: { gpu: { buy: [], sell: [] }, psu: { buy: [], sell: [] }, mobo: { buy: [], sell: [] }, cooling: { buy: [], sell: [] }, racks: { buy: [], sell: [] }, other: { buy: [], sell: [] } },
             cryptoExchange: {}
         },
        cryptoPrices: {},
        cryptoPriceHistory: {},
        newsFeed: [],
        activeResearch: null,
        availableStaffPool: [],
        availableEvents: getDefaultEvents(), // Загрузка дефолтных событий
        gameTime: 0,
        gameSpeed: 1,
        sessionStartTime: Date.now(),
        eventLog: ["Новая игра начата!"],
        nextItemId: 1,
        nextListingId: 1,
        nextOrderId: 1,
        nextStaffId: 1,
        nextRigId: 1,
        uiState: { // Сброс UI состояния
             activeSection: 'dashboard-section',
             activeMarketCategory: 'hardware',
             activeComponentType: 'gpu',
             activeMarketSubtab: 'new',
             activeRigTab: null,
             selectedWalletCrypto: 'BTC', // Убедиться, что BTC существует
             selectedAdminTab: 'components',
             selectedAdminComponentType: 'gpu',
             isLoggedInAdmin: gameState.uiState?.isLoggedInAdmin || false, // Сохраняем статус админа
             selectedInventoryItem: null,
             selectedRigSlot: { rigId: null, slotType: null, slotIndex: -1 },
         }
    };

    // Инициализация крипто-балансов и цен
    Object.keys(cryptoDefinitions).forEach(ticker => {
        initialGameState.player.crypto[ticker] = 0;
        initialGameState.cryptoPrices[ticker] = cryptoDefinitions[ticker].basePrice || 1;
        initialGameState.cryptoPriceHistory[ticker] = []; // Инициализируем историю
         // Инициализируем стаканы для биржи
         initialGameState.market.cryptoExchange[`${ticker}/USD`] = { bids: [], asks: [] };
    });
     // Убедимся, что дефолтный selectedWalletCrypto существует, иначе выберем первый
    if (!cryptoDefinitions[initialGameState.uiState.selectedWalletCrypto] && Object.keys(cryptoDefinitions).length > 0) {
        initialGameState.uiState.selectedWalletCrypto = Object.keys(cryptoDefinitions)[0];
    }

    gameState = initialGameState; // Присваиваем созданное состояние

    // Добавить первую стойку?
    // handleAddRig(true); // true - бесплатно
    addLog("Добро пожаловать в Crypto Empire Tycoon!");
    updateIdCounters(); // Обновить счетчики после сброса
}

function validateGameState() {
    // Проверяем наличие всех необходимых ключей и инициализируем при необходимости
    gameState.player = gameState.player || {};
    gameState.player.crypto = gameState.player.crypto || {};
    gameState.player.inventory = gameState.player.inventory || { gpu: [], psu: [], mobo: [], cooling: [], racks: [], other: [] };
     // Убедиться, что все типы инвентаря существуют
     Object.keys(componentDefinitions).forEach(type => {
         if (!gameState.player.inventory[type]) gameState.player.inventory[type] = [];
     });
    gameState.rigs = gameState.rigs || [];
    gameState.market = gameState.market || { used: {}, orders: {}, cryptoExchange: {} };
    gameState.market.used = gameState.market.used || {};
    gameState.market.orders = gameState.market.orders || {};
    gameState.market.cryptoExchange = gameState.market.cryptoExchange || {};
    // Убедиться, что used и orders имеют все типы
    Object.keys(componentDefinitions).forEach(type => {
        if (!gameState.market.used[type]) gameState.market.used[type] = [];
        if (!gameState.market.orders[type]) gameState.market.orders[type] = { buy: [], sell: [] };
    });
    gameState.cryptoPrices = gameState.cryptoPrices || {};
    gameState.cryptoPriceHistory = gameState.cryptoPriceHistory || {};
    gameState.player.achievements = gameState.player.achievements || {};
    gameState.player.completedResearch = gameState.player.completedResearch || [];
    gameState.player.hiredStaff = gameState.player.hiredStaff || [];
    gameState.availableStaffPool = gameState.availableStaffPool || [];
    gameState.availableEvents = gameState.availableEvents || getDefaultEvents();
    gameState.newsFeed = gameState.newsFeed || [];
    gameState.eventLog = gameState.eventLog || [];
    gameState.uiState = gameState.uiState || {}; // Добавить проверку uiState и его полей

     // Убедиться, что все криптовалюты из определений есть в player.crypto и cryptoPrices
     Object.keys(cryptoDefinitions).forEach(ticker => {
         if (gameState.player.crypto[ticker] === undefined) gameState.player.crypto[ticker] = 0;
         if (gameState.cryptoPrices[ticker] === undefined) gameState.cryptoPrices[ticker] = cryptoDefinitions[ticker].basePrice || 1;
         if (!gameState.cryptoPriceHistory[ticker]) gameState.cryptoPriceHistory[ticker] = [];
         if (!gameState.market.cryptoExchange[`${ticker}/USD`]) gameState.market.cryptoExchange[`${ticker}/USD`] = { bids: [], asks: [] };
     });

    // Удалить данные для крипт, которых нет в определениях (опционально)
    // Object.keys(gameState.player.crypto).forEach(ticker => {
    //     if (!cryptoDefinitions[ticker]) delete gameState.player.crypto[ticker];
    // });
    // Object.keys(gameState.cryptoPrices).forEach(ticker => {
    //     if (!cryptoDefinitions[ticker]) {
    //         delete gameState.cryptoPrices[ticker];
    //         delete gameState.cryptoPriceHistory[ticker];
    //         delete gameState.market.cryptoExchange[`${ticker}/USD`];
    //     }
    // });

     // Убедиться, что ID генераторы существуют
     gameState.nextItemId = gameState.nextItemId || 1;
     gameState.nextListingId = gameState.nextListingId || 1;
     gameState.nextOrderId = gameState.nextOrderId || 1;
     gameState.nextStaffId = gameState.nextStaffId || 1;
     gameState.nextRigId = gameState.nextRigId || 1;

     // Проверить корректность definitionId у всех предметов в инвентаре и ригах
     Object.keys(gameState.player.inventory).forEach(type => {
         gameState.player.inventory[type] = gameState.player.inventory[type].filter(item =>
             componentDefinitions[type]?.[item.definitionId]
         );
     });
     gameState.rigs.forEach(rig => {
         Object.keys(rig.slots).forEach(slotType => {
             rig.slots[slotType] = rig.slots[slotType].map(item =>
                 (item && componentDefinitions[slotType]?.[item.definitionId]) ? item : null
             );
         });
         // Проверить definitionId самой стойки
         if(rig.definitionId && !rackDefinitions[rig.definitionId]) rig.definitionId = null; // Сбросить на дефолт?
     });
}

// Обновляет счетчики ID на основе существующих элементов
function updateIdCounters() {
    let maxItemId = 0;
    Object.values(gameState.player.inventory).flat().forEach(item => {
         const match = item?.id?.match(/_(\d+)$/);
         if (match) maxItemId = Math.max(maxItemId, parseInt(match[1]));
    });
     gameState.rigs.forEach(rig => {
        Object.values(rig.slots).flat().forEach(item => {
             const match = item?.id?.match(/_(\d+)$/);
             if (match) maxItemId = Math.max(maxItemId, parseInt(match[1]));
        });
     });
     // Учитываем ботовские предметы на БУ рынке
     Object.values(gameState.market.used).flat().forEach(listing => {
          const match = listing?.item?.id?.match(/_(\d+)$/);
          if (match) maxItemId = Math.max(maxItemId, parseInt(match[1]));
     });
     gameState.nextItemId = Math.max(gameState.nextItemId || 1, maxItemId + 1);

    let maxListingId = 0;
    Object.values(gameState.market.used).flat().forEach(listing => {
        const match = listing?.listingId?.match(/_(\d+)$/);
        if (match) maxListingId = Math.max(maxListingId, parseInt(match[1]));
    });
    gameState.nextListingId = Math.max(gameState.nextListingId || 1, maxListingId + 1);

    let maxOrderId = 0;
    Object.values(gameState.market.orders).forEach(typeOrders => {
         Object.values(typeOrders).flat().forEach(order => {
              const match = order?.orderId?.match(/_(\d+)$/);
              if (match) maxOrderId = Math.max(maxOrderId, parseInt(match[1]));
         });
    });
     gameState.nextOrderId = Math.max(gameState.nextOrderId || 1, maxOrderId + 1);

    let maxStaffId = 0;
    [...gameState.player.hiredStaff, ...gameState.availableStaffPool].forEach(staff => {
        const match = staff?.id?.match(/_(\d+)$/);
        if (match) maxStaffId = Math.max(maxStaffId, parseInt(match[1]));
    });
     gameState.nextStaffId = Math.max(gameState.nextStaffId || 1, maxStaffId + 1);

    let maxRigId = 0;
    gameState.rigs.forEach(rig => {
        const match = rig?.id?.match(/_(\d+)$/);
        if (match) maxRigId = Math.max(maxRigId, parseInt(match[1]));
    });
     gameState.nextRigId = Math.max(gameState.nextRigId || 1, maxRigId + 1);

     console.log("ID counters updated:", gameState.nextItemId, gameState.nextListingId, gameState.nextOrderId, gameState.nextStaffId, gameState.nextRigId);
}

// Глубокое слияние объектов (простая реализация)
function deepMerge(target, source) {
    // Создаем копию target, чтобы не изменять оригинал напрямую
    const merged = { ...target };
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            const targetValue = merged[key];
            const sourceValue = source[key];
            if (sourceValue !== null && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
                targetValue !== null && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
                merged[key] = deepMerge(targetValue, sourceValue); // Рекурсивно для вложенных объектов
            } else if (sourceValue !== undefined) { // Проверяем на undefined, чтобы не перезаписать существующие ключи null'ами или пустыми значениями из старого сейва
                 merged[key] = sourceValue; // Перезаписываем примитивы, массивы или если в target нет ключа/не объект
            }
        }
    }
    return merged;
}

// --- Игровой Цикл ---
function startGameLoop() {
    if (gameLoopIntervalId) clearInterval(gameLoopIntervalId); // Предотвращаем двойной запуск
    lastTickTime = Date.now();
    gameLoopIntervalId = setInterval(gameTick, TICK_INTERVAL_MS);
    console.log("Игровой цикл запущен.");
}

function stopGameLoop() {
    if (gameLoopIntervalId) {
        clearInterval(gameLoopIntervalId);
        gameLoopIntervalId = null;
        console.log("Игровой цикл остановлен.");
    }
}

function gameTick() {
    const now = Date.now();
    const deltaTime = (now - lastTickTime) / 1000; // Время в секундах с прошлого тика
    lastTickTime = now;

    // Если прошло слишком много времени (например, вкладка была неактивна), ограничиваем deltaTime
    const MAX_DELTA_TIME = 5; // Максимум 5 секунд за тик, чтобы избежать "прыжка"
    const effectiveDeltaTime = Math.min(deltaTime, MAX_DELTA_TIME) * gameState.gameSpeed; // Учитываем скорость игры

    gameState.gameTime += effectiveDeltaTime;

    // --- Обновление Симуляции ---
    updateMining(effectiveDeltaTime);
    updateEnergyCost(effectiveDeltaTime);
    updateWearAndTear(effectiveDeltaTime);
    updateCoolingAndTemperature(effectiveDeltaTime); // Новое
    updateCryptoPrices(effectiveDeltaTime);
    updateMarketSimulation(effectiveDeltaTime); // Обновляем рынок (боты, ордера)
    updateResearchProgress(effectiveDeltaTime); // Новое
    updateStaffActions(effectiveDeltaTime); // Новое
    updateEventSystem(effectiveDeltaTime); // Новое
    checkAchievements(effectiveDeltaTime); // Новое

    // --- Обновление UI (реже для производительности) ---
    // Обновляем чаще важные индикаторы в хедере
    updateHeaderIndicators();
    // Полное обновление UI реже
    if (Math.floor(gameState.gameTime) % 2 === 0) { // Например, каждые 2 игровых секунды
        // Оптимизация: рендерить только активную секцию?
         if (gameState.uiState.activeSection === 'dashboard-section') renderDashboard();
         else if (gameState.uiState.activeSection === 'market-section') renderMarket();
         else if (gameState.uiState.activeSection === 'rigs-section') renderRigs(); // Риги могут требовать более частого обновления
         else if (gameState.uiState.activeSection === 'wallet-section') renderWallet();
         else if (gameState.uiState.activeSection === 'research-section') renderResearch(); // Обновляем прогресс
         else if (gameState.uiState.activeSection === 'staff-section') renderStaff();
         else if (gameState.uiState.activeSection === 'events-section') renderEvents(); // Обновлять, если новости важны
         // Достижения и настройки обновляются по событиям
          // Админка обновляется по событиям
    } else if (gameState.uiState.activeSection === 'rigs-section' || gameState.uiState.activeSection === 'research-section') {
         // Более частый рендер для критичных секций, если нужно
         // renderRigs();
         // renderResearch();
    }


    // --- Автосохранение ---
    if (gameSettings.autosaveInterval > 0 && now - (lastSaveTime || 0) > gameSettings.autosaveInterval * 60 * 1000) {
        saveGame();
    }
}

// --- Функции Обновления Симуляции (Детализация и Заглушки) ---

function updateMining(deltaTime) {
    // Перебираем все риги и их GPU
    gameState.rigs.forEach(rig => {
        // Сбрасываем хешрейт перед пересчетом
         rig.totalHashrate = {};

        if (rig.status !== 'running') return; // Майнят только работающие риги

        const mobo = rig.slots.mobo[0];
        const moboDef = mobo ? moboDefinitions[mobo.definitionId] : null;
        const gpuSlotsInUse = rig.slots.gpu.filter(gpu => gpu !== null && gpu.status !== 'broken').length; // Только рабочие GPU

        // Проверка лимита мат. платы
        if (moboDef && gpuSlotsInUse > moboDef.gpuSlots) {
            addLog(`Ферма "${rig.name}" остановлена: Мат. плата (${moboDef.name}) не поддерживает столько GPU (${gpuSlotsInUse} > ${moboDef.gpuSlots})!`, "error", rig.id);
            rig.status = 'error_mobo';
            return;
        }
         if (!mobo) {
            addLog(`Ферма "${rig.name}" остановлена: Отсутствует материнская плата!`, "error", rig.id);
            rig.status = 'error_mobo';
            return;
        }

        rig.slots.gpu.forEach(gpu => {
            // Проверяем, что GPU существует, не сломан и есть его определение
             if (gpu && gpu.status !== 'broken' && gpuDefinitions[gpu.definitionId]) {
                const def = gpuDefinitions[gpu.definitionId];
                const tempFactor = calculateTempFactor(gpu.temperature);
                const overclockFactor = calculateOverclockFactor(gpu);
                const wearFactor = Math.max(0.1, 1 - (gpu.wear || 0) / 150); // Убедимся, что wear не NaN

                for (const algo in def.hashrates) {
                    if (!rig.totalHashrate[algo]) rig.totalHashrate[algo] = 0;

                    const baseRate = def.hashrates[algo];
                    // Проверяем, что все факторы - числа
                     const effectiveRate = baseRate * wearFactor * tempFactor * overclockFactor;
                     if (isNaN(effectiveRate)) {
                         console.warn(`NaN detected in hashrate calculation for ${def.name} in rig ${rig.id}. Factors: base=${baseRate}, wear=${wearFactor}, temp=${tempFactor}, overclock=${overclockFactor}`);
                         continue; // Пропускаем эту итерацию
                     }

                    rig.totalHashrate[algo] += effectiveRate;

                    // Зарабатываем криптовалюту
                    const cryptoDef = Object.values(cryptoDefinitions).find(c => c.algorithm === algo);
                    if (cryptoDef) {
                        // Усложненная формула: (Хешрейт_Алгоритма_Карты / Общий_Хешрейт_Сети_Алгоритма) * Награда_За_Блок_Алгоритма / Время_Блока_Алгоритма
                        // Упрощенная формула: Хешрейт * Коэффициент_Прибыльности / Сложность
                        const earnCoefficient = 0.00000005; // ОЧЕНЬ ПРИМЕРНЫЙ КОЭФФИЦИЕНТ! НУЖНА БАЛАНСИРОВКА!
                        const difficultyFactor = cryptoDef.difficulty || 1000; // Сложность из определения крипты
                        const earned = (effectiveRate * earnCoefficient / difficultyFactor) * deltaTime;

                        if (earned > 0 && !isNaN(earned)) {
                            if (gameState.player.crypto[cryptoDef.ticker] === undefined) gameState.player.crypto[cryptoDef.ticker] = 0;
                             // Проверяем, что текущий баланс - число
                             if (isNaN(gameState.player.crypto[cryptoDef.ticker])) gameState.player.crypto[cryptoDef.ticker] = 0;
                             gameState.player.crypto[cryptoDef.ticker] += earned;
                        }
                    }
                }
            }
        });
    });
}

function updateEnergyCost(deltaTime) {
    let totalPowerW = 0;
    gameState.rigs.forEach(rig => {
        if (rig.status === 'off' || rig.status?.startsWith('error')) {
             rig.power = 0;
             return; // Не потребляет энергию
        }

        let rigPower = 0;
        // Потребление компонентов (Mobo, Cooling, etc.)
        const mobo = rig.slots.mobo[0];
        const moboDef = mobo ? moboDefinitions[mobo.definitionId] : null;
        rigPower += moboDef?.power || 5; // Базовое потребление, если нет МП или определения

        rig.slots.cooling.forEach(c => {
            const coolDef = c ? coolingDefinitions[c.definitionId] : null;
            rigPower += coolDef?.power || 0;
        });

        // Потребление GPU (с учетом Power Limit)
        rig.slots.gpu.forEach(gpu => {
             // Только работающие GPU потребляют
             if(gpu && gpu.status !== 'broken' && gpuDefinitions[gpu.definitionId]) {
                const def = gpuDefinitions[gpu.definitionId];
                const powerLimitFactor = (gpu.powerLimit || 100) / 100;
                rigPower += def.power * powerLimitFactor;
            }
        });

        // Потери БП
        const psu = rig.slots.psu[0];
        const psuDef = psu ? psuDefinitions[psu.definitionId] : null;

        if (psuDef) {
             const efficiency = (psuDef.efficiency || 80) / 100; // Минимум 80%, если не указано
             const maxEffectivePower = psuDef.powerOutput * efficiency;
             // Проверка мощности БП
             if (rigPower > maxEffectivePower) {
                  addLog(`Ферма "${rig.name}" остановлена: Недостаточно мощности БП (${psuDef.name})! Требуется ${rigPower.toFixed(0)}W, доступно ~${maxEffectivePower.toFixed(0)}W`, "error", rig.id);
                  rig.status = 'error_psu';
                  rig.power = 0; // Перестает потреблять
                  return;
             }
             // Если мощность достаточна, считаем реальное потребление от сети
             rig.power = rigPower / efficiency;
             // Проверка износа БП (простая)
             if (psu.wear > 100) {
                 const breakChance = (psu.wear - 95) / 8000 * deltaTime; // Увеличивается с износом > 100%
                 if (Math.random() < breakChance) {
                      handleComponentBreakdown(rig, 'psu', 0); // Индекс 0, т.к. БП пока один
                 }
             }
        } else {
            // Нет БП - не работает
            addLog(`Ферма "${rig.name}" остановлена: Отсутствует Блок Питания!`, "error", rig.id);
            rig.status = 'error_psu';
            rig.power = 0;
            return;
        }

         // Если риг перегрет, увеличиваем потребление на доп. охлаждение? Или это уже учтено? Пока нет.

        totalPowerW += rig.power;
    });

    const totalPowerKW = totalPowerW / 1000;
    const cost = totalPowerKW * gameSettings.energyCostPerKWh * (deltaTime / 3600); // Стоимость за deltaTime
     if (!isNaN(cost)) {
          gameState.player.money -= cost;
     } else {
          console.warn("NaN detected in energy cost calculation.");
     }
    // Обновить статистику расходов за сессию (если нужно)

    if (gameState.player.money < 0) {
        gameState.player.money = 0; // Банкротство? Или кредит? Пока просто 0.
        addLog("Недостаточно средств для оплаты электроэнергии! Фермы могут остановиться.", "error");
        // TODO: Остановить фермы, если денег нет X времени?
         gameState.rigs.forEach(rig => {
             if(rig.status === 'running' || rig.status === 'overheating') {
                  rig.status = 'error_power_off'; // Новый статус - отключен за неуплату
             }
         });
    } else {
         // Если деньги появились, включить обратно фермы со статусом error_power_off?
          gameState.rigs.forEach(rig => {
              if (rig.status === 'error_power_off') {
                  rig.status = 'idle'; // Попробовать запустить снова (станет running в след. тике, если все ок)
                  addLog(`Появились средства, ферма "${rig.name}" снова пытается запуститься.`, "info", rig.id);
              }
          });
    }
}

function updateWearAndTear(deltaTime) {
    const baseWearMultiplier = 0.001; // Базовый множитель износа за 1 час работы при норм. условиях

    gameState.rigs.forEach(rig => {
        if (rig.status !== 'running' && rig.status !== 'overheating') return; // Износ только у работающих/перегретых

        const wearDeltaTime = deltaTime / 3600; // Переводим в часы для множителя

        // Износ GPU
        rig.slots.gpu.forEach((gpu, index) => {
            if (gpu && gpu.status !== 'broken' && gpuDefinitions[gpu.definitionId]) {
                const def = gpuDefinitions[gpu.definitionId];
                const baseWearRate = def.wearRate || 0.01; // Базовая скорость износа (% в час) из определения
                const tempFactor = Math.max(1, (gpu.temperature || 60) / 60); // Ускорение от температуры > 60C (линейно)
                 const overclockFactor = 1 + (Math.abs(gpu.coreClockOffset || 0) / 500) + (Math.abs(gpu.memClockOffset || 0) / 1000); // Ускорение от разгона (большие значения = больший износ)
                 const powerLimitFactor = Math.max(0.8, (gpu.powerLimit || 100) / 100); // Небольшое снижение износа при андервольте

                const wearAmount = baseWearRate * tempFactor * overclockFactor * powerLimitFactor * baseWearMultiplier * wearDeltaTime;
                 gpu.wear = Math.min(150, (gpu.wear || 0) + wearAmount); // Максимум 150% износа

                // Шанс поломки
                 if (gpu.wear >= 95) { // Начинаем проверять шанс с 95%
                    const breakChance = ((gpu.wear - 90) / 10000) * (deltaTime / 60); // Увеличивается с износом, вероятность в минуту
                    if (Math.random() < breakChance) {
                        handleComponentBreakdown(rig, 'gpu', index);
                    }
                 }
            }
        });

          // Износ PSU
          const psu = rig.slots.psu[0];
          if (psu && psu.status !== 'broken' && psuDefinitions[psu.definitionId]) {
              const psuDef = psuDefinitions[psu.definitionId];
               const loadFactor = Math.min(1.5, (rig.power * (psuDef.efficiency || 80) / 100) / psuDef.powerOutput); // Нагрузка на БП (может быть > 1 если риг потребляет больше чем надо, до ошибки)
               const basePsuWearRate = 0.005; // Медленнее изнашивается
               const psuWearAmount = basePsuWearRate * loadFactor * baseWearMultiplier * wearDeltaTime;
               psu.wear = Math.min(150, (psu.wear || 0) + psuWearAmount);
               // Шанс поломки PSU уже обрабатывается в updateEnergyCost при проверке износа
          }

          // Износ Охлаждения
          rig.slots.cooling.forEach((cooler, index) => {
              if(cooler && cooler.status !== 'broken' && coolingDefinitions[cooler.definitionId]) {
                   const coolDef = coolingDefinitions[cooler.definitionId];
                   const baseCoolerWearRate = 0.008;
                   // Износ зависит от температуры рига? Или просто от времени?
                    const tempFactor = Math.max(1, (rig.temp || 30) / 50); // Ускоренный износ при высокой общей температуре
                    const coolerWearAmount = baseCoolerWearRate * tempFactor * baseWearMultiplier * wearDeltaTime;
                    cooler.wear = Math.min(150, (cooler.wear || 0) + coolerWearAmount);
                    // Шанс поломки
                    if (cooler.wear >= 98) {
                         const breakChance = ((cooler.wear - 95) / 5000) * (deltaTime / 60);
                         if (Math.random() < breakChance) {
                              handleComponentBreakdown(rig, 'cooling', index);
                         }
                    }
              }
          });

          // Износ Mobo (очень медленный)
          const mobo = rig.slots.mobo[0];
           if (mobo && mobo.status !== 'broken' && moboDefinitions[mobo.definitionId]) {
                const baseMoboWearRate = 0.001;
                const moboWearAmount = baseMoboWearRate * baseWearMultiplier * wearDeltaTime;
                mobo.wear = Math.min(150, (mobo.wear || 0) + moboWearAmount);
                // Шанс поломки Mobo (очень низкий)
                 if (mobo.wear >= 110) {
                      const breakChance = ((mobo.wear - 105) / 20000) * (deltaTime / 60);
                      if (Math.random() < breakChance) {
                           handleComponentBreakdown(rig, 'mobo', 0);
                      }
                 }
           }
    });
}

function updateCoolingAndTemperature(deltaTime) {
    const AMBIENT_TEMP = 25; // Температура окружения
    const TEMP_CHANGE_RATE = 0.15; // Как быстро температура стремится к целевой (0.0 до 1.0)
    const HEAT_TO_TEMP_FACTOR = 0.08; // Коэффициент преобразования баланса тепла в градусы

    gameState.rigs.forEach(rig => {
        // Температура обновляется даже для выключенных ригов (они остывают)
         if (rig.status?.startsWith('error_') && rig.status !== 'error_power_off') {
              // Если ошибка не связана с питанием, риг не работает и не греется/остывает? Или остывает? Оставим остывание.
         }

        let totalHeatGeneratedW = 0; // Тепло от компонентов в Ваттах
        let totalCoolingPowerUnits = 0; // Мощность охлаждения в условных единицах

        // Тепло генерируется только работающими компонентами
        if (rig.status === 'running' || rig.status === 'overheating') {
             // Тепло от GPU
             rig.slots.gpu.forEach(gpu => {
                 if (gpu && gpu.status !== 'broken' && gpuDefinitions[gpu.definitionId]) {
                     const def = gpuDefinitions[gpu.definitionId];
                     const powerLimitFactor = (gpu.powerLimit || 100) / 100;
                      // Почти вся потребляемая мощность GPU уходит в тепло
                      totalHeatGeneratedW += def.power * powerLimitFactor * 0.95;
                 }
             });
             // Тепло от Mobo
             const mobo = rig.slots.mobo[0];
             const moboDef = mobo ? moboDefinitions[mobo.definitionId] : null;
             totalHeatGeneratedW += moboDef?.power || 5;

             // Тепло от потерь БП
             const psu = rig.slots.psu[0];
             const psuDef = psu ? psuDefinitions[psu.definitionId] : null;
             if (psuDef && rig.power > 0) { // rig.power - это потребление от сети
                  const efficiency = (psuDef.efficiency || 80) / 100;
                  const powerConsumedByRig = rig.power * efficiency; // Мощность, идущая компонентам
                  const heatLossPSU = rig.power - powerConsumedByRig; // Потери БП в тепло
                  totalHeatGeneratedW += heatLossPSU;
             }
        }


        // Мощность охлаждения (работает всегда, если есть питание?)
         // Считаем, что охлаждение работает, если риг не выключен полностью (off или error_power_off)
         let isCoolingActive = rig.status !== 'off' && rig.status !== 'error_power_off';

         // Базовое охлаждение стойки
        const rackDef = rig.definitionId ? rackDefinitions[rig.definitionId] : null;
        totalCoolingPowerUnits += rackDef?.baseCooling || 0;

        // Охлаждение от компонентов
        rig.slots.cooling.forEach(c => {
            if (c && c.status !== 'broken' && coolingDefinitions[c.definitionId]) {
                 const coolDef = coolingDefinitions[c.definitionId];
                 const wearFactor = Math.max(0.3, 1 - (c.wear || 0) / 100); // Снижение эффективности с износом
                 if(isCoolingActive) {
                     totalCoolingPowerUnits += coolDef.coolingPower * wearFactor;
                 }
            }
        });

        // Расчет температуры рига (target temperature)
         // Упрощенный баланс: Тепловая мощность (W) против Охлаждающей мощности (Units)
         // Нужен коэффициент перевода W в Units или наоборот. Пусть 1 Cooling Unit = 10 W тепла.
         const coolingWEquivalent = totalCoolingPowerUnits * 10;
         const heatBalanceW = totalHeatGeneratedW - coolingWEquivalent;
         // Целевая температура: Базовая + добавка от дисбаланса тепла
         const targetRigTemp = AMBIENT_TEMP + Math.max(0, heatBalanceW) * HEAT_TO_TEMP_FACTOR;

         // Обновление температуры каждой GPU (стремится к targetRigTemp рига)
         let avgRigTemp = 0;
         let gpuCount = 0;
         let isAnyGpuOverheating = false;

         rig.slots.gpu.forEach(gpu => {
             if (gpu) { // Обновляем температуру даже для сломанных (они остывают)
                 gpu.temperature = gpu.temperature || AMBIENT_TEMP; // Инициализация, если нет
                 let currentTargetTemp = targetRigTemp;
                  // Если GPU сломан или риг не работает, цель - остыть до окружения
                  if (gpu.status === 'broken' || (rig.status !== 'running' && rig.status !== 'overheating')) {
                       currentTargetTemp = AMBIENT_TEMP;
                  }

                 // Температура меняется медленнее, стремится к целевой
                 const tempChange = (currentTargetTemp - gpu.temperature) * TEMP_CHANGE_RATE * deltaTime * gameState.gameSpeed; // Учитываем скорость игры!
                 gpu.temperature += tempChange;
                 // Ограничения температуры (например, от -10 до 110)
                 gpu.temperature = Math.max(AMBIENT_TEMP - 5, Math.min(110, gpu.temperature));

                 // Не считаем среднюю температуру по сломанным картам
                  if(gpu.status !== 'broken') {
                       avgRigTemp += gpu.temperature;
                       gpuCount++;
                  }

                 // Проверка перегрева GPU (только для работающих карт)
                  if (gpu.status !== 'broken' && gpu.temperature > 95 && (rig.status === 'running' || rig.status === 'overheating')) {
                       if(gameSettings.notifyOverheat) addLog(`Карта ${gpuDefinitions[gpu.definitionId]?.name} в "${rig.name}" ПЕРЕГРЕЛАСЬ (${gpu.temperature.toFixed(0)}°C)! Хешрейт снижен.`, "warning", rig.id);
                       isAnyGpuOverheating = true;
                       // Можно добавить статус 'overheating' прямо на GPU?
                       // gpu.status = 'overheating'; // Не очень хорошо, т.к. статус должен быть один
                  }
             }
         });

          // Обновляем среднюю температуру рига
          rig.temp = gpuCount > 0 ? avgRigTemp / gpuCount : AMBIENT_TEMP;

          // Обновление статуса рига на основе перегрева
          if (isAnyGpuOverheating && rig.status === 'running') {
               rig.status = 'overheating';
               addLog(`Ферма "${rig.name}" перешла в режим перегрева из-за высоких температур GPU.`, "warning", rig.id);
          } else if (!isAnyGpuOverheating && rig.status === 'overheating') {
               // Если температура спала ниже порога (например, 90)
               const allGpuCoolEnough = rig.slots.gpu.every(gpu => !gpu || gpu.temperature < 90);
               if (allGpuCoolEnough) {
                    rig.status = 'running'; // Возвращаемся в нормальный режим
                    addLog(`Температура в "${rig.name}" нормализовалась.`, "info", rig.id);
               }
          }
          // Если риг был выключен или в ошибке (кроме перегрева), он не должен сам перейти в 'running'
           else if (rig.status === 'idle' && rig.slots.gpu.some(g => g && g.status !== 'broken')) { // Если есть хоть одна рабочая карта
               rig.status = 'running'; // Автозапуск, если был idle
           } else if (rig.status === 'running' && rig.slots.gpu.every(g => !g || g.status === 'broken')) {
                rig.status = 'idle'; // Переход в idle, если все карты сломаны/отсутствуют
           }
    });
}


function updateCryptoPrices(deltaTime) {
    const HISTORY_INTERVAL = 60; // Записывать историю раз в 60 игровых секунд (1 минута)
    const MAX_HISTORY_POINTS = 1440; // Хранить историю за последние 24 часа (1440 минут)

    for (const ticker in gameState.cryptoPrices) {
        if (cryptoDefinitions[ticker]) {
            const cryptoDef = cryptoDefinitions[ticker];
            const volatility = cryptoDef.volatility || 0.1;
            // Модель изменения цены: Случайное блуждание + Возврат к средней (basePrice) + Влияние новостей
            const randomFactor = (Math.random() - 0.495) * volatility * 2; // Случайный шум (нормализованный?)
            const meanReversionFactor = (cryptoDef.basePrice - gameState.cryptoPrices[ticker]) / cryptoDef.basePrice * 0.05; // Медленный возврат к базовой цене
            const newsFactor = calculateNewsImpactFactor(ticker); // Влияние новостей/событий

            // Комбинируем факторы, deltaTime влияет на скорость изменения
            const changePercent = (randomFactor + meanReversionFactor + newsFactor) * (deltaTime / 60); // Нормализуем на минуту

            const oldPrice = gameState.cryptoPrices[ticker];
            let newPrice = oldPrice * (1 + changePercent);
            newPrice = Math.max(0.0001, newPrice); // Минимальная цена (не 0)

             if (isNaN(newPrice)) {
                 console.warn(`NaN detected in crypto price calculation for ${ticker}. OldPrice=${oldPrice}, ChangePercent=${changePercent}`);
                 newPrice = oldPrice; // Не меняем цену, если NaN
             }
            gameState.cryptoPrices[ticker] = newPrice;

            // Сохранение истории цен
            if (!gameState.cryptoPriceHistory[ticker]) gameState.cryptoPriceHistory[ticker] = [];
            // Проверяем, прошло ли достаточно времени с последней записи для этой крипты
            const lastHistoryEntry = gameState.cryptoPriceHistory[ticker][gameState.cryptoPriceHistory[ticker].length - 1];
            const timeSinceLastEntry = lastHistoryEntry ? Math.floor(gameState.gameTime) - lastHistoryEntry.time : HISTORY_INTERVAL;

            if (!lastHistoryEntry || timeSinceLastEntry >= HISTORY_INTERVAL) {
                 gameState.cryptoPriceHistory[ticker].push({ time: Math.floor(gameState.gameTime), price: newPrice });
                 // Ограничить размер истории
                 if (gameState.cryptoPriceHistory[ticker].length > MAX_HISTORY_POINTS) {
                     gameState.cryptoPriceHistory[ticker].shift();
                 }
            }
        }
    }
}

function updateMarketSimulation(deltaTime) {
    // 1. Симуляция Б/У рынка (боты выставляют товары)
    Object.keys(componentDefinitions).forEach(compType => {
        simulateUsedMarketForType(compType, deltaTime);
    });

    // 2. Симуляция Ордеров на Оборудование (боты ставят ордера, сведение ордеров)
    simulateHardwareOrders(deltaTime);

    // 3. Симуляция Криптобиржи (боты двигают стаканы, сведение ордеров)
    simulateCryptoExchange(deltaTime);
}

function simulateUsedMarketForType(componentType, deltaTime) {
    const botActivity = gameSettings.botActivity || 5;
    const definitions = componentDefinitions[componentType];
    if (!definitions || Object.keys(definitions).length === 0) return;

    // Вероятность появления нового Б/У товара в минуту
     const spawnChancePerMinute = botActivity / (5 * Object.keys(componentDefinitions).length);
     const spawnChancePerTick = spawnChancePerMinute * (deltaTime / 60);

    if (Math.random() < spawnChancePerTick) {
        const availableDefs = Object.values(definitions);
        if (availableDefs.length === 0) return;
        const randomDef = availableDefs[Math.floor(Math.random() * availableDefs.length)];
        const wear = Math.random() * 70; // 0-70% износа
         // Цена зависит от базовой цены, износа и случайности
         const priceFactorFromWear = Math.max(0.2, 0.9 - wear / 100); // От 90% до 20% от базовой
         const randomPriceFactor = 0.8 + Math.random() * 0.4; // +/- 20% случайности
        const price = (randomDef.price || 50) * priceFactorFromWear * randomPriceFactor;

        const newItem = {
            id: `${componentType}_bot_${gameState.nextItemId++}`,
            definitionId: randomDef.id,
            wear: wear,
             // Добавить специфичные поля для GPU (случайный разгон?)
             ...(componentType === 'gpu' && {
                 coreClockOffset: Math.floor((Math.random() - 0.5) * 100), // -50 to +50 MHz
                 memClockOffset: Math.floor((Math.random() - 0.5) * 200), // -100 to +100 MHz
                 powerLimit: 100,
                 temperature: 25 // Начальная температура
             })
        };
        const newListing = {
            listingId: `used_${gameState.nextListingId++}`,
            item: newItem,
            price: Math.max(5, Math.round(price)), // Мин. цена $5
            seller: `BotTrader_${Math.floor(Math.random() * 100)}`,
            type: componentType, // Добавляем тип для фильтрации
            timestamp: Math.floor(gameState.gameTime)
        };

        if (!gameState.market.used[componentType]) gameState.market.used[componentType] = [];
        gameState.market.used[componentType].push(newListing);

        // Ограничиваем размер рынка для типа (удаляем самые старые)
        const maxListingsPerType = 20 + botActivity * 2;
        if (gameState.market.used[componentType].length > maxListingsPerType) {
            gameState.market.used[componentType].sort((a, b) => a.timestamp - b.timestamp); // Сортируем по времени
            gameState.market.used[componentType].shift(); // Удаляем самый старый
        }
        // addLog(`Новое Б/У ${componentType}: ${randomDef.name} за $${newListing.price}`); // Очень много логов будет
    }
}

function simulateHardwareOrders(deltaTime) {
    const botActivity = gameSettings.botActivity || 5;
    const orderChancePerMinute = botActivity / 2; // Шанс на создание ордера ботом в минуту

     Object.keys(componentDefinitions).forEach(compType => {
        if(compType === 'other') return; // Не торгуем "прочим" через ордера
         const definitions = componentDefinitions[compType];
         if (!definitions || Object.keys(definitions).length === 0) return;

         const orderChancePerTick = orderChancePerMinute * (deltaTime / 60);

         // Шанс создать ордер на ПОКУПКУ
         if (Math.random() < orderChancePerTick / 2) {
             const randomDef = Object.values(definitions)[Math.floor(Math.random() * Object.keys(definitions).length)];
             // Цена покупки чуть ниже базовой
              const price = (randomDef.price || 50) * (0.7 + Math.random() * 0.25); // 70-95% от базовой
              const amount = Math.floor(Math.random() * botActivity) + 1; // От 1 до botActivity штук

              const newOrder = {
                  orderId: `order_buy_${gameState.nextOrderId++}`,
                  price: Math.round(price),
                  amount: amount,
                  itemId: randomDef.id, // ID определения
                  creator: 'bot',
                  timestamp: Math.floor(gameState.gameTime),
                  type: 'buy'
              };
              if (!gameState.market.orders[compType]) gameState.market.orders[compType] = { buy: [], sell: [] };
              gameState.market.orders[compType].buy.push(newOrder);
         }

         // Шанс создать ордер на ПРОДАЖУ (новые товары)
         if (Math.random() < orderChancePerTick / 2) {
              const randomDef = Object.values(definitions)[Math.floor(Math.random() * Object.keys(definitions).length)];
             // Цена продажи чуть выше базовой
              const price = (randomDef.price || 50) * (1.02 + Math.random() * 0.15); // 102-117% от базовой
              const amount = Math.floor(Math.random() * botActivity) + 1;

              const newOrder = {
                  orderId: `order_sell_${gameState.nextOrderId++}`,
                  price: Math.round(price),
                  amount: amount,
                  itemId: randomDef.id, // ID определения
                  creator: 'bot',
                  timestamp: Math.floor(gameState.gameTime),
                   type: 'sell'
              };
              if (!gameState.market.orders[compType]) gameState.market.orders[compType] = { buy: [], sell: [] };
              gameState.market.orders[compType].sell.push(newOrder);
         }

         // Сведение ордеров (очень простая логика)
         if (gameState.market.orders[compType]) {
              const { buy: buyOrders, sell: sellOrders } = gameState.market.orders[compType];
              buyOrders.sort((a, b) => b.price - a.price); // Лучшие покупки - самые дорогие
              sellOrders.sort((a, b) => a.price - b.price); // Лучшие продажи - самые дешевые

              while (buyOrders.length > 0 && sellOrders.length > 0 && buyOrders[0].price >= sellOrders[0].price) {
                   const buyOrder = buyOrders[0];
                   const sellOrder = sellOrders[0];

                   // Сделка происходит по цене ордера, который был раньше (или средняя?)
                    // Пусть будет цена продавца (sellOrder.price) для простоты
                    const tradePrice = sellOrder.price;
                    const tradeAmount = Math.min(buyOrder.amount, sellOrder.amount);

                    // TODO: Обработать сделку!
                    // - Если ордер игрока, обновить его баланс/инвентарь
                    // - Если оба бота, просто уменьшить количество в ордерах
                    // addLog(`Сделка (${compType}): ${tradeAmount}x ${buyOrder.itemId} @ $${tradePrice} (Ордера: ${buyOrder.orderId} <-> ${sellOrder.orderId})`, 'debug'); // 'debug' тип для скрытия?

                    buyOrder.amount -= tradeAmount;
                    sellOrder.amount -= tradeAmount;

                    // Удаляем исполненные ордера
                    if (buyOrder.amount <= 0) buyOrders.shift();
                    if (sellOrder.amount <= 0) sellOrders.shift();
              }

             // Ограничение количества ордеров (удаляем старые)
              const maxOrders = 50;
              if (buyOrders.length > maxOrders) buyOrders.sort((a,b)=>a.timestamp-b.timestamp).splice(0, buyOrders.length - maxOrders);
              if (sellOrders.length > maxOrders) sellOrders.sort((a,b)=>a.timestamp-b.timestamp).splice(0, sellOrders.length - maxOrders);
         }
     });
}

function simulateCryptoExchange(deltaTime) {
    const botActivity = gameSettings.botActivity || 5;
    const orderChancePerMinute = botActivity * 2; // Больше ордеров на криптобирже
    const bookDepth = 10 + botActivity; // Глубина стакана
    const maxOrdersInBookSide = 100; // Макс ордеров на стороне стакана

     Object.keys(gameState.cryptoPrices).forEach(ticker => {
         const pair = `${ticker}/USD`;
         if (!gameState.market.cryptoExchange[pair]) gameState.market.cryptoExchange[pair] = { bids: [], asks: [] };

         const { bids, asks } = gameState.market.cryptoExchange[pair];
         const currentPrice = gameState.cryptoPrices[ticker];
         const orderChancePerTick = orderChancePerMinute * (deltaTime / 60);
         const volatilityFactor = (cryptoDefinitions[ticker]?.volatility || 0.1) * 5; // Для спреда и объема

         // Шанс добавить ордер (покупка или продажа)
         if (Math.random() < orderChancePerTick) {
             const isBuy = Math.random() < 0.5;
              // Цена ордера близка к текущей цене, с небольшим сдвигом
              const priceSpread = currentPrice * 0.005 * volatilityFactor; // 0.5% спред * волатильность
              const price = isBuy
                  ? currentPrice - priceSpread * Math.random() // Покупка чуть дешевле
                  : currentPrice + priceSpread * Math.random(); // Продажа чуть дороже
              // Объем зависит от цены и волатильности (дороже -> меньше объем?)
               const amount = (Math.random() * botActivity * 10 / price) * volatilityFactor;

              if (price > 0 && amount > 0) {
                   const order = [price, amount]; // [price, amount]
                   if (isBuy) {
                        bids.push(order);
                   } else {
                        asks.push(order);
                   }
              }
         }

         // Шанс отменить случайный ордер (чтобы стакан не рос бесконечно)
          if (Math.random() < orderChancePerTick / 2) {
               if (Math.random() < 0.5 && bids.length > bookDepth) {
                    bids.splice(Math.floor(Math.random() * bids.length), 1);
               } else if (asks.length > bookDepth) {
                    asks.splice(Math.floor(Math.random() * asks.length), 1);
               }
          }

          // Сортировка и ограничение стакана
          bids.sort((a, b) => b[0] - a[0]); // По убыванию цены
          asks.sort((a, b) => a[0] - b[0]); // По возрастанию цены

         if (bids.length > maxOrdersInBookSide) bids.length = maxOrdersInBookSide;
         if (asks.length > maxOrdersInBookSide) asks.length = maxOrdersInBookSide;

         // TODO: Сведение ордеров игроков с этим стаканом? (Обрабатывается при размещении ордера игроком)
     });
}


function updateResearchProgress(deltaTime) {
    if (gameState.activeResearch) {
        const researchId = gameState.activeResearch.researchId;
        const researchDef = researchDefinitions[researchId];
        if (!researchDef) {
            console.error("Активное исследование не найдено в определениях:", researchId);
            addLog(`Ошибка: Не найдено определение для активного исследования ${researchId}. Исследование отменено.`, "error");
            gameState.activeResearch = null;
            return;
        }
        // Учитываем множитель скорости от персонала
        const researchSpeedMultiplier = calculateResearchSpeedMultiplier();
        // Время прогрессирует на основе реального времени * скорость игры * множитель персонала
         const progressDelta = deltaTime * gameState.gameSpeed * researchSpeedMultiplier;
         gameState.activeResearch.progressTime = (gameState.activeResearch.progressTime || 0) + progressDelta;

        // Используем накопленное время для проверки завершения
        if (gameState.activeResearch.progressTime >= researchDef.duration) {
            // Исследование завершено
            addLog(`Исследование "${researchDef.name}" завершено!`, "success");
            gameState.player.completedResearch.push(researchId);
            applyResearchEffect(researchId); // Применить эффект
            gameState.activeResearch = null;
            renderResearch(); // Обновить UI исследований
        }
        // Иначе просто обновляем прогресс-бар (если он есть в UI) - рендер происходит в gameTick
    }
}

function updateStaffActions(deltaTime) {
    let totalSalaryCostPerHour = 0;
     const costMultiplier = deltaTime / 3600; // Множитель для перевода часовой ставки в стоимость за тик

    gameState.player.hiredStaff.forEach(staff => {
         // Зарплата
         const salaryPerHour = staff.salary || 10;
         const cost = salaryPerHour * costMultiplier;
         if (!isNaN(cost)) {
              gameState.player.money -= cost;
         } else {
              console.warn(`NaN detected in staff salary cost calculation for ${staff.name}.`);
         }
         totalSalaryCostPerHour += salaryPerHour;

        // Выполнение заданий персоналом (Заглушки)
        switch(staff.assignment?.split('_')[0]) { // Проверяем первую часть назначения
            case 'idle': break; // Ничего не делает
            case 'repair':
                if (staff.assignedRigId) {
                     staffPerformRepair(staff, staff.assignedRigId, deltaTime);
                }
                break;
            case 'optimize':
                 if (staff.assignedRigId) {
                      staffPerformOptimization(staff, staff.assignedRigId, deltaTime);
                 }
                break;
            case 'research': // Если назначение 'research_assist' или просто 'research'
                // Эффект учтен в calculateResearchSpeedMultiplier
                break;
            // ... другие задания
             default:
                 // Если назначение не распознано, сбросить в idle?
                  // staff.assignment = 'idle';
                  break;
        }
    });

     // Обновить общую зп в UI (если есть элемент)
     const salaryEl = document.getElementById('total-salary-cost');
     if (salaryEl) salaryEl.textContent = totalSalaryCostPerHour.toFixed(2);

     // Генерация новых кандидатов в пул
     generateNewStaffCandidates(deltaTime);
}


// --- Функции выполнения заданий персоналом (Заглушки/Примеры) ---

function staffPerformRepair(staff, rigId, deltaTime) {
     const rig = gameState.rigs.find(r => r.id === rigId);
     if (!rig) {
          staff.assignment = 'idle'; // Сбросить задание, если риг не найден
          return;
     }

     const repairSkill = staff.skills?.repair || 1;
     const repairSpeedFactor = 0.1 * repairSkill; // % износа в секунду на балл навыка (очень быстро!)
     const repairAmount = repairSpeedFactor * deltaTime * gameState.gameSpeed;

     let repairedSomething = false;
     // Ищем самый изношенный *не сломанный* компонент для ремонта
     let componentToRepair = null;
     let maxWear = 0;
     let slotInfo = { type: null, index: -1 };

     Object.keys(rig.slots).forEach(slotType => {
          rig.slots[slotType].forEach((comp, index) => {
               if (comp && comp.status !== 'broken' && (comp.wear || 0) > maxWear && comp.wear > 1) { // Ремонтируем только если износ > 1%
                    maxWear = comp.wear;
                    componentToRepair = comp;
                    slotInfo = { type: slotType, index: index };
               }
          });
     });

     if (componentToRepair) {
          const oldWear = componentToRepair.wear;
          componentToRepair.wear = Math.max(0, oldWear - repairAmount);
          repairedSomething = true;
           // addLog(`${staff.name} ремонтирует ${componentDefinitions[slotInfo.type]?.[componentToRepair.definitionId]?.name || 'компонент'} в "${rig.name}". Износ: ${oldWear.toFixed(1)}% -> ${componentToRepair.wear.toFixed(1)}%`, 'debug');
     } else {
          // Если нечего ремонтировать, можно перевести в idle?
           // staff.assignment = 'idle';
           // addLog(`${staff.name} закончил ремонт в "${rig.name}".`, 'info');
     }
}

function staffPerformOptimization(staff, rigId, deltaTime) {
     // TODO: Реализовать логику оптимизации
     // - Персонал пытается подобрать лучшие настройки разгона для GPU в риге?
     // - Увеличивает хешрейт/снижает потребление?
     // - Эффективность зависит от навыка optimize.
     // - Может быть временный бафф или постоянное (но небольшое) изменение настроек.
     // console.log(`Staff ${staff.name} optimizing rig ${rigId} (placeholder)`);
      if (Math.random() < 0.01 * deltaTime) { // Очень редко
           addLog(`${staff.name} оптимизирует "${gameState.rigs.find(r=>r.id===rigId)?.name || rigId}" (Заглушка)`, 'debug', rigId);
      }
}


function updateEventSystem(deltaTime) {
     const eventCheckInterval = 10; // Проверять раз в 10 секунд игрового времени
     if (Math.floor(gameState.gameTime) % eventCheckInterval !== 0) return; // Проверка реже

     Object.keys(gameState.availableEvents).forEach(eventId => {
         const eventConfig = gameState.availableEvents[eventId];
         const probabilityPerMinute = eventConfig.probability || 0.01; // Вероятность в минуту
         const probabilityPerCheck = probabilityPerMinute * (eventCheckInterval / 60);

         if (Math.random() < probabilityPerCheck) {
             triggerSpecificEvent(eventId, eventConfig);
         }
     });

     // Удаление старых новостей
     const MAX_NEWS = 50;
     if (gameState.newsFeed.length > MAX_NEWS) {
         gameState.newsFeed.shift();
     }
}

function checkAchievements(deltaTime) {
     // Выполнять проверку реже для производительности?
     if (Math.floor(gameState.gameTime) % 5 !== 0) return; // Раз в 5 секунд

     Object.keys(achievementDefinitions).forEach(achId => {
         const achDef = achievementDefinitions[achId];
         if (!achDef || !achDef.condition) return; // Пропускаем, если нет определения или условия

          const playerAch = gameState.player.achievements[achId] || { unlocked: false, progress: 0 };

         if (!playerAch.unlocked) { // Если еще не получено
             const result = achDef.condition(gameState); // Выполнить функцию проверки
              let conditionMet = false;
              let currentProgress = 0;

              if (typeof result === 'boolean') {
                  conditionMet = result;
              } else if (typeof result === 'number') {
                   // Функция вернула текущий прогресс
                   currentProgress = result;
                   if (achDef.target && currentProgress >= achDef.target) {
                        conditionMet = true;
                   }
                   // Обновляем прогресс в состоянии игрока, если он изменился
                    if (currentProgress > playerAch.progress) {
                         playerAch.progress = currentProgress;
                         if(!gameState.player.achievements[achId]) gameState.player.achievements[achId] = playerAch; // Добавить, если не было
                          renderAchievements(); // Обновить UI прогресса
                    }
              }

             if (conditionMet) {
                 unlockAchievement(achId);
             }
         }
     });
}

function calculateTempFactor(temperature) {
    temperature = temperature || AMBIENT_TEMP; // Если температуры нет, считаем нормальной
    if (temperature < 75) return 1.0;
    if (temperature > 95) return 0.5; // Резкое падение при сильном перегреве (50% хешрейта)
    // Линейное падение хешрейта от 100% до 50% в диапазоне 75-95C
     return 1.0 - ((temperature - 75) / (95 - 75)) * 0.5;
}

function calculateOverclockFactor(gpu) {
    // Простая модель: небольшой бонус за разгон, штраф за отрицательный разгон? Нет, только бонус.
    // Считаем, что базовый хешрейт соответствует 0 смещению.
     const coreBoost = (gpu.coreClockOffset || 0) / 1000; // +0.1% за каждые +10 MHz (при 1000 MHz = +10%)
     const memBoost = (gpu.memClockOffset || 0) / 2000; // +0.05% за каждые +10 MHz (при 2000 MHz = +10%)
    // Power limit не влияет напрямую на хешрейт в этой модели (он влияет на температуру и износ)
     return Math.max(0.1, 1 + coreBoost + memBoost); // Минимальный хешрейт 10%
}

function calculateNewsImpactFactor(ticker) {
    let totalImpact = 0;
    const RELEVANT_NEWS_TIME = 3600 * 6; // Учитываем новости за последние 6 игровых часов

    gameState.newsFeed.forEach(news => {
         if (Math.floor(gameState.gameTime) - news.timestamp < RELEVANT_NEWS_TIME) {
              // Проверяем, влияет ли новость на эту крипту (по тикеру или алгоритму)
              const affectsTicker = news.affected?.includes(ticker);
              const affectsAlgo = cryptoDefinitions[ticker] && news.affected?.includes(cryptoDefinitions[ticker].algorithm);

              if (affectsTicker || affectsAlgo) {
                   // Эффект затухает со временем
                    const timeDecay = 1 - (Math.floor(gameState.gameTime) - news.timestamp) / RELEVANT_NEWS_TIME;
                    let impactValue = 0;
                    if (news.type === 'positive') impactValue = (news.strength || 0.01) * timeDecay; // strength 0 до 0.1?
                    if (news.type === 'negative') impactValue = -(news.strength || 0.01) * timeDecay;
                    totalImpact += impactValue;
              }
         }
    });
    // Ограничиваем общий импакт, чтобы не было слишком резких скачков
     return Math.max(-0.1, Math.min(0.1, totalImpact)); // Макс +/- 10% к изменению цены от новостей
}

function calculateResearchSpeedMultiplier() {
    let multiplier = 1;
    gameState.player.hiredStaff.forEach(staff => {
        if (staff.assignment?.startsWith('research')) {
             const researchSkill = staff.skills?.research || 0;
             multiplier += researchSkill * 0.15; // +15% за каждый балл навыка
        }
    });
    // TODO: Учесть баффы от зданий или других исследований?
    return multiplier;
}

function applyResearchEffect(researchId) {
    const researchDef = researchDefinitions[researchId];
    if (!researchDef || !researchDef.effect) return;

    console.log("Применение эффекта исследования:", researchId, researchDef.effect);
    addLog(`Эффект исследования "${researchDef.name}" применен!`, "info");

    const effect = researchDef.effect;
    switch(effect.type) {
        case 'global_hashrate_boost': // Увеличить хешрейт всех GPU на %
             // Это сложно применять динамически, лучше дать бафф
             // Или можно модифицировать *базовые* определения (ОПАСНО!)
             // Пример: добавить глобальный модификатор
             gameSettings.globalHashBoost = (gameSettings.globalHashBoost || 0) + effect.value; // value = 0.05 для +5%
             addLog(`Глобальный хешрейт увеличен на ${effect.value * 100}%!`);
             break;
        case 'energy_efficiency': // Снизить потребление всех GPU на %
             gameSettings.globalEnergySave = (gameSettings.globalEnergySave || 0) + effect.value; // value = 0.03 для -3%
             addLog(`Энергоэффективность улучшена на ${effect.value * 100}%!`);
             break;
        case 'unlock_component': // Разблокировать новый компонент (добавить в магазин?)
             // Нужно добавить ID компонента в эффект
             // componentDefinitions[effect.componentType][effect.componentId].isLocked = false; // Пример
             addLog(`Разблокирован новый компонент: ${effect.componentId}!`);
             renderMarket(); // Обновить рынок
             break;
         case 'unlock_feature': // Разблокировать новую вкладку или функцию
              // Например, разблокировать персонал или авто-ребалансировку
              if (effect.feature === 'staff') document.querySelector('.nav-button[data-section="staff-section"]')?.style.display = 'block';
              addLog(`Разблокирована функция: ${effect.feature}!`);
              break;
          case 'staff_skill_increase': // Увеличить макс навык персонала
              // gameSettings.maxStaffSkill[effect.skill] += effect.value;
               addLog(`Максимальный навык персонала (${effect.skill}) увеличен!`);
               break;
          case 'reduce_wear_rate': // Снизить скорость износа компонента
               gameSettings.globalWearReduction = (gameSettings.globalWearReduction || 0) + effect.value;
                addLog(`Скорость износа оборудования снижена на ${effect.value * 100}%!`);
                break;
         // ... другие типы эффектов
         default:
             console.warn("Неизвестный тип эффекта исследования:", effect.type);
    }
     // Сохранить изменения в настройках, если они были
     saveDefinitionsAndSettings();
}

function generateNewStaffCandidates(deltaTime) {
     const poolSize = gameState.availableStaffPool.length;
     const maxPoolSize = 5 + Math.floor(gameState.gameTime / (3600 * 24)); // Увеличивается со временем
     const spawnChancePerHour = 0.5; // Шанс появления нового кандидата в час
     const spawnChancePerTick = spawnChancePerHour * (deltaTime / 3600);

    if (poolSize < maxPoolSize && Math.random() < spawnChancePerTick) {
         const newStaffId = `staff_${gameState.nextStaffId++}`;
         const skillPoints = 5 + Math.floor(Math.random() * 5); // Всего 5-9 очков навыков
         let remainingPoints = skillPoints;
         const skills = { repair: 0, optimize: 0, research: 0 };
         // Распределяем очки случайно
          while(remainingPoints > 0) {
               const skillName = ['repair', 'optimize', 'research'][Math.floor(Math.random()*3)];
               // Ограничение на макс навык (из gameSettings?)
               const maxSkill = 5; // gameSettings.maxStaffSkill[skillName] || 5;
                if (skills[skillName] < maxSkill) {
                     skills[skillName]++;
                     remainingPoints--;
                }
                // Предохранитель от бесконечного цикла
                if (remainingPoints > 0 && skills.repair >= maxSkill && skills.optimize >= maxSkill && skills.research >= maxSkill) break;
          }

         const baseSalary = 8;
         const salaryPerSkillPoint = 1.5;
         const salary = Math.round(baseSalary + skillPoints * salaryPerSkillPoint + Math.random() * 5); // ЗП зависит от навыков + рандом

         const newStaff = {
             id: newStaffId,
             name: generateStaffName(), // Функция генерации имени
             skills: skills,
             salary: salary
         };
         gameState.availableStaffPool.push(newStaff);
         // addLog(`Новый кандидат в сотрудники: ${newStaff.name}`, 'debug');
         if (gameState.uiState.activeSection === 'staff-section') renderStaff(); // Обновить UI персонала, если он открыт
    }

    // Удалять старых кандидатов?
     const candidateLifetime = 3600 * 24 * 3; // Кандидат "висит" 3 игровых дня
     gameState.availableStaffPool = gameState.availableStaffPool.filter(staff =>
          !staff.timestamp || (Math.floor(gameState.gameTime) - staff.timestamp < candidateLifetime)
     );
     // Добавить timestamp при создании
     gameState.availableStaffPool.forEach(s => { if(!s.timestamp) s.timestamp = Math.floor(gameState.gameTime); });
}

function generateStaffName() {
     // Простая генерация имен
     const firstNames = ["Иван", "Петр", "Сергей", "Алексей", "Дмитрий", "Михаил", "Олег", "Василий", "Никита", "Андрей"];
     const lastNames = ["Петров", "Иванов", "Сидоров", "Кузнецов", "Смирнов", "Волков", "Зайцев", "Белов", "Орлов", "Соколов"];
     return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

function triggerSpecificEvent(eventId, eventConfig) {
     if (!eventConfig) {
          console.warn("Попытка запустить событие без конфигурации:", eventId);
          return;
     }
    console.log("Запуск события:", eventId, eventConfig);
    const timestamp = Math.floor(gameState.gameTime);

     const newsItem = {
         time: formatGameTime(timestamp),
         timestamp: timestamp, // Сохраняем числовой timestamp для фильтрации
         headline: eventConfig.headline || `Событие: ${eventId}`,
         impact: eventConfig.impactDescription || 'Неизвестно',
         type: eventConfig.type || 'neutral', // positive, negative, neutral
          affected: eventConfig.affected || [], // На что влияет (крипта, тип компонента)
          strength: eventConfig.strength || 0.01 // Сила влияния (для цены крипты)
     };
     gameState.newsFeed.push(newsItem);

     // Применяем реальные эффекты события на gameState
     applyEventEffect(eventId, eventConfig);

     if (gameState.uiState.activeSection === 'events-section' || gameState.uiState.activeSection === 'dashboard-section') {
          renderEvents(); // Обновить ленту новостей
     }
     addLog(`Событие: ${newsItem.headline}`, newsItem.type);
}

function applyEventEffect(eventId, eventConfig) {
     if (!eventConfig || !eventConfig.effect) return;
     const effect = eventConfig.effect;
     console.log("Применение эффекта события:", eventId, effect);

     switch(effect.type) {
          case 'market_price_change': // Изменить цену нового оборудования
                const compType = effect.componentType;
                const changePercent = effect.value; // +/- процент
                 if (componentDefinitions[compType]) {
                      Object.keys(componentDefinitions[compType]).forEach(defId => {
                           componentDefinitions[compType][defId].price *= (1 + changePercent);
                           componentDefinitions[compType][defId].price = Math.max(1, Math.round(componentDefinitions[compType][defId].price));
                      });
                       addLog(`Цены на ${getComponentTypeName(compType)} ${changePercent > 0 ? 'выросли' : 'упали'} на ${Math.abs(changePercent * 100)}%!`, eventConfig.type);
                       saveDefinitionsAndSettings(); // Сохраняем измененные определения
                       renderMarket(); // Обновить рынок
                 }
                break;
          case 'instant_cash': // Дать/забрать деньги
                gameState.player.money += effect.amount;
                addLog(`Вы ${effect.amount > 0 ? 'получили' : 'потеряли'} $${Math.abs(effect.amount)}!`, eventConfig.type);
                break;
          case 'component_breakdown': // Сломать случайный компонент определенного типа
               const breakType = effect.componentType;
               let broken = false;
                const potentialTargets = [];
                gameState.rigs.forEach(rig => {
                     rig.slots[breakType]?.forEach((comp, index) => {
                          if (comp && comp.status !== 'broken') {
                               potentialTargets.push({ rig, slotType: breakType, slotIndex: index });
                          }
                     });
                });
                if (potentialTargets.length > 0) {
                     const target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
                     handleComponentBreakdown(target.rig, target.slotType, target.slotIndex);
                     broken = true;
                }
                 if(broken) addLog(`Один из ваших ${getComponentTypeName(breakType)} внезапно сломался!`, eventConfig.type);
                break;
           case 'research_progress': // Дать/отнять прогресс в текущем исследовании
                 if (gameState.activeResearch) {
                      const changeSeconds = effect.value;
                       gameState.activeResearch.progressTime = Math.max(0, (gameState.activeResearch.progressTime || 0) + changeSeconds);
                       addLog(`Прогресс в исследовании "${researchDefinitions[gameState.activeResearch.researchId]?.name}" ${changeSeconds > 0 ? 'ускорен' : 'замедлен'}!`, eventConfig.type);
                       renderResearch();
                 }
                break;
           case 'new_staff_candidate': // Добавить особого кандидата
                 const newStaff = {
                      id: `staff_${gameState.nextStaffId++}`,
                      name: effect.name || generateStaffName(),
                      skills: effect.skills || { repair: 1, optimize: 1, research: 1 },
                      salary: effect.salary || 15,
                      timestamp: Math.floor(gameState.gameTime)
                 };
                 gameState.availableStaffPool.push(newStaff);
                 addLog(`Появился новый интересный кандидат: ${newStaff.name}!`, eventConfig.type);
                 if (gameState.uiState.activeSection === 'staff-section') renderStaff();
                break;
          // ... другие типы эффектов
          default:
              console.warn("Неизвестный тип эффекта события:", effect.type);
     }
}


function unlockAchievement(achievementId) {
    if (!achievementDefinitions[achievementId]) return;

    // Используем gameState для хранения информации о достижениях игрока
     if (!gameState.player.achievements[achievementId]) {
         gameState.player.achievements[achievementId] = { unlocked: false, progress: 0 };
     }

    if (!gameState.player.achievements[achievementId].unlocked) {
        gameState.player.achievements[achievementId].unlocked = true;
         gameState.player.achievements[achievementId].unlockTime = Math.floor(gameState.gameTime); // Запомним время получения

        const achDef = achievementDefinitions[achievementId];
        addLog(`Достижение получено: "${achDef.name}"!`, "success");

        // Выдать награду, если есть
        applyAchievementReward(achievementId);

        // Обновить UI достижений, если оно видимо
        if (gameState.uiState.activeSection === 'achievements-section') {
            renderAchievements();
        }
    }
}

function applyAchievementReward(achievementId) {
     const achDef = achievementDefinitions[achievementId];
     if (!achDef || !achDef.reward) return;
     const reward = achDef.reward;

     let rewardText = reward.text || "Получена награда!";
     if (reward.money) {
          gameState.player.money += reward.money;
          rewardText += ` (+$${reward.money})`;
     }
     if (reward.researchPoints) {
          // gameState.player.researchPoints += reward.researchPoints; // Если есть очки исследований
          // rewardText += ` (+${reward.researchPoints} RP)`;
     }
      if (reward.unlocks) {
           // Разблокировать что-то (исследование, компонент)
           // applyUnlock(reward.unlocks);
           // rewardText += ` (Разблокировано: ${reward.unlocks})`;
      }
     addLog(rewardText, "success");
}

function handleComponentBreakdown(rig, slotType, slotIndex) {
    if (!rig || !rig.slots || !rig.slots[slotType] || !rig.slots[slotType][slotIndex]) return; // Доп. проверки

    const component = rig.slots[slotType][slotIndex];
    if (component.status === 'broken') return; // Уже сломан

    const def = componentDefinitions[slotType]?.[component.definitionId];
    const componentName = def ? def.name : `${slotType} ID: ${component.id?.slice(-4)}`;

    addLog(`КОМПОНЕНТ СЛОМАЛСЯ: ${componentName} в "${rig.name}"! Требуется замена или утилизация.`, "error", rig.id);

    // Помечаем компонент как сломанный
    component.status = 'broken';
    // Сбрасываем кастомные настройки при поломке?
     if (slotType === 'gpu') {
          component.coreClockOffset = 0;
          component.memClockOffset = 0;
          component.powerLimit = 100;
          component.temperature = AMBIENT_TEMP; // Остужаем
     }

    // Останавливаем риг, если сломался ключевой компонент
    if (slotType === 'psu' || slotType === 'mobo') {
         rig.status = `error_${slotType}`;
         addLog(`Ферма "${rig.name}" остановлена из-за поломки ${slotType === 'psu' ? 'блока питания' : 'материнской платы'}.`, "error", rig.id);
    } else if (slotType === 'gpu' && rig.slots.gpu.every(g => g === null || g.status === 'broken')) {
          rig.status = 'error_gpu'; // Остановить, если все GPU сломаны
           addLog(`Ферма "${rig.name}" остановлена, так как все GPU сломаны.`, "error", rig.id);
    } else if (slotType === 'cooling') {
        // Поломка охлаждения может привести к перегреву
         addLog(`Система охлаждения "${componentName}" в "${rig.name}" сломалась! Возможен перегрев.`, "warning", rig.id);
    }

     // Обновить UI немедленно, если секция ригов активна
     if (gameState.uiState.activeSection === 'rigs-section') {
          renderRigs();
     }
}

// --- Обновление / Отрисовка UI ---

function renderUI() {
    // Вызываем рендеры для всех видимых и важных частей
    renderDashboard();
    renderMarket();
    renderRigs();
    renderWallet();
    renderResearch();
    renderStaff();
    renderEvents();
    renderAchievements();
    renderSettings(); // Обновить настройки (например, время последнего сохранения)
    // Админка рендерится при входе/действиях
    updateHeaderIndicators(); // Обновляем всегда
}

function updateHeaderIndicators() {
    gameTimeDisplay.textContent = formatGameTime(gameState.gameTime);
    fiatBalanceHeader.textContent = formatCurrency(gameState.player.money);
    // Суммарный баланс крипты (упрощенно)
    let totalCryptoValue = 0;
    Object.keys(gameState.player.crypto).forEach(ticker => {
        totalCryptoValue += (gameState.player.crypto[ticker] || 0) * (gameState.cryptoPrices[ticker] || 0);
    });
     // Проверяем на NaN
     cryptoBalanceSummaryValue.textContent = !isNaN(totalCryptoValue) && totalCryptoValue > 0 ? formatCurrency(totalCryptoValue) : "0.00";
}

function renderDashboard() {
    if (gameState.uiState.activeSection !== 'dashboard-section') return; // Не рендерить, если не видно

    // Обновление основных показателей дашборда
     // Хешрейт (суммируем по всем ригам)
     let totalHashrateOverall = {};
     gameState.rigs.forEach(rig => {
          // Учитываем хешрейт только работающих ('running') ригов
          if (rig.status === 'running' && rig.totalHashrate) {
             Object.keys(rig.totalHashrate).forEach(algo => {
                 if (!totalHashrateOverall[algo]) totalHashrateOverall[algo] = 0;
                 totalHashrateOverall[algo] += rig.totalHashrate[algo];
             });
         }
     });
     let hashString = Object.entries(totalHashrateOverall)
         .filter(([algo, rate]) => rate > 0.001)
         .map(([algo, rate]) => {
              const cryptoDef = Object.values(cryptoDefinitions).find(c => c.algorithm === algo);
              return `${algo.toUpperCase()}: ${formatHashrate(rate, cryptoDef?.hashUnit || 'H/s')}`;
         })
         .join(' | ') || '0 H/s';
    setTextContent(document.getElementById('current-hashrate'), hashString);

     // Мощность (суммируем по всем *включенным* ригам, даже с ошибками, но не 'off')
     let totalPowerOverall = gameState.rigs.reduce((sum, rig) => sum + (rig.power || 0), 0);
     setTextContent(document.getElementById('current-power'), totalPowerOverall.toFixed(0));

     // Стоимость энергии
     const energyCostPerHour = (totalPowerOverall / 1000) * gameSettings.energyCostPerKWh;
     setTextContent(document.getElementById('energy-cost-hour'), formatCurrency(energyCostPerHour));

     // Статус фермы (общий)
     const farmStatusEl = document.getElementById('farm-status');
     if (farmStatusEl) {
         const runningRigs = gameState.rigs.filter(r => r.status === 'running').length;
         const errorRigs = gameState.rigs.filter(r => r.status?.startsWith('error')).length;
         const overheatingRigs = gameState.rigs.filter(r => r.status === 'overheating').length;
         const totalRigs = gameState.rigs.length;

         if (errorRigs > 0) {
             farmStatusEl.textContent = `Ошибка (${errorRigs}/${totalRigs})`; farmStatusEl.className = 'status-error';
         } else if (overheatingRigs > 0) {
             farmStatusEl.textContent = `Перегрев (${overheatingRigs}/${totalRigs})`; farmStatusEl.className = 'status-warning';
         } else if (runningRigs > 0 && runningRigs === totalRigs) {
              farmStatusEl.textContent = `Работает (${runningRigs}/${totalRigs})`; farmStatusEl.className = 'status-ok';
         } else if (runningRigs > 0) {
              farmStatusEl.textContent = `Частично (${runningRigs}/${totalRigs})`; farmStatusEl.className = 'status-ok'; // Или warning?
         } else if (totalRigs > 0) {
              farmStatusEl.textContent = `Остановлена (0/${totalRigs})`; farmStatusEl.className = 'status-offline';
         } else {
              farmStatusEl.textContent = "Нет ферм"; farmStatusEl.className = 'status-offline';
         }
     }

     // Примерная прибыль (очень грубо, только крипта минус энергия)
      let estimatedCryptoIncomePerHour = 0;
       Object.entries(totalHashrateOverall).forEach(([algo, rate]) => {
            const cryptoDef = Object.values(cryptoDefinitions).find(c => c.algorithm === algo);
            if (cryptoDef) {
                 const earnCoefficient = 0.00000005; // TODO: Убрать магические числа!
                 const difficultyFactor = cryptoDef.difficulty || 1000;
                 const earnedPerSecond = (rate * earnCoefficient / difficultyFactor);
                 estimatedCryptoIncomePerHour += earnedPerSecond * 3600 * (gameState.cryptoPrices[cryptoDef.ticker] || 0);
            }
       });
      const estimatedProfit = estimatedCryptoIncomePerHour - energyCostPerHour;
      setTextContent(document.getElementById('profit-estimate-hour'), formatCurrency(estimatedProfit));

      // Средняя температура (по работающим GPU)
       let totalTemp = 0, activeGpuCount = 0;
       gameState.rigs.forEach(rig => {
            if (rig.status === 'running' || rig.status === 'overheating') {
                rig.slots.gpu.forEach(gpu => {
                    if(gpu && gpu.status !== 'broken' && gpu.temperature) {
                        totalTemp += gpu.temperature;
                        activeGpuCount++;
                    }
                });
            }
       });
       const avgTemp = activeGpuCount > 0 ? totalTemp / activeGpuCount : AMBIENT_TEMP;
       setTextContent(document.getElementById('avg-temp'), avgTemp.toFixed(1));

     // Аптайм
     const uptimeSeconds = (Date.now() - gameState.sessionStartTime) / 1000;
     setTextContent(document.getElementById('session-uptime'), formatDuration(uptimeSeconds));

     // Обзор ферм
     const farmListSummaryEl = document.getElementById('farm-list-summary');
     if (farmListSummaryEl) {
         farmListSummaryEl.innerHTML = '';
         gameState.rigs.forEach(rig => {
             const gpuCount = rig.slots.gpu.filter(g => g !== null && g.status !== 'broken').length;
              const rackDef = rig.definitionId ? rackDefinitions[rig.definitionId] : null;
             const maxSlots = rackDef?.gpuSlots || gameSettings.initialRigSlots; // Используем определение стойки
             const statusClass = rig.status === 'running' ? 'status-ok' : (rig.status === 'overheating' ? 'status-warning' : (rig.status?.startsWith('error') ? 'status-error' : 'status-offline'));
             const statusText = getStatusText(rig.status); // Функция для перевода статуса
             farmListSummaryEl.innerHTML += `<p>${rig.name}: ${gpuCount}/${maxSlots} GPU, ${rig.power?.toFixed(0) || 0}W, ${rig.temp?.toFixed(0) || AMBIENT_TEMP}°C, <span class="${statusClass}">${statusText}</span></p>`;
         });
         if (gameState.rigs.length === 0) farmListSummaryEl.innerHTML = '<p>Нет активных ферм.</p>';
     }
     // TODO: farm-mini-visualization

    // Финансы (Дашборд)
    setTextContent(document.getElementById('fiat-balance'), formatCurrency(gameState.player.money));
    // TODO: Расчет investment-hardware, session-income, session-cost
     // Investment: Сумма цен (price) всех компонентов в inventory и rigs на момент покупки? Сложно. Пока 0.
     setTextContent(document.getElementById('investment-hardware'), '0');
     // Доход/расход за сессию (с момента gameState.sessionStartTime) - нужно накапливать
     // setTextContent(document.getElementById('session-crypto-income'), formatCurrency(gameState.sessionStats.cryptoIncome || 0));
     // setTextContent(document.getElementById('session-energy-cost'), formatCurrency(gameState.sessionStats.energyCost || 0));
     // setTextContent(document.getElementById('session-other-cost'), formatCurrency(gameState.sessionStats.otherCost || 0));
     // setTextContent(document.getElementById('session-net-profit'), formatCurrency((gameState.sessionStats.cryptoIncome || 0) - (gameState.sessionStats.energyCost || 0) - (gameState.sessionStats.otherCost || 0)));
     setTextContent(document.getElementById('session-crypto-income'), '0.00');
     setTextContent(document.getElementById('session-energy-cost'), '0.00');
     setTextContent(document.getElementById('session-other-cost'), '0.00');
     setTextContent(document.getElementById('session-net-profit'), '0.00');


    // Кратко о криптовалютах
    const cryptoSummaryListEl = document.getElementById('dashboard-crypto-list');
    if (cryptoSummaryListEl) {
        cryptoSummaryListEl.innerHTML = ''; // Очищаем
        Object.keys(cryptoDefinitions).slice(0, 5).forEach(ticker => { // Показываем первые 5
            const cryptoDef = cryptoDefinitions[ticker];
            const balance = gameState.player.crypto[ticker] || 0;
            const price = gameState.cryptoPrices[ticker] || 0;
            const value = balance * price;
            // Рассчитать изменение цены (%) за последний час (60*60 сек)
             const history = gameState.cryptoPriceHistory[ticker] || [];
             const oneHourAgoTime = Math.floor(gameState.gameTime) - 3600;
             const priceOneHourAgo = history.find(p => p.time >= oneHourAgoTime)?.price || history[0]?.price || price;
             const priceChangePercent = priceOneHourAgo ? ((price - priceOneHourAgo) / priceOneHourAgo * 100) : 0;

            const priceChangeClass = priceChangePercent > 0.1 ? 'price-up' : (priceChangePercent < -0.1 ? 'price-down' : '');
            const iconHtml = cryptoDef.icon ? (cryptoDef.icon.startsWith('fa') ? `<i class="${cryptoDef.icon}" style="color: ${cryptoDef.color || 'inherit'}"></i>` : `<img src="${cryptoDef.icon}" alt="${ticker}" width="16">`) : '';

             cryptoSummaryListEl.innerHTML += `
                 <div class="crypto-summary-item">
                     ${iconHtml}
                     <span class="crypto-name">${cryptoDef.name} (${ticker})</span>
                     <span class="crypto-balance">${balance.toFixed(6)}</span>
                     <span class="crypto-value text-muted">($${formatCurrency(value)})</span>
                     <span class="crypto-price">@ $${formatCurrency(price)}</span>
                     <span class="price-change ${priceChangeClass}">${priceChangePercent.toFixed(1)}%</span>
                 </div>`;
        });
         if (Object.keys(cryptoDefinitions).length === 0) {
              cryptoSummaryListEl.innerHTML = '<p class="text-muted">Нет данных о криптовалютах.</p>';
         }
    }

    // Лог событий
    const logOutputEl = document.getElementById('log-output'); // Находим элемент здесь
     if (logOutputEl) {
          if (logOutputEl.innerHTML.length > 10000) { // Очищаем, если слишком большой
               logOutputEl.innerHTML = gameState.eventLog.slice(-50).join('<br>'); // Показать последние 50
          } else {
               logOutputEl.innerHTML = gameState.eventLog.join('<br>');
          }
          logOutputEl.scrollTop = logOutputEl.scrollHeight; // Автопрокрутка вниз
     }

    // Уведомления (Alerts)
    const alertsOutputEl = document.getElementById('alerts-output');
     if(alertsOutputEl) {
          // Фильтруем только важные логи (error, warning?) за последнее время?
           const importantLogs = gameState.eventLog
               .filter(log => log.includes('color: red') || log.includes('color: orange'))
               .slice(-5); // Последние 5 важных
           if(importantLogs.length > 0) {
                alertsOutputEl.innerHTML = importantLogs.map(log => `<li class="${log.includes('red')?'alert-danger':'alert-warning'}">${log.replace(/\[.*?\]\s*/, '')}</li>`).join(''); // Убираем время
           } else {
                alertsOutputEl.innerHTML = '<li class="alert-info"><i class="fas fa-info-circle"></i> Нет важных уведомлений.</li>';
           }
     }
}

function renderMarket() {
     if (gameState.uiState.activeSection !== 'market-section') return;

    const category = gameState.uiState.activeMarketCategory;
    const compType = gameState.uiState.activeComponentType;
    const subtab = gameState.uiState.activeMarketSubtab;

    // Обновляем имя компонента в заголовках и кнопках
     document.querySelectorAll('.component-type-name').forEach(el => {
         el.textContent = getComponentTypeName(compType, true); // Plural form
     });
      // Обновить имя в кнопке "Добавить" в админке, если она видна
       const addBtnSpan = document.getElementById('add-component-button')?.querySelector('.admin-selected-comp-type');
       if(addBtnSpan) addBtnSpan.textContent = getComponentTypeName(compType); // Singular form

    if (category === 'hardware') {
         const definitions = componentDefinitions[compType];
        const usedList = gameState.market.used[compType] || [];
        const playerInventory = gameState.player.inventory[compType] || [];

        // Рендер Новых
        const newItemsContainerEl = document.getElementById('new-items-container');
        if (newItemsContainerEl && subtab === 'new') {
             renderComponentList(newItemsContainerEl, Object.values(definitions || {}), 'new');
        }

        // Рендер Б/У
        const usedItemsContainerEl = document.getElementById('used-items-container');
        if (usedItemsContainerEl && subtab === 'used') {
            // Фильтрация и сортировка Б/У (пример)
            const filteredUsed = filterAndSortItems(usedList, getMarketFilters('used', compType));
            renderComponentList(usedItemsContainerEl, filteredUsed, 'used');
        }

        // Рендер Ордеров
        const buyOrdersListEl = document.getElementById('buy-orders-list');
        const sellOrdersListEl = document.getElementById('sell-orders-list');
        if (buyOrdersListEl && sellOrdersListEl && subtab === 'orders') {
             renderOrderBook(buyOrdersListEl, gameState.market.orders[compType]?.buy || [], 'buy');
             renderOrderBook(sellOrdersListEl, gameState.market.orders[compType]?.sell || [], 'sell');
             // Обновить формы создания ордеров (доступные модели и предметы)
              updateHardwareOrderForms(compType);
        }

        // Рендер Предметов для Продажи
        const sellItemsContainerEl = document.getElementById('sell-items-container');
        if (sellItemsContainerEl && subtab === 'sell') {
             renderComponentList(sellItemsContainerEl, playerInventory, 'sell');
        }

    } else if (category === 'crypto') {
        // Рендер Криптобиржи
        renderCryptoExchange();
    }
}

function renderComponentList(container, items, mode = 'new') { // mode: new, used, sell
    container.innerHTML = ''; // Очищаем
    if (!items || items.length === 0) {
        let message = 'Нет доступных товаров.';
        if (mode === 'used') message = 'На Б/У рынке пока пусто.';
        if (mode === 'sell') message = 'У вас нет таких предметов в инвентаре.';
        container.innerHTML = `<p class="text-muted p-3">${message}</p>`;
        return;
    }

    // Сортировка (для used - по цене?)
     if (mode === 'used') items.sort((a, b) => a.price - b.price);
     if (mode === 'sell') items.sort((a, b) => (componentDefinitions[getComponentTypeFromId(a.definitionId)]?.[a.definitionId]?.name || '').localeCompare(componentDefinitions[getComponentTypeFromId(b.definitionId)]?.[b.definitionId]?.name || '')); // По имени

    items.forEach(itemOrDef => {
         // Определяем, определение это или экземпляр
         const isDefinition = mode === 'new';
         let definition = null;
         let instance = null;
         let componentType = null;

         try {
              if (isDefinition) {
                  definition = itemOrDef;
                  componentType = definition?.type || getComponentTypeFromId(definition?.id);
              } else {
                  instance = itemOrDef;
                  // Тип может быть прямо в instance (для Б/У) или определяться из definitionId
                  componentType = instance.type || getComponentTypeFromId(instance.definitionId);
                  if (!componentType) throw new Error("Cannot determine component type");
                  definition = componentDefinitions[componentType]?.[instance.definitionId];
              }

              if (!definition || !componentType) {
                  console.warn("Определение или тип не найдены для", itemOrDef, "в режиме", mode);
                  return; // Пропускаем, если нет определения или типа
              }

              // Используем общую функцию для генерации карточки
              const cardHtml = generateComponentCard(definition, instance, mode, componentType);
              if (cardHtml) {
                  container.insertAdjacentHTML('beforeend', cardHtml);
              }
         } catch (error) {
              console.error("Ошибка рендеринга карточки компонента:", error, "Данные:", itemOrDef, "Режим:", mode);
         }
    });
}

// Генератор HTML для карточки компонента
function generateComponentCard(definition, instance, mode, componentType) {
    const price = (mode === 'new') ? definition.price : (mode === 'used' ? instance.price : null);
    const itemId = (mode === 'new') ? definition.id : (mode === 'used' ? instance.listingId : instance.id);
    const wear = instance?.wear;
    const instanceIdShort = instance?.id?.slice(-6); // Короткий ID экземпляра

    let infoHtml = '';
    let actionHtml = '';
    let requirementsHtml = definition.requirements ? `<p class="requirements" title="Требования"><i class="fas fa-plug"></i> ${definition.requirements}</p>` : '';

    // Генерируем инфо в зависимости от типа компонента
    switch (componentType) {
        case 'gpu':
            const hashrates = definition.hashrates || {};
            let hashInfo = Object.entries(hashrates)
                .map(([algo, rate]) => {
                    const cryptoDef = Object.values(cryptoDefinitions).find(c => c.algorithm === algo);
                    let currentRate = rate;
                    // Для Б/У и Продажи показываем примерный хешрейт с учетом износа
                    if (instance) {
                        currentRate *= Math.max(0.1, 1 - (wear / 150));
                    }
                    return `<p title="${algo.toUpperCase()}"><i class="fas fa-tachometer-alt"></i> ${formatHashrate(currentRate, cryptoDef?.hashUnit || 'H/s')} ${instance ? '(~)' : ''}</p>`;
                }).join('');
             if (!hashInfo) hashInfo = '<p><i class="fas fa-tachometer-alt"></i> N/A</p>';
            infoHtml = `
                ${hashInfo}
                <p title="Потребление"><i class="fas fa-bolt"></i> ${definition.power} W</p>
                ${wear !== undefined ? `<p title="Износ"><i class="fas fa-heartbeat"></i> <span class="wear-tear">${wear.toFixed(1)}%</span></p>` : ''}
                ${mode === 'used' ? `<p title="Продавец"><i class="fas fa-user"></i> <span class="seller-name">${instance.seller}</span></p>` : ''}
                ${requirementsHtml}
            `;
            break;
        case 'psu':
             infoHtml = `
                <p title="Мощность"><i class="fas fa-bolt"></i> ${definition.powerOutput} W</p>
                <p title="Эффективность"><i class="fas fa-leaf"></i> ${definition.efficiency}%</p>
                ${wear !== undefined ? `<p title="Износ"><i class="fas fa-heartbeat"></i> <span class="wear-tear">${wear.toFixed(1)}%</span></p>` : ''}
                 ${mode === 'used' ? `<p title="Продавец"><i class="fas fa-user"></i> <span class="seller-name">${instance.seller}</span></p>` : ''}
                  ${requirementsHtml}
           `;
            break;
        case 'mobo':
             infoHtml = `
                <p title="Слотов GPU"><i class="fas fa-microchip"></i> x${definition.gpuSlots}</p>
                <p title="Слотов PSU"><i class="fas fa-plug"></i> x${definition.psuSlots || 1}</p>
                 <p title="Потребление"><i class="fas fa-bolt"></i> ${definition.power || 5} W</p>
                ${wear !== undefined ? `<p title="Износ"><i class="fas fa-heartbeat"></i> <span class="wear-tear">${wear.toFixed(1)}%</span></p>` : ''}
                 ${mode === 'used' ? `<p title="Продавец"><i class="fas fa-user"></i> <span class="seller-name">${instance.seller}</span></p>` : ''}
                  ${requirementsHtml}
           `;
            break;
        case 'cooling':
             infoHtml = `
                <p title="Мощность охлаждения"><i class="fas fa-snowflake"></i> ${definition.coolingPower} Units</p>
                <p title="Потребление"><i class="fas fa-bolt"></i> ${definition.power} W</p>
                ${wear !== undefined ? `<p title="Износ"><i class="fas fa-heartbeat"></i> <span class="wear-tear">${wear.toFixed(1)}%</span></p>` : ''}
                ${mode === 'used' ? `<p title="Продавец"><i class="fas fa-user"></i> <span class="seller-name">${instance.seller}</span></p>` : ''}
                 ${requirementsHtml}
           `;
            break;
        case 'racks':
             infoHtml = `
                <p title="Слотов GPU"><i class="fas fa-microchip"></i> x${definition.gpuSlots}</p>
                <p title="Базовое охлаждение"><i class="fas fa-wind"></i> ${definition.baseCooling} Units</p>
                 ${requirementsHtml}
           `; // У стоек нет износа? Или есть? Пока нет.
            break;
        default:
            infoHtml = '<p>Нет детальной информации.</p>';
             infoHtml += requirementsHtml;
    }

    // Генерируем кнопки действий
    if (mode === 'new' || mode === 'used') {
         const canAfford = gameState.player.money >= price;
        actionHtml = `
            <p class="price">$${price?.toLocaleString() || 'N/A'}</p>
            <button class="buy-button btn-success" data-item-id="${itemId}" data-type="${mode}" data-component-type="${componentType}" ${!canAfford ? 'disabled' : ''}>Купить</button>
        `;
    } else if (mode === 'sell') {
        actionHtml = `
            <button class="sell-action-button btn-primary" data-item-id="${itemId}" data-component-type="${componentType}">Выставить на Б/У</button>
            <button class="order-sell-action-button btn-secondary" data-item-id="${itemId}" data-component-type="${componentType}">Создать ордер</button>
        `;
    }

    return `
        <div class="market-listing-card ${componentType}-card">
            <div class="gpu-image" style="background-image: url('${definition.imageUrl || `img/placeholder-${componentType}.png`}');"></div>
            <div class="gpu-info">
                <h3>${definition.name} ${instanceIdShort ? `<span class="instance-id">(#${instanceIdShort})</span>` : ''}</h3>
                ${infoHtml}
            </div>
            <div class="gpu-price-action">
                ${actionHtml}
            </div>
        </div>`;
}

function renderOrderBook(container, orders, type = 'buy') {
    container.innerHTML = '';
     if (orders.length === 0) {
         container.innerHTML = `<li class="order-placeholder text-muted">Нет активных ордеров</li>`;
         return;
     }
     // Сортировка: Покупка - по убыванию цены, Продажа - по возрастанию
     orders.sort((a, b) => type === 'buy' ? b.price - a.price : a.price - b.price);

     // Показываем только лучшие N ордеров
      const MAX_ORDERS_DISPLAY = 15;
      orders = orders.slice(0, MAX_ORDERS_DISPLAY);

     orders.forEach(order => {
         const priceColor = type === 'buy' ? 'text-success' : 'text-danger';
         const defName = componentDefinitions[getComponentTypeFromId(order.itemId)]?.[order.itemId]?.name || order.itemId;
         container.innerHTML += `
             <li>
                 <span class="${priceColor}" title="${defName}">$${order.price.toFixed(2)}</span>
                 <span>${order.amount} шт.</span>
                 <span class="text-muted">(~$${(order.price * order.amount).toFixed(0)})</span>
                  ${order.creator === 'player' ? '<i class="fas fa-user" title="Ваш ордер"></i>' : ''}
             </li>
         `;
     });
}

function updateHardwareOrderForms(componentType) {
     const buyModelSelect = document.getElementById('buy-order-model');
     const sellItemSelect = document.getElementById('sell-order-item');
     const definitions = componentDefinitions[componentType] || {};
     const inventoryItems = gameState.player.inventory[componentType] || [];

     // Заполняем select для покупки
     if (buyModelSelect) {
          buyModelSelect.innerHTML = '<option value="">-- Выберите модель --</option>';
          Object.values(definitions).forEach(def => {
               buyModelSelect.innerHTML += `<option value="${def.id}">${def.name} (Цена: $${def.price})</option>`;
          });
     }
      // Заполняем select для продажи
      if (sellItemSelect) {
           sellItemSelect.innerHTML = '<option value="">-- Выберите предмет --</option>';
           inventoryItems.forEach(item => {
                const def = definitions[item.definitionId];
                if(def) sellItemSelect.innerHTML += `<option value="${item.id}">${def.name} (#${item.id.slice(-6)}, Изн: ${item.wear?.toFixed(1)}%)</option>`;
           });
      }
     // Сбросить значения форм
     document.getElementById('place-buy-order-form')?.reset();
     document.getElementById('place-sell-order-form')?.reset();
     setTextContent(document.getElementById('buy-order-total'), '0.00');
     setTextContent(document.getElementById('sell-order-total'), '0.00');
}


function renderCryptoExchange() {
    // Проверяем, активна ли секция и категория
     if (gameState.uiState.activeSection !== 'market-section' || gameState.uiState.activeMarketCategory !== 'crypto') return;

     const selectedPair = document.getElementById('crypto-pair-select')?.value || `${gameState.uiState.selectedWalletCrypto || 'BTC'}/USD`;
     const [baseTicker, quoteTicker] = selectedPair.split('/'); // BTC, USD

      if (!cryptoDefinitions[baseTicker]) {
           console.error(`Криптовалюта ${baseTicker} не найдена в определениях!`);
            document.getElementById('crypto-exchange-content').innerHTML = `<p class="text-danger">Ошибка: Криптовалюта ${baseTicker} не найдена.</p>`;
           return; // Не рендерим дальше, если крипта не существует
      }

     document.querySelectorAll('.current-pair').forEach(el => el.textContent = selectedPair);
     document.querySelectorAll('.crypto-ticker-buy').forEach(el => el.textContent = baseTicker);
     document.querySelectorAll('.crypto-ticker-sell').forEach(el => el.textContent = baseTicker);

     // Обновление стаканов
     const pairOrders = gameState.market.cryptoExchange[selectedPair] || { bids: [], asks: [] };
     const asksListEl = document.getElementById('crypto-asks');
     const bidsListEl = document.getElementById('crypto-bids');
     renderCryptoOrderBookSide(asksListEl, pairOrders.asks, 'asks');
     renderCryptoOrderBookSide(bidsListEl, pairOrders.bids, 'bids');

     // Обновление балансов в форме
     setTextContent(document.getElementById('usd-balance-trade'), formatCurrency(gameState.player.money));
     setTextContent(document.getElementById('crypto-balance-trade'), (gameState.player.crypto[baseTicker] || 0).toFixed(8)); // Больше знаков для крипты

     // Обновление последней цены и 24ч изменения
      const currentPrice = gameState.cryptoPrices[baseTicker] || 0;
      const history = gameState.cryptoPriceHistory[baseTicker] || [];
      const dayAgoTime = Math.floor(gameState.gameTime) - 3600 * 24;
      const priceDayAgo = history.find(p => p.time >= dayAgoTime)?.price || history[0]?.price || currentPrice;
      const change24h = priceDayAgo ? ((currentPrice - priceDayAgo) / priceDayAgo * 100) : 0;
      setTextContent(document.getElementById('crypto-last-price'), formatCurrency(currentPrice, currentPrice < 1 ? 4 : 2));
      const changeEl = document.getElementById('crypto-24h-change');
      if(changeEl) {
           changeEl.textContent = `${change24h.toFixed(2)}%`;
           changeEl.className = `price-change ${change24h > 0.1 ? 'price-up' : (change24h < -0.1 ? 'price-down' : '')}`;
      }

     // Рендер графика (Заглушка)
     renderCryptoExchangeChart(selectedPair);
}

function renderCryptoOrderBookSide(container, orders, type = 'bids') {
    if (!container) return;
    container.innerHTML = '';
    if (!orders || orders.length === 0) {
        container.innerHTML = '<li class="text-muted">Пусто</li>';
        return;
    }
    // Показываем только N лучших ордеров
     const MAX_ORDERS_DISPLAY = 15;
     const displayOrders = orders.slice(0, MAX_ORDERS_DISPLAY);

    displayOrders.forEach(order => {
        // order = [price, amount]
        const price = parseFloat(order[0]);
        const amount = parseFloat(order[1]);
         if (isNaN(price) || isNaN(amount)) return; // Пропускаем невалидные данные
        const priceColor = type === 'bids' ? 'text-success' : 'text-danger';
         const total = price * amount;
        container.innerHTML += `<li><span class="${priceColor}">$${formatCurrency(price, price < 1 ? 4 : 2)}</span> <span>${amount.toFixed(6)}</span> <span class="text-muted">($${formatCurrency(total, 0)})</span></li>`;
    });
}

function renderCryptoExchangeChart(pair) {
    // TODO: Реальная интеграция с библиотекой графиков (например, Lightweight Charts by TradingView)
    const chartContainer = document.getElementById('crypto-exchange-chart-container');
    const placeholder = chartContainer?.querySelector('.chart-placeholder-large');
     const [ticker] = pair.split('/');
     const history = gameState.cryptoPriceHistory[ticker] || [];

    if (placeholder) {
        placeholder.textContent = `[График для ${pair} - ${history.length} точек истории]`;
    }
    // console.log("Rendering crypto chart for:", pair, "(placeholder)");
}


function renderRigs() {
     if (gameState.uiState.activeSection !== 'rigs-section') return;

    // Рендер вкладок ригов
    const rigTabsContainer = document.querySelector('.rig-list-tabs');
    const rigContentContainer = document.getElementById('rig-details-content');
    if (!rigTabsContainer || !rigContentContainer) return;

    let currentTabsHtml = '';
    gameState.rigs.forEach(rig => {
        const isActive = gameState.uiState.activeRigTab === rig.id;
        const statusIndicatorClass = rig.status === 'running' ? 'status-ok' : (rig.status === 'overheating' ? 'status-warning' : (rig.status?.startsWith('error') ? 'status-error' : 'status-offline'));
        currentTabsHtml += `<button class="rig-tab-button ${isActive ? 'active' : ''}" data-rig-id="${rig.id}">
                                 <i class="fas fa-circle ${statusIndicatorClass}" style="font-size: 0.6em; margin-right: 5px;"></i>
                                 ${rig.name}
                            </button>`;
    });
    rigTabsContainer.innerHTML = currentTabsHtml + '<button id="add-new-rig-tab-btn" title="Добавить новую ферму (стойку)"><i class="fas fa-plus"></i></button>';

    // Рендер контента активного рига
    rigContentContainer.innerHTML = ''; // Очищаем
    const activeRig = gameState.rigs.find(rig => rig.id === gameState.uiState.activeRigTab);

    if (activeRig) {
        rigContentContainer.innerHTML = generateRigContentHtml(activeRig);
        // После добавления HTML, отрендерить инвентарь для этого рига
        renderRigInventory(activeRig.id);
        // Обновить детали выбранного слота/компонента для этого рига
         updateSelectedRigItemDetails(activeRig.id);
         // Добавить обработчик для contenteditable имени
          const nameEl = document.getElementById(`rig-name-${activeRig.id}`);
          if(nameEl) nameEl.addEventListener('blur', (e) => handleRenameRig(activeRig.id, e.target.textContent));

    } else if (gameState.rigs.length > 0 && !gameState.uiState.activeRigTab) {
        // Если есть риги, но ни один не выбран, выбираем первый
        gameState.uiState.activeRigTab = gameState.rigs[0].id;
        renderRigs(); // Перерисовываем с выбранным первым ригом
    } else {
         rigContentContainer.innerHTML = '<p class="text-muted p-3">У вас пока нет ферм. Нажмите "+" чтобы добавить.</p>';
    }
}

// Генерирует HTML для содержимого вкладки одного рига
function generateRigContentHtml(rig) {
     const gpuSlots = rig.slots.gpu || [];
     const psuSlots = rig.slots.psu || [];
     const moboSlots = rig.slots.mobo || [];
     const coolingSlots = rig.slots.cooling || [];
     const rackDef = rig.definitionId ? rackDefinitions[rig.definitionId] : null;
     // Макс слотов берем из определения стойки, если есть, иначе из настроек
     const maxGpuSlots = rackDef?.gpuSlots || gameSettings.initialRigSlots;

     // Генерируем HTML для слотов GPU, но только до maxGpuSlots
      let gpuSlotsHtml = '';
      for (let i = 0; i < maxGpuSlots; i++) {
          // gpuSlots[i] может быть undefined, если в сейве было меньше слотов
          gpuSlotsHtml += generateSlotHtml(rig.id, 'gpu', i, gpuSlots[i]);
      }


     // Слоты PSU и Mobo могут быть фиксированы или зависеть от стойки/материнки
      // Пока оставим как есть (1 Mobo, 1 PSU)
      const psuSlotHtml = generateSlotHtml(rig.id, 'psu', 0, psuSlots[0]);
      const moboSlotHtml = generateSlotHtml(rig.id, 'mobo', 0, moboSlots[0]);

      // Слоты охлаждения - сколько есть в массиве
      const coolingSlotsHtml = coolingSlots.map((slot, i) => generateSlotHtml(rig.id, 'cooling', i, slot)).join('')
                             + generateAddCoolingSlotButton(rig.id, coolingSlots.length); // Кнопка добавления

     const statusClass = rig.status === 'running' ? 'status-ok' : (rig.status === 'overheating' ? 'status-warning' : (rig.status?.startsWith('error') ? 'status-error' : 'status-offline'));
     const statusText = getStatusText(rig.status);

     // Общий хешрейт рига
      let rigHashrateHtml = Object.entries(rig.totalHashrate || {})
          .filter(([algo, rate]) => rate > 0.001)
          .map(([algo, rate]) => {
               const cryptoDef = Object.values(cryptoDefinitions).find(c => c.algorithm === algo);
               return `<span title="${algo.toUpperCase()}"><i class="fas fa-tachometer-alt"></i> ${formatHashrate(rate, cryptoDef?.hashUnit || 'H/s')}</span>`;
          })
          .join(' | ');
      if (!rigHashrateHtml && rig.status === 'running') rigHashrateHtml = 'Calculating...';
      else if (!rigHashrateHtml) rigHashrateHtml = 'N/A';

     return `
        <div class="rig-content active" data-rig-content-id="${rig.id}">
             <div class="rig-header">
                  <h3 contenteditable="true" id="rig-name-${rig.id}" data-rig-id="${rig.id}" title="Кликните для переименования">${rig.name}</h3>
                  <div class="rig-stats">
                      <span class="rig-status ${statusClass}" id="rig-status-${rig.id}" title="Статус">${statusText}</span>
                      <span title="Средняя температура GPU"><i class="fas fa-thermometer-half"></i> ${rig.temp?.toFixed(0) || AMBIENT_TEMP}°C</span>
                      <span title="Потребление энергии"><i class="fas fa-bolt"></i> ${rig.power?.toFixed(0) || 0}W</span>
                      <span title="Текущий хешрейт">${rigHashrateHtml}</span>
                  </div>
                 <div class="rig-actions">
                     <button class="rename-rig-btn" data-rig-id="${rig.id}" title="Переименовать (активно при фокусе на названии)"><i class="fas fa-pen"></i></button>
                     <button class="delete-rig-btn btn-danger" data-rig-id="${rig.id}" title="Удалить ферму"><i class="fas fa-trash"></i></button>
                 </div>
             </div>
             <div class="rig-management-layout-advanced">
                 <div class="rig-slots-view">
                     <h4><i class="fas fa-server"></i> Компоненты Фермы</h4>
                     <div class="rig-component-slots" id="rig-slots-${rig.id}">
                          <div class="core-slots"> ${moboSlotHtml} ${psuSlotHtml} </div>
                          <div class="gpu-slots"> ${gpuSlotsHtml} </div>
                          <div class="cooling-slots"> ${coolingSlotsHtml} </div>
                     </div>
                 </div>
                 <div class="rig-inventory-view">
                      <h4><i class="fas fa-box-open"></i> Доступный Инвентарь (${gameState.uiState.selectedInventoryItem ? 'Выбрано: ' + (componentDefinitions[gameState.uiState.selectedInventoryItem.type]?.[gameState.player.inventory[gameState.uiState.selectedInventoryItem.type]?.find(i=>i.id === gameState.uiState.selectedInventoryItem.id)?.definitionId]?.name || '?') : 'Ничего не выбрано'})</h4>
                      <select id="inventory-filter-${rig.id}" data-rig-id="${rig.id}">
                          <option value="gpu">Видеокарты</option>
                          <option value="psu">Блоки питания</option>
                          <option value="mobo">Мат. платы</option>
                          <option value="cooling">Охлаждение</option>
                          <option value="racks">Стойки</option>
                          <option value="other">Прочее</option>
                      </select>
                     <ul id="gpu-inventory-list-${rig.id}" class="inventory-list active"></ul>
                     <ul id="psu-inventory-list-${rig.id}" class="inventory-list" style="display: none;"></ul>
                     <ul id="mobo-inventory-list-${rig.id}" class="inventory-list" style="display: none;"></ul>
                     <ul id="cooling-inventory-list-${rig.id}" class="inventory-list" style="display: none;"></ul>
                      <ul id="racks-inventory-list-${rig.id}" class="inventory-list" style="display: none;"></ul>
                      <ul id="other-inventory-list-${rig.id}" class="inventory-list" style="display: none;"></ul>
                 </div>
                  <div class="rig-item-actions-detailed">
                     <h4><i class="fas fa-sliders-h"></i> Настройки и Действия (${gameState.uiState.selectedRigSlot.slotType ? `Выбран слот: ${getComponentTypeName(gameState.uiState.selectedRigSlot.slotType)} #${gameState.uiState.selectedRigSlot.slotIndex+1}` : 'Слот не выбран'})</h4>
                     <div id="selected-rig-item-details-${rig.id}">
                         <p class="text-muted">Выберите компонент в ферме или предмет в инвентаре...</p>
                     </div>
                 </div>
             </div>
        </div>
    `;
}

// Генерирует HTML для одного слота
function generateSlotHtml(rigId, slotType, slotIndex, componentInstance) {
    const isEmpty = !componentInstance;
     // Проверяем, соответствует ли выбранный слот текущему рендеру
     const isSelected = gameState.uiState.selectedRigSlot.rigId === rigId &&
                        gameState.uiState.selectedRigSlot.slotType === slotType &&
                        gameState.uiState.selectedRigSlot.slotIndex === slotIndex;

    let definition = null;
     if (!isEmpty) {
          definition = componentDefinitions[slotType]?.[componentInstance.definitionId];
          // Если определение не найдено (например, удалено админом), считаем слот пустым
          if (!definition) {
               console.warn(`Определение ${componentInstance.definitionId} для компонента в слоте ${rigId}/${slotType}/${slotIndex} не найдено! Слот будет пустым.`);
               componentInstance = null; // Обнуляем инстанс
               isEmpty = true;
          }
     }

    const name = definition ? definition.name : `Слот ${getComponentTypeName(slotType)} ${slotIndex + 1}`;
    const status = componentInstance?.status; // 'broken'
    let slotClasses = `rig-slot ${slotType}-slot ${isEmpty ? 'empty' : 'occupied'} ${isSelected ? 'selected' : ''}`;
    let statusText = '';
    if (status === 'broken') { slotClasses += ' status-error'; statusText = 'СЛОМАН'; }

    let detailsHtml = '';
    if (isEmpty) {
         detailsHtml = `<span class="slot-type-indicator">(${slotType.toUpperCase()})</span> Пусто`;
    } else if (definition) {
         detailsHtml = `<b>${name}</b>`;
         if (componentInstance) {
              let wearText = componentInstance.wear !== undefined ? `${componentInstance.wear.toFixed(1)}%` : 'N/A';
              if (slotType === 'gpu') {
                   detailsHtml += `<br><span class="text-muted"><i class="fas fa-thermometer-half"></i> ${componentInstance.temperature?.toFixed(0) || AMBIENT_TEMP}°C | <i class="fas fa-heartbeat"></i> ${wearText}</span>`;
              } else {
                   detailsHtml += `<br><span class="text-muted"><i class="fas fa-heartbeat"></i> ${wearText} износ</span>`;
              }
              if(statusText) detailsHtml += `<br><span class="status-text">${statusText}</span>`;
         }
    } else {
         // Случай, когда instance есть, а definition нет (ошибка данных)
         detailsHtml = `<span class="slot-type-indicator">(${slotType.toUpperCase()})</span> Ошибка данных!`;
         slotClasses += ' status-error';
    }


    return `
        <div class="${slotClasses}"
             data-rig-id="${rigId}" data-slot-type="${slotType}" data-slot-index="${slotIndex}"
             title="${definition?.name || 'Пустой слот'}">
            <div class="slot-content">${detailsHtml}</div>
        </div>`;
}

// Генерирует кнопку добавления слота охлаждения
function generateAddCoolingSlotButton(rigId, currentSlotCount) {
     // TODO: Добавить лимит на слоты охлаждения? (например, от стойки)
     const maxCoolingSlots = 4; // Пример лимита
     if (currentSlotCount < maxCoolingSlots) {
          return `
             <button class="rig-slot cooling-slot add-slot-btn"
                     data-rig-id="${rigId}" data-slot-type="cooling"
                     title="Добавить слот охлаждения">
                 <i class="fas fa-plus"></i> Охлаждение
             </button>`;
     }
     return ''; // Не показывать кнопку, если лимит достигнут
}

// Рендерит списки инвентаря для конкретного рига
function renderRigInventory(rigId) {
    const activeFilter = document.getElementById(`inventory-filter-${rigId}`)?.value || 'gpu';

     Object.keys(componentDefinitions).forEach(type => {
         const listEl = document.getElementById(`${type}-inventory-list-${rigId}`);
         if (listEl) {
             listEl.innerHTML = ''; // Очищаем
             const items = gameState.player.inventory[type] || [];
             const itemsOfType = items.filter(item => item); // Убираем null/undefined на всякий случай

             if (itemsOfType.length > 0) {
                  // Сортируем по имени
                  itemsOfType.sort((a, b) => (componentDefinitions[type]?.[a.definitionId]?.name || '').localeCompare(componentDefinitions[type]?.[b.definitionId]?.name || ''));

                 itemsOfType.forEach(item => {
                    const def = componentDefinitions[type]?.[item.definitionId];
                    if (!def) return; // Пропускаем, если нет определения

                    const isSelected = gameState.uiState.selectedInventoryItem?.type === type && gameState.uiState.selectedInventoryItem?.id === item.id;
                    const wearText = item.wear !== undefined ? ` (Изн: ${item.wear.toFixed(1)}%)` : '';
                    listEl.innerHTML += `
                         <li data-item-id="${item.id}" data-item-type="${type}" class="${isSelected ? 'selected' : ''}" title="${def.name}${wearText}">
                             <img src="${def.imageUrl || `img/placeholder-${type}.png`}" class="inventory-icon" alt="${type}">
                             ${def.name} ${wearText}
                         </li>`;
                 });
             } else {
                 listEl.innerHTML = `<li class="text-muted">Пусто</li>`;
             }
             // Показываем/скрываем список в зависимости от фильтра
             listEl.style.display = (type === activeFilter) ? 'block' : 'none';
         }
     });
}

// Обновляет блок с деталями и действиями для выбранного слота/инвентаря
function updateSelectedRigItemDetails(rigId) {
    const detailsContainer = document.getElementById(`selected-rig-item-details-${rigId}`);
    if (!detailsContainer) return;

    const { selectedInventoryItem, selectedRigSlot } = gameState.uiState;
    let html = '';
    let component = null;
    let definition = null;
    let location = null; // 'inventory' or 'rig'
    let currentRig = gameState.rigs.find(r => r.id === rigId);
    if (!currentRig) return; // Не рендерить, если риг не найден

    // Определяем, что выбрано
    if (selectedInventoryItem && selectedInventoryItem.type && selectedInventoryItem.id) {
        component = gameState.player.inventory[selectedInventoryItem.type]?.find(i => i.id === selectedInventoryItem.id);
        if (component) {
             definition = componentDefinitions[selectedInventoryItem.type]?.[component.definitionId];
             location = definition ? 'inventory' : null; // Только если определение найдено
        }
    } else if (selectedRigSlot.rigId === rigId && selectedRigSlot.slotType && selectedRigSlot.slotIndex !== -1) {
        component = currentRig.slots[selectedRigSlot.slotType]?.[selectedRigSlot.slotIndex];
        if (component) {
             definition = componentDefinitions[selectedRigSlot.slotType]?.[component.definitionId];
             location = definition ? 'rig' : null; // Только если определение найдено
        } else {
             location = 'empty_slot';
        }
    }

    // Генерируем HTML
    if (location === 'inventory' && definition && component) {
        html = `<h5>${definition.name} (в инвентаре)</h5>`;
        html += `<p>Тип: ${getComponentTypeName(selectedInventoryItem.type)}</p>`;
        if (component.wear !== undefined) html += `<p>Износ: ${component.wear.toFixed(1)}%</p>`;
        // Кнопка "Установить", если выбран пустой слот *совместимого* типа
        const targetSlot = gameState.uiState.selectedRigSlot; // Берем выбранный слот
         const canInstall = targetSlot.rigId === rigId && // Слот в текущем риге
                           targetSlot.slotType === selectedInventoryItem.type && // Типы совпадают
                           targetSlot.slotIndex !== -1 && // Индекс корректный
                           currentRig.slots[targetSlot.slotType]?.[targetSlot.slotIndex] === null; // Слот пуст

        if (canInstall) {
             html += `<div class="action-buttons"><button id="install-component-btn" class="btn-success">Установить в выбранный слот (${targetSlot.slotType} #${targetSlot.slotIndex + 1})</button></div>`;
        } else {
             html += `<p class="text-muted">Выберите пустой слот (${getComponentTypeName(selectedInventoryItem.type)}) в ферме для установки.</p>`;
        }

    } else if (location === 'rig' && definition && component) {
        html = `<h5>${definition.name} (в "${currentRig.name}")</h5>`;
        html += `<p>Тип: ${getComponentTypeName(selectedRigSlot.slotType)}</p>`;
        if (selectedRigSlot.slotType === 'gpu') {
             html += `<p>Температура: ${component.temperature?.toFixed(1) || AMBIENT_TEMP}°C</p>`;
             // TODO: Показать текущий хешрейт этой карты? (Сложно, считается в цикле)
             // Форма разгона
             html += `
                 <div class="tuning-controls">
                     <h6><i class="fas fa-sliders-h"></i> Тонкая настройка GPU</h6>
                     <div class="tuning-grid">
                         <label>Ядро (MHz): <input type="number" step="10" value="${component.coreClockOffset || 0}" data-gpu-id="${component.id}" data-param="coreClockOffset"></label>
                         <label>Память (MHz): <input type="number" step="25" value="${component.memClockOffset || 0}" data-gpu-id="${component.id}" data-param="memClockOffset"></label>
                         <label>Power Limit (%): <input type="number" step="1" value="${component.powerLimit || 100}" min="50" max="120" data-gpu-id="${component.id}" data-param="powerLimit"></label>
                         <button class="apply-tuning-btn btn-primary" data-gpu-id="${component.id}" title="Применить настройки разгона"><i class="fas fa-check"></i></button>
                     </div>
                 </div>
             `;
        }
         if (component.wear !== undefined) html += `<p>Износ: ${component.wear.toFixed(1)}%</p>`;
         if(component.status === 'broken') html += `<p class="status-error"><i class="fas fa-skull-crossbones"></i> КОМПОНЕНТ СЛОМАН!</p>`;
         // Кнопки действий
         html += '<div class="action-buttons">';
         // Кнопка "Снять" доступна всегда, если компонент не пустой
          html += `<button id="remove-component-btn" class="btn-warning">Снять в инвентарь</button>`;

         if (component.status !== 'broken') {
              const repairCost = calculateRepairCost(component);
              const canAffordRepair = gameState.player.money >= repairCost;
              if ((component.wear || 0) > 1 && repairCost > 0) { // Показывать кнопку, если есть износ > 1%
                   html += `<button id="repair-component-btn" class="btn-info" ${!canAffordRepair ? 'disabled title="Недостаточно средств"' : `title="Стоимость ремонта: $${repairCost}"`}>Ремонт ($${repairCost})</button>`;
              }
         } else { // Если сломан
               html += `<button id="scrap-component-btn" class="btn-danger" title="Утилизировать компонент">Утилизировать</button>`;
         }
          html += '</div>';

    } else if (location === 'empty_slot') {
          html = `<h5>Пустой слот (${getComponentTypeName(selectedRigSlot.slotType)} #${selectedRigSlot.slotIndex + 1})</h5>`;
          // Кнопка установки, если выбран предмет в инвентаре совместимого типа
          const sourceItem = gameState.uiState.selectedInventoryItem;
          if (sourceItem && sourceItem.type === selectedRigSlot.slotType) {
                const itemInstance = gameState.player.inventory[sourceItem.type]?.find(i => i.id === sourceItem.id);
                const itemDef = itemInstance ? componentDefinitions[sourceItem.type]?.[itemInstance.definitionId] : null;
                if(itemDef && itemInstance) {
                     html += `<p>Готов к установке: ${itemDef.name} (#${itemInstance.id.slice(-6)})</p>`;
                     html += `<div class="action-buttons"><button id="install-component-btn" class="btn-success">Установить ${itemDef.name}</button></div>`;
                } else {
                     html += `<p class="text-warning">Ошибка: Выбранный предмет не найден в инвентаре.</p>`;
                }
          } else if (sourceItem) {
                html += `<p class="text-muted">Выберите предмет типа "${getComponentTypeName(selectedRigSlot.slotType)}" в инвентаре для установки.</p>`;
          } else {
               html += `<p class="text-muted">Выберите совместимый компонент в инвентаре для установки.</p>`;
          }
    }
    else {
        html = '<p class="text-muted">Выберите компонент в ферме или предмет в инвентаре...</p>';
    }

    detailsContainer.innerHTML = html;
}

function renderWallet() {
      if (gameState.uiState.activeSection !== 'wallet-section') return;

     // Балансы
     setTextContent(document.getElementById('wallet-fiat-balance'), formatCurrency(gameState.player.money));
     const cryptoBalancesListEl = document.getElementById('wallet-crypto-balances-list');
     const walletChartSelectEl = document.getElementById('wallet-chart-crypto-select');
     let portfolioValue = 0;
     if (cryptoBalancesListEl) cryptoBalancesListEl.innerHTML = '';
     if (walletChartSelectEl) walletChartSelectEl.innerHTML = '';

     const cryptoData = Object.entries(gameState.player.crypto)
          .map(([ticker, balance]) => {
               const definition = cryptoDefinitions[ticker];
               if (!definition) return null; // Пропускаем, если нет определения
               const price = gameState.cryptoPrices[ticker] || 0;
                return {
                     ticker,
                     name: definition.name,
                     icon: definition.icon,
                     balance: balance || 0,
                     price: price,
                     value: (balance || 0) * price
                };
          })
          .filter(item => item !== null) // Убираем null
          .sort((a, b) => b.value - a.value); // Сортируем по стоимости

     cryptoData.forEach(crypto => {
         portfolioValue += crypto.value;
         const iconHtml = crypto.icon ? (crypto.icon.startsWith('fa') ? `<i class="${crypto.icon}"></i>` : `<img src="${crypto.icon}" alt="${crypto.ticker}" width="16">`) : '<i class="fas fa-question-circle"></i>';

         if (cryptoBalancesListEl) {
             cryptoBalancesListEl.innerHTML += `
                 <div class="balance-item crypto-balance">
                     ${iconHtml}
                     <span>${crypto.name} (${crypto.ticker}):</span>
                     <span>${crypto.balance.toFixed(8)}</span>
                     <span class="balance-value">($${formatCurrency(crypto.value)})</span>
                     <div class="wallet-actions">
                         <button class="btn-send btn-secondary" data-ticker="${crypto.ticker}" title="Отправить (Заглушка)"><i class="fas fa-paper-plane"></i></button>
                         <button class="btn-receive btn-secondary" data-ticker="${crypto.ticker}" title="Получить адрес (Заглушка)"><i class="fas fa-qrcode"></i></button>
                     </div>
                 </div>`;
         }
         if (walletChartSelectEl) {
              walletChartSelectEl.innerHTML += `<option value="${crypto.ticker}" ${gameState.uiState.selectedWalletCrypto === crypto.ticker ? 'selected' : ''}>${crypto.name} (${crypto.ticker})</option>`;
         }
     });
      if (cryptoData.length === 0 && cryptoBalancesListEl) {
           cryptoBalancesListEl.innerHTML = '<p class="text-muted">У вас нет криптовалют.</p>';
      }
     setTextContent(document.getElementById('portfolio-total-value'), formatCurrency(gameState.player.money + portfolioValue));

     // График портфеля (Заглушка)
     renderPortfolioPieChart(gameState.player.money, cryptoData);

     // Форма ребалансировки
     renderRebalanceForm(portfolioValue, cryptoData);

     // График выбранной крипты (Заглушка)
     renderWalletCryptoChart(gameState.uiState.selectedWalletCrypto);
}

function renderPortfolioPieChart(fiatValue, cryptoData) {
    // TODO: Реальная интеграция с библиотекой диаграмм (Chart.js, ApexCharts, etc.)
    const chartEl = document.getElementById('portfolio-pie-chart');
     if (!chartEl) return;

    const totalPortfolioValue = fiatValue + cryptoData.reduce((sum, crypto) => sum + crypto.value, 0);

    if (totalPortfolioValue > 0.01) {
         // Собираем данные для диаграммы: метка, значение, цвет?
          let chartData = [{ label: 'USD', value: fiatValue }];
          cryptoData.forEach(crypto => {
              // Пропускаем очень маленькие доли для наглядности
               if (crypto.value / totalPortfolioValue > 0.005) { // Больше 0.5%
                    chartData.push({ label: crypto.ticker, value: crypto.value });
               }
          });
          // Сортируем для легенды/отображения
          chartData.sort((a, b) => b.value - a.value);

          // Упрощенно показываем топ N ассетов текстом
          let topAssetsText = chartData.slice(0, 5).map(d => `${d.label}: ${((d.value / totalPortfolioValue) * 100).toFixed(1)}%`).join(', ');
          if (chartData.length > 5) topAssetsText += ', ...';

          chartEl.textContent = `Распределение портфеля: ${topAssetsText}`;
          // Здесь должен быть код для отрисовки диаграммы с chartData
          // Например, используя Chart.js:
          // const ctx = chartEl.getContext('2d');
          // new Chart(ctx, { type: 'pie', data: { labels: chartData.map(d=>d.label), datasets: [{ data: chartData.map(d=>d.value) }] } });

    } else {
         chartEl.textContent = '[Нет активов для отображения]';
    }
    // console.log("Rendering portfolio pie chart (placeholder)");
}

function renderRebalanceForm(portfolioCryptoValue, cryptoData) {
     const container = document.getElementById('rebalance-targets');
     if (!container) return;
     container.innerHTML = '';
     let currentTotalPercent = 0;

     if (cryptoData.length === 0) {
          container.innerHTML = '<p class="text-muted">Нет криптовалют для ребалансировки.</p>';
          setTextContent(document.getElementById('rebalance-total-percent'), '0');
          document.getElementById('calculate-rebalance-btn')?.setAttribute('disabled', 'true');
          return;
     }
      document.getElementById('calculate-rebalance-btn')?.removeAttribute('disabled');


      cryptoData.forEach(crypto => {
         // TODO: Загружать/сохранять целевые % в gameState? Или рассчитывать динамически?
         // Пока просто берем текущее распределение как цель по умолчанию
         const currentPercent = portfolioCryptoValue > 0 ? (crypto.value / portfolioCryptoValue * 100) : 0;
         // Округляем до целых для удобства ввода
         const targetPercent = Math.round(currentPercent);
         currentTotalPercent += targetPercent;

         container.innerHTML += `
             <div class="rebalance-target-item">
                 <label for="rebalance-${crypto.ticker.toLowerCase()}">${crypto.ticker} (%):</label>
                 <input type="number" id="rebalance-${crypto.ticker.toLowerCase()}" data-ticker="${crypto.ticker}" min="0" max="100" step="1" value="${targetPercent}">
                 <span class="text-muted current-percent" title="Текущая доля">(Тек: ${currentPercent.toFixed(1)}%)</span>
             </div>
         `;
     });

      // Корректировка суммы до 100% (грубо, добавляем/убираем у последнего)
      const inputs = container.querySelectorAll('input[type="number"]');
      if(inputs.length > 0) {
          const lastInput = inputs[inputs.length-1];
           const currentSum = Array.from(inputs).reduce((sum, input) => sum + parseInt(input.value || 0), 0);
          const diff = 100 - currentSum;
          const lastVal = parseInt(lastInput.value || 0);
          const newVal = Math.max(0, Math.min(100, lastVal + diff)); // Не выходим за 0-100
          if (lastVal !== newVal) {
              lastInput.value = newVal;
              currentTotalPercent = 100; // Принудительно
          } else {
               currentTotalPercent = currentSum; // Если коррекция не удалась, показываем реальную сумму
          }
      }


     setTextContent(document.getElementById('rebalance-total-percent'), currentTotalPercent);
      document.getElementById('rebalance-total-percent').style.color = (currentTotalPercent === 100) ? 'inherit' : 'red';
     // Сбросить список действий и скрыть кнопку выполнения
     document.getElementById('rebalance-steps-list').innerHTML = '<li>Нажмите "Рассчитать" для получения плана действий.</li>';
     document.getElementById('execute-rebalance-btn').style.display = 'none';
}

function renderWalletCryptoChart(ticker) {
    // TODO: Реальная интеграция с библиотекой графиков
    const chartEl = document.getElementById('wallet-selected-crypto-chart');
     if (!chartEl) return;
     if (!ticker || !cryptoDefinitions[ticker]) {
          chartEl.textContent = '[Выберите криптовалюту для отображения графика]';
          return;
     }

    const history = gameState.cryptoPriceHistory[ticker] || [];
     const placeholder = chartEl.querySelector('.chart-placeholder');

    if (placeholder) {
        placeholder.textContent = `[График цены ${ticker} - ${history.length} точек]`;
    }
     // console.log("Rendering wallet crypto chart (placeholder) for:", ticker);
      // Здесь должен быть код для отрисовки графика цены с использованием history
      // Например, используя Lightweight Charts:
      // chart.setData(history.map(p => ({ time: p.time, value: p.price })));
}


function renderResearch() {
      if (gameState.uiState.activeSection !== 'research-section') return;

    const treeContainer = document.getElementById('research-tree-container');
    const currentDetailsEl = document.getElementById('current-research-details');
    const completedListEl = document.getElementById('completed-research-list');

    if (!treeContainer || !currentDetailsEl || !completedListEl) return;

    // Рендер дерева (Упрощенно - список)
    // TODO: Реализовать визуальное дерево с зависимостями (например, с помощью LeaderLine.js или D3.js)
    treeContainer.innerHTML = '';
    const researchArray = Object.values(researchDefinitions);
     // Сортировка (например, по стоимости или по зависимостям?)
     researchArray.sort((a, b) => (a.cost || 0) - (b.cost || 0));

    researchArray.forEach(resDef => {
        const isCompleted = gameState.player.completedResearch.includes(resDef.id);
        const isActive = gameState.activeResearch?.researchId === resDef.id;
         // Проверяем зависимости
         const dependenciesMet = (resDef.requires || []).every(reqId => gameState.player.completedResearch.includes(reqId));
         // Проверяем стоимость
          const canAfford = gameState.player.money >= (resDef.cost || 0);
          // Можно начать исследование?
         const canResearch = !isCompleted && !isActive && dependenciesMet;

        let nodeClass = 'locked';
         let titleText = '';
         if (isCompleted) {
              nodeClass = 'completed'; titleText = 'Исследование завершено';
         } else if (isActive) {
              nodeClass = 'active'; titleText = 'Исследование активно';
         } else if (canResearch && canAfford) {
              nodeClass = 'available'; titleText = 'Доступно для исследования';
         } else if (canResearch && !canAfford) {
              nodeClass = 'locked'; titleText = 'Недостаточно средств';
         } else if (!dependenciesMet) {
              nodeClass = 'locked'; titleText = `Требуется: ${resDef.requires?.map(r => researchDefinitions[r]?.name || r).join(', ')}`;
         }


        treeContainer.innerHTML += `
            <div class="research-node ${nodeClass}" data-research-id="${resDef.id}" title="${titleText}">
                 <h4>${resDef.name} ${isCompleted ? '<i class="fas fa-check-circle text-success"></i>' : (isActive ? '<i class="fas fa-flask fa-spin"></i>' : '')}</h4>
                 <p>${resDef.description}</p>
                 <div class="research-meta">
                     <span><i class="fas fa-coins"></i> $${(resDef.cost || 0).toLocaleString()}</span>
                     <span><i class="fas fa-clock"></i> ${formatDuration(resDef.duration || 0)}</span>
                     ${resDef.requires?.length > 0 ? `<span title="Требования"><i class="fas fa-sitemap"></i> ${resDef.requires.length}</span>` : ''}
                 </div>
                 <div class="research-actions">
                     ${canResearch ? `<button class="start-research-btn btn-success" data-research-id="${resDef.id}" ${!canAfford ? 'disabled' : ''}>Исследовать</button>` : ''}
                     ${isActive ? `<button class="cancel-research-btn btn-danger" data-research-id="${resDef.id}">Отменить</button>` : ''}
                 </div>
            </div>`;
    });
     if (researchArray.length === 0) treeContainer.innerHTML = '<p class="text-muted">Нет доступных исследований.</p>';

    // Рендер текущего исследования
    if (gameState.activeResearch) {
        const resDef = researchDefinitions[gameState.activeResearch.researchId];
         if (!resDef) { // Если определение удалили, пока шло исследование
              currentDetailsEl.innerHTML = '<p class="text-danger">Ошибка: Активное исследование не найдено!</p>';
              gameState.activeResearch = null; // Сбрасываем
              return;
         }
        const researchSpeedMultiplier = calculateResearchSpeedMultiplier();
        const progressTime = gameState.activeResearch.progressTime || 0;
        const progressPercent = Math.min(100, (progressTime / resDef.duration) * 100);
        const timeLeftSeconds = Math.max(0, resDef.duration - progressTime);
        // Время оставшееся с учетом множителя скорости
        const displayTimeLeft = timeLeftSeconds / researchSpeedMultiplier;

        currentDetailsEl.innerHTML = `
             <h4>Исследуется: ${resDef.name}</h4>
             <p>Осталось времени: ~${formatDuration(displayTimeLeft)} (Скорость: x${researchSpeedMultiplier.toFixed(1)})</p>
             <div class="progress-bar research-progress" title="${progressPercent.toFixed(1)}%">
                 <div class="progress" style="width: ${progressPercent.toFixed(1)}%;"></div>
             </div>
             <button class="cancel-research-btn btn-danger" data-research-id="${resDef.id}" style="margin-top: 0.5rem;">Отменить</button>
        `;
    } else {
         currentDetailsEl.innerHTML = '<p class="text-muted">Нет активных исследований.</p>';
    }

    // Рендер завершенных
    completedListEl.innerHTML = '';
    gameState.player.completedResearch.forEach(resId => {
         const resDef = researchDefinitions[resId];
         if(resDef) completedListEl.innerHTML += `<li title="${resDef.description}">${resDef.name}</li>`;
         else completedListEl.innerHTML += `<li class="text-muted" title="Определение удалено">~~ ${resId} ~~</li>`; // Показать ID, если определение удалено
    });
    if(gameState.player.completedResearch.length === 0) completedListEl.innerHTML = '<li class="text-muted">Нет завершенных исследований.</li>';
}

function renderStaff() {
      if (gameState.uiState.activeSection !== 'staff-section') return;

    const availableListEl = document.getElementById('available-staff-list');
    const hiredListEl = document.getElementById('hired-staff-list');

    if (!availableListEl || !hiredListEl) return;

    // Доступные кандидаты
    availableListEl.innerHTML = '';
    gameState.availableStaffPool.sort((a,b) => b.salary - a.salary); // Сортируем (дорогие сверху?)
    gameState.availableStaffPool.forEach(staff => {
         availableListEl.innerHTML += `
            <li class="staff-card">
                 <h4>${staff.name}</h4>
                 <div class="staff-skills">
                     <span title="Ремонт"><i class="fas fa-tools"></i> ${staff.skills?.repair || 0}/5</span> |
                     <span title="Оптимизация"><i class="fas fa-cogs"></i> ${staff.skills?.optimize || 0}/5</span> |
                     <span title="Исследования"><i class="fas fa-flask"></i> ${staff.skills?.research || 0}/5</span>
                 </div>
                 <p class="staff-salary">Зарплата: $${staff.salary || 10}/час</p>
                 <button class="hire-staff-btn btn-success" data-staff-id="${staff.id}">Нанять</button>
             </li>`;
    });
    if (gameState.availableStaffPool.length === 0) availableListEl.innerHTML = '<li class="text-muted">Нет доступных кандидатов.</li>';

    // Нанятые сотрудники
    hiredListEl.innerHTML = '';
     let totalSalary = 0;
    gameState.player.hiredStaff.sort((a,b) => (a.name || '').localeCompare(b.name || '')); // Сортируем по имени
    gameState.player.hiredStaff.forEach(staff => {
        totalSalary += staff.salary || 0;
        // Опции для назначения
         let assignmentOptions = '<option value="idle">Без задания</option>';
         // Группируем риги
         assignmentOptions += '<optgroup label="Ремонт Ферм">';
         gameState.rigs.forEach(rig => {
              assignmentOptions += `<option value="repair_${rig.id}" ${staff.assignment === `repair_${rig.id}` ? 'selected' : ''}>Ремонт: ${rig.name}</option>`;
         });
         assignmentOptions += '</optgroup>';
         assignmentOptions += '<optgroup label="Оптимизация Ферм">';
          gameState.rigs.forEach(rig => {
               assignmentOptions += `<option value="optimize_${rig.id}" ${staff.assignment === `optimize_${rig.id}` ? 'selected' : ''}>Оптим.: ${rig.name}</option>`;
          });
          assignmentOptions += '</optgroup>';

         // Задачи исследований, если они есть
         if(Object.keys(researchDefinitions).length > 0) {
              assignmentOptions += '<optgroup label="Исследования">';
              assignmentOptions += `<option value="research_assist" ${staff.assignment === 'research_assist' ? 'selected' : ''}>Помощь в исследованиях</option>`;
              assignmentOptions += '</optgroup>';
         }

         const currentAssignmentText = staff.assignment === 'idle' ? 'Без задания' :
             staff.assignment === 'research_assist' ? 'Помощь в исследованиях' :
             staff.assignment?.startsWith('repair_') ? `Ремонт: ${gameState.rigs.find(r => r.id === staff.assignedRigId)?.name || '?'}` :
             staff.assignment?.startsWith('optimize_') ? `Оптим.: ${gameState.rigs.find(r => r.id === staff.assignedRigId)?.name || '?'}` : 'Неизвестно';


         hiredListEl.innerHTML += `
            <li class="staff-card hired">
                 <h4>${staff.name}</h4>
                 <div class="staff-skills">
                     <span title="Ремонт"><i class="fas fa-tools"></i> ${staff.skills?.repair || 0}/5</span> |
                     <span title="Оптимизация"><i class="fas fa-cogs"></i> ${staff.skills?.optimize || 0}/5</span> |
                     <span title="Исследования"><i class="fas fa-flask"></i> ${staff.skills?.research || 0}/5</span>
                 </div>
                 <p class="staff-salary">Зарплата: $${staff.salary || 10}/час</p>
                 <div class="staff-assignment-control">
                     <label title="Текущее задание: ${currentAssignmentText}"><i class="fas fa-tasks"></i></label>
                      <select class="staff-assignment" data-staff-id="${staff.id}">
                          ${assignmentOptions}
                      </select>
                 </div>
                 <button class="fire-staff-btn btn-danger" data-staff-id="${staff.id}" title="Уволить сотрудника"><i class="fas fa-user-slash"></i></button>
             </li>`;
    });
     if (gameState.player.hiredStaff.length === 0) hiredListEl.innerHTML = '<li class="text-muted">У вас нет сотрудников.</li>';
     // Обновить общую зарплату
      setTextContent(document.getElementById('total-salary-cost'), totalSalary.toFixed(2));
}


function renderEvents() {
      if (gameState.uiState.activeSection !== 'events-section' && gameState.uiState.activeSection !== 'dashboard-section') return; // Обновляем для дашборда тоже

    const feedListEl = document.getElementById('news-feed-list');
    if (!feedListEl) return;
    feedListEl.innerHTML = '';
     // Показываем новости в обратном порядке (новые сверху), но берем из gameState как есть
     const newsToDisplay = [...gameState.newsFeed].reverse().slice(0, 30); // Показать последние 30

     if (newsToDisplay.length === 0) {
          feedListEl.innerHTML = '<li class="text-muted">Новостей пока нет.</li>';
          return;
     }

    newsToDisplay.forEach(news => {
          // Иконка в зависимости от типа
          let icon = 'fa-info-circle';
          if (news.type === 'positive') icon = 'fa-arrow-up';
          else if (news.type === 'negative') icon = 'fa-arrow-down';
          else if (news.type === 'neutral') icon = 'fa-circle'; // Или fa-minus?

          // Формируем строку влияния
           let impactString = news.impact || '';
           if(news.affected && news.affected.length > 0) {
                if (impactString) impactString += " | ";
                impactString += `Влияет на: ${news.affected.join(', ')}`;
           }
            if (!impactString) impactString = 'Влияние неизвестно';

         feedListEl.innerHTML += `
            <li class="news-item news-${news.type || 'neutral'}">
                 <span class="news-time">[${news.time || '??:??'}]</span>
                 <i class="fas ${icon} news-icon"></i>
                 <span class="news-headline">${news.headline}</span>
                 <span class="news-impact">${impactString}</span>
             </li>`;
    });
}

function renderAchievements() {
      if (gameState.uiState.activeSection !== 'achievements-section') return;

    const gridEl = document.getElementById('achievements-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';
     const achievementArray = Object.values(achievementDefinitions);
     // Сортировка: сначала полученные, потом по названию?
     achievementArray.sort((a, b) => {
          const unlockedA = gameState.player.achievements[a.id]?.unlocked;
          const unlockedB = gameState.player.achievements[b.id]?.unlocked;
          if (unlockedA && !unlockedB) return -1;
          if (!unlockedA && unlockedB) return 1;
          return (a.name || '').localeCompare(b.name || '');
     });


     achievementArray.forEach(achDef => {
        const achId = achDef.id;
        const playerAch = gameState.player.achievements[achId] || { unlocked: false, progress: 0, target: achDef.target || 1 };
        let cardClass = 'locked';
        let iconClass = 'fas fa-lock';
        let progressHtml = '';
         let titleText = 'Достижение заблокировано';

        if (playerAch.unlocked) {
             cardClass = 'unlocked';
             iconClass = 'fas fa-trophy'; // Трофей для полученных
             titleText = `Получено: ${playerAch.unlockTime ? formatGameTime(playerAch.unlockTime) : 'Давно'}`;
        } else if (achDef.target && achDef.target > 1 && playerAch.progress > 0) {
             cardClass = 'progress';
             iconClass = 'fas fa-spinner fa-spin'; // Спиннер для прогресса
             const percent = Math.min(100, (playerAch.progress / achDef.target) * 100);
             progressHtml = `
                 <div class="progress-bar achievement-progress" title="${playerAch.progress} / ${achDef.target}">
                     <div class="progress" style="width: ${percent}%;">${percent.toFixed(0)}%</div>
                 </div>
             `;
             titleText = `Прогресс: ${playerAch.progress} / ${achDef.target}`;
        } else {
             // Остается locked
        }


        gridEl.innerHTML += `
             <div class="achievement-card ${cardClass}" title="${titleText}">
                 <i class="${iconClass} achievement-icon"></i>
                 <div class="achievement-details">
                      <h4>${achDef.name}</h4>
                      <p>${achDef.description}</p>
                      ${progressHtml}
                      ${playerAch.unlocked && achDef.reward ? `<p class="achievement-reward">Награда: ${achDef.reward.text || (reward.money ? `$${reward.money}`: 'Получено!')}</p>` : ''}
                 </div>
             </div>`;
     });
     if(achievementArray.length === 0) gridEl.innerHTML = '<p class="text-muted">Достижения еще не определены.</p>';
}

function renderAdminPanel() {
    if (!gameState.uiState.isLoggedInAdmin) return; // Не рендерим, если не вошли

    // Обновляем списки при переключении вкладок или изменении данных
     renderAdminLists(); // Рендерит списки для активной админ-вкладки
     // Обновляем значения в формах настроек
     updateAdminSettingsForms();
     // Обновить выбор типа компонента в админке
      const adminCompSelect = document.getElementById('admin-component-type-select');
      if(adminCompSelect) adminCompSelect.value = gameState.uiState.selectedAdminComponentType;
       // Обновить имя в кнопке "Добавить"
        const addBtnSpan = document.getElementById('add-component-button')?.querySelector('.admin-selected-comp-type');
        if(addBtnSpan) addBtnSpan.textContent = getComponentTypeName(gameState.uiState.selectedAdminComponentType);
}

function renderAdminLists() { // Теперь зависит от активной вкладки админки
     if (!gameState.uiState.isLoggedInAdmin) return;
     const activeTab = gameState.uiState.selectedAdminTab;
     const activeCompType = gameState.uiState.selectedAdminComponentType;

     if (activeTab === 'components') {
         renderAdminComponentList(activeCompType);
     } else if (activeTab === 'crypto') {
         renderAdminCryptoList();
     } else if (activeTab === 'events') {
         renderAdminEventTypeList();
     } else if (activeTab === 'research') {
          renderAdminResearchList();
     } else if (activeTab === 'achievements') {
          renderAdminAchievementList();
     }
     // Для настроек списков нет
}

function renderAdminComponentList(componentType) {
    const listEl = document.getElementById('component-list-admin');
    const definitions = componentDefinitions[componentType] || {};
    if (!listEl) return;
    listEl.innerHTML = '';
    const defArray = Object.values(definitions).sort((a,b)=>(a.name||'').localeCompare(b.name||'')); // Сортируем

    defArray.forEach(def => {
         let details = `Цена: $${def.price || 0}`;
         if(componentType === 'gpu') details += ` | P: ${def.power || '?'}W | H: ${Object.keys(def.hashrates || {}).length} algos`;
         else if(componentType === 'psu') details += ` | P: ${def.powerOutput || '?'}W | Eff: ${def.efficiency || '?'}%`;
         else if(componentType === 'mobo') details += ` | GPU: x${def.gpuSlots || '?'} | PSU: x${def.psuSlots || '?'}`;
         else if(componentType === 'cooling') details += ` | Cool: ${def.coolingPower || '?'}U | P: ${def.power || '?'}W`;
         else if(componentType === 'racks') details += ` | GPU: x${def.gpuSlots || '?'} | Cool: ${def.baseCooling || '?'}U`;

         listEl.innerHTML += `
            <li data-component-id="${def.id}" data-component-type="${componentType}">
                 <img src="${def.imageUrl || `img/placeholder-${componentType}.png`}" class="admin-list-icon" alt="${componentType}">
                 <div class="list-item-info">
                      <strong>${def.name || 'Без имени'}</strong><small> (ID: ...${def.id.slice(-6)})</small><br>
                     <span>${details}</span>
                 </div>
                 <div class="list-actions">
                     <button class="edit-button btn-secondary">Edit</button>
                     <button class="delete-button btn-danger">Del</button>
                 </div>
             </li>`;
    });
    if (defArray.length === 0) listEl.innerHTML = `<li>Нет добавленных ${getComponentTypeName(componentType, true)}.</li>`;
}

function renderAdminCryptoList() {
    const listEl = document.getElementById('crypto-list-admin');
    if (!listEl) return;
    listEl.innerHTML = '';
    const cryptoArray = Object.values(cryptoDefinitions).sort((a,b)=>(a.name||'').localeCompare(b.name||'')); // Сортируем

    cryptoArray.forEach(crypto => {
         const iconHtml = crypto.icon ? (crypto.icon.startsWith('fa') ? `<i class="${crypto.icon}"></i>` : `<img src="${crypto.icon}" alt="${crypto.ticker}" width="16">`) : '?';
        listEl.innerHTML += `
            <li data-crypto-ticker="${crypto.ticker}">
                 <span class="admin-list-icon">${iconHtml}</span>
                 <div class="list-item-info">
                     <strong>${crypto.name} (${crypto.ticker})</strong><br>
                     <span>Algo: ${crypto.algorithm} | Unit: ${crypto.hashUnit} | Price: $${crypto.basePrice} | Vol: ${crypto.volatility} | Diff: ${crypto.difficulty}</span>
                 </div>
                 <div class="list-actions">
                     <button class="edit-button btn-secondary">Edit</button>
                     <button class="delete-button btn-danger">Del</button>
                 </div>
             </li>`;
    });
     if (cryptoArray.length === 0) listEl.innerHTML = '<li>Нет добавленных криптовалют.</li>';
}

function renderAdminEventTypeList() {
     const listEl = document.getElementById('event-types-list-admin');
     if(!listEl) return;
     listEl.innerHTML = '';
     const eventArray = Object.entries(gameState.availableEvents || {}).sort((a,b)=>(a[1].headline||'').localeCompare(b[1].headline||''));

     eventArray.forEach(([eventId, eventConfig]) => {
          let icon = 'fa-question-circle';
          if (eventConfig.type === 'positive') icon = 'fa-plus-circle text-success';
          else if (eventConfig.type === 'negative') icon = 'fa-minus-circle text-danger';
          listEl.innerHTML += `
             <li data-event-id="${eventId}">
                  <i class="fas ${icon} admin-list-icon"></i>
                  <div class="list-item-info">
                      <strong>${eventConfig.headline || eventId}</strong><br>
                      <span>Prob: ${(eventConfig.probability * 100).toFixed(1)}%/min | Effect: ${eventConfig.effect?.type || 'N/A'} | Affected: ${eventConfig.affected?.join(', ') || 'All'}</span>
                  </div>
                  <div class="list-actions">
                      <button class="edit-button btn-secondary">Edit</button>
                      <button class="delete-button btn-danger">Del</button>
                      <button class="trigger-button btn-info" title="Запустить сейчас">Trigger</button>
                  </div>
             </li>`;
     });
      if (eventArray.length === 0) listEl.innerHTML = '<li>Нет определенных типов событий.</li>';
}

function renderAdminResearchList() {
     const listEl = document.getElementById('research-list-admin');
     if (!listEl) return;
     listEl.innerHTML = '';
     const researchArray = Object.values(researchDefinitions).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

     researchArray.forEach(res => {
         listEl.innerHTML += `
            <li data-research-id="${res.id}">
                 <i class="fas fa-flask admin-list-icon"></i>
                 <div class="list-item-info">
                     <strong>${res.name}</strong><br>
                     <span>Cost: $${res.cost} | Time: ${formatDuration(res.duration)} | Requires: ${res.requires?.join(', ') || 'None'} | Effect: ${res.effect?.type || 'N/A'}</span>
                 </div>
                 <div class="list-actions">
                     <button class="edit-button btn-secondary">Edit</button>
                     <button class="delete-button btn-danger">Del</button>
                 </div>
            </li>`;
     });
     if (researchArray.length === 0) listEl.innerHTML = '<li>Нет добавленных исследований.</li>';
}

function renderAdminAchievementList() {
     const listEl = document.getElementById('achievement-list-admin');
     if (!listEl) return;
     listEl.innerHTML = '';
     const achArray = Object.values(achievementDefinitions).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

     achArray.forEach(ach => {
         listEl.innerHTML += `
            <li data-achievement-id="${ach.id}">
                  <i class="fas fa-trophy admin-list-icon"></i>
                 <div class="list-item-info">
                     <strong>${ach.name}</strong><br>
                     <span>Desc: ${ach.description?.substring(0, 50)}... | Target: ${ach.target || 1} | Reward: ${ach.reward?.text || 'None'}</span>
                 </div>
                 <div class="list-actions">
                     <button class="edit-button btn-secondary">Edit</button>
                     <button class="delete-button btn-danger">Del</button>
                 </div>
            </li>`;
     });
     if (achArray.length === 0) listEl.innerHTML = '<li>Нет добавленных достижений.</li>';
}

// Обновляет значения в формах настроек в админке
function updateAdminSettingsForms() {
     if (!gameState.uiState.isLoggedInAdmin) return;
     // Вкладка "Настройки Игры"
     if (startCapitalInput) startCapitalInput.value = gameSettings.startCapital;
     if (energyCostInput) energyCostInput.value = gameSettings.energyCostPerKWh;
     if(document.getElementById('initial-rig-slots')) document.getElementById('initial-rig-slots').value = gameSettings.initialRigSlots;
     if(document.getElementById('rig-cost')) document.getElementById('rig-cost').value = gameSettings.rigCost;

     // Вкладка "Рынок и Симуляция"
     if (botActivityInput) botActivityInput.value = gameSettings.botActivity;
     if (restockFreqInput) restockFreqInput.value = gameSettings.marketRestockFreq;
}


function renderSettings() {
      if (gameState.uiState.activeSection !== 'settings-section') return;

     // Заполняем поля настроек при инициализации или обновлении
      safeSetElementValue(document.getElementById('theme-select'), gameSettings.theme);
      safeSetElementChecked(document.getElementById('enable-animations'), gameSettings.enableAnimations);
      safeSetElementChecked(document.getElementById('show-tooltips'), gameSettings.showTooltips);
      safeSetElementChecked(document.getElementById('notify-overheat'), gameSettings.notifyOverheat);
      safeSetElementChecked(document.getElementById('notify-breakdown'), gameSettings.notifyBreakdown);
      safeSetElementChecked(document.getElementById('notify-deals'), gameSettings.notifyDeals);
      safeSetElementChecked(document.getElementById('enable-sound'), gameSettings.enableSound);
      safeSetElementValue(document.getElementById('game-speed-select'), gameState.gameSpeed);
      safeSetElementValue(document.getElementById('autosave-interval'), gameSettings.autosaveInterval);

     const lastSaveEl = document.getElementById('last-save-time');
     if(lastSaveEl) lastSaveEl.textContent = lastSaveTime ? new Date(lastSaveTime).toLocaleString() : 'Никогда';
}

// Безопасные функции для установки значений в UI
function safeSetElementValue(element, value) {
     if (element && element.value !== value) {
          element.value = value;
     }
}
function safeSetElementChecked(element, checked) {
     if (element && element.checked !== checked) {
          element.checked = checked;
     }
}


// --- Установка Обработчиков Событий ---

function setupEventListeners() {
    // Навигация по секциям
    navButtons.forEach(button => {
        button.addEventListener('click', handleNavClick);
    });

    // --- Обработчики для Дашборда ---
     document.getElementById('panic-shutdown-btn')?.addEventListener('click', handlePanicShutdown);
     document.getElementById('view-transactions-btn')?.addEventListener('click', handleViewTransactions); // Заглушка
     document.getElementById('go-to-wallet-btn')?.addEventListener('click', () => navigateToSection('wallet-section'));
     document.getElementById('clear-alerts-btn')?.addEventListener('click', handleClearAlerts);

    // --- Обработчики для Рынка (Делегирование на #game-content) ---
    const gameContent = document.getElementById('game-content');
    if(gameContent) {
         // Кнопки категорий, типов, под-вкладок
         gameContent.addEventListener('click', (event) => {
             const button = event.target.closest('button');
             if (!button) return;

             if (button.classList.contains('market-category-button')) handleMarketCategoryChange(event);
             else if (button.classList.contains('component-tab-button')) handleComponentTypeChange(event);
             else if (button.classList.contains('market-subtab-button')) handleMarketSubtabChange(event);
             else if (button.classList.contains('buy-button')) handleMarketActions(event); // Перенаправляем
             else if (button.classList.contains('sell-action-button')) handleMarketActions(event);
             else if (button.classList.contains('order-sell-action-button')) handleMarketActions(event);
              else if (button.closest('.chart-timeframes') || button.closest('.chart-timeframes-wallet')) handleChangeChartTimeframe(event);
              else if (button.closest('.trade-tabs')) handleCryptoTradeTabChange(event);
              else if (button.classList.contains('btn-send') && button.closest('#wallet-section')) handleWalletActions(event); // Кнопки в кошельке
              else if (button.classList.contains('btn-receive') && button.closest('#wallet-section')) handleWalletActions(event);
              else if (button.id === 'execute-rebalance-btn') handleWalletActions(event);
              else if (button.classList.contains('start-research-btn')) handleResearchActions(event); // Кнопки исследований
              else if (button.classList.contains('cancel-research-btn')) handleResearchActions(event);
              else if (button.classList.contains('hire-staff-btn')) handleStaffActions(event); // Кнопки персонала
              else if (button.classList.contains('fire-staff-btn')) handleStaffActions(event);
         });

          // Формы ордеров и торговли
          gameContent.addEventListener('submit', (event) => {
               if (event.target.id === 'place-buy-order-form' || event.target.id === 'place-sell-order-form') handlePlaceHardwareOrder(event);
               else if (event.target.id === 'crypto-trade-buy-form' || event.target.id === 'crypto-trade-sell-form') handleCryptoTrade(event);
               else if (event.target.id === 'rebalance-form') handleCalculateRebalance(event);
          });

          // Изменения в select и input
          gameContent.addEventListener('change', (event) => {
              if (event.target.id === 'crypto-pair-select') handleCryptoPairChange(event);
               else if (event.target.id === 'buy-order-model') updateBuyOrderForm();
               else if (event.target.id === 'sell-order-item') updateSellOrderForm();
               else if (event.target.id === 'wallet-chart-crypto-select') handleWalletChartSelect(event);
               else if (event.target.classList.contains('staff-assignment')) handleStaffAssignmentChange(event); // Назначение персонала
               else if (event.target.id.startsWith('inventory-filter-')) handleRigManagementChanges(event); // Фильтр инвентаря в ригах
          });

          // Ввод в полях для обновления total
          gameContent.addEventListener('input', (event) => {
               const targetId = event.target.id;
               if (targetId === 'buy-crypto-price' || targetId === 'buy-crypto-amount' ||
                   targetId === 'sell-crypto-price' || targetId === 'sell-crypto-amount') {
                    updateCryptoTradeTotal(event);
               } else if (targetId === 'buy-order-price' || targetId === 'buy-order-amount' ||
                          targetId === 'sell-order-price' || targetId === 'sell-order-amount') {
                   updateHardwareOrderTotal(event);
               } else if (event.target.closest('#rebalance-targets')) {
                    handleRebalanceInputChange();
               }
          });
    }


     // Кнопки подтверждения/отмены для продажи с БУ рынка (вне делегирования?)
     confirmSellItemBtn?.addEventListener('click', handleConfirmSell);
     cancelSellItemBtn?.addEventListener('click', handleCancelSell);

    // --- Обработчики для Управления Фермами (Делегирование на #game-content) ---
     if(gameContent) {
          gameContent.addEventListener('click', handleRigManagementActions); // Клик по кнопкам, слотам
          // Обработка изменений уже добавлена выше (фильтр, название)
          // Обработка инпутов тюнинга (хотя применяется по кнопке)
     }

    // --- Обработчики для Настроек Игры ---
    const settingsSection = document.getElementById('settings-section');
    if (settingsSection) {
         settingsSection.addEventListener('change', (event) => {
              const target = event.target;
              if (target.id === 'theme-select') handleThemeChange(event);
              else if (target.id === 'game-speed-select') handleGameSpeedChange(event);
              else if (target.id === 'autosave-interval') handleAutosaveIntervalChange(event);
              else if (target.type === 'checkbox') handleSettingCheckboxChange(event);
         });
         settingsSection.addEventListener('click', (event) => {
               if (event.target.id === 'manual-save-btn') saveGame();
               else if (event.target.id === 'load-game-btn') {
                    if (confirm('Загрузить последнее сохранение? Несохраненный прогресс будет утерян.')) {
                         stopGameLoop();
                         // Не просто initGame, а перезагрузка страницы, чтобы гарантировать чистое состояние
                          location.reload();
                         // ИЛИ более сложная логика полного сброса и инициализации без перезагрузки
                         // initGame();
                    }
               }
         });
    }
}

// --- Обработчики Действий Пользователя (Много Заглушек!) ---

function handleNavClick(event) {
    const button = event.currentTarget;
    const targetSectionId = button.dataset.section;
    navigateToSection(targetSectionId);
}

function navigateToSection(targetSectionId) {
    const targetSection = document.getElementById(targetSectionId);
    if (!targetSection) {
        console.warn("Секция не найдена:", targetSectionId);
        return;
    }

     // Если уже активна, ничего не делаем
     // if (targetSection.classList.contains('active-section')) return;

    gameState.uiState.activeSection = targetSectionId;

    // Скрываем все секции
    allSections.forEach(section => section.classList.remove('active-section'));
    // Показываем нужную
    targetSection.classList.add('active-section');

    // Обновляем активную кнопку
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === targetSectionId);
    });

    // Дополнительная логика при переключении
    if (targetSectionId === 'admin-panel-section') {
         // Показываем админку или логин в зависимости от статуса
         const adminPanelContent = document.getElementById('admin-panel-content'); // Содержимое админки
         const adminLogin = document.getElementById('admin-login'); // Секция логина
         if (adminPanelContent && adminLogin) {
              adminPanelContent.style.display = gameState.uiState.isLoggedInAdmin ? 'block' : 'none';
              adminLogin.style.display = gameState.uiState.isLoggedInAdmin ? 'none' : 'block';
         }
         if(gameState.uiState.isLoggedInAdmin) renderAdminPanel(); // Обновить админку при показе
    }
     // Принудительный рендер для секций при переключении на них (если они не обновляются в gameTick)
     else if (targetSectionId === 'wallet-section') renderWallet();
     else if (targetSectionId === 'staff-section') renderStaff();
      else if (targetSectionId === 'achievements-section') renderAchievements();
      else if (targetSectionId === 'settings-section') renderSettings();
      else if (targetSectionId === 'research-section') renderResearch();
       else if (targetSectionId === 'market-section') renderMarket(); // Обновить рынок при переходе
       else if (targetSectionId === 'rigs-section') renderRigs(); // Обновить риги при переходе
       else if (targetSectionId === 'dashboard-section') renderDashboard(); // Обновить дашборд
}

function selectInitialSection() {
    // Пытаемся восстановить последнюю активную секцию или открываем дашборд
    const lastSection = gameState.uiState.activeSection || 'dashboard-section';
    // Проверяем, существует ли секция и кнопка для нее
    if (document.getElementById(lastSection) && document.querySelector(`.nav-button[data-section="${lastSection}"]`)) {
        navigateToSection(lastSection);
    } else {
         navigateToSection('dashboard-section'); // Фоллбэк на дашборд
    }
}


// --- Дашборд ---
function handlePanicShutdown() {
    if (confirm("Аварийно отключить все фермы?")) {
        addLog("АВАРИЙНОЕ ОТКЛЮЧЕНИЕ ВСЕХ ФЕРМ!", "error");
        gameState.rigs.forEach(rig => {
             if (rig.status !== 'off') rig.status = 'off'; // Выключаем
        });
        renderUI(); // Обновить UI немедленно
    }
}
function handleViewTransactions() { addLog("Функция истории транзакций еще не реализована.", "info"); }
function handleClearAlerts() {
    // Очищаем только UI, т.к. лог в gameState хранится для истории
     const alertsOutputEl = document.getElementById('alerts-output');
     if(alertsOutputEl) alertsOutputEl.innerHTML = '<li class="alert-info"><i class="fas fa-info-circle"></i> Нет важных уведомлений.</li>';
    addLog("Уведомления очищены.", "info");
}

// --- Рынок ---
function handleMarketCategoryChange(event) {
    gameState.uiState.activeMarketCategory = event.target.dataset.marketCategory;
    document.querySelectorAll('.market-category-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.market-category-content').forEach(cont => cont.classList.remove('active'));
    event.target.classList.add('active');
    const contentEl = document.getElementById(`market-${gameState.uiState.activeMarketCategory}-content`);
    if (contentEl) contentEl.classList.add('active');
    // Сброс подвкладки на 'new' или на 'trade' для крипты
    gameState.uiState.activeMarketSubtab = gameState.uiState.activeMarketCategory === 'crypto' ? 'trade' : 'new';
    renderMarket(); // Перерисовать рынок
}

function handleComponentTypeChange(event) {
    gameState.uiState.activeComponentType = event.target.dataset.componentType;
    document.querySelectorAll('.component-tab-button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    // Сбрасываем под-вкладку на "Новые" при смене типа компонента
    gameState.uiState.activeMarketSubtab = 'new';
    document.querySelectorAll('.market-subtab-button').forEach(btn => btn.classList.toggle('active', btn.dataset.marketSubtab === 'new'));
    document.querySelectorAll('.market-subtab-content').forEach(cont => cont.classList.toggle('active', cont.id === 'market-new'));
    renderMarket();
}

function handleMarketSubtabChange(event) {
    gameState.uiState.activeMarketSubtab = event.target.dataset.marketSubtab;
    document.querySelectorAll('.market-subtab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.market-subtab-content').forEach(cont => cont.classList.remove('active'));
    event.target.classList.add('active');
    const contentEl = document.getElementById(`market-${gameState.uiState.activeMarketSubtab}`);
    if(contentEl) contentEl.classList.add('active');
    renderMarket(); // Перерисовать только контент под-вкладки
}

function handleMarketActions(event) {
    const button = event.target.closest('button');
    if (!button) return;

    if (button.classList.contains('buy-button')) {
        const itemId = button.dataset.itemId;
        const type = button.dataset.type; // 'new' or 'used'
        const componentType = button.dataset.componentType;
        handleBuyComponent(itemId, type, componentType);
    } else if (button.classList.contains('sell-action-button')) {
        const itemId = button.dataset.itemId;
         const componentType = button.dataset.componentType;
        handleInitiateSell(itemId, componentType);
    } else if (button.classList.contains('order-sell-action-button')) {
         const itemId = button.dataset.itemId;
         const componentType = button.dataset.componentType;
          handleInitiateSellOrder(itemId, componentType);
    }
}

function handleBuyComponent(itemId, type, componentType) {
    let definitionOrListing;
    let price;
    let itemToBuyDefinition = null; // Определение покупаемого товара
    let listingToRemove = null; // БУ листинг для удаления
    let boughtInstance = null; // Экземпляр БУ товара

    const definitions = componentDefinitions[componentType];
    if (!definitions) { addLog(`Ошибка: Неизвестный тип компонента ${componentType}`, "error"); return; }

    if (type === 'new') {
        itemToBuyDefinition = definitions[itemId];
        if (!itemToBuyDefinition) { addLog(`Ошибка: Определение ${componentType} [${itemId}] не найдено.`, "error"); return; }
        price = itemToBuyDefinition.price;
    } else { // used
        const usedMarket = gameState.market.used[componentType] || [];
        definitionOrListing = usedMarket.find(l => l.listingId === itemId);
        if (!definitionOrListing) { addLog("Ошибка: Б/У лот не найден.", "error"); return; }

        itemToBuyDefinition = definitions[definitionOrListing.item.definitionId];
        if (!itemToBuyDefinition) { addLog("Ошибка: Определение Б/У товара не найдено.", "error"); return; }

        price = definitionOrListing.price;
        listingToRemove = definitionOrListing.listingId;
         boughtInstance = definitionOrListing.item; // Конкретный экземпляр со своим ID и износом
    }

    if (gameState.player.money >= price) {
        gameState.player.money -= price;

         // Создаем новый экземпляр в инвентаре
         const newItemInstance = {
             // Если купили БУ, используем его ID, иначе генерируем новый
             id: boughtInstance ? boughtInstance.id : `${componentType}_${gameState.nextItemId++}`,
             definitionId: itemToBuyDefinition.id,
             wear: boughtInstance ? boughtInstance.wear : 0,
             // Копируем доп. параметры из купленного БУ или ставим дефолт
              ...(componentType === 'gpu' && {
                  coreClockOffset: boughtInstance?.coreClockOffset || 0,
                  memClockOffset: boughtInstance?.memClockOffset || 0,
                  powerLimit: boughtInstance?.powerLimit || 100,
                  temperature: AMBIENT_TEMP // Начинаем с температуры окружения
              }),
              status: null // У купленного нет статуса поломки
         };

        if (!gameState.player.inventory[componentType]) gameState.player.inventory[componentType] = [];
        gameState.player.inventory[componentType].push(newItemInstance);

        // Удаляем БУ лот, если купили его
        if (listingToRemove) {
            gameState.market.used[componentType] = gameState.market.used[componentType].filter(l => l.listingId !== listingToRemove);
        }

        addLog(`Куплен ${itemToBuyDefinition.name} за $${price.toLocaleString()}`, "success");
        renderMarket(); // Обновляем рынок (убрать БУ лот)
        // Не нужно renderUI(), т.к. баланс обновится в хедере, а инвентарь на вкладке ригов
         updateHeaderIndicators(); // Обновить баланс в хедере
    } else {
        addLog(`Недостаточно средств для покупки ${itemToBuyDefinition.name}! (Нужно $${price.toLocaleString()})`, "warning");
    }
}

function handleInitiateSell(itemId, componentType) {
    if (!gameState.player.inventory[componentType]) return;
    const item = gameState.player.inventory[componentType].find(item => item.id === itemId);
    if (!item) { addLog("Предмет не найден в инвентаре", "error"); return; }

    const definition = componentDefinitions[componentType]?.[item.definitionId];
    if (!definition) { addLog("Определение предмета не найдено", "error"); return; }

    // Сохраняем данные о предмете для формы
    itemToSell = { ...item, type: componentType }; // Копируем и добавляем тип

    // Показываем форму (предполагаем, что sellForm существует)
    if (sellForm && sellItemNameEl && sellItemPriceInput && confirmSellItemBtn && cancelSellItemBtn) {
         sellItemNameEl.textContent = `${definition.name} (#${item.id.slice(-6)}, Изн: ${item.wear?.toFixed(1) || 0}%)`;
         // Предлагаем цену чуть ниже рынка новых * (1 - %износа/100)
          const basePrice = definition.price || 50;
          const wearFactor = Math.max(0.1, 1 - (item.wear || 0) / 100);
          const suggestedPrice = Math.round(basePrice * 0.8 * wearFactor); // 80% от новой цены с учетом износа
         sellItemPriceInput.value = Math.max(1, suggestedPrice);
         sellForm.style.display = 'block';
         sellItemPriceInput.focus();
    } else {
         console.error("Элементы формы продажи не найдены!");
    }
}

function handleConfirmSell() {
    if (!itemToSell) return;
    const componentType = itemToSell.type;
    const price = parseInt(sellItemPriceInput.value);
    const definition = componentDefinitions[componentType]?.[itemToSell.definitionId];

    if (!definition) { addLog("Ошибка: Определение предмета не найдено при подтверждении продажи.", "error"); return; }
    if (isNaN(price) || price <= 0) { addLog("Введите корректную цену.", "warning"); return; }

    // Удаляем из инвентаря
    gameState.player.inventory[componentType] = gameState.player.inventory[componentType].filter(item => item.id !== itemToSell.id);

    // Добавляем на Б/У рынок
    const newListing = {
        listingId: `used_${gameState.nextListingId++}`,
        // Берем данные из itemToSell, но убираем временное поле type
        item: {
             id: itemToSell.id,
             definitionId: itemToSell.definitionId,
             wear: itemToSell.wear,
              ...(componentType === 'gpu' && { // Копируем параметры GPU, если они есть
                  coreClockOffset: itemToSell.coreClockOffset,
                  memClockOffset: itemToSell.memClockOffset,
                  powerLimit: itemToSell.powerLimit,
                  temperature: itemToSell.temperature // Нужно ли? Сбросим к AMBIENT_TEMP?
              }),
              status: null // Сбрасываем статус при выставлении
         },
        price: price,
        seller: "Вы", // Имя игрока?
        type: componentType, // Тип компонента для фильтрации
        timestamp: Math.floor(gameState.gameTime)
    };

    if (!gameState.market.used[componentType]) gameState.market.used[componentType] = [];
    gameState.market.used[componentType].push(newListing);

    addLog(`${definition.name} выставлен на продажу за $${price.toLocaleString()}`, "success");
    itemToSell = null;
    if(sellForm) sellForm.style.display = 'none';
    renderMarket(); // Обновить рынок (вкладку Sell и Used)
}

function handleCancelSell() {
    itemToSell = null;
    if(sellForm) sellForm.style.display = 'none';
}

// Вызывается при клике на "Создать ордер" под предметом в инвентаре
function handleInitiateSellOrder(itemId, componentType) {
     // Переключиться на вкладку Ордеры
     gameState.uiState.activeMarketSubtab = 'orders';
     document.querySelectorAll('.market-subtab-button').forEach(btn => btn.classList.toggle('active', btn.dataset.marketSubtab === 'orders'));
     document.querySelectorAll('.market-subtab-content').forEach(cont => cont.classList.toggle('active', cont.id === 'market-orders'));

     // Заполнить и показать форму ордера на продажу
      updateHardwareOrderForms(componentType); // Обновит списки
      const sellItemSelect = document.getElementById('sell-order-item');
      if(sellItemSelect) {
           sellItemSelect.value = itemId; // Выбрать нужный предмет
           updateSellOrderForm(); // Обновить информацию о выбранном предмете
           document.getElementById('sell-order-price')?.focus(); // Фокус на цене
      }
     renderMarket(); // Перерисовать всю вкладку рынка
     addLog(`Создание ордера на продажу для ${itemId}. Заполните детали.`, "info");
}


function handlePlaceHardwareOrder(event) {
    event.preventDefault();
    const form = event.target;
    const isBuyOrder = form.id === 'place-buy-order-form';
    const componentType = gameState.uiState.activeComponentType;

    const price = parseFloat(form.querySelector(`#${isBuyOrder ? 'buy' : 'sell'}-order-price`)?.value);
    const amount = parseInt(form.querySelector(`#${isBuyOrder ? 'buy' : 'sell'}-order-amount`)?.value);
    let itemId, definition; // itemId - ID определения для покупки, ID экземпляра для продажи

    if (isNaN(price) || price <= 0 || isNaN(amount) || amount <= 0) {
        addLog("Введите корректные цену и количество.", "warning"); return;
    }

    if (isBuyOrder) {
        itemId = form.querySelector('#buy-order-model')?.value; // Это definitionId
         if (!itemId) { addLog("Выберите модель для покупки.", "warning"); return; }
         definition = componentDefinitions[componentType]?.[itemId];
         if (!definition) { addLog("Ошибка: Определение модели не найдено.", "error"); return; }

        // Проверка баланса
        const totalCost = price * amount;
        if (gameState.player.money < totalCost) {
             addLog(`Недостаточно средств для размещения ордера на покупку ($${totalCost.toLocaleString()})`, "warning"); return;
        }
        // Резервируем деньги? Или списываем при исполнении? Пока резервируем.
        gameState.player.money -= totalCost;
        addLog(`$${totalCost.toLocaleString()} зарезервировано для ордера на покупку.`, "info");

    } else { // Sell order
        const instanceId = form.querySelector('#sell-order-item')?.value; // Это instanceId из инвентаря
         if (!instanceId) { addLog("Выберите предмет для продажи.", "warning"); return; }
         const itemInstance = gameState.player.inventory[componentType]?.find(i => i.id === instanceId);
         if (!itemInstance) { addLog("Ошибка: Предмет не найден в инвентаре.", "error"); return; }
         itemId = itemInstance.definitionId; // Для ордера используем definitionId
         definition = componentDefinitions[componentType]?.[itemId];
         if (!definition) { addLog("Ошибка: Определение предмета не найдено.", "error"); return; }

        // Перемещаем предмет из инвентаря в "зарезервированные для продажи"?
        // Или просто удаляем из инвентаря? Удаляем.
         // TODO: Нужно обрабатывать частичное исполнение ордера! Пока продаем только 1 шт.
         if (amount > 1) { addLog("Пока можно выставить на продажу только 1 шт. через ордер.", "warning"); return; }
         gameState.player.inventory[componentType] = gameState.player.inventory[componentType].filter(i => i.id !== instanceId);
         addLog(`${definition.name} (#${instanceId.slice(-6)}) убран из инвентаря для ордера на продажу.`, "info");
    }

    // Создаем ордер
    const newOrder = {
        orderId: `order_${isBuyOrder ? 'buy' : 'sell'}_${gameState.nextOrderId++}`,
        price: price,
        amount: amount, // TODO: Для продажи пока только 1
        itemId: itemId, // definitionId
        // componentInstanceId: isBuyOrder ? null : instanceId, // Сохраняем ID экземпляра для продажи?
        creator: 'player',
        timestamp: Math.floor(gameState.gameTime),
        type: isBuyOrder ? 'buy' : 'sell'
    };

    if (!gameState.market.orders[componentType]) gameState.market.orders[componentType] = { buy: [], sell: [] };
    gameState.market.orders[componentType][isBuyOrder ? 'buy' : 'sell'].push(newOrder);

    addLog(`Ордер на ${isBuyOrder ? 'покупку' : 'продажу'} ${amount}x ${definition.name} @ $${price.toLocaleString()} размещен.`, "success");
    form.reset();
    renderMarket(); // Обновить стаканы ордеров
    updateHeaderIndicators(); // Обновить баланс (если покупали)
}
// Обновление инфо в формах ордеров
function updateBuyOrderForm(){
     const select = document.getElementById('buy-order-model');
     const priceInput = document.getElementById('buy-order-price');
     if(!select || !priceInput) return;
     const selectedDefId = select.value;
     const def = componentDefinitions[gameState.uiState.activeComponentType]?.[selectedDefId];
     if(def) {
          priceInput.value = def.price; // Предложить базовую цену
          updateHardwareOrderTotal({ target: priceInput }); // Обновить total
     }
}
function updateSellOrderForm(){
     const select = document.getElementById('sell-order-item');
     const priceInput = document.getElementById('sell-order-price');
     if(!select || !priceInput) return;
     const selectedInstanceId = select.value;
      const item = gameState.player.inventory[gameState.uiState.activeComponentType]?.find(i => i.id === selectedInstanceId);
      if(item) {
           const def = componentDefinitions[gameState.uiState.activeComponentType]?.[item.definitionId];
           if(def) {
                // Предложить цену с учетом износа
                 const wearFactor = Math.max(0.1, 1 - (item.wear || 0) / 100);
                 priceInput.value = Math.round(def.price * 0.9 * wearFactor); // 90% от новой с учетом износа
                 updateHardwareOrderTotal({ target: priceInput }); // Обновить total
           }
      }
}
// Обновление total в формах ордеров на оборудование
function updateHardwareOrderTotal(event) {
     const form = event.target.closest('form');
     if (!form) return;
     const priceInput = form.querySelector('input[id*="-order-price"]');
     const amountInput = form.querySelector('input[id*="-order-amount"]');
     const totalEl = form.querySelector('span[id*="-order-total"]');
     const price = parseFloat(priceInput?.value) || 0;
     const amount = parseInt(amountInput?.value) || 0;
     if(totalEl) totalEl.textContent = formatCurrency(price * amount);
}

function getMarketFilters(subtab, componentType) {
     // TODO: Считать значения из полей фильтров #filter-new-..., #filter-used-...
     return {}; // Заглушка - вернуть объект с фильтрами
}

function filterAndSortItems(items, filters) {
     // TODO: Реализовать фильтрацию и сортировку на основе объекта filters
     return items; // Заглушка
}

// Криптобиржа
function handleCryptoPairChange(event) {
      // Не нужно ничего делать, renderCryptoExchange() сама прочитает значение
      renderCryptoExchange();
}
function handleCryptoTradeTabChange(event) {
     const type = event.target.dataset.tradeType; // 'buy' or 'sell'
     document.querySelectorAll('.trade-tabs button').forEach(btn => btn.classList.remove('active'));
     document.querySelectorAll('.trade-form').forEach(form => form.classList.remove('active'));
     event.target.classList.add('active');
     const formEl = document.getElementById(`crypto-trade-${type}-form`);
     if (formEl) formEl.classList.add('active');
}
function handleCryptoTrade(event) {
     event.preventDefault();
     const formId = event.target.id;
     const isBuy = formId === 'crypto-trade-buy-form';
     const priceInput = document.getElementById(`${isBuy ? 'buy' : 'sell'}-crypto-price`);
     const amountInput = document.getElementById(`${isBuy ? 'buy' : 'sell'}-crypto-amount`);
     const price = parseFloat(priceInput?.value);
     const amount = parseFloat(amountInput?.value);
     const selectedPair = document.getElementById('crypto-pair-select')?.value || 'BTC/USD';
     const [baseTicker, quoteTicker] = selectedPair.split('/'); // base = крипта, quote = USD

     if (!cryptoDefinitions[baseTicker]) { addLog("Ошибка: Неизвестная криптовалюта.", "error"); return; }
     if (isNaN(price) || price <= 0 || isNaN(amount) || amount <= 0) {
         addLog("Введите корректные цену и количество.", "warning");
         return;
     }

     const totalCost = price * amount;
     const feePercent = 0.001; // 0.1% комиссия
     const fee = totalCost * feePercent;

     if (isBuy) {
          // Покупка крипты за USD
          const costWithFee = totalCost + fee;
          if (gameState.player.money >= costWithFee) {
               gameState.player.money -= costWithFee;
               gameState.player.crypto[baseTicker] = (gameState.player.crypto[baseTicker] || 0) + amount;
               addLog(`Куплено ${amount.toFixed(6)} ${baseTicker} по $${price.toLocaleString()} (-$${costWithFee.toLocaleString()} вкл. комиссию)`, "success");
               event.target.reset(); // Сброс формы
                renderCryptoExchange(); // Обновить UI биржи
                updateHeaderIndicators(); // Обновить балансы в хедере
          } else {
               addLog(`Недостаточно USD для покупки ${baseTicker}. Нужно $${costWithFee.toLocaleString()}`, "warning");
          }
     } else {
          // Продажа крипты за USD
          if ((gameState.player.crypto[baseTicker] || 0) >= amount) {
               gameState.player.crypto[baseTicker] -= amount;
               const receivedAmount = totalCost - fee;
               gameState.player.money += receivedAmount;
               addLog(`Продано ${amount.toFixed(6)} ${baseTicker} по $${price.toLocaleString()} (+$${receivedAmount.toLocaleString()} после комиссии)`, "success");
               event.target.reset(); // Сброс формы
                renderCryptoExchange(); // Обновить UI биржи
                updateHeaderIndicators(); // Обновить балансы в хедере
          } else {
               addLog(`Недостаточно ${baseTicker} для продажи. Нужно ${amount.toFixed(6)}`, "warning");
          }
     }
}
function updateCryptoTradeTotal(event) {
     const form = event.target.closest('form');
     if (!form) return;
     const priceInput = form.querySelector('input[id*="-crypto-price"]');
     const amountInput = form.querySelector('input[id*="-crypto-amount"]');
     const totalInput = form.querySelector('input[id*="-crypto-total"]');
     const price = parseFloat(priceInput?.value) || 0;
     const amount = parseFloat(amountInput?.value) || 0;
     if(totalInput) totalInput.value = (price * amount).toFixed(2);
}
function handleChangeChartTimeframe(event) {
     const timeframe = event.target.dataset.timeframe;
     addLog(`Загрузка графика с таймфреймом ${timeframe} (Заглушка)`, 'info');
     // TODO: Перерисовать график с новым таймфреймом
     // Сначала убираем active со всех кнопок в этой группе
      event.target.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      // Потом добавляем active к нажатой
      event.target.classList.add('active');
      // Перерисовать соответствующий график
       if (event.target.closest('#market-crypto-content')) {
            renderCryptoExchangeChart(document.getElementById('crypto-pair-select')?.value);
       } else if (event.target.closest('#wallet-section')) {
            renderWalletCryptoChart(document.getElementById('wallet-chart-crypto-select')?.value);
       }
}

// --- Управление Фермами ---
function handleRigManagementActions(event) {
    const button = event.target.closest('button');
    const slotDiv = event.target.closest('.rig-slot');
    const inventoryLi = event.target.closest('.inventory-list li');

    if (button) {
        const rigId = button.dataset.rigId || event.target.closest('.rig-content')?.dataset.rigContentId;
        if (button.classList.contains('rig-tab-button')) {
            gameState.uiState.activeRigTab = button.dataset.rigId;
             // Сбросить выбор слота/инвентаря при смене рига
             gameState.uiState.selectedRigSlot = { rigId: null, slotType: null, slotIndex: -1 };
             gameState.uiState.selectedInventoryItem = null;
            renderRigs();
        } else if (button.id === 'add-new-rig-tab-btn') {
             handleAddRig();
        } else if (button.classList.contains('delete-rig-btn') && rigId) {
             handleDeleteRig(rigId);
        } else if (button.id === 'install-component-btn') {
             handleInstallComponent();
        } else if (button.id === 'remove-component-btn') {
             handleRemoveComponent();
        } else if (button.id === 'repair-component-btn') {
             handleRepairComponent();
        } else if (button.id === 'scrap-component-btn') {
             handleScrapComponent();
        } else if (button.classList.contains('apply-tuning-btn') && button.dataset.gpuId) {
             handleApplyTuning(button.dataset.gpuId);
        } else if (button.classList.contains('add-slot-btn') && button.dataset.slotType === 'cooling') {
             handleAddCoolingSlot(rigId);
        }
         // Кнопка rename-rig-btn больше не нужна, переименование по blur

    } else if (slotDiv && !slotDiv.classList.contains('add-slot-btn')) { // Клик по слоту (не по кнопке добавления)
        handleSelectSlot(slotDiv.dataset.rigId, slotDiv.dataset.slotType, parseInt(slotDiv.dataset.slotIndex));
    } else if (inventoryLi && inventoryLi.dataset.itemId) { // Клик по предмету в инвентаре
         handleSelectInventoryItem(inventoryLi.dataset.itemId, inventoryLi.dataset.itemType);
    }
}
function handleRigManagementChanges(event) {
     // Изменение select (фильтр инвентаря)
     if (event.target.tagName === 'SELECT' && event.target.id.startsWith('inventory-filter-')) {
         renderRigInventory(event.target.dataset.rigId);
     }
      // Изменение инпутов тюнинга (пока не обрабатываем здесь, ждем Apply)
}

function handleSelectSlot(rigId, slotType, slotIndex) {
     // Если кликнули по уже выбранному слоту, снимаем выбор
     if (gameState.uiState.selectedRigSlot.rigId === rigId &&
         gameState.uiState.selectedRigSlot.slotType === slotType &&
         gameState.uiState.selectedRigSlot.slotIndex === slotIndex) {
         gameState.uiState.selectedRigSlot = { rigId: null, slotType: null, slotIndex: -1 };
     } else {
         gameState.uiState.selectedInventoryItem = null; // Сбрасываем выбор инвентаря
         gameState.uiState.selectedRigSlot = { rigId, slotType, slotIndex };
     }
    renderRigs(); // Перерисовать риги для отображения выделения и деталей
}

function handleSelectInventoryItem(itemId, itemType) {
     // Если кликнули по уже выбранному предмету, снимаем выбор
     if (gameState.uiState.selectedInventoryItem?.id === itemId && gameState.uiState.selectedInventoryItem?.type === itemType) {
          gameState.uiState.selectedInventoryItem = null;
     } else {
         gameState.uiState.selectedRigSlot = { rigId: null, slotType: null, slotIndex: -1 }; // Сбрасываем выбор слота
         gameState.uiState.selectedInventoryItem = { id: itemId, type: itemType };
     }
    renderRigs(); // Перерисовать риги (обновить инвентарь и детали)
}

function handleAddRig(free = false) {
     const cost = free ? 0 : (gameSettings.rigCost || 50);
     if (!free && gameState.player.money < cost) {
         addLog(`Недостаточно средств для покупки стойки ($${cost})`, "warning");
         return;
     }

     // Найти первое доступное определение стойки
      const availableRackDefs = Object.values(rackDefinitions);
      if (availableRackDefs.length === 0) {
           addLog("Нет доступных определений стоек в игре!", "error");
           return; // Не можем добавить риг без определения стойки
      }
       // Берем первую попавшуюся или конкретную базовую? Возьмем первую.
       const defaultRackDef = availableRackDefs[0];

     gameState.player.money -= cost;
     const newRigId = `rig_${gameState.nextRigId++}`;
     const newRig = {
         id: newRigId,
         name: `Ферма ${gameState.nextRigId - 1}`,
         definitionId: defaultRackDef.id, // Используем ID найденного определения
         slots: { // Инициализируем слоты на основе определения стойки? Или стандартно?
             psu: [null], // Пока 1 слот
             mobo: [null], // 1 слот
             gpu: Array(defaultRackDef.gpuSlots || gameSettings.initialRigSlots).fill(null), // Используем слоты из определения стойки
             cooling: [] // Слоты охлаждения пока пусты
         },
         status: 'idle', // 'off', 'running', 'error_*', 'overheating', 'idle'
         temp: AMBIENT_TEMP,
         power: 0,
         totalHashrate: {}
     };
     gameState.rigs.push(newRig);
     // Переключаемся на новую вкладку
     gameState.uiState.activeRigTab = newRigId;
     addLog(`Добавлена новая ферма "${newRig.name}" (${defaultRackDef.name}) ${free ? '' : `за $${cost}`}`, "success");
     renderRigs();
     updateHeaderIndicators(); // Обновить баланс
}

function handleDeleteRig(rigId) {
    const rigIndex = gameState.rigs.findIndex(r => r.id === rigId);
    if (rigIndex === -1) return;
    const rig = gameState.rigs[rigIndex];

    if (confirm(`Вы уверены, что хотите удалить ферму "${rig.name}"? Все компоненты будут перемещены в инвентарь.`)) {
        addLog(`Удаление фермы "${rig.name}"...`, "warning");
        // Перемещаем все компоненты в инвентарь
         Object.keys(rig.slots).forEach(slotType => {
              if (componentDefinitions[slotType]) { // Проверяем, что тип компонента существует
                  rig.slots[slotType]?.forEach(component => {
                      if (component) {
                           if (!gameState.player.inventory[slotType]) gameState.player.inventory[slotType] = [];
                           // Перед добавлением убедимся, что компонент не null/undefined
                           if (component) {
                                gameState.player.inventory[slotType].push(component);
                           }
                      }
                  });
              }
         });
        // Удаляем риг из массива
        gameState.rigs.splice(rigIndex, 1);
        // Сбрасываем активную вкладку, если удалили ее
        if (gameState.uiState.activeRigTab === rigId) {
            gameState.uiState.activeRigTab = gameState.rigs[0]?.id || null;
             // Сбросить выбор слота/инвентаря
             gameState.uiState.selectedRigSlot = { rigId: null, slotType: null, slotIndex: -1 };
             gameState.uiState.selectedInventoryItem = null;
        }
        addLog(`Ферма "${rig.name}" удалена. Компоненты перемещены в инвентарь.`, "info");
        renderRigs();
        // renderInventory(); // Обновить инвентарь (но он рендерится в renderRigs)
    }
}

function handleRenameRig(rigId, newName) {
    const rig = gameState.rigs.find(r => r.id === rigId);
    const trimmedName = newName.trim();
    if (rig && rig.name !== trimmedName && trimmedName) {
         const oldName = rig.name;
        rig.name = trimmedName;
        addLog(`Ферма "${oldName}" переименована в "${rig.name}"`, "info");
        renderRigs(); // Обновить вкладки
    } else if (rig && rig.name !== trimmedName && !trimmedName) {
         // Если имя стерли, вернуть старое? Или оставить пустое? Вернем старое.
          const nameEl = document.getElementById(`rig-name-${rigId}`);
          if(nameEl) nameEl.textContent = rig.name; // Восстанавливаем в UI
          addLog(`Имя фермы не может быть пустым.`, "warning");
    }
}

function handleInstallComponent() {
    const { selectedInventoryItem, selectedRigSlot } = gameState.uiState;
    if (!selectedInventoryItem || !selectedRigSlot.rigId || !selectedRigSlot.slotType || selectedRigSlot.slotIndex === -1) {
         addLog("Ошибка: Не выбран предмет в инвентаре ИЛИ пустой слот для установки.", "error"); return;
    }
    const rig = gameState.rigs.find(r => r.id === selectedRigSlot.rigId);
    const itemIndex = gameState.player.inventory[selectedInventoryItem.type]?.findIndex(i => i.id === selectedInventoryItem.id);
    if (!rig || itemIndex === -1 || !gameState.player.inventory[selectedInventoryItem.type]?.[itemIndex]) {
         addLog("Ошибка: Ферма или предмет не найден.", "error"); return;
    }
    const item = gameState.player.inventory[selectedInventoryItem.type][itemIndex];

     // Проверка совместимости слота и типа
     if (selectedInventoryItem.type !== selectedRigSlot.slotType) {
          addLog(`Ошибка: Нельзя установить ${getComponentTypeName(selectedInventoryItem.type)} в слот для ${getComponentTypeName(selectedRigSlot.slotType)}.`, "error"); return;
     }

     // Проверка, что слот пуст
      if (rig.slots[selectedRigSlot.slotType]?.[selectedRigSlot.slotIndex] !== null) {
          addLog("Ошибка: Слот уже занят!", "warning"); return;
      }

      // TODO: Добавить проверки совместимости компонентов (например, мощность БП, требования мат. платы)
       const definition = componentDefinitions[item.type]?.[item.definitionId];
       if (!definition) { addLog("Ошибка: Определение компонента не найдено.", "error"); return; }
       // Пример проверки требований
        if (definition.requirements) {
            // Очень простая проверка - нужна ли она здесь? Или при работе рига?
            // Например, проверить пины питания GPU?
        }

    // Перемещение: Удаляем из инвентаря и ставим в слот
    rig.slots[selectedRigSlot.slotType][selectedRigSlot.slotIndex] = item;
    gameState.player.inventory[selectedInventoryItem.type].splice(itemIndex, 1);

    addLog(`${definition.name} (#${item.id.slice(-6)}) установлен в слот ${selectedRigSlot.slotType} #${selectedRigSlot.slotIndex + 1} фермы "${rig.name}".`, "success");

    // Сброс выбора и рендер
    gameState.uiState.selectedInventoryItem = null;
    gameState.uiState.selectedRigSlot = { rigId: null, slotType: null, slotIndex: -1 };
    renderRigs();
    // Если риг был idle, он должен попытаться запуститься в след. тике
     if (rig.status === 'idle' || rig.status === 'error_gpu' || rig.status === 'error_psu' || rig.status === 'error_mobo') {
         rig.status = 'idle'; // Попробовать запустить
     }
}

function handleRemoveComponent() {
    const { selectedRigSlot } = gameState.uiState;
    if (!selectedRigSlot.rigId || !selectedRigSlot.slotType || selectedRigSlot.slotIndex === -1) {
        addLog("Ошибка: Не выбран компонент в ферме для снятия.", "error"); return;
    }
    const rig = gameState.rigs.find(r => r.id === selectedRigSlot.rigId);
    if (!rig) { addLog("Ошибка: Ферма не найдена.", "error"); return; }
    const component = rig.slots[selectedRigSlot.slotType]?.[selectedRigSlot.slotIndex];
    if (!component) { addLog("Слот пуст, нечего снимать.", "warning"); return; }
    const definition = componentDefinitions[selectedRigSlot.slotType]?.[component.definitionId];

    // Перемещение
    if (!gameState.player.inventory[selectedRigSlot.slotType]) gameState.player.inventory[selectedRigSlot.slotType] = [];
    gameState.player.inventory[selectedRigSlot.slotType].push(component);
    rig.slots[selectedRigSlot.slotType][selectedRigSlot.slotIndex] = null;

     addLog(`${definition?.name || 'Компонент'} (#${component.id.slice(-6)}) снят из "${rig.name}" и помещен в инвентарь.`, "success");

     // Сброс выбора и рендер
     gameState.uiState.selectedRigSlot = { rigId: null, slotType: null, slotIndex: -1 };
     renderRigs();
     // Если из-за снятия компонента риг должен остановиться
      if ((selectedRigSlot.slotType === 'psu' || selectedRigSlot.slotType === 'mobo') && !rig.slots[selectedRigSlot.slotType][0]) {
          rig.status = `error_${selectedRigSlot.slotType}`;
      } else if (rig.status === 'running' && rig.slots.gpu.every(g => g === null || g.status === 'broken')) {
          rig.status = 'idle'; // Нет рабочих GPU - переходим в idle
      }
}

function handleRepairComponent() {
    const { selectedRigSlot } = gameState.uiState;
     if (!selectedRigSlot.rigId || !selectedRigSlot.slotType || selectedRigSlot.slotIndex === -1) {
         addLog("Ошибка: Не выбран компонент для ремонта.", "error"); return;
     }
     const rig = gameState.rigs.find(r => r.id === selectedRigSlot.rigId);
     if (!rig) { addLog("Ошибка: Ферма не найдена.", "error"); return; }
     const component = rig.slots[selectedRigSlot.slotType]?.[selectedRigSlot.slotIndex];
     if (!component) { addLog("Слот пуст.", "warning"); return; }
     if (component.status === 'broken') { addLog("Сломанный компонент нельзя отремонтировать, только заменить или утилизировать.", "warning"); return; }
     const definition = componentDefinitions[selectedRigSlot.slotType]?.[component.definitionId];
     if (!definition) { addLog("Ошибка: Определение компонента не найдено.", "error"); return; }

     const repairCost = calculateRepairCost(component, definition);
     if (gameState.player.money >= repairCost) {
         gameState.player.money -= repairCost;
         const wearReductionPercent = 0.8 + Math.random() * 0.15; // Уменьшаем износ на 80-95%
         const wearToReduce = (component.wear || 0) * wearReductionPercent;
         component.wear = Math.max(0, (component.wear || 0) - wearToReduce);

         addLog(`${definition.name} (#${component.id.slice(-6)}) отремонтирован за $${repairCost}. Текущий износ: ${component.wear.toFixed(1)}%`, "success");
         renderRigs(); // Обновить UI, включая кнопки
         updateHeaderIndicators(); // Обновить баланс
     } else {
         addLog(`Недостаточно средств для ремонта ($${repairCost})`, "warning");
     }
}
function handleScrapComponent() {
    const { selectedRigSlot } = gameState.uiState;
     if (!selectedRigSlot.rigId || !selectedRigSlot.slotType || selectedRigSlot.slotIndex === -1) {
         addLog("Ошибка: Не выбран компонент для утилизации.", "error"); return;
     }
     const rig = gameState.rigs.find(r => r.id === selectedRigSlot.rigId);
     if (!rig) { addLog("Ошибка: Ферма не найдена.", "error"); return; }
     const component = rig.slots[selectedRigSlot.slotType]?.[selectedRigSlot.slotIndex];
     if (!component) { addLog("Слот пуст.", "warning"); return; }
     const definition = componentDefinitions[selectedRigSlot.slotType]?.[component.definitionId];
     const name = definition?.name || 'компонент';

     if (confirm(`Утилизировать ${name} (#${component.id.slice(-6)})? Это действие необратимо.`)) {
           // Даем немного денег (зависит от цены и износа?)
           const basePrice = definition?.price || 10;
            const wearFactor = Math.max(0, 1 - (component.wear || 0) / 100);
           const scrapValue = Math.max(1, Math.round(basePrice * 0.05 * wearFactor)); // 5% от цены * (1 - износ)
           gameState.player.money += scrapValue;

           rig.slots[selectedRigSlot.slotType][selectedRigSlot.slotIndex] = null; // Удаляем компонент

           addLog(`${name} (#${component.id.slice(-6)}) утилизирован. Получено $${scrapValue}.`, "info");
           gameState.uiState.selectedRigSlot = { rigId: null, slotType: null, slotIndex: -1 }; // Сбросить выбор
           renderRigs();
           updateHeaderIndicators();
     }
}

function handleApplyTuning(gpuId) {
    const detailsContainer = document.querySelector(`#selected-rig-item-details-${gameState.uiState.selectedRigSlot.rigId}`);
    if(!detailsContainer || gameState.uiState.selectedRigSlot.slotType !== 'gpu') return;

    const rigId = gameState.uiState.selectedRigSlot.rigId;
    const slotIndex = gameState.uiState.selectedRigSlot.slotIndex;
    const rig = gameState.rigs.find(r => r.id === rigId);
    const targetGpu = rig?.slots?.gpu?.[slotIndex];

    // Дополнительная проверка, что ID совпадает (на всякий случай)
    if (!targetGpu || targetGpu.id !== gpuId) { addLog("Ошибка: GPU для тюнинга не найден или ID не совпадает.", "error"); return; }

    const coreInput = detailsContainer.querySelector(`input[data-param="coreClockOffset"][data-gpu-id="${gpuId}"]`);
    const memInput = detailsContainer.querySelector(`input[data-param="memClockOffset"][data-gpu-id="${gpuId}"]`);
    const powerInput = detailsContainer.querySelector(`input[data-param="powerLimit"][data-gpu-id="${gpuId}"]`);

    const newCore = parseInt(coreInput?.value) || 0;
    const newMem = parseInt(memInput?.value) || 0;
    const newPower = parseInt(powerInput?.value) || 100;

    // Валидация значений (примерные рамки)
     const maxCoreOffset = 500;
     const maxMemOffset = 1500;
     const minPower = 50;
     const maxPower = 120;

     if (newCore < -maxCoreOffset || newCore > maxCoreOffset || newMem < -maxMemOffset || newMem > maxMemOffset || newPower < minPower || newPower > maxPower) {
          addLog("Ошибка: Недопустимые значения разгона!", "warning");
          // Восстановить значения в инпутах?
           coreInput.value = targetGpu.coreClockOffset || 0;
           memInput.value = targetGpu.memClockOffset || 0;
           powerInput.value = targetGpu.powerLimit || 100;
          return;
     }


    targetGpu.coreClockOffset = newCore;
    targetGpu.memClockOffset = newMem;
    targetGpu.powerLimit = newPower;

    addLog(`Настройки тюнинга для ${gpuDefinitions[targetGpu.definitionId]?.name || 'GPU'} (#${gpuId.slice(-6)}) применены (Core: ${newCore}, Mem: ${newMem}, PL: ${newPower}%)`, "info");
     // Не нужно вызывать renderRigs(), т.к. инпуты уже обновлены.
     // Изменения хешрейта/мощности/температуры/износа учтутся в следующем тике.
}

function handleAddCoolingSlot(rigId) {
     const rig = gameState.rigs.find(r => r.id === rigId);
     if (!rig) return;
     // TODO: Проверить лимит слотов (если он есть)
      const maxCoolingSlots = 4; // Пример
      if (rig.slots.cooling.length >= maxCoolingSlots) {
           addLog("Достигнут лимит слотов охлаждения для этой фермы.", "warning");
           return;
      }

     // Добавляем пустой слот
     if (!rig.slots.cooling) rig.slots.cooling = [];
     rig.slots.cooling.push(null);
     addLog(`Добавлен новый слот для охлаждения в ферму "${rig.name}".`, "info");
     renderRigs(); // Перерисовать риг с новым слотом
}


// --- Кошелек ---
function handleWalletActions(event) {
     const button = event.target.closest('button');
     if (!button) return;

     if (button.classList.contains('btn-send')) {
          addLog(`Отправка ${button.dataset.ticker} (Заглушка)`, "info");
          // TODO: Открыть модальное окно для ввода адреса и суммы
     } else if (button.classList.contains('btn-receive')) {
          addLog(`Адрес для получения ${button.dataset.ticker}: fakeAddress_${button.dataset.ticker}_${Date.now().toString().slice(-5)} (Заглушка)`, "info");
          // TODO: Показать QR-код или адрес
     } else if (button.id === 'execute-rebalance-btn') {
          handleExecuteRebalance();
     }
}
function handleCalculateRebalance(event) {
     event.preventDefault();
     const container = document.getElementById('rebalance-targets');
     const stepsList = document.getElementById('rebalance-steps-list');
     const executeBtn = document.getElementById('execute-rebalance-btn');
     if (!container || !stepsList || !executeBtn) return;

     let targets = {};
     let totalTargetPercent = 0;
     container.querySelectorAll('input[type="number"]').forEach(input => {
          const ticker = input.dataset.ticker;
          const percent = parseInt(input.value || 0);
          if (ticker && percent >= 0 && percent <= 100) {
               targets[ticker] = percent / 100; // Храним как долю (0-1)
               totalTargetPercent += percent;
          }
     });

     if (totalTargetPercent !== 100) {
          addLog(`Ошибка: Сумма целевых процентов должна быть равна 100%, а не ${totalTargetPercent}%.`, "warning");
          stepsList.innerHTML = '<li class="text-danger">Сумма целей не равна 100%!</li>';
          executeBtn.style.display = 'none';
          return;
     }

     addLog("Расчет шагов ребалансировки...", "info");
     stepsList.innerHTML = '<li>Расчет...</li>';

     // Логика расчета
      const currentPortfolioCryptoValue = Object.entries(gameState.player.crypto).reduce((sum, [ticker, balance]) => {
           return sum + (balance || 0) * (gameState.cryptoPrices[ticker] || 0);
      }, 0);

      if (currentPortfolioCryptoValue <= 0.01) {
           addLog("Портфель пуст или его стоимость слишком мала для ребалансировки.", "info");
           stepsList.innerHTML = '<li>Портфель пуст.</li>';
           executeBtn.style.display = 'none';
           return;
      }

      let steps = [];
      Object.keys(targets).forEach(ticker => {
           const targetValue = currentPortfolioCryptoValue * targets[ticker];
           const currentValue = (gameState.player.crypto[ticker] || 0) * (gameState.cryptoPrices[ticker] || 0);
           const differenceValue = targetValue - currentValue;
           const price = gameState.cryptoPrices[ticker];

           if (price > 0 && Math.abs(differenceValue) > 1) { // Ребалансируем, если разница больше $1
                const amountToTrade = differenceValue / price;
                if (amountToTrade > 0.000001) { // Покупаем
                     steps.push({ type: 'buy', ticker: ticker, amount: amountToTrade, estimatedValue: differenceValue });
                } else if (amountToTrade < -0.000001) { // Продаем
                     steps.push({ type: 'sell', ticker: ticker, amount: Math.abs(amountToTrade), estimatedValue: Math.abs(differenceValue) });
                }
           }
      });

      // Отображаем шаги
      if (steps.length > 0) {
           // Сортируем: сначала продажи, потом покупки?
           steps.sort((a, b) => (a.type === 'sell' ? -1 : 1) - (b.type === 'sell' ? -1 : 1));
           stepsList.innerHTML = steps.map(step => `
                <li class="${step.type === 'buy' ? 'text-success' : 'text-danger'}">
                    ${step.type === 'buy' ? 'Купить' : 'Продать'} ${step.amount.toFixed(6)} ${step.ticker} (~$${step.estimatedValue.toFixed(0)})
                </li>
           `).join('');
           executeBtn.style.display = 'inline-block';
           // Сохраняем шаги для выполнения?
           executeBtn.dataset.rebalanceSteps = JSON.stringify(steps);
      } else {
           stepsList.innerHTML = '<li>Ребалансировка не требуется.</li>';
           executeBtn.style.display = 'none';
      }
}
function handleExecuteRebalance() {
     const executeBtn = document.getElementById('execute-rebalance-btn');
     const stepsList = document.getElementById('rebalance-steps-list');
     if (!executeBtn || !stepsList) return;
     const stepsJson = executeBtn.dataset.rebalanceSteps;
     if (!stepsJson) {
          addLog("Ошибка: Шаги ребалансировки не найдены.", "error");
          return;
     }

     try {
          const steps = JSON.parse(stepsJson);
          addLog(`Выполнение ребалансировки (${steps.length} шагов)...`, "info");
          stepsList.innerHTML = '<li>Выполнение...</li>';
          executeBtn.setAttribute('disabled', 'true'); // Блокируем кнопку

          // Выполняем шаги (синхронно для простоты, в реальной игре может быть асинхронно)
          let success = true;
          steps.forEach(step => {
               const price = gameState.cryptoPrices[step.ticker];
               if (!price || price <= 0) {
                    addLog(`Ошибка ребалансировки: Некорректная цена для ${step.ticker}.`, "error");
                    success = false; return;
               }
               const totalValue = price * step.amount;
               const fee = totalValue * 0.001; // 0.1% комиссия

               if (step.type === 'buy') {
                    const costWithFee = totalValue + fee;
                    if (gameState.player.money >= costWithFee) {
                         gameState.player.money -= costWithFee;
                         gameState.player.crypto[step.ticker] = (gameState.player.crypto[step.ticker] || 0) + step.amount;
                         addLog(`Ребаланс: Куплено ${step.amount.toFixed(6)} ${step.ticker}`, "info");
                    } else {
                         addLog(`Ребаланс: Недостаточно USD для покупки ${step.ticker}. Шаг пропущен.`, "warning");
                         // success = false; // Не считать ошибкой, просто пропуск?
                    }
               } else { // sell
                    if ((gameState.player.crypto[step.ticker] || 0) >= step.amount) {
                         gameState.player.crypto[step.ticker] -= step.amount;
                         gameState.player.money += (totalValue - fee);
                         addLog(`Ребаланс: Продано ${step.amount.toFixed(6)} ${step.ticker}`, "info");
                    } else {
                         addLog(`Ребаланс: Недостаточно ${step.ticker} для продажи. Шаг пропущен.`, "warning");
                         // success = false;
                    }
               }
          });

          if (success) {
                addLog("Ребалансировка портфеля завершена.", "success");
               stepsList.innerHTML = '<li>Ребалансировка завершена.</li>';
          } else {
               addLog("Ребалансировка портфеля завершена с ошибками/пропусками.", "warning");
               stepsList.innerHTML = '<li>Ребалансировка завершена (частично).</li>';
          }
          executeBtn.style.display = 'none'; // Скрываем кнопку после выполнения
          executeBtn.removeAttribute('disabled');
          executeBtn.dataset.rebalanceSteps = ''; // Очищаем шаги
          renderWallet(); // Обновить кошелек
          updateHeaderIndicators(); // Обновить балансы

     } catch (error) {
          console.error("Ошибка выполнения ребалансировки:", error);
          addLog("Критическая ошибка при выполнении ребалансировки!", "error");
           stepsList.innerHTML = '<li class="text-danger">Ошибка выполнения!</li>';
           executeBtn.removeAttribute('disabled');
     }
}

function handleRebalanceInputChange() {
     const container = document.getElementById('rebalance-targets');
     if (!container) return;
     let totalPercent = 0;
     container.querySelectorAll('input[type="number"]').forEach(input => {
          // Ограничиваем значение 0-100
          let value = parseInt(input.value || 0);
          if (value < 0) value = 0;
          if (value > 100) value = 100;
          input.value = value; // Обновляем значение в поле
         totalPercent += value;
     });
     const totalEl = document.getElementById('rebalance-total-percent');
     if (totalEl) {
          totalEl.textContent = totalPercent;
          totalEl.style.color = (totalPercent === 100) ? 'inherit' : 'red';
     }
     // Сбросить расчетные шаги при изменении цели
      document.getElementById('rebalance-steps-list').innerHTML = '<li>Требуется пересчет.</li>';
      document.getElementById('execute-rebalance-btn').style.display = 'none';
}
function handleWalletChartSelect(event) {
     gameState.uiState.selectedWalletCrypto = event.target.value;
     renderWalletCryptoChart(gameState.uiState.selectedWalletCrypto);
}

// --- Исследования ---
function handleResearchActions(event) {
     const button = event.target.closest('button');
     if (!button) return;
     const researchId = button.dataset.researchId;
     if (!researchId) return;

     if (button.classList.contains('start-research-btn')) {
         handleStartResearch(researchId);
     } else if (button.classList.contains('cancel-research-btn')) {
         handleCancelResearch(researchId);
     }
}
function handleStartResearch(researchId) {
    if (gameState.activeResearch) {
        addLog(`Уже идет исследование: "${researchDefinitions[gameState.activeResearch.researchId]?.name || '?'}"`, "warning"); return;
    }
    const resDef = researchDefinitions[researchId];
    if (!resDef) { addLog("Ошибка: Исследование не найдено.", "error"); return; }

    // Проверка стоимости
    if (gameState.player.money < (resDef.cost || 0)) {
         addLog(`Недостаточно средств для исследования "${resDef.name}" (Нужно $${(resDef.cost || 0).toLocaleString()})`, "warning"); return;
    }
    // Проверка зависимостей
    const unmetDeps = (resDef.requires || []).filter(reqId => !gameState.player.completedResearch.includes(reqId));
    if (unmetDeps.length > 0) {
         addLog(`Не выполнены требования для "${resDef.name}": ${unmetDeps.map(id => researchDefinitions[id]?.name || id).join(', ')}`, "warning"); return;
    }

    gameState.player.money -= resDef.cost;
    gameState.activeResearch = {
        researchId: researchId,
        startTime: Date.now(), // Реальное время старта (для расчета прошедшего времени)
        progressTime: 0, // Накопленное игровое время прогресса
        duration
