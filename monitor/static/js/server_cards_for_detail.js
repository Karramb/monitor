document.addEventListener("DOMContentLoaded", function() {
  const hostId = document.querySelector('.toggle-btn')?.dataset.hostId;
  if (!hostId) return;

  const configStatusEl = document.querySelector('.config-status');
  const statusTextEl = configStatusEl.querySelector('.status-text');
  const buttons = {
    toggle: document.querySelector('.toggle-btn'),
    restore: document.querySelector('.restore-btn'),
    fastPull: document.querySelector('.fast-pull-btn'),
    pullReload: document.querySelector('.pull-reload-btn')
  };
  
  const socket = new WebSocket(`ws://${window.location.host}/ws/core/${hostId}/`);
  const alertsContainer = document.getElementById('liveAlerts');

  // Функция обновления статуса конфигурации и спиннера
  function updateConfigStatus(status) {
    if (!status) return;
    
    const spinner = configStatusEl.querySelector('.spinner-border');
    if (spinner) {
      spinner.style.display = 'none'; // Скрываем вместо удаления
    }
    
    // Остальной код без изменений
    statusTextEl.textContent = status;
    configStatusEl.className = 'config-status text-center p-2 rounded ';
    
    if (status.includes("тестовая")) {
      configStatusEl.classList.add("bg-warning", "text-dark");
    } else if (status.includes("продакшн")) {
      configStatusEl.classList.add("bg-success", "text-white");
    } else {
      configStatusEl.classList.add("bg-secondary", "text-white");
    }
  }

  // Функция показа уведомлений
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

  // Обработчики WebSocket
  socket.onmessage = function(event) {
    try {
      const data = JSON.parse(event.data);
      console.log("WebSocket message:", data);

      // Обновление статуса конфигурации
      if (data.config_status) {
        updateConfigStatus(data.config_status);
      }

      // Обработка операций
      if (data.action === 'operation_start') {
        showAlert('info', data.message);
      } 
      else if (data.action === 'operation_completed') {
        showAlert('success', data.message || 'Операция выполнена успешно');
        enableButtons();
      }
      else if (data.action === 'operation_error') {
        showAlert('danger', data.message || 'Ошибка при выполнении операции');
        enableButtons();
      }
    } catch (e) {
      console.error("Error processing message:", e);
    }
  };

  socket.onerror = function() {
    showAlert('danger', 'Ошибка соединения с сервером');
    enableButtons();
  };

  socket.onclose = function() {
    enableButtons();
  };

  // Обработчики кнопок
  Object.entries(buttons).forEach(([key, btn]) => {
    if (!btn) return;
    
    btn.addEventListener('click', function() {
      const operations = {
        toggle: { 
          action: 'toggle_mongo', 
          confirm: 'Вы уверены, что хотите переключить базу данных?' 
        },
        restore: { 
          action: 'restore_backup', 
          confirm: 'Вы уверены, что хотите накатить дамп PG?' 
        },
        fastPull: { 
          action: 'fast_pull', 
          confirm: 'Выполнить быстрый git pull?' 
        },
        pullReload: { 
          action: 'pull_with_reload', 
          confirm: 'Выполнить полный reload (git pull + deploy)?' 
        }
      };
      
      if (confirm(operations[key].confirm)) {
        disableButtons();
        socket.send(JSON.stringify({ action: operations[key].action }));
      }
    });
  });

  // Управление состоянием кнопок
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

  // Первоначальное получение статуса
  socket.onopen = function() {
    socket.send(JSON.stringify({ action: 'get_status' }));
  };
});