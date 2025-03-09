import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  ChartLine, 
  Lightbulb 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AiInsight } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface AiInsightItemProps {
  insight: AiInsight;
}

function AiInsightItem({ insight }: AiInsightItemProps) {
  const getTypeIcon = () => {
    switch (insight.type) {
      case 'price_trend':
        return <ChartLine className="text-primary-600" />;
      case 'recommendation':
        return <Lightbulb className="text-success-500" />;
      case 'warning':
        return <AlertTriangle className="text-warning-500" />;
      default:
        return <ChartLine className="text-primary-600" />;
    }
  };
  
  const getSeverityClasses = () => {
    switch (insight.severity) {
      case 'info':
        return 'bg-blue-50 border-l-4 border-primary-500';
      case 'success':
        return 'bg-green-50 border-l-4 border-success-500';
      case 'warning':
        return 'bg-amber-50 border-l-4 border-warning-500';
      default:
        return 'bg-blue-50 border-l-4 border-primary-500';
    }
  };
  
  const getHeaderColor = () => {
    switch (insight.severity) {
      case 'info':
        return 'text-primary-800';
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-amber-800';
      default:
        return 'text-primary-800';
    }
  };

  const timeAgo = insight.createdAt 
    ? formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true }) 
    : 'recently';

  return (
    <div className={`p-4 rounded ${getSeverityClasses()}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getTypeIcon()}
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${getHeaderColor()}`}>{insight.title}</h3>
          <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
          <p className="text-xs text-gray-500 mt-2">{timeAgo}</p>
        </div>
      </div>
    </div>
  );
}

export function AiInsights() {
  const { data: insights, isLoading } = useQuery<AiInsight[]>({
    queryKey: ['/api/ai-insights'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
            <Button variant="link" className="text-primary-600 hover:text-primary-800 text-sm font-medium">View All</Button>
          </div>
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 h-24 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
          <Button variant="link" className="text-primary-600 hover:text-primary-800 text-sm font-medium">View All</Button>
        </div>
        <div className="space-y-5">
          {insights && insights.length > 0 ? (
            insights.slice(0, 3).map((insight) => (
              <AiInsightItem key={insight.id} insight={insight} />
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No AI insights available.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
