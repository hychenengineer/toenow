(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RescueLevels = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  return [
    {
      name: '初次發車', subtitle: '兩種動物，先熟悉月台。',
      tip: '先把三隻貓安排到同一車廂，看看列車如何出發。',
      queues: [['cat', 'dog'], ['cat', 'cat'], ['dog', 'dog']],
      goals: { cat: 3, dog: 3 }
    },
    {
      name: '森林會合', subtitle: '三種動物，三節車廂。',
      tip: '觀察隊伍後方，把同一種動物集中在同一車廂。',
      queues: [['rabbit', 'dog', 'rabbit'], ['cat', 'cat', 'dog'], ['rabbit', 'dog', 'cat']],
      goals: { cat: 3, dog: 3, rabbit: 3 }
    },
    {
      name: '狐狸來了', subtitle: '第四種旅客，需要輪流發車。',
      tip: '車廂比動物種類少。先送走一組，再接下一種旅客。',
      queues: [['dog', 'rabbit', 'fox', 'rabbit'], ['dog', 'dog', 'fox', 'cat'], ['cat', 'rabbit', 'cat', 'fox']],
      goals: { cat: 3, dog: 3, rabbit: 3, fox: 3 }
    },
    {
      name: '山谷接力', subtitle: '有些動物需要兩班列車。',
      tip: '貓和狗各要救援六隻。每次發車後，重新看看三條隊伍。',
      queues: [['dog', 'cat', 'dog', 'fox', 'rabbit', 'rabbit'], ['dog', 'fox', 'fox', 'cat', 'dog', 'rabbit'], ['cat', 'dog', 'dog', 'cat', 'cat', 'cat']],
      goals: { cat: 6, dog: 6, rabbit: 3, fox: 3 }
    },
    {
      name: '星夜大救援', subtitle: '五種旅客，最後一站。',
      tip: '留一節空車廂很有用。別急著把每一種旅客都接上車。',
      queues: [['fox', 'fox', 'dog', 'cat', 'cat', 'panda', 'rabbit', 'cat'], ['dog', 'cat', 'panda', 'dog', 'rabbit', 'rabbit', 'rabbit', 'cat'], ['fox', 'dog', 'dog', 'rabbit', 'cat', 'dog', 'panda', 'rabbit']],
      goals: { cat: 6, dog: 6, rabbit: 6, fox: 3, panda: 3 }
    }
  ];
});
