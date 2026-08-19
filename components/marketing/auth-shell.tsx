import Link from "next/link";
import { Card } from "@/components/ui/card";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-primary-900">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
        <Link href="/" className="mb-8 block text-center text-2xl font-extrabold text-white">
          Auto360
        </Link>
        <Card className="p-6">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </Card>
      </div>
    </div>
  );
}
