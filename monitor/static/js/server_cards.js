document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll('.server-card').forEach(function(card) {
    const hostId = card.dataset.hostId;
    const configStatusEl = card.querySelector('.config-status');
    const toggleBtn = card.querySelector('.toggle-btn');
    const restoreBtn = card.querySelector('.restore-btn');
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
      
      // Обработка завершения операций
      if (data.action === 'toggle_completed') {
        hideGlobalSpinner();
        showAlert('success', 'База успешно переключена');
        return;
      }
      
      if (data.action === 'restore_completed') {
        hideGlobalSpinner();
        showAlert('success', 'Дам PG успешно восстановлен');
        return;
      }
      
      // Обработка ошибок
      if (data.action === 'toggle_failed') {
        hideGlobalSpinner();
        showAlert('danger', `Ошибка переключения: ${data.error}`);
        return;
      }
      
      if (data.action === 'restore_failed') {
        hideGlobalSpinner();
        showAlert('danger', `Ошибка восстановления: ${data.error}`);
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
      console.error("WebSocket error for host ID", hostId, event);
    };
    
    socket.onclose = function() {
      hideGlobalSpinner();
      if (toggleBtn) toggleBtn.disabled = false;
      if (restoreBtn) restoreBtn.disabled = false;
    };

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        if (confirm("Вы уверены, что хотите переключить базу данных?\nЭто может привести к кратковременной недоступности сервиса.")) {
          toggleBtn.disabled = true;
          socket.send(JSON.stringify({action: 'toggle_mongo'}));
        }
      });
    }

    if (restoreBtn) {
      restoreBtn.addEventListener('click', function() {
        if (confirm("Вы уверены, что хотите накатить дамп PG?\nЭто приведет к перезаписи текущих данных в базе.")) {
          restoreBtn.disabled = true;
          socket.send(JSON.stringify({action: 'restore_backup'}));
        }
      });
    }
  });
});
