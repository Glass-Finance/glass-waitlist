/**
 * Reveal — scroll-triggered entrance animation.
 * Uses inline transition styles so no CSS file needed.
 *
 * variant: 'up' | 'left' | 'right' | 'scale' | 'fade'
 * delay:   ms number (0, 80, 160, 240, 320, 400)
 */
export function Reveal({ children, variant = 'up', delay = 0, className = '' }) {
  const initial = {
    up:    'opacity-0 translate-y-8',
    left:  'opacity-0 -translate-x-8',
    right: 'opacity-0 translate-x-8',
    scale: 'opacity-0 scale-95',
    fade:  'opacity-0',
  };

  return (
    <div
      data-reveal
      data-delay={delay}
      className={`transition-all duration-700 ease-out ${initial[variant] ?? initial.up} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}