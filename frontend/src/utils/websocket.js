export function connectWebSocket(hostId, onMessage) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(`${protocol}//${window.location.host}/ws/host-status/${hostId}/`);

  socket.onopen = () => {
    console.log(`WebSocket connected for host ${hostId}`);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    onMessage({ error: 'WebSocket connection error' });
  };

  socket.onclose = () => {
    console.log(`WebSocket closed for host ${hostId}`);
  };

  return socket;
}