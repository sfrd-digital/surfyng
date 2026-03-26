// Configuração global dos testes — executado antes de cada suite
// Define NODE_ENV=test para impedir que o servidor suba automaticamente
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.FIREBASE_PROJECT_ID = 'surfyng-test';
process.env.FIREBASE_CLIENT_EMAIL = 'test@surfyng-test.iam.gserviceaccount.com';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7test\n-----END PRIVATE KEY-----\n';
process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_placeholder';
process.env.STRIPE_PRICE_PRO = 'price_test_pro';
process.env.STRIPE_PRICE_GLOBAL = 'price_test_global';
process.env.STRIPE_SUCCESS_URL = 'https://surfyng.app/sucesso';
process.env.STRIPE_CANCEL_URL = 'https://surfyng.app/cancelado';
process.env.STRIPE_PORTAL_RETURN_URL = 'https://surfyng.app/perfil';

// Silencia logs durante os testes para output limpo
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
// Mantém erros visíveis para facilitar debugging
// jest.spyOn(console, 'error').mockImplementation(() => {});
