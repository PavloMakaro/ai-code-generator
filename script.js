"use strict"; // Используем строгий режим

// --- Элементы DOM ---
const scoreDisplay = document.getElementById('score');
const ppcDisplay = document.getElementById('ppc');
const ppsDisplay = document.getElementById('pps');
const pizzaButton = document.getElementById('pizza-button');
const pizzaContainer = document.getElementById('pizza-container');
const interactiveArea = document.getElementById('interactive-area');
const upgradesList = document.getElementById('upgrades-list');
const resetButton = document.getElementById('reset-button');
const achievementsList = document.getElementById('achievements-list');
const achievementCountDisplay = document.getElementById('achievement-count');
const achievementToast = document.getElementById('achievement-toast');
const toastMessage = achievementToast.querySelector('.toast-message');
const userGreetingElement = document.getElementById('user-greeting');

// --- Аудио ---
const sounds = {
    click: document.getElementById('click-sound'),
    buy: document.getElementById('buy-sound'),
    achievement: document.getElementById('achievement-sound'),
    goldenPizza: document.getElementById('golden-pizza-sound')
};
let audioContextStarted = false;

// --- Telegram Web App Initialization ---
const tg = window.Telegram.WebApp;
let userColorScheme = 'light';
const CLOUD_STORAGE_KEY = 'pizzaClickerSave_tma'; // Ключ для CloudStorage
const LOCAL_STORAGE_FALLBACK_KEY = 'pizzaClickerSave_fallback'; // Ключ для LocalStorage (запасной)

// --- Состояние игры ---
let score = 0;
let totalPizzasEarned = 0;
let totalClicks = 0;
let pizzasPerClick = 1;
let pizzasPerSecond = 0;
let scoreCountUp; // Экземпляр CountUp.js

// --- Данные улучшений ---
let upgrades = [
    { id: 'strong_wrist', name: 'Сильное Запястье', description: 'Увеличивает пицц за клик.', icon: '💪', baseCost: 15, costIncreaseFactor: 1.15, type: 'click', baseValue: 1, level: 0, tooltip: "Больше пиццы за каждый ваш клик!" },
    { id: 'oven_mitts', name: 'Кухонные Рукавицы', description: 'Больше пицц за клик.', icon: '🧤', baseCost: 100, costIncreaseFactor: 1.18, type: 'click', baseValue: 5, level: 0, tooltip: "Кликайте с комфортом и эффективностью." },
    { id: 'carbide_roller', name: 'Карбидовый Ролик', description: 'Серьезно увеличивает пицц за клик.', icon: '🔪', baseCost: 2000, costIncreaseFactor: 1.20, type: 'click', baseValue: 50, level: 0, tooltip: "Высокотехнологичный ролик для пиццы." },
    { id: 'grandma', name: 'Бабушка', description: 'Печет пиццу автоматически.', icon: '👵', baseCost: 50, costIncreaseFactor: 1.20, type: 'auto', baseValue: 1, level: 0, tooltip: "Классика. Печет с любовью." },
    { id: 'pizza_boy', name: 'Доставщик Пиццы', description: 'Приносит немного пицц сам.', icon: '🛵', baseCost: 500, costIncreaseFactor: 1.22, type: 'auto', baseValue: 8, level: 0, tooltip: "Быстрая доставка свежих пицц." },
    { id: 'stone_oven', name: 'Каменная Печь', description: 'Значительно увеличивает авто-прибыль.', icon: '🔥', baseCost: 5000, costIncreaseFactor: 1.25, type: 'auto', baseValue: 50, level: 0, tooltip: "Горячие пиццы, прямо из печи!" },
    { id: 'pizzeria', name: 'Пиццерия', description: 'Настоящее производство пиццы.', icon: '🏢', baseCost: 75000, costIncreaseFactor: 1.28, type: 'auto', baseValue: 400, level: 0, tooltip: "Ваша первая собственная пиццерия." },
    { id: 'click_multiplier', name: 'Двойной Клик', description: 'Умножает силу клика x2.', icon: '🖱️', baseCost: 10000, costIncreaseFactor: 2.5, type: 'click_multiplier', baseValue: 2, level: 0, maxLevel: 5, tooltip: "Каждый клик считается за два!" },
    { id: 'grandma_recipes', name: 'Рецепты Бабушки', description: 'Удваивает эффективность Бабушек.', icon: '📜', baseCost: 25000, costIncreaseFactor: 3, type: 'synergy', targetUpgradeId: 'grandma', multiplier: 2, level: 0, maxLevel: 3, tooltip: "Секретные ингредиенты творят чудеса." },
];

