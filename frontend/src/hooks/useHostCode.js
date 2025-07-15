import { useEffect, useState } from 'react';
import axios from 'axios';

const useHostCode = (hostId) => {
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [codesLoading, setCodesLoading] = useState(true);
  const [error, setError] = useState(null);

  // Для input-кодов
  const [inputCodes, setInputCodes] = useState([]);
  const [selectedInputCodeId, setSelectedInputCodeId] = useState('');
  const [inputCodeData, setInputCodeData] = useState({
    variables: {},
    output: null,
    error: null
  });

  // Для output-кодов (10messages)
  const [outputCodes, setOutputCodes] = useState([]);
  const [selectedOutputCodeId, setSelectedOutputCodeId] = useState('');
  const [outputCodeData, setOutputCodeData] = useState({
    variables: {},
    output: null,
    error: null
  });

  const [inputVariablesText, setInputVariablesText] = useState('{}');
  const [outputVariablesText, setOutputVariablesText] = useState('{}');
  const [inputVariablesObj, setInputVariablesObj] = useState({});
  const [outputVariablesObj, setOutputVariablesObj] = useState({});

  const [executionState, setExecutionState] = useState({
    loading: false,
    success: null,
    message: '',
    type: null // 'input' или 'output'
  });

  // Получение данных хоста
  useEffect(() => {
    const fetchHostData = async () => {
      try {
        const { getHostDetail } = await import('../api');
        const hostData = await getHostDetail(hostId);
        setHost(hostData);
      } catch (err) {
        setError('Ошибка загрузки данных хоста');
      } finally {
        setLoading(false);
      }
    };
    if (hostId) {
      fetchHostData();
    }
  }, [hostId]);

  // Получение списка кодов пользователя
  useEffect(() => {
    const fetchUserCodes = async () => {
      setCodesLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/messagecode/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && Array.isArray(response.data)) {
          // Фильтруем input-коды
          const inputCodes = response.data.filter(code => 
            code.name && code.name.startsWith('input')
          );
          setInputCodes(inputCodes);
          if (inputCodes.length > 0) {
            setSelectedInputCodeId(inputCodes[0].id);
          }

          // Фильтруем output-коды (10messages)
          const outputCodes = response.data.filter(code =>
            code.name && code.name.startsWith('10messages')
          );
          setOutputCodes(outputCodes);
          if (outputCodes.length > 0) {
            setSelectedOutputCodeId(outputCodes[0].id);
          }
        } else {
          setError('Неверный формат данных кодов');
        }
      } catch (err) {
        setError('Ошибка загрузки списка кодов');
      } finally {
        setCodesLoading(false);
      }
    };
    fetchUserCodes();
  }, []);

  // Получение данных выбранного input-кода
  useEffect(() => {
    if (!selectedInputCodeId) return;

    const fetchCodeData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/messagecode/${selectedInputCodeId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInputCodeData({
          variables: response.data.variables || {},
          output: response.data.output,
          error: response.data.error
        });
      } catch {
        setExecutionState({
          loading: false,
          success: false,
          message: 'Ошибка загрузки данных input-кода',
          type: 'input'
        });
      }
    };
    fetchCodeData();
  }, [selectedInputCodeId]);

  // Получение данных выбранного output-кода
  useEffect(() => {
    if (!selectedOutputCodeId) return;

    const fetchCodeData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/messagecode/${selectedOutputCodeId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOutputCodeData({
          variables: response.data.variables || {},
          output: response.data.output,
          error: response.data.error
        });
      } catch {
        setExecutionState({
          loading: false,
          success: false,
          message: 'Ошибка загрузки данных output-кода',
          type: 'output'
        });
      }
    };
    fetchCodeData();
  }, [selectedOutputCodeId]);

  // Синхронизация текста и объекта переменных для input-кода
  useEffect(() => {
    setInputVariablesObj(inputCodeData.variables || {});
    setInputVariablesText(JSON.stringify(inputCodeData.variables || {}, null, 2));
  }, [inputCodeData.variables]);

  // Синхронизация текста и объекта переменных для output-кода
  useEffect(() => {
    setOutputVariablesObj(outputCodeData.variables || {});
    setOutputVariablesText(JSON.stringify(outputCodeData.variables || {}, null, 2));
  }, [outputCodeData.variables]);

  // Обработчик изменения текста переменных input-кода
  const handleInputVariablesChange = (val) => {
    setInputVariablesText(val);
    try {
      const parsed = JSON.parse(val);
      setInputVariablesObj(parsed);
    } catch {
      // invalid JSON - не меняем объект
    }
  };

  // Обработчик изменения текста переменных output-кода
  const handleOutputVariablesChange = (val) => {
    setOutputVariablesText(val);
    try {
      const parsed = JSON.parse(val);
      setOutputVariablesObj(parsed);
    } catch {
      // invalid JSON - не меняем объект
    }
  };

  // Сохранение переменных input-кода
  const handleSaveInputVariables = async () => {
    if (!selectedInputCodeId) return;
    try {
      setExecutionState({ loading: true, success: null, message: '', type: 'input' });
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/messagecode/${selectedInputCodeId}/update-variables/`,
        { variables: inputVariablesObj },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExecutionState({ 
        loading: false, 
        success: true, 
        message: 'Variables input-кода успешно сохранены',
        type: 'input'
      });
    } catch (err) {
      setExecutionState({ 
        loading: false, 
        success: false, 
        message: err.response?.data?.error || 'Ошибка сохранения input-кода',
        type: 'input'
      });
    }
  };

  // Сохранение переменных output-кода
  const handleSaveOutputVariables = async () => {
    if (!selectedOutputCodeId) return;
    try {
      setExecutionState({ loading: true, success: null, message: '', type: 'output' });
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/messagecode/${selectedOutputCodeId}/update-variables/`,
        { variables: outputVariablesObj },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExecutionState({ 
        loading: false, 
        success: true, 
        message: 'Variables output-кода успешно сохранены',
        type: 'output'
      });
    } catch (err) {
      setExecutionState({ 
        loading: false, 
        success: false, 
        message: err.response?.data?.error || 'Ошибка сохранения output-кода',
        type: 'output'
      });
    }
  };

  // Выполнение input-кода
  const handleExecuteInputCode = async () => {
    if (!selectedInputCodeId) return;
    try {
      setExecutionState({ loading: true, success: null, message: '', type: 'input' });
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/messagecode/${selectedInputCodeId}/execute/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInputCodeData(prev => ({ ...prev, output: response.data.output, error: null }));
      setExecutionState({ 
        loading: false, 
        success: true, 
        message: 'Input-код выполнен успешно',
        type: 'input'
      });
    } catch (err) {
      setInputCodeData(prev => ({
        ...prev,
        output: null,
        error: err.response?.data?.execution || 'Ошибка выполнения input-кода'
      }));
      setExecutionState({
        loading: false,
        success: false,
        message: err.response?.data?.execution || 'Ошибка выполнения input-кода',
        type: 'input'
      });
    }
  };

  // Выполнение output-кода (10messages)
