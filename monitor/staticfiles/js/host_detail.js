document.addEventListener("DOMContentLoaded", function() {
  const hostId = document.querySelector('.server-card')?.dataset.hostId;
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

  // Функции управления UI
  function updateConfigStatus(status) {
    if (!status) return;
    
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

  function showSpinner(message) {
    const spinner = document.createElement('div');
    spinner.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
    spinner.style.background = 'rgba(0,0,0,0.5)';
    spinner.style.zIndex = '1000';
    spinner.innerHTML = `
      <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
      <div class="text-white ms-3">${message}</div>
    `;
    document.body.appendChild(spinner);
    return spinner;
  }

  // Обработчики WebSocket
  socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log("WebSocket message:", data);

    if (data.config_status) {
      updateConfigStatus(data.config_status);
    }

    if (data.action) {
      switch(data.action) {
        case 'operation_start':
          this.spinner = showSpinner(data.message);
          break;
          
        case 'operation_completed':
          if (this.spinner) this.spinner.remove();
          showAlert('success', data.message);
          enableButtons();
          break;
          
        case 'operation_error':
          if (this.spinner) this.spinner.remove();
          showAlert('danger', data.message);
          enableButtons();
          break;
      }
    }
  };

  socket.onerror = function() {
    if (this.spinner) this.spinner.remove();
    showAlert('danger', 'Ошибка соединения');
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
        toggle: { action: 'toggle_mongo', confirm: 'Переключить базу данных?' },
        restore: { action: 'restore_backup', confirm: 'Накатить дамп PG?' },
        fastPull: { action: 'fast_pull', confirm: 'Выполнить быстрый git pull?' },
        pullReload: { action: 'pull_with_reload', confirm: 'Выполнить полный reload (git pull + deploy)?' }
      };
      
      if (confirm(operations[key].confirm)) {
        disableButtons();
        socket.send(JSON.stringify({ action: operations[key].action }));
      }
    });
  });

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
});
