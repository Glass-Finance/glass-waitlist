// Blue icon rail on the far left of the animated dashboard mockup.
export default function NavRail() {
  return (
    <div className="w-12 bg-brand flex flex-col items-center pt-3 flex-shrink-0">
      <div className="mb-3.5">
        <img
          src="/Glass.webp"
          alt=""
          className="w-6 h-6 object-contain brightness-0 invert"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>
      <div className="w-[30px] h-[30px] rounded-lg bg-white flex items-center justify-center mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"
            stroke="#002FA7"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 21V12h6v9"
            stroke="#002FA7"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="w-5 h-px bg-white/20 mb-3" />
      <div className="w-[30px] h-[30px] rounded-lg bg-white text-brand text-[10px] font-extrabold flex items-center justify-center mb-[7px]">
        KC
      </div>
      <div className="w-[30px] h-[30px] rounded-lg bg-white/[0.18] text-white text-[10px] font-extrabold flex items-center justify-center">
        C1
      </div>
    </div>
  );
}