// --- Данные достижений ---
let achievements = [
    { id: 'click_1', name: 'Первый Клик', description: 'Сделать 1 клик', icon: '👆', condition: () => totalClicks >= 1, unlocked: false },
    { id: 'click_100', name: 'Сотый Клик', description: 'Сделать 100 кликов', icon: '🖱️', condition: () => totalClicks >= 100, unlocked: false },
    { id: 'click_1k', name: 'Тысяча Кликов', description: 'Сделать 1000 кликов', icon: '⌨️', condition: () => totalClicks >= 1000, unlocked: false },
    { id: 'earn_100', name: 'Начинающий Пекарь', description: 'Заработать 100 пицц', icon: '💰', condition: () => totalPizzasEarned >= 100, unlocked: false },
    { id: 'earn_10k', name: 'Пицца-Магнат', description: 'Заработать 10,000 пицц', icon: '🤑', condition: () => totalPizzasEarned >= 10000, unlocked: false },
    { id: 'earn_1m', name: 'Миллионер', description: 'Заработать 1,000,000 пицц', icon: '👑', condition: () => totalPizzasEarned >= 1000000, unlocked: false },
    { id: 'buy_grandma', name: 'Привет, Бабуля!', description: 'Купить первую Бабушку', icon: '👵', condition: () => upgrades.find(u => u.id === 'grandma')?.level >= 1, unlocked: false },
    { id: 'buy_10_grandma', name: 'Армия Бабушек', description: 'Купить 10 Бабушек', icon: '👵👵', condition: () => upgrades.find(u => u.id === 'grandma')?.level >= 10, unlocked: false },
    { id: 'buy_oven', name: 'Зажигаем!', description: 'Купить Каменную Печь', icon: '🔥', condition: () => upgrades.find(u => u.id === 'stone_oven')?.level >= 1, unlocked: false },
    { id: 'buy_synergy', name: 'Секретный Рецепт', description: 'Купить улучшение синергии', icon: '✨', condition: () => upgrades.some(u => u.type === 'synergy' && u.level > 0), unlocked: false },
];

// --- Золотая Пицца ---
let goldenPizzaTimeout;
const GOLDEN_PIZZA_MIN_INTERVAL = 30 * 1000;
const GOLDEN_PIZZA_RANDOM_INTERVAL = 90 * 1000;
const GOLDEN_PIZZA_DURATION = 8 * 1000;

// --- Игровые циклы (ID интервалов) ---
let autoClickIntervalId;
let saveGameIntervalId;

// --- Функции ---

// Инициализация Telegram WebApp
function setupTelegramIntegration() {
    if (!tg || !tg.initData) { // Проверяем наличие tg и initData
        console.warn("Не удалось инициализировать Telegram WebApp. Работаем в режиме fallback.");
        if (userGreetingElement) userGreetingElement.textContent = "Откройте в Telegram для лучшего опыта!";
        applyTheme({}); // Применяем дефолтную тему
        return;
    }

    try {
        tg.ready();
        tg.expand();
        tg.enableClosingConfirmation();

        applyTheme(tg.themeParams);
        tg.onEvent('themeChanged', () => applyTheme(tg.themeParams));

        if (tg.initDataUnsafe?.user && userGreetingElement) {
            const user = tg.initDataUnsafe.user;
            userGreetingElement.textContent = `Привет, ${user.first_name || user.username}!`;
        }
         console.log("Telegram WebApp инициализирован:", tg);
    } catch (error) {
         console.error("Ошибка инициализации Telegram:", error);
          if (userGreetingElement) userGreetingElement.textContent = "Ошибка интеграции с Telegram.";
          applyTheme({}); // Применяем дефолтную тему при ошибке
    }
}

