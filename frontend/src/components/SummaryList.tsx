import { SummaryCard } from './SummaryCard';

interface SummaryListProps { summaries: any[]; }

export function SummaryList({ summaries }: SummaryListProps) {
  if (summaries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">아직 요약이 없습니다.</p>
        <p className="text-sm text-gray-400 mt-2">첫 요약은 내일 아침 9시에 생성됩니다.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {summaries.map((summary) => <SummaryCard key={summary.id} summary={summary} />)}
    </div>
  );
}
