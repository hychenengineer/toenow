(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RescueLevels = factory();
})(globalThis, function () {
  return [
    { tier: 1, tierName: 'Beginner', carCount: 2,
      name: 'First Departure', subtitle: 'Two queues. Two carriages. A gentle first rescue.',
      thinking: 'Match species and learn when a carriage leaves.',
      tip: 'Bring three cats together to send your first carriage home.',
      queues: [['cat', 'cat', 'dog'], ['cat', 'dog', 'dog']], goals: { cat: 3, dog: 3 } },
    { tier: 2, tierName: 'Easy', carCount: 2,
      name: 'Forest Meeting', subtitle: 'Three queues share two carriages.',
      thinking: 'Compare the queues and choose who boards first.',
      tip: 'Look at the next passengers before opening a new group.',
      queues: [['dog', 'cat', 'rabbit'], ['dog', 'dog', 'cat'], ['cat', 'rabbit', 'rabbit']], goals: { cat: 3, dog: 3, rabbit: 3 } },
    { tier: 3, tierName: 'Intermediate', carCount: 3,
      name: 'Woodland Crossroads', subtitle: 'Three queues, three carriages, five species.',
      thinking: 'Keep an exit open as the queues depend on each other.',
      tip: 'After this passenger boards, which queue can still move?',
      queues: [['panda', 'cat', 'fox', 'cat', 'cat', 'cat'], ['fox', 'dog', 'dog', 'dog', 'rabbit', 'rabbit'], ['panda', 'cat', 'rabbit', 'fox', 'panda', 'cat']],
      goals: { cat: 6, dog: 3, rabbit: 3, fox: 3, panda: 3 } },
    { tier: 4, tierName: 'Hard', carCount: 3,
      name: 'Valley Relay', subtitle: 'Four queues, three carriages, six species.',
      thinking: 'Reserve space for a sequence of connected rescues.',
      tip: 'Before taking a new species, plan how your occupied carriages will leave.',
      queues: [['cat', 'pig', 'panda', 'panda', 'rabbit', 'dog'], ['fox', 'pig', 'fox', 'dog', 'dog', 'cat'], ['pig', 'cat', 'dog', 'cat', 'dog', 'rabbit'], ['cat', 'rabbit', 'dog', 'cat', 'fox', 'panda']],
      goals: { cat: 6, dog: 6, rabbit: 3, fox: 3, panda: 3, pig: 3 } },
    { tier: 5, tierName: 'Expert', carCount: 4,
      name: 'Starlight Rescue', subtitle: 'Five queues, four carriages, eight species.',
      thinking: 'Coordinate several departures across the whole station.',
      tip: 'Keep the next departure possible whenever you start a new group.',
      queues: [['bear', 'dog', 'pig', 'fox', 'cat', 'bear'], ['rabbit', 'owl', 'cat', 'rabbit', 'dog', 'dog'], ['cat', 'owl', 'dog', 'owl', 'cat', 'cat'], ['cat', 'fox', 'fox', 'panda', 'dog', 'rabbit'], ['panda', 'pig', 'bear', 'pig', 'dog', 'panda']],
      goals: { cat: 6, dog: 6, rabbit: 3, fox: 3, panda: 3, pig: 3, owl: 3, bear: 3 } }
  ];
});
