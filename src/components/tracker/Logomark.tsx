export default function Logomark({ size = 28 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className="logomark"
      aria-hidden="true"
    >
      <path d="M16,16 L16,2 A14,14 0 0,1 20.3,29.3 Z" fill="var(--protein)" />
      <path d="M16,16 L20.3,29.3 A14,14 0 0,1 2.7,11.7 Z" fill="var(--carbs)" />
      <path d="M16,16 L2.7,11.7 A14,14 0 0,1 16,2 Z" fill="var(--fat)" />
      <circle cx="16" cy="16" r="5.5" fill="var(--bg)" />
    </svg>
  );
}
