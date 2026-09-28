import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  eyebrowClassName?: string;
  eyebrowAction?: ReactNode;
  title: ReactNode;
  titleAction?: ReactNode;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ eyebrow, eyebrowClassName, eyebrowAction, title, titleAction, description, action }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <div className="page-header-eyebrow-line"><p className={`eyebrow${eyebrowClassName ? ` ${eyebrowClassName}` : ""}`}>{eyebrow}</p>{eyebrowAction}</div> : null}
        <div className="page-header-title-line"><h2>{title}</h2>{titleAction}</div>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {action ? <div className="page-action">{action}</div> : null}
    </header>
  );
}
