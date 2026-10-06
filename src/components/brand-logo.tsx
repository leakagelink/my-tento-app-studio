// Bundled locally (not a hosted asset URL) so the logo also loads inside the Android app.
import myTentoMarkUrl from "@/assets/mytento-brand.webp";

const myTentoMark = { url: myTentoMarkUrl };

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className = "size-10", priority = false }: BrandLogoProps) {
  return (
    <img
      src={myTentoMark.url}
      alt="MyTento"
      width={256}
      height={256}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}