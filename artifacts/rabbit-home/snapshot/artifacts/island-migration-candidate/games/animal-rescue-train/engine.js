(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RescueTrain = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));

  function canBoard(state, queueIndex, carIndex) {
    const queue = state.queues[queueIndex], car = state.cars[carIndex];
    return state.status === 'playing' && Number.isInteger(queueIndex) && Number.isInteger(carIndex) &&
      Boolean(queue?.length && car && car.length < 3 && car.every(animal => animal === queue[0]));
  }

  function evaluate(state, goals, requiredLastAnimal) {
    const allRescued = Object.entries(goals).every(([animal, count]) => (state.rescued[animal] || 0) >= count);
    if (requiredLastAnimal) {
      const targetGoal = goals[requiredLastAnimal] || 0;
      const targetRescued = state.rescued[requiredLastAnimal] || 0;
      // If the required last animal reached its goal before all other animals were rescued, it was sent too early -> fail!
      if (targetRescued >= targetGoal && !allRescued) {
        return 'lost';
      }
    }
    if (allRescued) return 'won';
    return state.queues.some((queue, q) => state.cars.some((car, c) => canBoard(state, q, c))) ? 'playing' : 'lost';
  }

  function advance(state, goals, queueIndex, carIndex, requiredLastAnimal) {
    if (!canBoard(state, queueIndex, carIndex)) return null;
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
    next.status = evaluate(next, goals, requiredLastAnimal);
    return next;
  }

  class Game {
    constructor(level) {
      this.level = copy(level);
      this.restart();
    }
    restart() {
      this.state = { queues: copy(this.level.queues), cars: Array.from({ length: this.level.carCount ?? 3 }, () => []), rescued: {}, moves: 0, departure: null, status: 'playing' };
      this.state.status = evaluate(this.state, this.level.goals, this.level.requiredLastAnimal);
      this.previous = null;
    }
    get canUndo() { return this.previous !== null; }
    move(queue, car) {
      const next = advance(this.state, this.level.goals, queue, car, this.level.requiredLastAnimal);
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

  return { Game, advance, canBoard };
});
