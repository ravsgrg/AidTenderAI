import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBackground: string;
  iconColor: string;
  trend?: {
    value: number;
    label: string;
    isUpward: boolean;
  };
}

export function StatsCard({
  title,
  value,
  icon,
  iconBackground,
  iconColor,
  trend,
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${iconBackground} ${iconColor}`}>
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
        {trend && (
          <div className="mt-4">
            <span className={`text-sm font-medium flex items-center ${trend.isUpward ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isUpward ? <ArrowUp className="mr-1 h-4 w-4" /> : <ArrowDown className="mr-1 h-4 w-4" />}
              {trend.value}%
              <span className="text-gray-500 ml-2">{trend.label}</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
