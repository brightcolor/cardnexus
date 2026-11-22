import Link from "next/link";

export function PlatformBrandLink({ appName, logoUrl }: { appName: string; logoUrl: string | null }) {
  return (
    <Link href="/" className="inline-flex items-center gap-1.5 font-medium hover:text-foreground">
      {logoUrl && <img src={logoUrl} alt="" className="h-4 w-4 rounded object-cover" />}
      {appName}
    </Link>
  );
}
