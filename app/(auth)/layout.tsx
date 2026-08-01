import Image from "next/image";
import logo from "../icon.png";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center justify-center gap-3">
          <Image src={logo} alt="" width={32} height={32} className="rounded-md" />
          <h1 className="text-center text-2xl font-semibold tracking-tight">
            Catat
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