// Применение темы Telegram
function applyTheme(themeParams) {
    try {
        userColorScheme = tg?.colorScheme || 'light';
        const root = document.documentElement;
        root.style.setProperty('--tma-bg-color', themeParams.bg_color || '#ffffff');
        root.style.setProperty('--tma-text-color', themeParams.text_color || '#000000');
        root.style.setProperty('--tma-hint-color', themeParams.hint_color || '#707579');
        root.style.setProperty('--tma-link-color', themeParams.link_color || '#2481cc');
        root.style.setProperty('--tma-button-color', themeParams.button_color || '#2481cc');
        root.style.setProperty('--tma-button-text-color', themeParams.button_text_color || '#ffffff');
        root.style.setProperty('--tma-secondary-bg-color', themeParams.secondary_bg_color || '#f1f1f1');

        // Установка мета-тега theme-color для строки состояния браузера на мобильных
        let themeMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeMeta) {
            themeMeta = document.createElement('meta');
            themeMeta.name = "theme-color";
            document.head.appendChild(themeMeta);
        }
        themeMeta.content = themeParams.bg_color || '#ffffff'; // Цвет фона приложения

        console.log(`Тема ${userColorScheme} применена.`);

    } catch (error) {
         console.error("Ошибка применения темы:", error);
    }
}

// Воспроизведение звука
function playSound(soundId) {
    if (!audioContextStarted && typeof AudioContext !== 'undefined') {
        const audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().then(() => {
                console.log("AudioContext resumed!");
                audioContextStarted = true;
                playSoundInternal(soundId);
            }).catch(e => console.error("AudioContext resume failed:", e));
        } else {
             audioContextStarted = true;
        }
    }
    playSoundInternal(soundId);
}

function playSoundInternal(soundId) {
    const sound = sounds[soundId];
    if (sound && (audioContextStarted || !tg || !tg.initData)) { // Разрешаем играть вне ТГ сразу
        sound.currentTime = 0;
        sound.play().catch(error => console.warn(`Не удалось воспроизвести звук ${soundId}:`, error));
    } else if (!sound) {
        // console.warn(`Звук с ID "${soundId}" не найден.`);
    }
}

// Haptic Feedback
function triggerHapticFeedback(style = 'light') {
     if (tg?.HapticFeedback?.impactOccurred) {
          try {
            tg.HapticFeedback.impactOccurred(style);
          } catch (e) {
            console.warn("Haptic feedback failed:", style, e);
            // Попробовать базовый стиль при ошибке
            if (style !== 'light') {
                 try { tg.HapticFeedback.impactOccurred('light'); } catch (e2) {}
            }
          }
     }
}

// Форматирование чисел
function formatNumber(num) {
    num = Math.floor(num);
    if (Math.abs(num) < 1000) return num.toString();
    const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    const i = Math.floor(Math.log10(Math.abs(num)) / 3);
    if (i >= suffixes.length) return num.toExponential(2);
    const scaled = num / Math.pow(1000, i);
    const formatted = scaled.toFixed(scaled < 10 ? 2 : scaled < 100 ? 1 : 0).replace(/\.0+$/, ''); // Убираем .00 и .0
    return formatted + suffixes[i];
}

// Расчет стоимости улучшения
function calculateCost(upgrade) {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costIncreaseFactor, upgrade.level));
}

// Обновление отображения счета
function updateScoreDisplay() {
    const currentScore = Math.floor(score);
    if (!scoreCountUp) {
        try {
            scoreCountUp = new CountUp(scoreDisplay, currentScore, {
                duration: 0.4,
                formattingFn: formatNumber,
                useEasing: false // Отключаем easing для большей точности при частых обновлениях
            });
             if (!scoreCountUp.error) scoreCountUp.start();
             else scoreDisplay.textContent = formatNumber(currentScore);
         } catch(e) { // CountUp может падать при невалидном элементе
             console.error("CountUp Error:", e);
             if(scoreDisplay) scoreDisplay.textContent = formatNumber(currentScore);
         }
    } else {
        scoreCountUp.update(currentScore);
    }
}

