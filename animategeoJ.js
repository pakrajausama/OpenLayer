 function animateBoundary(animationType) {
      const animations = {
        bounce: [
          { opacity: 0, transform: 'translateY(-100%) scale(0.2) rotateZ(-5deg)', offset: 0 },
          { opacity: 0.8, transform: 'translateY(25%) scale(1.4) rotateZ(2deg)', offset: 0.3, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' },
          { opacity: 1, transform: 'translateY(-15%) scale(0.9) rotateZ(-1deg)', offset: 0.5 },
          { transform: 'translateY(5%) scale(1.1)', offset: 0.7 },
          { opacity: 0.95, transform: 'translateY(0) scale(1) rotateZ(0deg)', offset: 0.9, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
          { opacity: 1, transform: 'translateY(0) scale(1)', offset: 1 }
        ],
        drop: [
          {  opacity: 0, transform: 'translateY(-50%)', offset: 0},
          { opacity: 1,transform: 'translateY(0)', offset:1}
        ],
        fade: [
          { opacity: 0, offset: 0 },
          { opacity: 1, offset: 1 }
        ],
        zoom: [
          { opacity: 0, transform: 'scale(0.2)', offset: 0 },
          { opacity: 1, transform: 'scale(1)', offset: 1 }
        ],
        swirl: [
          { opacity: 0, transform: 'rotate(-360deg) scale(0.5)', offset: 0 },
          { opacity: 1, transform: 'rotate(0deg) scale(1)', offset: 1 }
        ],
        pulse: [
          { transform: 'scale(1)', offset: 0 },
          { transform: 'scale(1.05)', offset: 0.5 },
          { transform: 'scale(1)', offset: 1 }
        ],
        shake: [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-10px)', offset: 0.2 },
          { transform: 'translateX(10px)', offset: 0.4 },
          { transform: 'translateX(-10px)', offset: 0.6 },
          { transform: 'translateX(10px)', offset: 0.8 },
          { transform: 'translateX(0)' }
        ],

      
      };

 const keyframes = animations[animationType];
   if (!keyframes) return;

  boundary.eachLayer(layer => {
    const path = layer._path;
    if (!path) return;
    path.getAnimations().forEach(a => a.cancel());
    path.animate(keyframes, {
      duration: 1500,
      fill: 'forwards',
      composite: 'accumulate'
    });
  });
}
