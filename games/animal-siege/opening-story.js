(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AnimalOpeningStory = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const copy = Object.freeze({
    title: 'Three Forts in the Mist', chapter: 'The expedition begins',
    fox: 'Fox Scout', squirrel: 'Squirrel Captain', beaver: 'Beaver Captain',
    next: 'Continue story', skip: 'Skip story', depart: 'Set out and reclaim the forts!'
  });
  const lines = Object.freeze([
    { speaker: 'fox', text: 'After the storm, thick mist covered every forest road. I found the other villages, but the garrisons have sealed off the forts along the way!' },
    { speaker: 'squirrel', text: 'Acorn Fort holds the food we saved for winter. We must reclaim it before our friends in the mountains go hungry!' },
    { speaker: 'beaver', text: 'River Keep controls the river crossing. We must capture it to reconnect the two banks.' },
    { speaker: 'fox', text: 'Capture both outer forts, Acorn Fort and River Keep, to open the road to Treetop Citadel. That is our final objective!' },
    { speaker: 'squirrel', text: 'I will scout the trails for supplies and allies! Visit our camp to recruit friends and train your squads.' },
    { speaker: 'beaver', text: 'Commander, lead us to reclaim all three forts and bring the forest together again!' }
  ].map(Object.freeze));
  function create() {
    let index = 0;
    return {
      current: () => ({ ...lines[index], index, total: lines.length, last: index === lines.length - 1 }),
      advance() { if (index === lines.length - 1) return false; index++; return true; }
    };
  }
  return { copy, lines, create };
});
