(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RescueTrain = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));

  function evaluate(state, goals) {
    if (Object.entries(goals).every(([animal, count]) => (state.rescued[animal] || 0) >= count)) return 'won';
    return state.queues.some(queue => queue.length) && state.cars.some(car => car.length < 3) ? 'playing' : 'lost';
  }

  function advance(state, goals, queueIndex, carIndex) {
    if (state.status !== 'playing' || !Number.isInteger(queueIndex) || !Number.isInteger(carIndex) ||
        !state.queues[queueIndex]?.length || !state.cars[carIndex] || state.cars[carIndex].length >= 3) return null;
    const next = copy(state);
    const animal = next.queues[queueIndex].shift();
    const car = next.cars[carIndex];
    car.push(animal);
    next.moves++;
    next.departure = null;
    // A departure is settled atomically before victory or lack of legal positions.
    if (car.length === 3 && car.every(passenger => passenger === animal)) {
      next.rescued[animal] = (next.rescued[animal] || 0) + 3;
      next.cars[carIndex] = [];
      next.departure = { animal, car: carIndex };
    }
    next.status = evaluate(next, goals);
    return next;
  }

  class Game {
    constructor(level) {
      this.level = copy(level);
      this.restart();
    }
    restart() {
      this.state = { queues: copy(this.level.queues), cars: [[], [], []], rescued: {}, moves: 0, departure: null, status: 'playing' };
      this.state.status = evaluate(this.state, this.level.goals);
      this.previous = null;
    }
    get canUndo() { return this.previous !== null; }
    move(queue, car) {
      const next = advance(this.state, this.level.goals, queue, car);
      if (!next) return false;
      this.previous = copy(this.state);
      this.state = next;
      return true;
    }
    undo() {
      if (!this.previous) return false;
      this.state = this.previous;
      this.previous = null;
      return true;
    }
  }

  return { Game, advance };
});
