// Data only. The shared renderer owns every title and result template.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ToenowScreenConfig=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){return {
  "capybara-drift": {
    "name": "CAPYBARA DRIFT", "icon": "🍊", "category": "RELAX",
    "description": "Float with Capybara. Collect little joys, meet friends, and take your time.",
    "rules": [{"label":"HOW TO PLAY","text":"Drag gently to collect bubbles, yuzu, petals and friends. Arrow keys also work."},{"label":"TIP","text":"No timer, no penalties. Take a break anytime. Saved joy buys new floats. Practice does not save progress."}],
    "titleId":"title-screen", "endId":"gameover-screen", "headingId":"screen-game-title", "startId":"btn-start", "retryId":"btn-retry", "returnId":"btn-title",
    "fields":{"score":"go-score","bestScore":"go-best-score","wave":"go-wave","combo":"go-combo","level":"go-level"},
    "animalSpecies":"capybara"
  },
  "number-pop": {
    "name": "NUMBER POP",
    "icon": "🐰",
    "category": "NUMBERS",
    "description": "Collect numbered harvest baskets from lowest to highest with Rabbit.",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Collect numbered harvest baskets from lowest to highest with Rabbit."
      },
      {
        "label": "WATCH OUT",
        "text": "Look at actual values, not bubble sizes! Keep combo meter high."
      }
    ],
    "titleId": "title-screen",
    "endId": "gameover-screen",
    "headingId": "screen-game-title",
    "startId": "btn-start",
    "retryId": "btn-retry",
    "returnId": "btn-go-title",
    "fields": {
      "score": "go-score",
      "bestScore": "go-best-score",
      "wave": "go-wave",
      "combo": "go-combo",
      "level": "go-survival-rank"
    },
    "animalSpecies": "rabbit"
  },
  "ball-track": {
    "name": "TARGET TRACK",
    "icon": "🦦",
    "category": "SPACE",
    "description": "Remember the otters, follow their floating leaves, then find their hiding places.",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Remember the otters, follow their floating leaves, then find their hiding places."
      },
      {
        "label": "TIP",
        "text": "Follow the hidden otters. Their leaves look identical until they are revealed. Start with 60 seconds. Right answers add 3 seconds; wrong answers remove 5 seconds. Maximum 60 seconds. No wave time limit."
      }
    ],
    "titleId": "screen-title",
    "endId": "screen-gameover",
    "headingId": "title-heading",
    "startId": "btn-start-game",
    "retryId": "btn-try-again",
    "returnId": "btn-title-gameover",
    "fields": {
      "score": "go-stat-score",
      "bestScore": "go-stat-best",
      "wave": "go-stat-wave",
      "combo": "go-stat-combo",
      "level": "go-level"
    },
    "animalSpecies": "otter"
  },
  "block-match": {
    "name": "BLOCK MATCH",
    "icon": "🦫",
    "category": "PATTERN",
    "description": "Remove extra timber tiles to match Beaver's blueprint.",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Remove extra timber tiles to match Beaver's blueprint."
      },
      {
        "label": "WATCH OUT",
        "text": "Watch for flip modifiers in later waves. Don't tap essential core blocks!"
      }
    ],
    "titleId": "title-screen",
    "endId": "gameover-screen",
    "headingId": "screen-game-title",
    "startId": "btn-start",
    "retryId": "btn-retry",
    "returnId": "btn-title-gameover",
    "fields": {
      "score": "final-score",
      "bestScore": "final-best",
      "wave": "final-waves",
      "combo": "final-combo",
      "level": "final-level-badge"
    },
    "animalSpecies": "beaver"
  },
  "add-up": {
    "name": "ADD UP",
    "icon": "🐿️",
    "category": "NUMBERS",
    "description": "Choose nut bags that add up to Squirrel's supply order.",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Choose nut bags that add up to Squirrel's supply order."
      },
      {
        "label": "BONUS",
        "text": "3-ball match adds +5s (2x Pts). 4-ball match adds +10s (3x Pts)."
      }
    ],
    "titleId": "title-screen",
    "endId": "gameover-screen",
    "headingId": "screen-game-title",
    "startId": "btn-start-game",
    "retryId": "btn-retry",
    "returnId": "btn-gameover-title",
    "fields": {
      "score": "gameover-score",
      "bestScore": "gameover-best",
      "wave": "gameover-waves",
      "combo": "gameover-combo",
      "level": "gameover-level"
    },
    "animalSpecies": "squirrel"
  },
  "space-scale": {
    "name": "SPACE SCALE",
    "icon": "🦊",
    "category": "LOGIC",
    "description": "Read the scales and help Fox sort mysterious parcels by weight.",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Read the scales and help Fox sort mysterious parcels by weight."
      },
      {
        "label": "REMEMBER",
        "text": "Size does not reveal weight. Use the scales to compare the parcels. Start with 60 seconds. Right answers add 3 seconds; wrong answers remove 5 seconds. Maximum 60 seconds. No wave time limit."
      }
    ],
    "titleId": "title-screen",
    "endId": "gameover-screen",
    "headingId": "screen-game-title",
    "startId": "btn-start",
    "retryId": "btn-play-again",
    "returnId": "btn-title-over",
    "fields": {
      "score": "over-score",
      "bestScore": "over-best",
      "wave": "over-wave",
      "combo": "over-combo",
      "level": "over-rank"
    },
    "animalSpecies": "fox"
  },
  "tap-match": {
    "name": "TAP MATCH",
    "icon": "🐧",
    "category": "SPACE",
    "description": "Find matching picture cards and help Penguin collect them.",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Find matching picture cards and help Penguin collect them."
      },
      {
        "label": "LEVELS",
        "text": "The grid gets bigger as you play. Start with 60 seconds. Right answers add 3 seconds; wrong answers remove 5 seconds. Maximum 60 seconds. No wave time limit."
      }
    ],
    "titleId": "modal-start",
    "endId": "modal-gameover",
    "headingId": "start-title",
    "startId": "btn-start-run",
    "retryId": "btn-retry",
    "returnId": "btn-gameover-title",
    "fields": {
      "score": "summary-score",
      "bestScore": "summary-best",
      "wave": "summary-wave",
      "combo": "summary-streak",
      "level": "summary-level"
    },
    "animalSpecies": "penguin"
  },
  "spot-quick": {
    "name": "SPOT QUICK",
    "icon": "🦉",
    "category": "PATTERN",
    "description": "Identify blurry photos from every category for Owl's observation journal.",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Identify blurry photos from every category for Owl's observation journal."
      },
      {
        "label": "TIME",
        "text": "Right answer: +2 seconds. Wrong answer: -1.5 seconds. Up to 60 seconds."
      }
    ],
    "titleId": "briefingModal",
    "endId": "gameOverModal",
    "headingId": "briefingTitle",
    "startId": "startAnalysisBtn",
    "retryId": "retryBtn",
    "returnId": "btn-gameover-title",
    "fields": {
      "score": "finalScoreVal",
      "bestScore": "finalBestVal",
      "wave": "finalWaveVal",
      "combo": "finalStreakVal",
      "level": "finalTierVal"
    },
    "animalSpecies": "owl"
  },
  "shadow-match": {
    "name": "SHADOW MATCH",
    "icon": "🦝",
    "category": "PATTERN",
    "description": "Watch Raccoon's moving paper shapes and find the matching card.",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Watch Raccoon's moving paper shapes and find the matching card."
      },
      {
        "label": "TIP",
        "text": "Shapes can overlap. Look carefully! Quick, correct answers can earn extra time."
      }
    ],
    "titleId": "title-overlay",
    "endId": "gameover-overlay",
    "headingId": "title-heading",
    "startId": "btn-init-optics",
    "retryId": "btn-reboot-optics",
    "returnId": "btn-gameover-title",
    "fields": {
      "score": "stat-final-score",
      "bestScore": "stat-best-score",
      "wave": "stat-waves-resolved",
      "combo": "stat-peak-combo",
      "level": "gameover-level-reached"
    },
    "animalSpecies": "raccoon"
  },
  "flash-brain": {
    "name": "FLASH BRAIN",
    "icon": "🐘",
    "category": "MEMORY",
    "description": "Remember the animal flowerbeds with Elephant. Recall their positions and avoid thorns.",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Remember the animal flowerbeds with Elephant. Recall their positions and avoid thorns."
      },
      {
        "label": "TIPS",
        "text": "Remember animal flowerbeds. Tap priority beds first and avoid thorn beds."
      }
    ],
    "titleId": "flash-title-screen",
    "endId": "flash-gameover-screen",
    "headingId": "flash-title-heading",
    "startId": "btn-start-game",
    "retryId": "btn-retry",
    "returnId": "btn-gameover-title",
    "fields": {
      "score": "flash-final-score",
      "bestScore": "flash-best-score",
      "wave": "flash-wave",
      "combo": "flash-combo",
      "level": "flash-level"
    },
    "animalSpecies": "elephant"
  }
};});