// Обновление остальной статистики и кнопок
function updateStatsDisplays() {
    if (ppcDisplay) ppcDisplay.textContent = formatNumber(pizzasPerClick);
    if (ppsDisplay) ppsDisplay.textContent = formatNumber(pizzasPerSecond);

    upgrades.forEach(upgrade => {
        const button = document.getElementById(`buy-${upgrade.id}`);
        if (button) {
            const currentCost = calculateCost(upgrade);
            const isMaxLevel = upgrade.maxLevel && upgrade.level >= upgrade.maxLevel;
            button.disabled = score < currentCost || isMaxLevel;
            const costSpan = button.querySelector('.upgrade-cost');
            if (costSpan) {
                 if (isMaxLevel) {
                    costSpan.textContent = "МАКС.";
                 } else {
                    costSpan.textContent = `🍕 ${formatNumber(currentCost)}`;
                 }
            }
        }
    });
    updateAchievementCounter();
}

// Пересчет PPC и PPS
function recalculateStats() {
    let basePPC = 1;
    let basePPS = 0;
    let clickMultiplier = 1;
    const synergyMultipliers = {};

    upgrades.filter(u => u.type === 'synergy' && u.level > 0).forEach(syn => {
        if (!synergyMultipliers[syn.targetUpgradeId]) synergyMultipliers[syn.targetUpgradeId] = 1;
        synergyMultipliers[syn.targetUpgradeId] *= Math.pow(syn.multiplier, syn.level);
    });

    upgrades.forEach(upgrade => {
        if (upgrade.level > 0) {
            const synergyBoost = synergyMultipliers[upgrade.id] || 1;
            const effectiveValue = upgrade.baseValue * synergyBoost;
            if (upgrade.type === 'click') basePPC += effectiveValue * upgrade.level;
            else if (upgrade.type === 'auto') basePPS += effectiveValue * upgrade.level;
            else if (upgrade.type === 'click_multiplier') clickMultiplier *= Math.pow(upgrade.baseValue, upgrade.level);
        }
    });

    pizzasPerClick = Math.floor(basePPC * clickMultiplier);
    pizzasPerSecond = basePPS; // Оставим дробным для точности в autoClick

    updateStatsDisplays();
    checkAchievements();
}

// Создание HTML элемента улучшения
function createUpgradeElement(upgrade) {
    const item = document.createElement('div');
    item.className = 'upgrade-item';
    item.id = `upgrade-${upgrade.id}`;
    item.title = `${upgrade.tooltip || upgrade.description}\nТекущий уровень: ${upgrade.level}`;

    const cost = calculateCost(upgrade);
    const isMaxLevel = upgrade.maxLevel && upgrade.level >= upgrade.maxLevel;
    let effectText = '';

    if (upgrade.level > 0) {
        const synergyBoost = (upgrades.find(u => u.type === 'synergy' && u.targetUpgradeId === upgrade.id)?.level > 0) ?
                             (Math.pow(upgrades.find(u => u.type === 'synergy' && u.targetUpgradeId === upgrade.id).multiplier, upgrades.find(u => u.type === 'synergy' && u.targetUpgradeId === upgrade.id).level)) : 1;
        let currentEffectValue;
        if (upgrade.type === 'click') { currentEffectValue = upgrade.baseValue * upgrade.level * synergyBoost; effectText = `+${formatNumber(currentEffectValue)} PPC`; }
        else if (upgrade.type === 'auto') { currentEffectValue = upgrade.baseValue * upgrade.level * synergyBoost; effectText = `+${formatNumber(currentEffectValue)} PPS`; }
        else if (upgrade.type === 'click_multiplier') { currentEffectValue = Math.pow(upgrade.baseValue, upgrade.level); effectText = `Клики x${formatNumber(currentEffectValue)}`; }
        else if (upgrade.type === 'synergy') { const targetName = upgrades.find(u => u.id === upgrade.targetUpgradeId)?.name || '?'; currentEffectValue = Math.pow(upgrade.multiplier, upgrade.level); effectText = `${targetName} x${formatNumber(currentEffectValue)}`; }
        if(effectText) item.title += `\nТекущий эффект: ${effectText}`;
    }

    item.innerHTML = `
        <div class="upgrade-icon">${upgrade.icon}</div>
        <div class="upgrade-details">
            <div class="upgrade-name">${upgrade.name} ${upgrade.maxLevel ? `(${upgrade.level}/${upgrade.maxLevel})` : `(Ур. ${upgrade.level})`}</div>
            <div class="upgrade-description">${upgrade.description}</div>
            ${effectText ? `<div class="upgrade-effect">${effectText}</div>` : ''}
        </div>
        <button class="upgrade-buy-button" id="buy-${upgrade.id}" ${ (score < cost || isMaxLevel) ? 'disabled' : ''}>
            Купить
            <span class="upgrade-cost">${isMaxLevel ? 'МАКС.' : `🍕 ${formatNumber(cost)}`}</span>
        </button>
    `;

    const buyButton = item.querySelector(`#buy-${upgrade.id}`);
    if(buyButton) buyButton.addEventListener('click', () => buyUpgrade(upgrade.id));

    return item;
}

