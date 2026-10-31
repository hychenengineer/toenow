(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FlashMemoryGarden = api;
})(globalThis, function (root) {
  'use strict';
  let progressSdk = null;
  function startRun() {
    if (!root.ToenowGameSDK || root.ToenowTutorials?.isActive('flash-brain')) return;
    if (!progressSdk) progressSdk = new root.ToenowGameSDK({ gameId: 'flash-brain', category: 'memory' });
    const params = new URLSearchParams(root.location.search);
    progressSdk.startRun({ wave: Math.max(1, Number(params.get('wave')) || 1), isPractice: params.get('practice') === '1' });
  }
  function finishRun(result) { return progressSdk?.finishMaterials({ score: Math.round(result.finalScore), wave: Number(result.reachedWave || result.wavesCleared || result.wave) || 1 }); }
  function reportProgress(wave) {
    if (!root.document || !root.ToenowGameSDK || root.ToenowTutorials?.isActive('flash-brain')) return;
    if (root.document.body.dataset.state !== 'playing') {
      if (progressSdk) progressSdk.runActive = false;
      return;
    }
    if (!progressSdk) progressSdk = new root.ToenowGameSDK({ gameId: 'flash-brain', category: 'memory' });
    if (!progressSdk.runActive) {
      const params = new URLSearchParams(root.location.search);
      progressSdk.startRun({ wave: Math.max(1, Number(params.get('wave')) || 1), isPractice: params.get('practice') === '1' });
    }
    progressSdk.reportProgress({ wave });
  }
  // Untapped beds stay identical throughout recall: art never leaks a hidden target.
  function isAnimalVisible(cell, phase, shell) {
    return shell === 'playing' && (cell.type === 'TARGET' || cell.type === 'PRIORITY') &&
      (phase === 'PHASE_FLASH' || cell.tapped || phase === 'PHASE_BREACH');
  }
  function drawCell(ctx, cell, phase, shell, x, y, size) {
    if (shell !== 'playing') return;
    ctx.save();
    // The same soil edge and leaf pair belongs to every cell, including hazards.
    ctx.strokeStyle = '#beaa7f';
    ctx.lineWidth = Math.max(1, size * .025);
    ctx.strokeRect(x - size * .46, y - size * .46, size * .92, size * .92);
    ctx.fillStyle = '#7e9c7b';
    ctx.beginPath();
    ctx.ellipse(x - size * .28, y + size * .38, size * .12, size * .035, -.4, 0, Math.PI * 2);
    ctx.ellipse(x + size * .28, y + size * .38, size * .12, size * .035, .4, 0, Math.PI * 2);
    ctx.fill();
    if (isAnimalVisible(cell, phase, shell) && root.ToenowAnimals?.drawAnimal) {
      // Keep the yellow priority number and the successful-tap check fully legible.
      const marked = cell.type === 'PRIORITY' || cell.tapped;
      root.ToenowAnimals.drawAnimal(ctx, 'elephant', marked ? x - size * .28 : x,
        marked ? y + size * .23 : y, marked ? size * .36 : size * .65);
    }
    ctx.restore();
  }
  function feedback(status, wave) {
    if (status === 'CORRECT' || status === 'WAVE_CLEARED') progressSdk?.recordCorrectAnswer();
    root.ToenowAnimals?.setWave?.('flash-brain', wave);
    if (status !== 'IGNORED') root.ToenowAnimals?.feedback?.('flash-brain', status !== 'MISTAKE');
  }
  return { isAnimalVisible, drawCell, feedback, reportProgress, startRun, finishRun };
});
