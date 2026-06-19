export const getMemberAuthRoute = () => {
  const isMobile = window.innerWidth < 768;

  return isMobile
    ? "/member/join"
    : "/member/signup";
};