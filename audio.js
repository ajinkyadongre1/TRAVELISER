/**
 * MARGIFY — AUDIO ENGINE (DISABLED / MUTED AS REQUESTED)
 * All audio, music, and sound effects have been removed.
 */

class MargifyAudioEngine {
    constructor() {
        this.isMuted = true;
    }
    init() {}
    toggleMute() { return false; }
    update() {}
    playBlip() {}
    playAiChime() {}
    playPoliceSiren() {}
    stopPoliceSiren() {}
}

window.MargifyAudioEngine = MargifyAudioEngine;
window.CarAudioEngine = MargifyAudioEngine;
