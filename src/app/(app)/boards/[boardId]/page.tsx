
// This file is deprecated and replaced by src/app/(app)/projects/[projectId]/page.tsx
// Keeping it temporarily to avoid build errors if old links are hit,
// but it should be removed once all links are updated.
// Or, redirect to the new projects page.

import { redirect } from 'next/navigation';

export default function DeprecatedBoardPage({ params }: { params: { boardId: string } }) {
  // Redirect to a default project or a generic projects listing page if one exists
  // For now, redirecting to a sample project ID.
  redirect(`/projects/project-alpha`); 
}
