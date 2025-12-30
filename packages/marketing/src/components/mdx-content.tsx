import { useMDXComponent } from "@content-collections/mdx/react";
import { Link } from "@tanstack/react-router";
import type { ComponentPropsWithoutRef } from "react";

type AnchorProps = ComponentPropsWithoutRef<"a">;

function Anchor({ href, children, ...props }: AnchorProps) {
  if (href?.startsWith("/")) {
    return (
      <Link to={href} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} rel="noopener noreferrer" target="_blank" {...props}>
      {children}
    </a>
  );
}

type ImgProps = ComponentPropsWithoutRef<"img">;

function Image({ alt, ...props }: ImgProps) {
  return (
    <img
      alt={alt ?? ""}
      loading="lazy"
      className="rounded-lg shadow-md"
      {...props}
    />
  );
}

const components = {
  a: Anchor,
  img: Image,
};

type MDXContentProps = {
  code: string;
  className?: string;
};

export function MDXContent({ code, className }: MDXContentProps) {
  const Component = useMDXComponent(code);
  return (
    <div className={className}>
      <Component components={components} />
    </div>
  );
}
