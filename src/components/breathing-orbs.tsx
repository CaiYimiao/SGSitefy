/**
 * Soft, slowly-breathing colored orbs for otherwise-plain app pages
 * (dashboard, wizard). Fixed behind content, non-interactive, and respects
 * prefers-reduced-motion. Styles live in globals.css (.orb-field).
 */
export function BreathingOrbs() {
  return (
    <div className="orb-field" aria-hidden="true">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
    </div>
  );
}
