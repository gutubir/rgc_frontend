/* Configuração do frontend. Edite só este arquivo para apontar para o backend. */
window.RGC_CONFIG = {
  // '' = mesma origem (front servido pelo próprio Spring Boot).
  // Front separado (Live Server etc.): 'http://localhost:8080'
  API_BASE_URL: '',
  CHAT_ENDPOINT: '/api/chat',
  USE_MOCK: false,      // true = responde no navegador, sem backend (demonstração)
  DEBUG: false,         // true = mostra intenção e score abaixo de cada resposta
  TIMEOUT_MS: 15000,
  MAX_LENGTH: 300
};
// Atalhos na URL: index.html?mock=1  |  index.html?debug=1
