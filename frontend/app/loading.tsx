export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        {/* Spinning ring */}
        <div className="absolute w-20 h-20 rounded-full border-[3px] border-primary/20" />
        <div className="absolute w-20 h-20 rounded-full border-[3px] border-transparent border-t-primary brand-loader-ring" />

        {/* Pulsing glow */}
        <div className="absolute w-24 h-24 rounded-full bg-primary/5 brand-loader-pulse" />

        {/* Favicon */}
        <img
          src="/icon.svg"
          alt="FloraEvent"
          className="w-10 h-10 rounded-lg"
        />
      </div>
    </div>
  )
}
