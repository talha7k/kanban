import { KanbanBoard } from '@/components/kanban/KanbanBoard';

// This page could fetch board data based on boardId in a real app.
// For now, KanbanBoard component uses mock data.
export default function BoardPage({ params }: { params: { boardId: string } }) {
  return (
    <div className="h-full">
      {/* You can use params.boardId to fetch specific board data later */}
      <KanbanBoard />
    </div>
  );
}
