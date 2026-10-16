"use client";
import NextLink from "next/link";
import { useState, type ComponentProps } from "react";

/**
 * next/link that prefetches on intent (hover, focus, touch) instead of as soon
 * as the link scrolls into view. Hub pages list hundreds of links; viewport
 * prefetching fetched each target's payload, and every fetch is an ISR read
 * on Vercel. A hover still gives the page a head start before the click.
 * Pass prefetch explicitly to opt out of this behaviour.
 */
export default function Link(props: ComponentProps<typeof NextLink>) {
  const [intent, setIntent] = useState(false);
  if (props.prefetch !== undefined) return <NextLink {...props} />;
  const arm = () => setIntent(true);
  return (
    <NextLink
      {...props}
      prefetch={intent ? null : false}
      onMouseEnter={(e) => { arm(); props.onMouseEnter?.(e); }}
      onTouchStart={(e) => { arm(); props.onTouchStart?.(e); }}
      onFocus={(e) => { arm(); props.onFocus?.(e); }}
    />
  );
}
