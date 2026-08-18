declare module "next/server" {
  export type NextRequest = any;
  export const NextResponse: any;
}

declare module "next/navigation" {
  export function redirect(path: string): never;
  export function notFound(): never;
}

declare module "next/headers" {
  export function cookies(): any;
}

declare module "next/cache" {
  export function revalidatePath(path: string): void;
}

declare module "next/link" {
  const Link: any;
  export default Link;
}

declare module "next/image" {
  const Image: any;
  export default Image;
}

declare module "next/font/google" {
  export const IBM_Plex_Sans: any;
  export const Manrope: any;
}

declare module "next" {
  export type Metadata = any;
}

declare module "next/types.js" {
  export type ResolvingMetadata = unknown;
  export type ResolvingViewport = unknown;
}
