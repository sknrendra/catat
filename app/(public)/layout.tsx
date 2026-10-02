import Image from "next/image";
import Link from "next/link";
import logo from "@/app/icon.png";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 min-h-0 overflow-y-auto">
      <header className="mx-auto flex max-w-3xl items-center gap-2 px-6 pt-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Image src={logo} alt="" width={20} height={20} className="rounded" />
          Catat
        </Link>
      </header>
      {children}
    </main>
  );
}
