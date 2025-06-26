document.addEventListener("DOMContentLoaded", function() {
  console.log('🚀 Скрипт запущен');
  
  const hostCard = document.querySelector('.server-card');
  console.log('Найдена карточка сервера:', !!hostCard);
  
  if (!hostCard) {
    console.error('❌ Карточка сервера не найдена');
    return;
  }

  const hostId = hostCard.dataset.hostId;
  console.log('Host ID:', hostId);
  
  if (!hostId) {
    console.error('❌ Host ID не найден');
    return;
  }

  const configStatusEl = hostCard.querySelector('.config-status');
  const statusTextEl = configStatusEl.querySelector('.status-text');
  
  const buttons = {
    toggle: hostCard.querySelector('.toggle-btn'),
    restore: hostCard.querySelector('.restore-btn'),
    fastPull: hostCard.querySelector('.fast-pull-btn'),
    pullReload: hostCard.querySelector('.pull-reload-btn')
  };

  const wsUrl = `ws://${window.location.host}/ws/core/${hostId}/`;
  console.log('🔗 Подключаемся к WebSocket:', wsUrl);
  
  const socket = new WebSocket(wsUrl);
  const alertsContainer = document.getElementById('liveAlerts');

  // ⬛ Overlay spinner
  let overlay = document.createElement('div');
  overlay.className = 'card-overlay d-none';
  overlay.innerHTML = `
    <div class="overlay-content text-center text-white">
      <div class="spinner-border spinner-border-lg mb-2" role="status"></div>
      <div class="overlay-message fw-semibold">Загрузка...</div>
    </div>
  `;
  hostCard.style.position = 'relative'; // Важно для позиционирования overlay
  hostCard.appendChild(overlay);

  function showOverlay(message = 'Загрузка...') {
    overlay.querySelector('.overlay-message').textContent = message;
    overlay.classList.remove('d-none');
  }

  function hideOverlay() {
    overlay.classList.add('d-none');
  }

  // 💬 Показываем только config-status со спиннером и сообщением
  function showSpinner(message) {
    console.log('🔄 Показываем спиннер:', message);

    // Убираем цветовые классы
    configStatusEl.className = 'config-status text-center p-2 rounded mb-3';
    
    // Удаляем старый спиннер
    let spinner = configStatusEl.querySelector('.spinner-border');
    if (spinner) spinner.remove();

    // Добавляем спиннер
    spinner = document.createElement('div');
    spinner.className = 'spinner-border spinner-border-sm me-2';
    spinner.setAttribute('role', 'status');
    spinner.innerHTML = '<span class="visually-hidden">Загрузка...</span>';
    configStatusEl.insertBefore(spinner, statusTextEl);

    statusTextEl.textContent = message;
  }

  function updateConfigStatus(status) {
    console.log('📊 Обновляем статус:', status);
    if (!status) return;

    statusTextEl.textContent = status;
    configStatusEl.className = 'config-status text-center p-2 rounded mb-3';

    // 🔻 Убираем спиннер, если операция не в процессе
    if (!operationInProgress) {
      const spinner = configStatusEl.querySelector('.spinner-border');
      if (spinner) spinner.remove();
    }

    if (status.includes("тестовая")) {
      configStatusEl.classList.add("bg-warning", "text-dark");
    } else if (status.includes("продакшн")) {
      configStatusEl.classList.add("bg-success", "text-white");
    } else {
      configStatusEl.classList.add("bg-secondary", "text-white");
    }
  }

  function showAlert(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertsContainer.appendChild(alert);
    
    setTimeout(() => {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), 150);
    }, 5000);
  }

  let operationInProgress = false;

  socket.onopen = function() {
    console.log('✅ WebSocket подключен');
    socket.send(JSON.stringify({action: 'get_status'}));
  };

  socket.onmessage = function(event) {
    try {
      const data = JSON.parse(event.data);
      console.log("📨 WebSocket сообщение:", data);

      if (data.config_status) {
        updateConfigStatus(data.config_status);
      }

      const actionMap = {
        toggle_started:  ['info', 'Начато переключение MongoDB', 'Переключение базы...'],
        restore_started: ['info', 'Начато восстановление дампа PG', 'Восстановление дампа...'],
        fast_pull_started: ['info', 'Начат git pull', 'Выполняется git pull...'],
        pull_with_reload_started: ['info', 'Начат Pull + Reload', 'Pull + Reload...'],

        toggle_completed: ['success', 'База успешно переключена', null],
        restore_completed: ['success', 'Дамп PG успешно восстановлен', null],
        fast_pull_completed: ['success', 'Git pull выполнен успешно', null],
        pull_with_reload_completed: ['success', 'Pull + Reload выполнен успешно', null],

        toggle_failed: ['danger', 'Ошибка переключения', null],
        restore_failed: ['danger', 'Ошибка восстановления', null],
        fast_pull_failed: ['danger', 'Ошибка git pull', null],
        pull_with_reload_failed: ['danger', 'Ошибка Pull + Reload', null]
      };

      const actionData = actionMap[data.action];
      if (actionData) {
        const [type, msg, spinnerText] = actionData;
        showAlert(type, data.error ? `${msg}: ${data.error}` : msg);

        if (spinnerText) {
          operationInProgress = true;
          showOverlay(spinnerText);
          showSpinner(spinnerText);
          disableButtons();
        } else {
          operationInProgress = false;
          hideOverlay();

          // ✅ Удаляем спиннер явно после завершения операции
          const spinner = configStatusEl.querySelector('.spinner-border');
          if (spinner) spinner.remove();

          enableButtons();
        }
      }
    } catch (e) {
      console.error("❌ Ошибка обработки сообщения:", e);
    }
  };

  socket.onerror = function(error) {
    console.error('🚨 WebSocket ошибка:', error);
    showAlert('danger', 'Ошибка соединения с сервером');
    updateConfigStatus('Ошибка соединения');
    hideOverlay();
    enableButtons();
  };

  socket.onclose = function(event) {
    console.log('❌ WebSocket закрыт:', event.code, event.reason);
    if (event.code !== 1000) {
      updateConfigStatus('Соединение потеряно');
    }
    hideOverlay();
    enableButtons();
  };

  // Если хочешь таймаут, добавь так, чтобы он не мешал операции:
  /*
  setTimeout(() => {
    if (operationInProgress) return;

    const spinner = configStatusEl.querySelector('.spinner-border');
    if (spinner) {
      console.log('⏰ Таймаут ожидания статуса');
      updateConfigStatus('Не удалось получить статус');
      hideOverlay();
    }
  }, 10000);
  */

  function disableButtons() {
    Object.values(buttons).forEach(btn => {
      if (btn) btn.disabled = true;
    });
  }

  function enableButtons() {
    Object.values(buttons).forEach(btn => {
      if (btn) btn.disabled = false;
    });
  }

  if (buttons.toggle) {
    buttons.toggle.addEventListener('click', function() {
      if (confirm("Вы уверены, что хотите переключить базу данных?")) {
        disableButtons();
        showOverlay('Отправка команды...');
        showSpinner('Отправка команды...');
        socket.send(JSON.stringify({action: 'toggle_mongo'}));
      }
    });
  }

  if (buttons.restore) {
    buttons.restore.addEventListener('click', function() {
      if (confirm("Вы уверены, что хотите накатить дамп PG?")) {
        disableButtons();
        showOverlay('Отправка команды...');
        showSpinner('Отправка команды...');
        socket.send(JSON.stringify({action: 'restore_backup'}));
      }
    });
  }

  if (buttons.fastPull) {
    buttons.fastPull.addEventListener('click', function() {
      if (confirm("Вы уверены, что хотите выполнить быстрый git pull?")) {
        disableButtons();
        showOverlay('Отправка команды...');
        showSpinner('Отправка команды...');
        socket.send(JSON.stringify({action: 'fast_pull'}));
      }
    });
  }

  if (buttons.pullReload) {
    buttons.pullReload.addEventListener('click', function() {
      if (confirm("Вы уверены, что хотите выполнить git pull с redeploy?")) {
        disableButtons();
        showOverlay('Отправка команды...');
        showSpinner('Отправка команды...');
        socket.send(JSON.stringify({action: 'pull_with_reload'}));
      }
    });
  }
});
