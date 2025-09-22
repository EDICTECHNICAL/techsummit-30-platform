import { ratingEmitter } from '@/lib/rating-emitter';

type RatingTeam = { id: string | number; name: string } | null;

export const PITCH_SEC = 300; // 5 minutes
export const WARNING_SEC = 5;
export const RATING_SEC = 120; // 2 minutes - teams + judges rating phase

export let ratingState: {
  team: RatingTeam;
  ratingActive: boolean;
  allPitchesCompleted: boolean;
  ratingCycleActive: boolean;
  currentPhase: 'idle' | 'pitching' | 'qna-pause' | 'rating-warning' | 'rating-active';
  phaseTimeLeft: number;
  cycleStartTime: number | null;
  phaseStartTime: number | null;
  // meta
  updatedAt: number;
  version: number;
} = {
  team: null,
  ratingActive: false,
  allPitchesCompleted: false,
  ratingCycleActive: false,
  currentPhase: 'idle',
  phaseTimeLeft: 0,
  cycleStartTime: null,
  phaseStartTime: null,
  updatedAt: Date.now(),
  version: 1,
};

let ratingTimeout: NodeJS.Timeout | null = null;
let tickInterval: NodeJS.Timeout | null = null;
let manualRatingStartAt: number | null = null;

function markStateChanged() {
  try {
    ratingState.updatedAt = Date.now();
    ratingState.version = (ratingState.version || 0) + 1;
    ratingEmitter.broadcast({ type: 'ratingStateChanged', data: ratingState });
  } catch (err) {
    console.error('Error broadcasting ratingStateChanged:', err);
  }
}

export function setTeam(team: RatingTeam) {
  ratingState.team = team;
  ratingState.ratingActive = false;
  ratingState.ratingCycleActive = false;
  ratingState.currentPhase = 'idle';
  ratingState.phaseStartTime = null;
  ratingState.phaseTimeLeft = 0;
  ratingState.cycleStartTime = null;
  manualRatingStartAt = null;
  if (ratingTimeout) {
    clearTimeout(ratingTimeout);
    ratingTimeout = null;
  }
  markStateChanged();
}

export function startRatingCycle() {
  ratingState.ratingCycleActive = true;
  ratingState.currentPhase = 'pitching';
  ratingState.cycleStartTime = Date.now();
  ratingState.phaseStartTime = Date.now();
  ratingState.phaseTimeLeft = PITCH_SEC;
  ratingState.ratingActive = false;
  manualRatingStartAt = null;
  if (ratingTimeout) {
    clearTimeout(ratingTimeout);
    ratingTimeout = null;
  }
  markStateChanged();
}

export function startQnaPause() {
  if (!ratingState.ratingCycleActive) return;
  ratingState.currentPhase = 'qna-pause';
  ratingState.phaseStartTime = Date.now();
  ratingState.phaseTimeLeft = 0;
  ratingState.ratingActive = false;
  if (ratingTimeout) {
    clearTimeout(ratingTimeout);
    ratingTimeout = null;
  }
  markStateChanged();
}

export function startRatingWarning() {
  if (!ratingState.ratingCycleActive) return;
  ratingState.currentPhase = 'rating-warning';
  ratingState.phaseStartTime = Date.now();
  ratingState.phaseTimeLeft = WARNING_SEC;
  ratingState.ratingActive = false;
  if (ratingTimeout) {
    clearTimeout(ratingTimeout);
    ratingTimeout = null;
  }
  markStateChanged();
}

export function startRatingPhase() {
  if (!ratingState.ratingCycleActive) return;
  ratingState.currentPhase = 'rating-active';
  ratingState.phaseStartTime = Date.now();
  ratingState.phaseTimeLeft = RATING_SEC;
  ratingState.ratingActive = true;

  if (ratingTimeout) {
    clearTimeout(ratingTimeout);
  }
  // Auto-stop after rating duration
  ratingTimeout = setTimeout(() => {
    ratingState.ratingCycleActive = false;
    ratingState.currentPhase = 'idle';
    ratingState.phaseStartTime = null;
    ratingState.phaseTimeLeft = 0;
    ratingState.ratingActive = false;
    ratingState.cycleStartTime = null;
    ratingTimeout = null;
    markStateChanged();
  }, RATING_SEC * 1000);
  markStateChanged();
}

export function stopRatingCycle() {
  ratingState.ratingCycleActive = false;
  ratingState.currentPhase = 'idle';
  ratingState.phaseStartTime = null;
  ratingState.phaseTimeLeft = 0;
  ratingState.ratingActive = false;
  ratingState.cycleStartTime = null;
  manualRatingStartAt = null;
  if (ratingTimeout) {
    clearTimeout(ratingTimeout);
    ratingTimeout = null;
  }
  markStateChanged();
}

