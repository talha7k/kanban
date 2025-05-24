import type { SVGProps } from 'react';

export function KanbanIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 5h12" />
      <path d="M6 12h12" />
      <path d="M6 19h12" />
      <path d="M6 5v14" />
      <path d="M12 5v14" />
      <path d="M18 5v14" />
    </svg>
  );
}
