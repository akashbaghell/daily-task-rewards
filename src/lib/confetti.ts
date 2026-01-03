import confetti from 'canvas-confetti';

export const triggerConfetti = () => {
  // Fire confetti from the center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#e11d48', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
  });
};

export const triggerRewardConfetti = () => {
  // Fire confetti from both sides
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#e11d48', '#f59e0b', '#fbbf24', '#10b981'],
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};

export const triggerCoinShower = () => {
  // Golden coin-like confetti
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.5 },
    colors: ['#fbbf24', '#f59e0b', '#d97706'],
    shapes: ['circle'],
    gravity: 1.2,
    scalar: 1.5,
    ticks: 100,
  });
};

export const triggerStarBurst = () => {
  // Star-like burst effect
  const duration = 2000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: Math.random() * 0.4 + 0.3, y: Math.random() - 0.2 },
      colors: ['#e11d48', '#fbbf24', '#f472b6'],
    });
  }, 250);
};
