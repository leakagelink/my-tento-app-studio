import myTentoMark from "@/assets/mytento-mark.png";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className = "size-10", priority = false }: BrandLogoProps) {
  return (
    <img
      src={myTentoMark}
      alt="MyTento"
      width={256}
      height={256}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}