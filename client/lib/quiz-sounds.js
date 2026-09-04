/**
 * Quiz verdict clips from `public/`. Unlock on Submit so later playback
 * is allowed after the explanation finishes.
 */

const SRC = {
  correct: "/duolingo-correct.mp3",
  wrong: "/answer-wrong.mp3",
};

const clips = { correct: null, wrong: null };

function getClip(kind) {
  if (typeof window === "undefined") return null;
  if (!clips[kind]) {
    const audio = new Audio(SRC[kind]);
    audio.preload = "auto";
    clips[kind] = audio;
  }
  return clips[kind];
}

export function unlockQuizSounds() {
  Object.keys(SRC).forEach((kind) => {
    const clip = getClip(kind);
    if (!clip) return;
    clip.muted = true;
    clip
      .play()
      .then(() => {
        clip.pause();
        clip.currentTime = 0;
        clip.muted = false;
      })
      .catch(() => {
        clip.muted = false;
      });
  });
}

export function playAnswerSound(correct) {
  const clip = getClip(correct ? "correct" : "wrong");
  if (!clip) return;
  clip.pause();
  clip.currentTime = 0;
  clip.play().catch(() => {});
}