export function setRatingActiveManually(active: boolean) {
  ratingState.ratingActive = active;
  if (active) {
    manualRatingStartAt = Date.now();
    if (ratingTimeout) clearTimeout(ratingTimeout);
    ratingTimeout = setTimeout(() => {
      ratingState.ratingActive = false;
      manualRatingStartAt = null;
      ratingTimeout = null;
      markStateChanged();
    }, RATING_SEC * 1000);
  } else {
    if (ratingTimeout) {
      clearTimeout(ratingTimeout);
      ratingTimeout = null;
    }
    manualRatingStartAt = null;
  }
  markStateChanged();
}

export function setAllPitchesCompleted(flag: boolean) {
  ratingState.allPitchesCompleted = !!flag;
  markStateChanged();
}

function tick() {
  const now = Date.now();

  if (ratingState.ratingCycleActive && ratingState.phaseStartTime) {
    const elapsed = Math.floor((now - ratingState.phaseStartTime) / 1000);
    
    // Debug logging for timer transitions
    if (elapsed % 10 === 0) { // Log every 10 seconds
      console.log(`Timer tick: phase=${ratingState.currentPhase}, elapsed=${elapsed}s, timeLeft=${ratingState.phaseTimeLeft}s`);
    }

    if (ratingState.currentPhase === 'pitching') {
      if (elapsed < PITCH_SEC) {
        ratingState.phaseTimeLeft = Math.max(0, PITCH_SEC - elapsed);
      } else {
        // Auto-transition to qna-pause after pitching time ends
        ratingState.currentPhase = 'qna-pause';
        ratingState.phaseStartTime = now;
        ratingState.phaseTimeLeft = 0;
        ratingState.ratingActive = false;
        markStateChanged();
      }
    } else if (ratingState.currentPhase === 'qna-pause') {
      // admin controlled; nothing to update except zero time
      ratingState.phaseTimeLeft = 0;
    } else if (ratingState.currentPhase === 'rating-warning') {
      if (elapsed < WARNING_SEC) {
        ratingState.phaseTimeLeft = Math.max(0, WARNING_SEC - elapsed);
      } else {
        // Auto-transition to rating-active after warning period
        ratingState.currentPhase = 'rating-active';
        ratingState.phaseStartTime = now;
        ratingState.phaseTimeLeft = RATING_SEC;
        ratingState.ratingActive = true;
        if (ratingTimeout) clearTimeout(ratingTimeout);
        ratingTimeout = setTimeout(() => {
          ratingState.ratingCycleActive = false;
          ratingState.currentPhase = 'idle';
          ratingState.phaseStartTime = null;
          ratingState.phaseTimeLeft = 0;
          ratingState.ratingActive = false;
          ratingState.cycleStartTime = null;
          ratingTimeout = null;
          markStateChanged();
        }, RATING_SEC * 1000);
        markStateChanged();
      }
    } else if (ratingState.currentPhase === 'rating-active') {
      if (elapsed < RATING_SEC) {
        ratingState.phaseTimeLeft = Math.max(0, RATING_SEC - elapsed);
      } else {
        // Auto-end the rating cycle after rating time expires
        ratingState.ratingCycleActive = false;
        ratingState.currentPhase = 'idle';
        ratingState.phaseStartTime = null;
        ratingState.phaseTimeLeft = 0;
        ratingState.ratingActive = false;
        ratingState.cycleStartTime = null;
        if (ratingTimeout) {
          clearTimeout(ratingTimeout);
          ratingTimeout = null;
        }
        markStateChanged();
      }
    }
  }

  if (ratingState.ratingActive && !ratingState.ratingCycleActive && manualRatingStartAt) {
    const elapsed = Math.floor((now - manualRatingStartAt) / 1000);
    const remaining = Math.max(0, RATING_SEC - elapsed);
    ratingState.phaseTimeLeft = remaining;
    if (remaining === 0) {
      ratingState.ratingActive = false;
      manualRatingStartAt = null;
      if (ratingTimeout) {
        clearTimeout(ratingTimeout);
        ratingTimeout = null;
      }
      markStateChanged();
    }
  }
}

function startTicker() {
  if (tickInterval) return;
  tickInterval = setInterval(tick, 1000);
  console.log('Rating state ticker started');
}

startTicker();

export function getRatingState() {
  return ratingState;
}