// Отрисовка всех улучшений
function renderUpgrades() {
    if (!upgradesList) return;
    upgradesList.innerHTML = '';
    upgrades.forEach(upgrade => {
        try { // Добавим try-catch на случай ошибки в одном улучшении
            const element = createUpgradeElement(upgrade);
            upgradesList.appendChild(element);
        } catch (error) {
            console.error(`Ошибка рендеринга улучшения ${upgrade.id}:`, error);
        }
    });
    recalculateStats();
}

// Покупка улучшения
function buyUpgrade(id) {
    const upgrade = upgrades.find(u => u.id === id);
    if (!upgrade || (upgrade.maxLevel && upgrade.level >= upgrade.maxLevel)) return;

    const cost = calculateCost(upgrade);
    const buyButton = document.getElementById(`buy-${upgrade.id}`);

    if (score >= cost) {
        score -= cost;
        upgrade.level++;

        playSound('buy');
        triggerHapticFeedback('medium');

        const iconElement = document.querySelector(`#upgrade-${id} .upgrade-icon`);
        if (iconElement) {
             iconElement.classList.add('purchased');
             setTimeout(() => iconElement.classList.remove('purchased'), 400);
        }

        const oldElement = document.getElementById(`upgrade-${upgrade.id}`);
        if (oldElement) {
            try {
                const newElement = createUpgradeElement(upgrade);
                oldElement.replaceWith(newElement);
            } catch (error) {
                 console.error(`Ошибка перерисовки улучшения ${id}:`, error);
                 renderUpgrades(); // Полная перерисовка в случае ошибки
            }
        } else {
             renderUpgrades();
        }

        recalculateStats();
        // Сохранение происходит по интервалу
    } else {
       if (buyButton) { // Анимация "не хватает"
            buyButton.style.animation = 'shake 0.4s ease-in-out';
            setTimeout(() => { if(buyButton) buyButton.style.animation = ''; }, 400);
       }
    }
}

// Клик по пицце
function handlePizzaClick() {
    playSound('click');
    triggerHapticFeedback('light');

    const earnedPizzas = pizzasPerClick;
    score += earnedPizzas;
    totalPizzasEarned += earnedPizzas;
    totalClicks++;

    createPizzaParticle(pizzaButton);

    if (pizzaButton) {
        pizzaButton.classList.add('clicked');
        setTimeout(() => pizzaButton?.classList.remove('clicked'), 200);
    }

    updateScoreDisplay();
    updateStatsDisplays(); // Обновляем кнопки сразу
    checkAchievements();
}

// Создание частиц пиццы
function createPizzaParticle(targetElement) {
    if (!targetElement || !pizzaContainer) return;
    const particleCount = Math.min(5, Math.max(1, Math.floor(Math.log10(pizzasPerClick + 1))));
    const rect = targetElement.getBoundingClientRect();
    const containerRect = pizzaContainer.getBoundingClientRect();
    const startX = (rect.left + rect.width / 2) - containerRect.left;
    const startY = (rect.top + rect.height / 2) - containerRect.top;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'pizza-particle';
        particle.textContent = '🍕';
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;
        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * 40;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance - 40;
        particle.style.setProperty('--tx', `${endX}px`);
        particle.style.setProperty('--ty', `${endY}px`);
        pizzaContainer.appendChild(particle);
        setTimeout(() => particle.remove(), 700);
    }
}

