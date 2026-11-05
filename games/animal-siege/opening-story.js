(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AnimalOpeningStory = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const copy = Object.freeze({
    title: 'Three Forts in the Mist', chapter: 'The expedition begins',
    fox: 'Fox Scout', squirrel: 'Squirrel Captain', beaver: 'Beaver Captain',
    next: 'Continue story', skip: 'Skip introduction', depart: 'Take me to camp',
    campTitle: 'Getting ready at Forest Camp', campChapter: 'Recruit and train your army',
    recruit: 'Show me recruitment', train: 'Explain squad training', finish: 'I will prepare my army'
  });
  const lines = Object.freeze([
    { speaker: 'fox', text: 'After the storm, thick mist covered every forest road. I found the other villages, but the garrisons have sealed off the forts along the way!' },
    { speaker: 'squirrel', text: 'Acorn Fort holds the food we saved for winter. We must reclaim it before our friends in the mountains go hungry!' },
    { speaker: 'beaver', text: 'River Keep controls the river crossing. We must capture it to reconnect the two banks.' },
    { speaker: 'fox', text: 'Capture both outer forts, Acorn Fort and River Keep, to open the road to Treetop Citadel. That is our final objective!' },
    { speaker: 'squirrel', text: 'I will scout the trails for supplies and allies! Visit our camp to recruit friends and train your squads.' },
    { speaker: 'beaver', text: 'Commander, lead us to reclaim all three forts and bring the forest together again! First, come into camp and prepare with us.' }
  ].map(Object.freeze));
  const campLines = Object.freeze([
    { speaker: 'beaver', topic: 'buildings', text: 'Welcome to Forest Camp! The Beaver Workshop, Fox Barracks and Squirrel Lookout recruit and train their own animals. First I will explain the camp. You can open a building after the introduction.' },
    { speaker: 'fox', topic: 'recruit', text: 'To buy troops later, open a building and choose Recruit +1 or +3. One Beaver costs 20 gold. Recruiting spends gold and adds healthy animals to your army. Foxes and Squirrels are recruited in their own buildings.' },
    { speaker: 'squirrel', topic: 'train', text: 'Training costs 35 wood per squad. Trained Beavers take 20% less damage. Gather wood on the trails if you need more. The tour ends here. Prepare your army at your own pace.' }
  ].map(Object.freeze));
  const KEY = 'animal_siege_introduction_v1';
  function create(saved) {
    let phase = saved?.phase === 'camp' ? 'camp' : 'story';
    const length = phase === 'camp' ? campLines.length : lines.length;
    let index = Number.isInteger(saved?.index) && saved.index >= 0 && saved.index < length ? saved.index : 0;
    const currentLines = () => phase === 'story' ? lines : campLines;
    return {
      current: () => ({ ...currentLines()[index], phase, index, total: currentLines().length, last: index === currentLines().length - 1 }),
      advance() { if (index === currentLines().length - 1) return false; index++; return true; },
      enterCamp() { if (phase !== 'story' || index !== lines.length - 1) return false; phase = 'camp'; index = 0; return true; }
    };
  }
  function progress(storage) {
    let memory = null, sessionOnly = false;
    function normalize(value) {
      if (value?.status === 'completed' || value?.status === 'skipped') return { status: value.status };
      if (value?.status !== 'progress') return null;
      const current = create(value).current();
      return { status: 'progress', phase: current.phase, index: current.index };
    }
    function write(value) {
      memory = value; sessionOnly = true;
      try { if (storage?.setItem) { storage.setItem(KEY, JSON.stringify(value)); sessionOnly = false; } } catch (_) {}
    }
    return {
      read() { if (sessionOnly) return memory; try { if (storage?.getItem) { const raw = storage.getItem(KEY); memory = raw ? normalize(JSON.parse(raw)) : null; } } catch (_) {} return memory; },
      save(current) { write({ status: 'progress', phase: current.phase, index: current.index }); },
      finish(status = 'completed') { write({ status: status === 'skipped' ? 'skipped' : 'completed' }); }
    };
  }
  return { KEY, copy, lines, campLines, create, progress };
});
