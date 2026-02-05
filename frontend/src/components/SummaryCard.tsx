import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SummaryCardProps {
  summary: { id: number; summary_date: string; email_count: number; summary_text: string; status: string };
}

export function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            {new Date(summary.summary_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </CardTitle>
          <Badge variant={summary.status === 'completed' ? 'default' : 'secondary'}>
            {summary.email_count}개의 이메일
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 whitespace-pre-wrap">{summary.summary_text}</p>
      </CardContent>
    </Card>
  );
}