// Авто-клик
function autoClick() {
    if (pizzasPerSecond > 0) {
        const earnedPizzas = pizzasPerSecond / 10; // 10 раз в секунду
        score += earnedPizzas;
        totalPizzasEarned += earnedPizzas;
        updateScoreDisplay(); // Обновляем только счет для производительности
        // updateStatsDisplays(); // Не нужно обновлять кнопки каждую 1/10 секунды
        checkAchievements(); // Проверяем ачивки
    }
}

// --- Достижения ---
function checkAchievements() {
    let changed = false;
    achievements.forEach(ach => {
        if (!ach.unlocked && ach.condition()) {
            ach.unlocked = true;
            showAchievementToast(ach);
            changed = true; // Флаг, что нужно перерисовать и сохранить
        }
    });
    if (changed) {
        renderAchievements();
        // Сохранение произойдет по таймеру
    }
}

function renderAchievements() {
    if (!achievementsList) return;
    achievementsList.innerHTML = '';
    achievements.forEach(ach => {
        const item = document.createElement('div');
        item.className = `achievement-item ${ach.unlocked ? 'unlocked' : ''}`;
        item.title = `${ach.name}\n${ach.description}${ach.unlocked ? ' (Получено!)' : ''}`;
        item.innerHTML = `<span class="achievement-icon">${ach.icon}</span>`;
        achievementsList.appendChild(item);
    });
    updateAchievementCounter();
}

function updateAchievementCounter() {
    if (!achievementCountDisplay) return;
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    achievementCountDisplay.textContent = `(${unlockedCount}/${achievements.length})`;
}

function showAchievementToast(achievement) {
    if (!achievementToast || !toastMessage) return;
    toastMessage.textContent = `Достижение: ${achievement.name}!`;
    achievementToast.classList.add('show');
    playSound('achievement');
    triggerHapticFeedback('success'); // Используем success фидбек, если доступен

    setTimeout(() => {
        achievementToast?.classList.remove('show');
    }, 3500);
}

// --- Золотая Пицца ---
function scheduleGoldenPizza() {
    clearTimeout(goldenPizzaTimeout);
    const delay = GOLDEN_PIZZA_MIN_INTERVAL + Math.random() * GOLDEN_PIZZA_RANDOM_INTERVAL;
    goldenPizzaTimeout = setTimeout(spawnGoldenPizza, delay);
}

function spawnGoldenPizza() {
    if (document.querySelector('.golden-pizza') || !interactiveArea) {
        scheduleGoldenPizza(); return;
    }
    const goldenPizza = document.createElement('div');
    goldenPizza.className = 'golden-pizza';
    goldenPizza.textContent = '🌟';
    const areaRect = interactiveArea.getBoundingClientRect();
    const pizzaSize = 35;
    const randomX = Math.random() * (areaRect.width - pizzaSize);
    const randomY = Math.random() * (areaRect.height - pizzaSize);
    goldenPizza.style.left = `${randomX}px`;
    goldenPizza.style.top = `${randomY}px`;
    goldenPizza.addEventListener('click', handleGoldenPizzaClick);
    interactiveArea.appendChild(goldenPizza);

    setTimeout(() => {
        goldenPizza?.remove();
        scheduleGoldenPizza();
    }, GOLDEN_PIZZA_DURATION);
}

function handleGoldenPizzaClick(event) {
    playSound('goldenPizza');
    triggerHapticFeedback('heavy');
    const goldenPizzaElement = event.target;
    const x = goldenPizzaElement.offsetLeft;
    const y = goldenPizzaElement.offsetTop;
    goldenPizzaElement.remove();

    const bonus = (pizzasPerSecond * 30) + (pizzasPerClick * 10) + 50;
    score += bonus;
    totalPizzasEarned += bonus;
    createBonusFeedback(x, y, bonus);
    updateScoreDisplay();
    updateStatsDisplays();
    checkAchievements();
    clearTimeout(goldenPizzaTimeout);
    scheduleGoldenPizza();
}

