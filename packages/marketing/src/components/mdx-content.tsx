import { useMDXComponent } from "@content-collections/mdx/react";
import { useSmoothHashLink } from "@laxdb/ui/hooks/use-smooth-hash-link";
import { Link } from "@tanstack/react-router";
import type { ComponentPropsWithoutRef } from "react";

type AnchorProps = ComponentPropsWithoutRef<"a">;

function Anchor({ href, children, onClick, ...props }: AnchorProps) {
  const handleHashClick = useSmoothHashLink({ href, onClick });

  if (href?.startsWith("/")) {
    return (
      <Link to={href} {...props}>
        {children}
      </Link>
    );
  }

  if (href?.startsWith("#")) {
    return (
      <a href={href} onClick={handleHashClick} {...props}>
        {children}
      </a>
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
  return <img alt={alt ?? ""} loading="lazy" className="rounded-lg shadow-md" {...props} />;
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
