import AuthPanel from "../assets/auth/auth-panel.png";

export default function AuthLayout({ children }) {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#F5F5F6] p-2">
      <div className="hidden md:block w-[46%] h-full flex-shrink-0 rounded-3xl overflow-hidden">
        <img src={AuthPanel} alt="Glass Finance" className="w-full h-full object-fill" />
      </div>
      <div className="flex-1 h-full flex flex-col justify-center items-center px-12 bg-[#F5F5F6] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}