function createBonusFeedback(x, y, amount) {
    if (!interactiveArea) return;
    const feedback = document.createElement('div');
    feedback.className = 'click-feedback'; // Используем стиль click-feedback
    feedback.textContent = `+${formatNumber(amount)} 🍕!`;
    feedback.style.color = 'var(--color-golden-pizza)';
    feedback.style.fontSize = '1.5em'; // Немного крупнее
    feedback.style.left = `${x}px`;
    feedback.style.top = `${y}px`;
    feedback.style.textShadow = '0 0 4px black';
    feedback.style.position = 'absolute'; // Убедимся, что позиционирование абсолютное
    feedback.style.pointerEvents = 'none';
    feedback.style.animation = 'float-up 1.5s ease-out forwards'; // Дольше висит
    interactiveArea.appendChild(feedback);
    setTimeout(() => feedback.remove(), 1500);
}
// Добавим анимацию float-up, если ее нет (на всякий случай)
try {
    const styleSheet = document.styleSheets[0];
    if (![...styleSheet.cssRules].some(rule => rule.name === 'float-up')) {
        styleSheet.insertRule(`
        @keyframes float-up {
            0% { opacity: 1; transform: translate(-50%, 0) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -60px) scale(0.8); }
        }`, styleSheet.cssRules.length);
    }
} catch (e) { console.error("Failed to insert CSS rule:", e)}

// --- Сохранение / Загрузка / Сброс ---
function saveGame() {
    const gameState = {
        score: score,
        totalPizzasEarned: totalPizzasEarned,
        totalClicks: totalClicks,
        upgradeLevels: upgrades.map(u => ({ id: u.id, level: u.level })),
        achievementsUnlocked: achievements.filter(a => a.unlocked).map(a => a.id)
    };
    const stateString = JSON.stringify(gameState);

    if (tg?.CloudStorage?.setItem) {
        tg.CloudStorage.setItem(CLOUD_STORAGE_KEY, stateString, (error, stored) => {
            if (error) console.error('CloudStorage setItem Error:', error);
            // else if (stored) console.log("Игра сохранена в CloudStorage.");
            // else console.log("CloudStorage: Данные не изменились или не сохранены.");
        });
    } else {
        try {
            localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, stateString);
            // console.log("Игра сохранена локально (Fallback).");
        } catch (e) { console.error("Ошибка сохранения в localStorage:", e); }
    }
}

// Асинхронная загрузка
function loadGame(callback) {
    if (tg?.CloudStorage?.getItem) {
        tg.CloudStorage.getItem(CLOUD_STORAGE_KEY, (error, value) => {
            if (error) {
                console.error('CloudStorage getItem Error:', error);
                loadFromLocalStorage(callback); // Пытаемся загрузить из localStorage при ошибке
            } else if (value) {
                console.log("Загрузка из Telegram CloudStorage...");
                parseAndLoadState(value, callback);
            } else {
                console.log("Сохранение в CloudStorage не найдено.");
                loadFromLocalStorage(callback); // Пытаемся из localStorage, если в облаке пусто
            }
        });
    } else {
        loadFromLocalStorage(callback); // Загрузка из localStorage, если нет CloudStorage
    }
}

function loadFromLocalStorage(callback) {
    console.log("Попытка загрузки из LocalStorage (Fallback)...");
    try {
        const savedState = localStorage.getItem(LOCAL_STORAGE_FALLBACK_KEY);
        if (savedState) {
             parseAndLoadState(savedState, callback);
        } else {
             console.log("Локальное сохранение не найдено, начало новой игры.");
             resetGameLogic();
             callback(); // Важно вызвать callback даже при новой игре
        }
     } catch (e) {
          console.error("Ошибка чтения из localStorage:", e);
          resetGameLogic();
          callback(); // Продолжаем при ошибке
     }
}

function parseAndLoadState(jsonState, callback) {
    try {
        const gameState = JSON.parse(jsonState);
        score = gameState.score || 0;
        totalPizzasEarned = gameState.totalPizzasEarned || 0;
        totalClicks = gameState.totalClicks || 0;

        if (gameState.upgradeLevels) {
            upgrades.forEach(gameUpgrade => {
                const saved = gameState.upgradeLevels.find(s => s.id === gameUpgrade.id);
                gameUpgrade.level = saved ? (saved.level || 0) : 0;
            });
        } else { // Если старый формат сохранения без upgradeLevels
            upgrades.forEach(u => u.level = 0);
        }

        if (gameState.achievementsUnlocked) {
             achievements.forEach(ach => {
                ach.unlocked = gameState.achievementsUnlocked.includes(ach.id);
             });
        } else {
             achievements.forEach(a => a.unlocked = false);
        }
        console.log("Состояние игры успешно загружено.");
    } catch (error) {
        console.error("Ошибка парсинга или применения состояния:", error);
        alert("Не удалось загрузить сохранение. Начинаем новую игру.");
        resetGameLogic(); // Сбрасываем при ошибке парсинга
    } finally {
        callback(); // Вызываем callback в любом случае
    }
}

