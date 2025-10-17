const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://www.demoblaze.com',
    setupNodeEvents(on, config) {
    },
    retries: {
      runMode: 2,
      openMode: 1,
    },
  },
});