/** Marca: dois elos entrelaçados sobre um bloco azul. `size` é o lado do bloco. */
export default function Logo({ size = 30 }: { size?: number }) {
  const glyph = Math.round(size * 0.64);
  return (
    <span className="brand-mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="12" height="12" rx="3.5" stroke="currentColor" strokeWidth="2.2" />
        <rect x="10" y="5" width="12" height="12" rx="3.5" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    </span>
  );
}