// Логика сброса
function resetGameLogic() {
    score = 0;
    totalPizzasEarned = 0;
    totalClicks = 0;
    upgrades.forEach(u => u.level = 0);
    achievements.forEach(a => a.unlocked = false);
    clearTimeout(goldenPizzaTimeout);
    document.querySelector('.golden-pizza')?.remove();
    // Останавливаем интервалы перед перезапуском
    clearInterval(autoClickIntervalId);
    clearInterval(saveGameIntervalId);
}

// Сброс с подтверждением
function resetGameConfirm() {
    triggerHapticFeedback('warning'); // Предупреждающий фидбек
    if (confirm("Вы уверены, что хотите сбросить весь прогресс? Это действие необратимо!")) {
        triggerHapticFeedback('heavy');
        resetGameLogic();

        // Очищаем хранилища
        if (tg?.CloudStorage?.removeItem) {
            tg.CloudStorage.removeItem(CLOUD_STORAGE_KEY, (err, removed) => {
                 if (err) console.error("CloudStorage removeItem error:", err);
                 else console.log("CloudStorage очищено.");
            });
        }
        try { localStorage.removeItem(LOCAL_STORAGE_FALLBACK_KEY); } catch(e){}
        console.log("Прогресс сброшен.");

        // Перерисовываем и перезапускаем циклы
        renderUpgrades();
        renderAchievements();
        updateScoreDisplay();
        updateStatsDisplays(); // Важно обновить все сразу после сброса
        scheduleGoldenPizza(); // Начинаем отсчет для золотой пиццы
        startGameLoops(); // Перезапускаем интервалы
    }
}

// Запуск игровых циклов
function startGameLoops() {
    // Очищаем старые интервалы на всякий случай
    clearInterval(autoClickIntervalId);
    clearInterval(saveGameIntervalId);

    autoClickIntervalId = setInterval(autoClick, 100);
    saveGameIntervalId = setInterval(saveGame, 15000); // Сохраняем каждые 15 сек
}

// --- Инициализация игры ---
function initGame() {
    console.log("Инициализация игры...");
    // 1. Настройка интеграции с ТГ (синхронно)
    setupTelegramIntegration();

    // 2. Добавление слушателей (синхронно)
    if (pizzaButton) pizzaButton.addEventListener('click', handlePizzaClick);
    else console.error("Кнопка пиццы не найдена!");

    if (resetButton) resetButton.addEventListener('click', resetGameConfirm);
    else console.error("Кнопка сброса не найдена!");

    // Добавляем слушатель для активации аудио контекста при первом тапе/клике
     document.body.addEventListener('pointerdown', () => {
         if (!audioContextStarted) playSound('click'); // Пробный звук
     }, { once: true });


    // 3. Асинхронная загрузка данных
    loadGame(() => {
        // ЭТОТ КОД ВЫПОЛНИТСЯ ПОСЛЕ ЗАГРУЗКИ ДАННЫХ
        console.log("Данные загружены, рендеринг интерфейса...");
        // 4. Первичная отрисовка интерфейса (синхронно внутри callback)
        renderUpgrades();
        renderAchievements();
        updateScoreDisplay(); // Первичная установка счета (CountUp инициализируется здесь)
        updateStatsDisplays(); // Первичная установка статов и доступности кнопок

        // 5. Запуск игровых циклов и золотой пиццы (после отрисовки)
        startGameLoops();
        scheduleGoldenPizza();

        console.log("Игра полностью инициализирована и запущена.");
    });
}

// Запускаем игру после загрузки DOM
document.addEventListener('DOMContentLoaded', initGame);
