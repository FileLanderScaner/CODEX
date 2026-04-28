export default {
  testDir: './tests/e2e',
  timeout: 90_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:8081',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run web -- --port 8081',
    url: 'http://127.0.0.1:8081',
    reuseExistingServer: true,
    timeout: 180_000,
  },
};