const handleExecuteOutputCode = async () => {
  if (!selectedOutputCodeId || !host || !selectedInputCodeId) return;

  try {
    setExecutionState({ loading: true, success: null, message: '', type: 'output' });
    const token = localStorage.getItem('token');

    // 1. Получаем актуальные данные выбранного input-кода
    const currentInputCode = await axios.get(
      `/api/messagecode/${selectedInputCodeId}/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // 3. Подготавливаем полный набор переменных
    const executionData = {
      variables: {
        ...outputVariablesObj,
        rabbit_host: host.ip_address,
        input_file: currentInputCode,
        // добавляем ident только если он есть
        ...(inputCodeData.variables?.ident ? { ident: inputCodeData.variables.ident } : {})
      },
      host_id: host.id,
      input_code_id: selectedInputCodeId
    };

    // 4. Выполняем output-код
    const response = await axios.post(
      `/api/messagecode/${selectedOutputCodeId}/execute/`,
      executionData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 5. Обновляем состояние
    setOutputCodeData(prev => ({ 
      ...prev, 
      output: response.data.output, 
      error: null 
    }));
    
    setExecutionState({ 
      loading: false, 
      success: true, 
      message: 'Output-код выполнен успешно',
      type: 'output'
    });

  } catch (err) {
    setOutputCodeData(prev => ({
      ...prev,
      output: null,
      error: err.response?.data?.execution || err.message
    }));
    
    setExecutionState({
      loading: false,
      success: false,
      message: err.response?.data?.execution || err.message || 'Ошибка выполнения',
      type: 'output'
    });
  }
};

  return {
    host,
    loading,
    error,
    codesLoading,
    
    // Input code
    inputCodes,
    selectedInputCodeId,
    setSelectedInputCodeId,
    inputCodeData,
    inputVariablesText,
    handleInputVariablesChange,
    handleSaveInputVariables,
    handleExecuteInputCode,
    
    // Output code
    outputCodes,
    selectedOutputCodeId,
    setSelectedOutputCodeId,
    outputCodeData,
    outputVariablesText,
    handleOutputVariablesChange,
    handleSaveOutputVariables,
    handleExecuteOutputCode,
    
    executionState
  };
};

export default useHostCode;