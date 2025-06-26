document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll('.server-card').forEach(function(card) {
    const hostId = card.dataset.hostId;
    const configStatusEl = card.querySelector('.config-status');
    const toggleBtn = card.querySelector('.toggle-btn');
    const restoreBtn = card.querySelector('.restore-btn');
    const fastPullBtn = card.querySelector('.fast-pull-btn');
    const pullReloadBtn = card.querySelector('.pull-reload-btn');
    const socket = new WebSocket(`ws://${window.location.host}/ws/core/${hostId}/`);
    
    // Привязываем карточку к сокету для доступа в обработчиках
    socket.card = card;

    function showGlobalSpinner(message) {
      hideGlobalSpinner();
    
      const spinnerHtml = `
        <div class="global-spinner position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="background: rgba(255,255,255,0.8); z-index: 10;">
          <div class="text-center">
            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
              <span class="visually-hidden">Загрузка...</span>
            </div>
            <div class="spinner-message mt-2">${message}</div>
          </div>
        </div>
      `;
    
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = spinnerHtml;
      const spinnerEl = tempDiv.firstElementChild;
    
      if (spinnerEl) {
        // Добавляем спиннер в саму карточку
        card.style.position = 'relative'; // нужно для absolute overlay
        card.appendChild(spinnerEl);
      }
    }
    
    function hideGlobalSpinner() {
      const spinner = card.querySelector('.global-spinner');
      if (spinner) spinner.remove();
    }

    function showAlert(type, message) {
      const alertDiv = document.createElement('div');
      alertDiv.className = `alert alert-${type} mt-2 p-2`;
      alertDiv.textContent = message;
      card.querySelector('.card-footer').appendChild(alertDiv);
      
      // Автоскрытие через 5 секунд
      setTimeout(() => alertDiv.remove(), 5000);
    }

    function updateConfigStatus(status) {
      configStatusEl.innerHTML = status;
      if (status.includes("тестовая")) {
        configStatusEl.className = "config-status text-center p-2 rounded bg-warning text-dark";
      } else if (status.includes("продакшн")) {
        configStatusEl.className = "config-status text-center p-2 rounded bg-success text-white";
      } else {
        configStatusEl.className = "config-status text-center p-2 rounded bg-secondary text-white";
      }
    }

    function enableButtons() {
      if (toggleBtn) toggleBtn.disabled = false;
      if (restoreBtn) restoreBtn.disabled = false;
      if (fastPullBtn) fastPullBtn.disabled = false;
      if (pullReloadBtn) pullReloadBtn.disabled = false;
    }

    function disableButtons() {
      if (toggleBtn) toggleBtn.disabled = true;
      if (restoreBtn) restoreBtn.disabled = true;
      if (fastPullBtn) fastPullBtn.disabled = true;
      if (pullReloadBtn) pullReloadBtn.disabled = true;
    }

    socket.onmessage = function(event) {
      const data = JSON.parse(event.data);
      console.log("WebSocket message:", data); 
      
      // Обработка начала операций
      if (data.action === 'toggle_started') {
        showGlobalSpinner('Переключение MongoDB...');
        return;
      }
      
      if (data.action === 'restore_started') {
        showGlobalSpinner('Восстановление дампа PG...');
        return;
      }
      
      if (data.action === 'fast_pull_started') {
        showGlobalSpinner('Выполнение git pull...');
        return;
      }
      
      if (data.action === 'pull_with_reload_started') {
        showGlobalSpinner('Pull + Reload...');
        return;
      }
      
      // Обработка завершения операций
      if (data.action === 'toggle_completed') {
        hideGlobalSpinner();
        showAlert('success', 'База успешно переключена');
        enableButtons();
        return;
      }
      
      if (data.action === 'restore_completed') {
        hideGlobalSpinner();
        showAlert('success', 'Дам PG успешно восстановлен');
        enableButtons();
        return;
      }
      
      if (data.action === 'fast_pull_completed') {
        hideGlobalSpinner();
        showAlert('success', 'Git pull выполнен успешно');
        enableButtons();
        return;
      }
      
      if (data.action === 'pull_with_reload_completed') {
        hideGlobalSpinner();
        showAlert('success', 'Pull + Reload выполнен успешно');
        enableButtons();
        return;
      }
      
      // Обработка ошибок
      if (data.action === 'toggle_failed') {
        hideGlobalSpinner();
        showAlert('danger', `Ошибка переключения: ${data.error}`);
        enableButtons();
        return;
      }
      
      if (data.action === 'restore_failed') {
        hideGlobalSpinner();
        showAlert('danger', `Ошибка восстановления: ${data.error}`);
        enableButtons();
        return;
      }
      
      if (data.action === 'fast_pull_failed') {
        hideGlobalSpinner();
        showAlert('danger', `Ошибка git pull: ${data.error}`);
        enableButtons();
        return;
      }
      
      if (data.action === 'pull_with_reload_failed') {
        hideGlobalSpinner();
        showAlert('danger', `Ошибка Pull + Reload: ${data.error}`);
        enableButtons();
        return;
      }
      
      // Обработка статуса конфигурации
      if (data.config_status) {
        updateConfigStatus(data.config_status);
      }
      
      // Обработка других ошибок
      if (data.error) {
        showAlert('danger', data.error);
      }
    };

    socket.onerror = function(event) {
      hideGlobalSpinner();
      showAlert('danger', 'Ошибка соединения');
      enableButtons();
      console.error("WebSocket error for host ID", hostId, event);
    };
    
    socket.onclose = function() {
      hideGlobalSpinner();
      enableButtons();
    };

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        if (confirm("Вы уверены, что хотите переключить базу данных?\nЭто может привести к кратковременной недоступности сервиса.")) {
          disableButtons();
          socket.send(JSON.stringify({action: 'toggle_mongo'}));
        }
      });
    }

    if (restoreBtn) {
      restoreBtn.addEventListener('click', function() {
        if (confirm("Вы уверены, что хотите накатить дамп PG?\nЭто приведет к перезаписи текущих данных в базе.")) {
          disableButtons();
          socket.send(JSON.stringify({action: 'restore_backup'}));
        }
      });
    }

    if (fastPullBtn) {
      fastPullBtn.addEventListener('click', function() {
        if (confirm("Вы уверены, что хотите выполнить быстрый git pull в директории /home/jsand/common?")) {
          disableButtons();
          socket.send(JSON.stringify({action: 'fast_pull'}));
        }
      });
    }

    if (pullReloadBtn) {
      pullReloadBtn.addEventListener('click', function() {
        if (confirm("Вы уверены, что хотите выполнить git pull с последующим redeploy? (git pull + deploy_remote + docker-compose up)")) {
          disableButtons();
          socket.send(JSON.stringify({action: 'pull_with_reload'}));
        }
      });
    }
  });
});