// Data only: game copy and lifecycle adapter IDs. Screen markup lives in toenow-screens.js.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ToenowScreenConfig=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){return {
  "number-pop": {
    "name": "NUMBER POP",
    "icon": "🔢",
    "category": "NUMBERS",
    "description": "Tap numbers from smallest to largest before time runs out!",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Find smallest value and tap it (Lowest → Highest sequence)."
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
    }
  },
  "ball-track": {
    "name": "BALL TRACK",
    "icon": "🔮",
    "category": "SPACE",
    "description": "Watch the glowing balls run around the orbit circle, then tap where they stop!",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Memorize target balls in the queue and track them during circular shuffle."
      },
      {
        "label": "TIP",
        "text": "Hold Overdrive during shuffle to accelerate balls and boost score up to 3.5x."
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
    }
  },
  "block-match": {
    "name": "BLOCK MATCH",
    "icon": "🖲️",
    "category": "PATTERN",
    "description": "Tap excess blocks to match the target blueprint.",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Compare active board to target blueprint and tap away extra blocks."
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
    }
  },
  "add-up": {
    "name": "ADD UP",
    "icon": "⚡",
    "category": "NUMBERS",
    "description": "Tap floating number balls to add up and match the target sum!",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Tap 2, 3, or 4 balls that sum to the core target number."
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
    }
  },
  "space-scale": {
    "name": "SPACE SCALE",
    "icon": "⚖️",
    "category": "LOGIC",
    "description": "Watch how scales tilt and deduce target celestial masses before time runs out.",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Analyze lever tilts to find Heaviest, Lightest, or Middle planet."
      },
      {
        "label": "REMEMBER",
        "text": "Size ≠ Weight! A small Black Hole can be far heavier than a Gas Cloud."
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
    }
  },
  "tap-match": {
    "name": "TAP MATCH",
    "icon": "🎯",
    "category": "SPACE",
    "description": "Tap matching pictures before they disappear.",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Look at the target above, then tap matching pictures."
      },
      {
        "label": "LEVELS",
        "text": "The grid gets bigger as you play."
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
    }
  },
  "spot-quick": {
    "name": "SPOT QUICK",
    "icon": "🔬",
    "category": "PATTERN",
    "description": "Guess the blurry picture before time runs out.",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Watch the picture become clearer, then tap the matching answer."
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
    }
  },
  "shadow-match": {
    "name": "SHADOW MATCH",
    "icon": "👤",
    "category": "PATTERN",
    "description": "Find the card that matches the moving shapes.",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Look at the shapes above, then tap the card with the same shapes."
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
    }
  },
  "flash-brain": {
    "name": "FLASH BRAIN",
    "icon": "🧠",
    "category": "MEMORY",
    "description": "Remember where the blocks light up.",
    "rules": [
      {
        "label": "HOW TO PLAY",
        "text": "Wait for GO, then tap the spots that lit up."
      },
      {
        "label": "TIPS",
        "text": "Tap yellow blocks first. Avoid red blocks: they cost you 3 seconds!"
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
    }
  }
};});
