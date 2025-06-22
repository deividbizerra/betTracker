import React from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProfitChart({ data, loading }) {
  if (loading) {
    return (
      <Card className="bg-[#1a1d27] border-0">
        <div className="p-4">
          <h3 className="text-base font-medium text-white">Lucro Diário (Últimos 30 dias)</h3>
          <div className="h-[250px] animate-pulse bg-gray-700/50 rounded-lg mt-3" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1a1d27] border-0">
      <div className="p-4">
        <h3 className="text-base font-medium text-white">Lucro Diário (Últimos 30 dias)</h3>
        <div className="h-[250px] mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                tick={{ fontSize: 11 }}
                tickFormatter={(date) => format(new Date(date), "dd/MM", { locale: ptBR })}
              />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1d27",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px"
                }}
                formatter={(value) => [`R$ ${value.toFixed(2)}`, "Lucro"]}
                labelFormatter={(date) => format(new Date(date), "dd 'de' MMMM", { locale: ptBR })}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}