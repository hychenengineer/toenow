// The first-play lesson now rehearses real combined orders in an isolated battle.
// Keep the established entry point running the current lesson/command browser matrix.
require('./verify-animal-orders-browser.cjs').run().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
