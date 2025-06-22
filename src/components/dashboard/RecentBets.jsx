import React from "react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RecentBets({ bets, loading }) {
  if (loading) {
    return (
      <Card className="bg-[#1a1d27] border-0">
        <div className="p-4">
          <h3 className="text-base font-medium text-white mb-3">Apostas Recentes</h3>
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-12 bg-gray-700/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1a1d27] border-0">
      <div className="p-4">
        <h3 className="text-base font-medium text-white mb-3">Apostas Recentes</h3>
        <div className="space-y-3">
          {bets.map(bet => (
            <div key={bet.id} className="flex items-center justify-between p-3 rounded-lg bg-[#12141c]">
              <div>
                <p className="text-white font-medium text-sm">{bet.match}</p>
                <p className="text-xs text-gray-400">
                  {format(new Date(bet.date), "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <span className={`font-medium text-sm ${
                bet.status === "won" ? "text-green-500" : 
                bet.status === "lost" ? "text-red-500" : 
                "text-gray-400"
              }`}>
                {bet.status === "pending" ? "Pendente" :
                 `R$ ${bet.profit?.toFixed(2)}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}