import React, { useState, useEffect } from 'react';
import { login, getCsrfToken } from '../api/index';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    // При монтировании компонента забираем CSRF cookie
    getCsrfToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const data = { username, password };
      const result = await login(data);
      console.log('Login success', result);
      // здесь редирект или установка состояния пользователя
    } catch (e) {
      setError('Login failed');
      console.error(e);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="Username"
        required
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </form>
  );
}

export default LoginPage;
