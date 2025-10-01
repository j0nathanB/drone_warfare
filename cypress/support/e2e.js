// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log for cleaner test output
// Cypress.on('fail', (error, runnable) => {
//   debugger
//   // we now have access to the err instance
//   // and the mocha runnable this failed on
//   throw error // throw error to have test still fail
// })