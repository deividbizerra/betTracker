
import React, { useState, useEffect } from "react";
import { Bet, Bankroll, User } from "@/api/entities";
import { Wallet, TrendingUp, DollarSign, Percent } from "lucide-react";
import StatsCard from "../components/dashboard/StatsCard";
import ProfitChart from "../components/dashboard/ProfitChart";
import RecentBets from "../components/dashboard/RecentBets";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBankrolls: 0,
    totalBets: 0,
    totalProfit: 0,
    roi: 0
  });
  const [profitData, setProfitData] = useState([]);
  const [recentBets, setRecentBets] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = await User.me();
      const [bankrolls, bets] = await Promise.all([
        Bankroll.filter({ created_by: user.email }),
        Bet.filter({ created_by: user.email }, "-date")
      ]);

      const totalProfit = bets.reduce((sum, bet) => sum + (bet.profit || 0), 0);
      const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0);
      const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;

      setStats({
        totalBankrolls: bankrolls.length,
        totalBets: bets.length,
        totalProfit,
        roi
      });

      const last30Days = [...Array(30)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const dailyProfits = last30Days.map(date => {
        const dayBets = bets.filter(bet => 
          bet.date.split('T')[0] === date
        );
        return {
          date,
          profit: dayBets.reduce((sum, bet) => sum + (bet.profit || 0), 0)
        };
      });

      setProfitData(dailyProfits);
      setRecentBets(bets.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-white mb-4">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatsCard
          title="Total de Bankrolls"
          value={stats.totalBankrolls}
          icon={Wallet}
          loading={loading}
        />
        <StatsCard
          title="Total de Apostas"
          value={stats.totalBets}
          icon={TrendingUp}
          loading={loading}
        />
        <StatsCard
          title="Lucro/Perda Total"
          value={stats.totalProfit}
          icon={DollarSign}
          isCurrency={true}
          trend={stats.roi}
          loading={loading}
        />
        <StatsCard
          title="ROI Geral"
          value={stats.roi}
          icon={Percent}
          isPercentage={true}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ProfitChart data={profitData} loading={loading} />
        </div>
        <div>
          <RecentBets bets={recentBets} loading={loading} />
        </div>
      </div>
    </div>
  );
}
