document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready(); // Сообщаем ТГ, что приложение готово
    tg.expand(); // Растягиваем на весь экран

    // --- Элементы UI ---
    const balanceElement = document.getElementById('player-balance');
    const totalHashrateElement = document.getElementById('total-hashrate');
    const totalPowerElement = document.getElementById('total-power');
    const userNameElement = document.getElementById('user-name');
    const mainHashrateElement = document.getElementById('main-hashrate');
    const mainPowerElement = document.getElementById('main-power');
    const collectButton = document.getElementById('collect-button');
    const collectAmountElement = document.getElementById('collect-amount');

    const screens = document.querySelectorAll('.screen');
    const navButtons = document.querySelectorAll('.nav-button');

    const shopItemsContainer = document.getElementById('shop-items');
    const marketItemsBuyContainer = document.getElementById('market-items-buy');
    // ... другие контейнеры

    const rigSlotsContainer = document.getElementById('rig-slots');

    // --- Игровые данные ---

    // Определения компонентов (пример)
    const componentData = {
        gpus: [
            { id: 'gpu1', name: 'Старая карта', price: 100, hashrate: 10, power: 50, type: 'gpu' },
            { id: 'gpu2', name: 'Игровая карта', price: 500, hashrate: 60, power: 120, type: 'gpu' },
            { id: 'gpu3', name: 'Профи Майнер', price: 2000, hashrate: 250, power: 200, type: 'gpu' },
        ],
        psus: [
             { id: 'psu1', name: 'Слабый БП', price: 50, capacity: 200, type: 'psu' },
             { id: 'psu2', name: 'Надежный БП', price: 150, capacity: 600, type: 'psu' },
             { id: 'psu3', name: 'Мощный БП', price: 400, capacity: 1200, type: 'psu' },
        ],
        // ... motherboards, cooling, etc.
    };

    // Состояние игры (загрузка/сохранение)
    let gameState = {
        balance: 150,
        rig: {
            slots: Array(8).fill(null), // Пример: 8 слотов в ферме
            psu: null, // Установленный блок питания
            // motherboard: null, // Установленная мат. плата (может определять кол-во слотов)
        },
        inventory: [ // Предметы не в ферме
             // { id: 'gpu1', name: 'Старая карта', ... }
        ],
        minedAmount: 0, // Накоплено с последнего сбора
        lastUpdate: Date.now(),
        // ... улучшения, статистика ...
    };

    // --- Функции ---

    // Сохранение и загрузка состояния (используем localStorage для простоты)
    function saveGame() {
        localStorage.setItem('cryptoBaronGameState', JSON.stringify(gameState));
         console.log("Game Saved");
    }

    function loadGame() {
        const savedState = localStorage.getItem('cryptoBaronGameState');
        if (savedState) {
            gameState = JSON.parse(savedState);
            // Важно: пересчитать накопленное за время оффлайна
            const timeOffline = (Date.now() - (gameState.lastUpdate || Date.now())) / 1000; // в секундах
            const offlineEarnings = calculateHashrate() * timeOffline / 10; // Примерный расчет
            gameState.minedAmount = (gameState.minedAmount || 0) + offlineEarnings;
             console.log(`Loaded game. Offline for ${Math.round(timeOffline)}s, earned ${Math.round(offlineEarnings)}`);
        } else {
             // Инициализация новой игры, если сохранений нет
             // Можно выдать стартовый предмет
             gameState.inventory.push({...componentData.gpus[0]}); // Даем стартовую карту в инвентарь
        }
        gameState.lastUpdate = Date.now(); // Обновляем время последнего апдейта
    }

    // Расчет общего хешрейта и мощности фермы
    function calculateRigStats() {
        let currentHashrate = 0;
        let currentPower = 0;
        gameState.rig.slots.forEach(item => {
            if (item && item.type === 'gpu') {
                currentHashrate += item.hashrate;
                currentPower += item.power;
            }
            // Добавить расчет мощности других компонентов
        });
         // Проверка мощности БП
         if (gameState.rig.psu && currentPower > gameState.rig.psu.capacity) {
             // Штраф или отключение части карт, если мощности не хватает
             // Для простоты пока просто покажем превышение, но хешрейт не будем резать
              console.warn(`Power limit exceeded! ${currentPower}W / ${gameState.rig.psu.capacity}W`);
              // Можно добавить визуальный индикатор перегрузки
         }
        return { hashrate: currentHashrate, power: currentPower };
    }
     function calculateHashrate() {
         return calculateRigStats().hashrate;
     }
     function calculatePower() {
          return calculateRigStats().power;
     }


    // Обновление UI
    function updateUI() {
        const { hashrate, power } = calculateRigStats();

        balanceElement.textContent = Math.floor(gameState.balance).toLocaleString();
        totalHashrateElement.textContent = hashrate.toLocaleString();
        totalPowerElement.textContent = power.toLocaleString();
        mainHashrateElement.textContent = hashrate.toLocaleString();
        mainPowerElement.textContent = power.toLocaleString();

        // Отображение имени пользователя ТГ (если доступно)
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            userNameElement.textContent = tg.initDataUnsafe.user.first_name || 'User';
        }

        // Обновление кнопки сбора
        collectAmountElement.textContent = Math.floor(gameState.minedAmount).toLocaleString();
        collectButton.disabled = gameState.minedAmount < 1;

        // Обновление слотов фермы
        renderRigSlots();

        // Обновление магазина (можно вызывать реже, при переходе на экран)
        // renderShop();
        // Обновление инвентаря
        // renderInventory();
        // Обновление рынка
        // renderMarket();
         // Обновление улучшений
        // renderUpgrades();

        // Применение стилей темы ТГ (пример)
        document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
        document.body.style.color = tg.themeParams.text_color || '#000000';
        // ... и для других элементов
    }

    // Рендер слотов фермы
    function renderRigSlots() {
        rigSlotsContainer.innerHTML = ''; // Очистить старые слоты
        gameState.rig.slots.forEach((item, index) => {
            const slot = document.createElement('div');
            slot.classList.add('slot');
            slot.dataset.index = index;

            if (item) {
                slot.classList.add('filled');
                 // Добавить информацию о карте
                 slot.innerHTML = `
                     <div class="slot-item-name">${item.name}</div>
                     <div class="slot-item-stats">⚡️ ${item.hashrate} H/s</div>
                     <div class="slot-item-stats">🔌 ${item.power} W</div>
                     <button class="action-button remove-from-rig-button" data-index="${index}" style="font-size: 0.7rem; padding: 3px 6px; margin-top: 5px; width: auto;">Убрать</button>
                 `;
            } else {
                slot.textContent = 'Пустой слот';
            }
            // Добавить обработчик клика для установки/замены карты
             slot.addEventListener('click', () => handleSlotClick(index));
            rigSlotsContainer.appendChild(slot);
        });

         // Обработчики для кнопок удаления из слота
         document.querySelectorAll('.remove-from-rig-button').forEach(button => {
             button.addEventListener('click', (event) => {
                 event.stopPropagation(); // Предотвратить срабатывание клика по слоту
                 const index = parseInt(event.target.dataset.index);
                 removeFromRig(index);
             });
         });
    }


     // Обработчик клика по слоту (для установки)
     function handleSlotClick(index) {
         if (gameState.rig.slots[index]) {
              console.log(`Slot ${index} is already filled with ${gameState.rig.slots[index].name}`);
              // Можно добавить опцию "Заменить"
              return;
         }

         // Показать окно/список выбора из инвентаря
         showInventoryForInstallation(index);
     }

     // Показать инвентарь для установки в слот
     function showInventoryForInstallation(slotIndex) {
          // TODO: Реализовать UI для выбора GPU из gameState.inventory
          // Пока просто выведем в консоль и установим первый подходящий
         const suitableGPU = gameState.inventory.find(item => item.type === 'gpu');
         if (suitableGPU) {
             console.log(`Предлагаем установить ${suitableGPU.name} в слот ${slotIndex}`);
             // Пример установки (нужно сделать через UI)
              if (confirm(`Установить ${suitableGPU.name} в слот ${slotIndex}?`)) {
                  installToRig(suitableGPU.id, slotIndex); // Нужен уникальный ID экземпляра, если карты одинаковые
              }
         } else {
             alert("Нет подходящих видеокарт в инвентаре!");
              console.log("Нет подходящих видеокарт в инвентаре для установки.");
         }
     }


    // Установка компонента в риг
    function installToRig(inventoryItemId, slotIndex) {
        // Найти предмет в инвентаре (нужна доработка для уникальных ID экземпляров, если покупаем одинаковые)
        const itemIndex = gameState.inventory.findIndex(item => item.id === inventoryItemId); // Упрощенно ищем по id модели
        if (itemIndex === -1) {
            console.error("Предмет не найден в инвентаре!");
            return;
        }
         const itemToInstall = gameState.inventory[itemIndex];

         // Проверка типа слота (если есть разные типы) и типа компонента
        if (itemToInstall.type !== 'gpu') { // Пока только GPU ставим в основные слоты
            alert("Этот компонент нельзя установить сюда.");
            return;
        }


        // Если слот занят, сначала переместить старый предмет в инвентарь
        if (gameState.rig.slots[slotIndex]) {
             const oldItem = gameState.rig.slots[slotIndex];
             gameState.inventory.push(oldItem);
        }

        // Переместить предмет из инвентаря в слот
         gameState.rig.slots[slotIndex] = itemToInstall;
         gameState.inventory.splice(itemIndex, 1); // Удалить из инвентаря

         console.log(`${itemToInstall.name} установлен в слот ${slotIndex}`);
        updateUI();
        saveGame();
    }

    // Удаление компонента из рига
    function removeFromRig(slotIndex) {
         const itemToRemove = gameState.rig.slots[slotIndex];
         if (!itemToRemove) {
              console.error("Слот уже пуст!");
              return;
         }

         // Переместить предмет из слота в инвентарь
         gameState.inventory.push(itemToRemove);
         gameState.rig.slots[slotIndex] = null;

         console.log(`${itemToRemove.name} убран из слота ${slotIndex} в инвентарь`);
         updateUI();
         saveGame();
    }


    // Рендер магазина
    function renderShop() {
        shopItemsContainer.innerHTML = '';
        // Объединяем все типы компонентов для отображения
        const allItems = [...componentData.gpus, ...componentData.psus /*, ... другие типы */];

        allItems.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('item-card');
            card.innerHTML = `
                <h3>${item.name}</h3>
                ${item.type === 'gpu' ? `<p>⚡️ ${item.hashrate} H/s</p><p>🔌 ${item.power} W</p>` : ''}
                 ${item.type === 'psu' ? `<p>💡 ${item.capacity} W</p>` : ''}
                <p class="price">💰 ${item.price.toLocaleString()}</p>
                <button class="buy-button" data-item-id="${item.id}" data-item-type="${item.type}">Купить</button>
            `;
            shopItemsContainer.appendChild(card);
        });

        // Добавить обработчики на кнопки покупки
        shopItemsContainer.querySelectorAll('.buy-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.target.dataset.itemId;
                const itemType = e.target.dataset.itemType; // 'gpu', 'psu' и т.д.
                buyItem(itemId, itemType);
            });
        });
    }

     // Рендер инвентаря
     function renderInventory() {
         const inventoryContainer = document.getElementById('inventory-items');
         inventoryContainer.innerHTML = ''; // Очистка

         if (gameState.inventory.length === 0) {
             inventoryContainer.innerHTML = '<p>Инвентарь пуст.</p>';
             return;
         }

         gameState.inventory.forEach((item, index) => { // Используем index как временный уникализатор
             const card = document.createElement('div');
             card.classList.add('item-card');
             card.innerHTML = `
                 <h3>${item.name}</h3>
                 ${item.type === 'gpu' ? `<p>⚡️ ${item.hashrate} H/s</p><p>🔌 ${item.power} W</p>` : ''}
                 ${item.type === 'psu' ? `<p>💡 ${item.capacity} W</p>` : ''}
                 <!-- Добавить кнопку "Продать на рынке" или "Установить" -->
                 <button class="action-button sell-on-market-prep" data-inventory-index="${index}" style="font-size: 0.8rem; padding: 5px 8px; margin-top: 8px; background-color: #ff9800;">Выставить на рынок</button>
             `;
             inventoryContainer.appendChild(card);
         });

         // Обработчики для кнопок "Выставить на рынок" (добавить позже)
     }

     // Рендер рынка (симуляция)
     function renderMarket() {
         // Симуляция лотов на покупку
         marketItemsBuyContainer.innerHTML = '';
         const marketGpus = componentData.gpus.slice(0, 2).map(gpu => ({
             ...gpu,
             // Симулируем Б/У состояние и цену
             price: Math.floor(gpu.price * (0.6 + Math.random() * 0.3)), // 60-90% от новой цены
             seller: `Player${Math.floor(Math.random()*1000)}` // Случайный продавец
         }));
         marketGpus.forEach(item => {
              const card = document.createElement('div');
              card.classList.add('item-card');
              card.innerHTML = `
                 <h3>${item.name} (Б/У)</h3>
                 <p>⚡️ ${item.hashrate} H/s</p><p>🔌 ${item.power} W</p>
                 <p>Продавец: ${item.seller}</p>
                 <p class="price">💰 ${item.price.toLocaleString()}</p>
                 <button class="buy-button market-buy-button" data-item-id="${item.id}" data-price="${item.price}">Купить</button>
              `;
              marketItemsBuyContainer.appendChild(card);
         });
          // TODO: Добавить обработчики для кнопок покупки с рынка
          // TODO: Реализовать вкладку "Продать" (листинг своих предметов)
     }

      // Рендер улучшений (пример)
      function renderUpgrades() {
          const upgradeList = document.getElementById('upgrade-list');
          upgradeList.innerHTML = ''; // Очистка

          // Пример данных об улучшениях
          const availableUpgrades = [
              { id: 'eff1', name: 'Эффективный майнинг I', description: '-5% потребления энергии', cost: 1000, level: gameState.upgrades?.eff1 || 0 },
              { id: 'hash1', name: 'Оптимизация алгоритма I', description: '+5% хешрейта', cost: 1500, level: gameState.upgrades?.hash1 || 0 },
          ];

          availableUpgrades.forEach(upg => {
              const currentLevel = upg.level;
              // Можно усложнить - стоимость и эффект растут с уровнем
              const currentCost = upg.cost * Math.pow(2, currentLevel);
              const card = document.createElement('div');
              card.classList.add('upgrade-card');
               card.innerHTML = `
                  <h3>${upg.name} (Ур. ${currentLevel})</h3>
                  <p>${upg.description}</p>
                  <p class="cost">💰 ${currentCost.toLocaleString()}</p>
                  <button class="upgrade-button" data-upgrade-id="${upg.id}" ${gameState.balance < currentCost ? 'disabled' : ''}>Улучшить</button>
               `;
               upgradeList.appendChild(card);
          });

            // TODO: Обработчики для кнопок улучшений
      }


    // Покупка предмета в магазине
    function buyItem(itemId, itemType) {
        const itemData = componentData[itemType + 's']?.find(i => i.id === itemId); // gpu -> gpus, psu -> psus
        if (!itemData) {
            console.error("Предмет не найден в данных магазина!");
            return;
        }

        if (gameState.balance >= itemData.price) {
            gameState.balance -= itemData.price;
             // Добавляем КОПИЮ предмета в инвентарь
             // В реальной игре нужен уникальный ID для каждого экземпляра
             gameState.inventory.push({ ...itemData });
             console.log(`Куплен ${itemData.name}`);
             tg.HapticFeedback.notificationOccurred('success'); // Виброотклик ТГ
            updateUI();
             renderInventory(); // Обновить отображение инвентаря
            saveGame();
        } else {
            console.log("Недостаточно средств!");
             tg.HapticFeedback.notificationOccurred('error');
            alert("Недостаточно BitCoinz!");
        }
    }

    // Сбор намайненного
    function collectMined() {
        if (gameState.minedAmount >= 1) {
            const collected = Math.floor(gameState.minedAmount);
            gameState.balance += collected;
            gameState.minedAmount -= collected; // Вычитаем только целую часть
             console.log(`Собрано ${collected} BitCoinz`);
             tg.HapticFeedback.impactOccurred('light');
            updateUI();
            saveGame();
        }
    }

    // Игровой цикл (обновление майнинга)
    function gameLoop() {
        const now = Date.now();
        const deltaTime = (now - gameState.lastUpdate) / 1000; // время в секундах с прошлого обновления

        const currentHashrate = calculateHashrate();
         // Начисляем монеты (например, 1 H/s = 0.1 BitCoinz в секунду, для баланса)
        const earnings = currentHashrate * deltaTime * 0.1;
        gameState.minedAmount += earnings;

        // TODO: Вычитать стоимость электричества, если реализовано

        gameState.lastUpdate = now;

        // Обновляем только то, что меняется часто (кнопка сбора)
        collectAmountElement.textContent = Math.floor(gameState.minedAmount).toLocaleString();
        collectButton.disabled = gameState.minedAmount < 1;

         // Периодическое сохранение
         // if (Math.random() < 0.1) saveGame(); // Например, сохранять раз в ~10 секунд в среднем
    }

    // Навигация между экранами
    function switchScreen(screenId) {
        screens.forEach(screen => screen.classList.remove('active'));
        navButtons.forEach(button => button.classList.remove('active'));

        const targetScreen = document.getElementById(`screen-${screenId}`);
        const targetButton = document.querySelector(`.nav-button[data-screen="${screenId}"]`);

        if (targetScreen) targetScreen.classList.add('active');
        if (targetButton) targetButton.classList.add('active');

         // Перерисовываем содержимое экрана при переключении (если нужно)
         if (screenId === 'shop') renderShop();
         if (screenId === 'inventory') renderInventory();
         if (screenId === 'market') renderMarket();
         if (screenId === 'upgrades') renderUpgrades();
         if (screenId === 'main') renderRigSlots(); // Обновляем слоты при возврате на главный

         console.log(`Switched to screen: ${screenId}`);
    }

    // --- Инициализация ---
    loadGame(); // Загружаем прогресс

    // Привязка событий к кнопкам навигации
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            switchScreen(button.dataset.screen);
        });
    });

     // Привязка событий к кнопкам рынка (табы)
     document.querySelectorAll('.tab-button').forEach(button => {
         button.addEventListener('click', () => {
             const tabId = button.dataset.marketTab; // 'buy' or 'sell'
             // Убираем active со всех табов и контентов
             document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
             document.querySelectorAll('.market-tab-content').forEach(content => content.classList.remove('active'));
             // Активируем нужный таб и контент
             button.classList.add('active');
             document.getElementById(`market-items-${tabId}`).classList.add('active');
         });
     });

    // Кнопка сбора
    collectButton.addEventListener('click', collectMined);

    // Запуск игрового цикла (каждую секунду)
    setInterval(gameLoop, 1000);

    // Первоначальное отображение UI
    updateUI();
     switchScreen('main'); // Начинаем с главного экрана

     // Периодическое автосохранение
     setInterval(saveGame, 30000); // Сохранять каждые 30 секунд
});
