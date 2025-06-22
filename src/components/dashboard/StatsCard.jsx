import React from "react";
import { Card } from "@/components/ui/card";

export default function StatsCard({ title, value, icon: Icon, trend, loading, isCurrency, isPercentage }) {
  
  const formatValue = () => {
    if (loading) return <div className="h-5 w-16 bg-gray-700 animate-pulse rounded mt-1" />;
    
    let displayValue = value;
    let valueColor = "text-white";

    if (isCurrency) {
      displayValue = `R$ ${Number(value).toFixed(2)}`;
      if (Number(value) > 0) valueColor = "text-green-500";
      else if (Number(value) < 0) valueColor = "text-red-500";
    } else if (isPercentage) {
      displayValue = `${Number(value).toFixed(2)}%`;
      if (Number(value) > 0) valueColor = "text-green-500";
      else if (Number(value) < 0) valueColor = "text-red-500";
    }
    
    return <p className={`mt-1 text-xl font-semibold ${valueColor}`}>{displayValue}</p>;
  };

  const formatTrend = () => {
    if (trend === undefined || trend === null) return null;
    const trendValue = Number(trend).toFixed(2);
    const trendColor = Number(trend) > 0 ? "text-green-500" : Number(trend) < 0 ? "text-red-500" : "text-gray-400";
    return <span className={`${trendColor} text-xs`}>{Number(trend) > 0 ? "+" : ""}{trendValue}%</span>;
  }

  return (
    <Card className="bg-[#1a1d27] border-0">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-500" />
          </div>
          {formatTrend()}
        </div>
        <h3 className="mt-3 text-xs font-medium text-gray-400">{title}</h3>
        {formatValue()}
      </div>
    </Card>
  );
}