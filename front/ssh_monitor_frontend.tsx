import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, 
  Server, 
  Database, 
  GitBranch, 
  RotateCcw, 
  Download,
  User,
  LogOut,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Terminal,
  Wifi,
  WifiOff
} from 'lucide-react';

const App = () => {
  const [hosts, setHosts] = useState([]);
  const [user, setUser] = useState({ username: 'admin', isAuthenticated: true });
  const [notifications, setNotifications] = useState([]);

  // Mock data for demonstration
  useEffect(() => {
    setHosts([
      {
        id: 1,
        name: 'Production Server',
        host: '192.168.1.100',
        port: 22,
        button_change_base: true,
        button_dump_pg: true,
        button_fast_pull: true,
        button_pull_reload: true,
        docker_base: 'docker-compose.base.yml',
        docker_prod: 'docker-compose.prod.yml',
        status: 'Подключена продакшн Монго',
        isConnected: true
      },
      {
        id: 2,
        name: 'Test Server',
        host: '192.168.1.101',
        port: 22,
        button_change_base: true,
        button_dump_pg: false,
        button_fast_pull: true,
        button_pull_reload: true,
        docker_base: 'docker-compose.base.yml',
        docker_prod: 'docker-compose.prod.yml',
        status: 'Подключена тестовая Монго',
        isConnected: true
      },
      {
        id: 3,
        name: 'Development Server',
        host: '192.168.1.102',
        port: 22,
        button_change_base: false,
        button_dump_pg: true,
        button_fast_pull: true,
        button_pull_reload: false,
        docker_base: 'docker-compose.base.yml',
        docker_prod: 'docker-compose.prod.yml',
        status: 'Используется другая конфигурация',
        isConnected: false
      }
    ]);
  }, []);

  const addNotification = (type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Server Monitor</h1>
          <p className="text-gray-600">Управление и мониторинг SSH серверов в режиме реального времени</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hosts.map(host => (
            <ServerCard 
              key={host.id} 
              host={host} 
              onNotification={addNotification}
            />
          ))}
        </div>
      </main>
      
      <NotificationContainer notifications={notifications} />
    </div>
  );
};

const Header = ({ user }) => {
  return (
    <header className="bg-white shadow-lg border-b border-slate-200">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Monitor className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">SSH Monitor</span>
            </div>
            
            <div className="hidden md:flex space-x-6">
              <a href="#" className="px-3 py-2 rounded-lg bg-blue-100 text-blue-700 font-medium">
                Сервера
              </a>
              <a href="#" className="px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                Бэклог
              </a>
            </div>
          </div>
          
          {user.isAuthenticated && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="w-4 h-4" />
                <span className="font-medium">{user.username}</span>
              </div>
              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                <LogOut className="w-4 h-4" />
                <span>Выйти</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

const ServerCard = ({ host, onNotification }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [configStatus, setConfigStatus] = useState(host.status);
  const [isConnected, setIsConnected] = useState(host.isConnected);
  const wsRef = useRef(null);

  useEffect(() => {
    // Simulate WebSocket connection
    const connectWebSocket = () => {
      // In real implementation, replace with actual WebSocket URL
      console.log(`Connecting to WebSocket for host ${host.id}`);
      
      // Simulate connection status updates
      const interval = setInterval(() => {
        setIsConnected(Math.random() > 0.1); // 90% uptime
      }, 10000);

      return () => clearInterval(interval);
    };

    const cleanup = connectWebSocket();
    return cleanup;
  }, [host.id]);

  const executeAction = async (action, confirmMessage) => {
    if (!confirm(confirmMessage)) return;
    
    setIsLoading(true);
    setLoadingMessage(getLoadingMessage(action));
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      if (Math.random() > 0.2) { // 80% success rate
        onNotification('success', getSuccessMessage(action));
        if (action === 'toggle_mongo') {
          setConfigStatus(prev => 
            prev.includes('тестовая') ? 'Подключена продакшн Монго' : 'Подключена тестовая Монго'
          );
        }
      } else {
        throw new Error('Операция завершилась с ошибкой');
      }
    } catch (error) {
      onNotification('error', `Ошибка ${action}: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const getLoadingMessage = (action) => {
    const messages = {
      toggle_mongo: 'Переключение MongoDB...',
      restore_backup: 'Восстановление дампа PG...',
      fast_pull: 'Выполнение git pull...',
      pull_with_reload: 'Pull + Reload...'
    };
    return messages[action] || 'Выполнение операции...';
  };

  const getSuccessMessage = (action) => {
    const messages = {
      toggle_mongo: 'База успешно переключена',
      restore_backup: 'Дамп PG успешно восстановлен',
      fast_pull: 'Git pull выполнен успешно',
      pull_with_reload: 'Pull + Reload выполнен успешно'
    };
    return messages[action] || 'Операция завершена успешно';
  };

  const getStatusColor = (status) => {
    if (status.includes('тестовая')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (status.includes('продакшн')) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10 rounded-xl">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-700 font-medium">{loadingMessage}</p>
          </div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Server className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{host.name}</h3>
              <p className="text-sm text-gray-500">{host.host}:{host.port}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
          </div>
        </div>
        
        <div className={`p-3 rounded-lg border mb-4 ${getStatusColor(configStatus)}`}>
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span className="text-sm font-medium">{configStatus}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {host.button_change_base && (
            <ActionButton
              icon={<RotateCcw className="w-4 h-4" />}
              label="Переключить БД"
              variant="warning"
              disabled={isLoading}
              onClick={() => executeAction('toggle_mongo', 
                "Вы уверены, что хотите переключить базу данных?\nЭто может привести к кратковременной недоступности сервиса."
              )}
            />
          )}
          
          {host.button_dump_pg && (
            <ActionButton
              icon={<Download className="w-4 h-4" />}
              label="Восстановить PG"
              variant="danger"
              disabled={isLoading}
              onClick={() => executeAction('restore_backup',
                "Вы уверены, что хотите накатить дамп PG?\nЭто приведет к перезаписи текущих данных в базе."
              )}
            />
          )}
          
          {host.button_fast_pull && (
            <ActionButton
              icon={<GitBranch className="w-4 h-4" />}
              label="Git Pull"
              variant="info"
              disabled={isLoading}
              onClick={() => executeAction('fast_pull',
                "Вы уверены, что хотите выполнить быстрый git pull в директории /home/jsand/common?"
              )}
            />
          )}
          
          {host.button_pull_reload && (
            <ActionButton
              icon={<Terminal className="w-4 h-4" />}
              label="Pull + Reload"
              variant="primary"
              disabled={isLoading}
              onClick={() => executeAction('pull_with_reload',
                "Вы уверены, что хотите выполнить git pull с последующим redeploy? (git pull + deploy_remote + docker-compose up)"
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ icon, label, variant, disabled, onClick }) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    info: 'bg-cyan-600 hover:bg-cyan-700 text-white'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center space-x-2 px-3 py-2 rounded-lg font-medium text-sm
        transition-all duration-200 transform hover:scale-105
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : 'shadow-md hover:shadow-lg'}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

const NotificationContainer = ({ notifications }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <Notification key={notification.id} {...notification} />
      ))}
    </div>
  );
};

const Notification = ({ type, message }) => {
  const types = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: <XCircle className="w-5 h-5 text-red-500" />
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  };

  const config = types[type] || types.success;

  return (
    <div className={`
      ${config.bg} ${config.text} border rounded-lg p-4 shadow-lg max-w-md
      animate-in slide-in-from-right duration-300
    `}>
      <div className="flex items-center space-x-3">
        {config.icon}
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
};

export default App;