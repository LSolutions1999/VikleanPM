import Image from "next/image";

export function BrandLogo({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="brand">
      <div className="brand-mark brand-mark-image">
        <Image src="/vikleanworklogored.png" alt="" width={44} height={44} priority />
      </div>
      <div>
        <p className="brand-kicker">{subtitle ?? "VikleanPM"}</p>
        <h1>{title}</h1>
      </div>
    </div>
  );
}
