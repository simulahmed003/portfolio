import Image, { type ImageProps } from "next/image";
import { optimizable } from "@/lib/supabase";

// next/image that never crashes on an outside address: images from other sites are shown unoptimized.
export default function Pic(props: ImageProps & { src: string }) {
  const { src, alt, ...rest } = props;
  if (!src) return null;
  return <Image src={src} alt={alt ?? ""} unoptimized={!optimizable(src)} {...rest} />;
}
