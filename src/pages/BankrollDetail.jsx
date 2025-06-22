
import React, { useState, useEffect, useMemo } from "react";
import { Bet, Bankroll, Sport, Bookie, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Filter, Plus, Pencil, Copy, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import BetFiltersModal from "@/components/modals/BetFiltersModal";
import BetStatusUpdateModal from "@/components/modals/BetStatusUpdateModal";
import UpgradeModal from "@/components/modals/UpgradeModal";

export default function BankrollDetail() {
  const navigate = useNavigate();
  const [bankroll, setBankroll] = useState(null);
  const [allBets, setAllBets] = useState([]);
  const [bets, setBets] = useState([]); // This state seems unused, but let's keep it for now as it's not removed by outline.
  const [sports, setSports] = useState([]);
  const [bookies, setBookies] = useState([]);
  const [showNewBet, setShowNewBet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBet, setSelectedBet] = useState(null);
  const [editingBetId, setEditingBetId] = useState(null);
  const [monthsExpanded, setMonthsExpanded] = useState({});
  const [statsCards, setStatsCards] = useState({
    totalBets: 0,
    totalProfit: 0,
    roi: 0,
    progress: 0
  });

  const [newBet, setNewBet] = useState({
    bankroll_id: "",
    bookie_id: "",
    sport_id: "",
    match: "",
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    stake: "",
    odds: "",
    bet_type: "Simples",
    status: "pending",
    commission: 0
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState({ open: false, id: null });

  const [filters, setFilters] = useState({
    dateFrom: null,
    dateTo: null,
    status: "all",
    bookieId: "all",
    betType: "all" // New filter for bet type
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [betForStatusUpdate, setBetForStatusUpdate] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const bankrollId = urlParams.get('id');
    if (bankrollId) {
      loadData(bankrollId);
    } else {
      navigate(createPageUrl("Bankrolls"));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside any bet row and also outside the action buttons.
      // The status bar is also part of the bet, so we need to ensure it doesn't close on clicking the status bar.
      if (!event.target.closest('.bet-row') && !event.target.closest('.bet-actions') && !event.target.closest('.bet-status-column')) {
        setSelectedBet(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadData = async (bankrollId) => {
    try {
      const user = await User.me();
      const [bankrollData, betsData, sportsData, bookiesData] = await Promise.all([
        Bankroll.filter({ id: bankrollId, created_by: user.email }),
        Bet.filter({ bankroll_id: bankrollId }, "-date"), // Bets fetched, profit should be from DB
        Sport.list(),
        Bookie.list()
      ]);
      
      if (bankrollData.length > 0) {
        setBankroll(bankrollData[0]);
        
        // Set bets directly from fetched data. Profit is assumed to be correct from DB for new bets.
        // The handleCreateBet function is responsible for saving the correct profit.
        setAllBets(betsData); 
        setSports(sportsData);
        setBookies(bookiesData);
        
        // Calculate stats based on betsData (profit from DB)
        const totalBets = betsData.length;
        const totalProfit = betsData.reduce((sum, bet) => sum + (bet.profit || 0), 0);
        const totalStake = betsData.reduce((sum, bet) => sum + bet.stake, 0);
        const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
        const progress = bankrollData[0].initial_amount > 0 
          ? (totalProfit / bankrollData[0].initial_amount) * 100 
          : 0;
          
        setStatsCards({
          totalBets,
          totalProfit,
          roi,
          progress
        });
        
        // Update bankroll with potentially more accurate aggregate values
        const currentBankrollAmount = bankrollData[0].initial_amount + totalProfit;
        if (bankrollData[0].current_amount !== currentBankrollAmount ||
            bankrollData[0].roi !== roi ||
            bankrollData[0].progress !== progress) {
          
          await Bankroll.update(bankrollId, {
            ...bankrollData[0],
            current_amount: currentBankrollAmount,
            roi: roi,
            progress: progress
          });
          // Update the local bankroll state if you rely on it for display elsewhere on this page immediately
          setBankroll(prev => ({...prev, current_amount: currentBankrollAmount, roi, progress}));
        }
        
        setNewBet(prev => ({ ...prev, bankroll_id: bankrollId }));
      } else {
        navigate(createPageUrl("Bankrolls"));
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };
  
    const filteredBets = useMemo(() => {
    return allBets.filter(bet => {
      let passesDateFilter = true;
      if (filters.dateFrom) {
        passesDateFilter = passesDateFilter && new Date(bet.date) >= new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        passesDateFilter = passesDateFilter && new Date(bet.date) <= toDate;
      }

      const passesStatusFilter = filters.status === "all" || bet.status === filters.status;
      const passesBookieFilter = filters.bookieId === "all" || bet.bookie_id === filters.bookieId;
      const passesBetTypeFilter = filters.betType === "all" || bet.bet_type === filters.betType;

      return passesDateFilter && passesStatusFilter && passesBookieFilter && passesBetTypeFilter;
    });
  }, [allBets, filters]);

  useEffect(() => {
    if (bankroll && filteredBets.length > 0) {
      const totalProfit = filteredBets.reduce((sum, bet) => sum + (bet.profit || 0), 0);
      const totalStake = filteredBets.reduce((sum, bet) => sum + bet.stake, 0);
      const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
      const progress = bankroll.initial_amount > 0 
        ? (totalProfit / bankroll.initial_amount) * 100 
        : 0;
        
      setStatsCards({
        totalBets: filteredBets.length,
        totalProfit,
        roi,
        progress
      });
    } else if (bankroll) {
        setStatsCards({
            totalBets: 0,
            totalProfit: 0,
            roi: 0,
            progress: 0
        });
    }
  }, [filteredBets, bankroll]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: null,
      dateTo: null,
      status: "all",
      bookieId: "all",
      betType: "all" // Clear bet type filter too
    });
  };

  const DEFAULT_BET_LIMIT_BANKROLL_DETAIL = 50; // Define default bet limit locally

  const handleOpenStatusUpdate = (bet) => {
    setBetForStatusUpdate(bet);
    setShowStatusUpdateModal(true);
  };

  const handleUpdateBetStatus = async (betId, updateData) => {
    try {
      const user = await User.me();
      if (user.is_blocked) {
        alert("Sua conta está bloqueada. Você não pode atualizar apostas.");
        return;
      }

      const betToUpdate = allBets.find(b => b.id === betId);
      if (!betToUpdate) return;

      const { status } = updateData;
      
      const stake = betToUpdate.stake;
      const odds = betToUpdate.odds;
      const commissionPercent = betToUpdate.commission || 0;
      
      let finalProfit = 0;
      
      // Calculate profit based on bet type and new status
      if (betToUpdate.bet_type === "Back") {
        if (status === "won") {
          const grossWin = stake * (odds - 1);
          finalProfit = grossWin - (grossWin * commissionPercent / 100);
        } else if (status === "lost") {
          finalProfit = -stake;
        } else {
          finalProfit = 0; // Pending
        }
      } else if (betToUpdate.bet_type === "Lay") {
        const responsibility = (odds - 1) * stake;
        if (status === "won") {
          finalProfit = stake - (stake * commissionPercent / 100);
        } else if (status === "lost") {
          finalProfit = -responsibility;
        } else {
          finalProfit = 0; // Pending
        }
      } else { // Simple bet
        if (status === "won") {
          finalProfit = stake * (odds - 1);
        } else if (status === "lost") {
          finalProfit = -stake;
        } else {
          finalProfit = 0; // Pending
        }
      }
      
      // If it's a cashout
      if (updateData.cashout_value !== undefined) {
        finalProfit = updateData.cashout_value - stake;
        // The backend would need to store this cashout value separately if needed
      }

      await Bet.update(betId, {
        ...betToUpdate,
        status,
        profit: finalProfit,
        net_profit: finalProfit
      });
      
      await loadData(bankroll.id); // Reload all data
    } catch (error) {
      console.error("Error updating bet status:", error);
      alert("Erro ao atualizar status da aposta. Tente novamente.");
    }
  };

  const handleCreateBet = async () => {
    try {
      const user = await User.me();
      if (user.is_blocked) {
        alert("Sua conta está bloqueada. Você não pode criar ou editar apostas.");
        setShowNewBet(false);
        return;
      }

      // Check if user is PRO or has unlimited bets
      const isPro = user.plan_type === 'pro' && user.subscription_status === 'active';
      
      if (!isPro && !editingBetId) { // Only apply limit if not PRO and creating a new bet
        const userBets = await Bet.filter({ created_by: user.email });
        const currentBetLimit = (user.bet_limit_override !== null && user.bet_limit_override !== undefined)
          ? user.bet_limit_override
          : DEFAULT_BET_LIMIT_BANKROLL_DETAIL;

        if (userBets.length >= currentBetLimit) {
          setShowNewBet(false); // Close the new bet dialog
          setShowUpgradeModal(true); // Show upgrade modal
          return; // Stop further execution
        }
      }

      const stake = parseFloat(newBet.stake);
      const odds = parseFloat(newBet.odds);
      const commissionPercent = parseFloat(newBet.commission) || 0;
      
      let finalProfit = 0;
      let calculatedResponsibility = 0;

      if (newBet.bet_type === "Back") {
        if (newBet.status === "won") {
          const grossWin = stake * (odds - 1);
          finalProfit = grossWin - (grossWin * commissionPercent / 100);
        } else if (newBet.status === "lost") {
          finalProfit = -stake;
        } // 'pending' profit is 0
      } else if (newBet.bet_type === "Lay") {
        calculatedResponsibility = (odds - 1) * stake;
        if (newBet.status === "won") { // Lay bet wins (event you bet against didn't happen)
          finalProfit = stake - (stake * commissionPercent / 100);
        } else if (newBet.status === "lost") { // Lay bet loses (event you bet against happened)
          finalProfit = -calculatedResponsibility;
        } // 'pending' profit is 0
      } else { // Simples
        if (newBet.status === "won") {
          finalProfit = stake * (odds - 1);
        } else if (newBet.status === "lost") {
          finalProfit = -stake;
        } // 'pending' profit is 0
      }

      const betData = {
        ...newBet, // includes bankroll_id, bookie_id, sport_id, match, date, bet_type, status
        stake: stake,
        odds: odds,
        profit: finalProfit, // This is the net financial impact
        net_profit: finalProfit, // Storing net_profit as the same for simplicity, profit is already net
        commission: commissionPercent,
        responsibility: (newBet.bet_type === "Lay") ? calculatedResponsibility : 0,
      };

      if (editingBetId) {
        await Bet.update(editingBetId, betData);
        setEditingBetId(null);
      } else {
        await Bet.create({
          ...betData,
          created_by: user.email // ensure created_by is set for new bets
        });
      }
      
      setShowNewBet(false);
      setNewBet({
        bankroll_id: bankroll.id,
        bookie_id: "",
        sport_id: "",
        match: "",
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        stake: "",
        odds: "",
        bet_type: "Simples",
        status: "pending",
        commission: 0
      });
      
      await loadData(bankroll.id); // Reload all data
    } catch (error) {
      console.error("Error creating/updating bet:", error);
      alert(`Erro ao ${editingBetId ? 'salvar' : 'criar'} aposta: ${error.message || 'Tente novamente.'}`);
    }
  };

  const handleEditBet = (bet) => {
    setEditingBetId(bet.id);
    setNewBet({
      ...bet,
      date: format(new Date(bet.date), "yyyy-MM-dd'T'HH:mm")
    });
    setShowNewBet(true);
  };

  const handleCopyBet = (bet) => {
    setEditingBetId(null);
    setNewBet({
      ...bet,
      date: format(new Date(bet.date), "yyyy-MM-dd'T'HH:mm"),
      status: "pending",
      profit: 0
    });
    setShowNewBet(true);
  };

  const handleRemoveBet = async (betId) => {
    setDeleteConfirmation({ open: true, id: betId });
  };
  
  const confirmDeleteBet = async () => {
    try {
      await Bet.delete(deleteConfirmation.id);
      await loadData(bankroll.id);
      setSelectedBet(null);
      setDeleteConfirmation({ open: false, id: null });
    } catch (error) {
      console.error("Erro ao remover aposta:", error);
      alert("Erro ao remover aposta. Tente novamente.");
    }
  };

  const toggleBetSelection = (bet) => {
    setSelectedBet(prev => prev?.id === bet.id ? null : bet);
  };

  const formatCurrency = (value) => {
    return `R$ ${Number(value).toFixed(2)}`;
  };

  const prepareChartData = (betsToChart) => {
    if (!betsToChart || betsToChart.length === 0 || !bankroll) return [{ date: format(new Date(), 'yyyy-MM-dd'), balance: bankroll?.initial_amount || 0 }];
    
    const sortedBets = [...betsToChart].sort((a, b) => new Date(a.date) - new Date(b.date));
    let currentBalance = bankroll.initial_amount;
    
    const chartData = [{ 
      date: sortedBets[0].date.split('T')[0], // Point before first bet, or on first bet date
      balance: bankroll.initial_amount 
    }];

    // Group profits by day to show daily balance changes
    const dailyProfitMap = new Map();
    sortedBets.forEach(bet => {
      if (bet.status !== "pending") { // Only consider resolved bets
        const betDate = bet.date.split('T')[0];
        dailyProfitMap.set(betDate, (dailyProfitMap.get(betDate) || 0) + (bet.profit || 0));
      }
    });
    
    // Get unique sorted dates from bets
    const uniqueDates = [...new Set(sortedBets.map(b => b.date.split('T')[0]))].sort();

    if (uniqueDates.length === 0 && bankroll) { // Handle case with no bets but initial amount
        return [{ date: format(new Date(), 'yyyy-MM-dd'), balance: bankroll.initial_amount }];
    }
    
    // If first bet date is after bankroll creation, ensure initial point
    // This is somewhat handled by the initial `chartData` entry.

    uniqueDates.forEach(date => {
      currentBalance += (dailyProfitMap.get(date) || 0);
      chartData.push({
        date: date,
        balance: currentBalance
      });
    });
    
    // If there are no bets, chart should still show initial amount
    if(chartData.length === 1 && chartData[0].balance === bankroll.initial_amount && betsToChart.length === 0){
        // Add a second point for today if no bets to make the line visible
        // chartData.push({ date: format(new Date(), 'yyyy-MM-dd'), balance: bankroll.initial_amount });
        // Or just return the single point if Recharts handles it. Let's stick to the current logic for now.
    }


    return chartData.filter((item, index, self) => 
        index === 0 || item.date !== self[index-1].date || item.balance !== self[index-1].balance
    ); // Remove consecutive duplicate entries if balance didn't change on same day, keep first entry
  };

  const getBookieName = (bookieId) => {
    const bookie = bookies.find(b => b.id === bookieId);
    return bookie ? bookie.name : '';
  };
  
  const getBookieLogo = (bookieId) => {
    const bookie = bookies.find(b => b.id === bookieId);
    return bookie ? bookie.logo_url : '';
  };
  
  const getSportIcon = (sportId) => {
    const sport = sports.find(s => s.id === sportId);
    return sport ? sport.icon : '🎮';
  };

  const renderStatusBadge = (status) => {
    if (status === "won") {
      return <div className="bg-green-600 text-white py-1 px-3 rounded text-center">Ganho</div>;
    } else if (status === "lost") {
      return <div className="bg-red-600 text-white py-1 px-3 rounded text-center">Perda</div>;
    }
    return <div className="bg-gray-600 text-white py-1 px-3 rounded text-center">Pendente</div>;
  };
  
  const groupBetsByMonth = (betsToGroup) => {
    const grouped = {};
    betsToGroup.forEach(bet => {
      const date = new Date(bet.date);
      const monthKey = format(date, 'yyyy-MM');
      const monthDisplay = format(date, "MMMM yyyy", { locale: ptBR }).toUpperCase();
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          display: monthDisplay,
          total: 0,
          weeks: {}
        };
      }

      grouped[monthKey].total += (bet.profit || 0);

      const weekNumber = Math.ceil(date.getDate() / 7);
      const weekName = `Semana ${weekNumber}`;
      if (!grouped[monthKey].weeks[weekName]) {
        grouped[monthKey].weeks[weekName] = [];
      }
      grouped[monthKey].weeks[weekName].push(bet);
    });
    return grouped;
  };

  const getWeekProfit = (weekBets) => {
    return weekBets.reduce((sum, bet) => sum + (bet.profit || 0), 0);
  };

  const toggleMonth = (monthKey) => {
    setMonthsExpanded(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <Button
          size="sm"
          onClick={() => navigate(createPageUrl("Bankrolls"))}
          className="bg-gray-600 text-white hover:bg-gray-700 border border-gray-700 h-8 w-8 p-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white">{bankroll.name}</h1>
          <span className={`text-sm ${statsCards.progress >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {statsCards.progress >= 0 ? '+' : ''}{statsCards.progress.toFixed(2)}%
          </span>
        </div>
        
        <div className="flex-1"></div>
        
        <Button 
          size="sm"
          className="bg-blue-600 text-white hover:bg-blue-700 gap-2 border border-blue-700 h-8 px-3 text-sm"
          onClick={() => setShowFilterModal(true)}
        >
          <Filter className="w-3 h-3" />
          Filtros
        </Button>
        
        <Button
          onClick={async () => {
            try {
              const currentUser = await User.me();
              if (currentUser.is_blocked) {
                alert("Sua conta está bloqueada. Você não pode adicionar novas apostas.");
                return;
              }

              // Check if user is PRO
              const isPro = currentUser.plan_type === 'pro' && currentUser.subscription_status === 'active';
              
              if (!isPro) { // If not PRO, check limits
                const userBets = await Bet.filter({ created_by: currentUser.email });
                const currentBetLimit = (currentUser.bet_limit_override !== null && currentUser.bet_limit_override !== undefined)
                  ? currentUser.bet_limit_override
                  : DEFAULT_BET_LIMIT_BANKROLL_DETAIL;

                if (userBets.length >= currentBetLimit) {
                  setShowUpgradeModal(true); // Show upgrade modal if limit reached
                  return; // Stop further execution
                }
              }
            } catch (error) {
              console.error("Error fetching user status:", error);
              return;
            }

            setEditingBetId(null);
            setNewBet({
              bankroll_id: bankroll.id,
              bookie_id: "",
              sport_id: "",
              match: "",
              date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
              stake: "",
              odds: "",
              bet_type: "Simples",
              status: "pending",
              commission: 0
            });
            setShowNewBet(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-sm"
        >
          <Plus className="w-3 h-3 mr-1" />
          Nova Aposta
        </Button>
      </div>

      <div className="mb-4">
        <div className="h-48 bg-[#1a1d27] rounded-lg overflow-hidden p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={prepareChartData(filteredBets)}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                tick={{ fontSize: 10 }}
                tickFormatter={(date) => format(new Date(date), "dd/MM", { locale: ptBR })}
                axisLine={{ stroke: '#374151' }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                domain={['auto', 'auto']}
                axisLine={{ stroke: '#374151' }}
                scale="linear"
                allowDataOverflow={true}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1d27",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "11px"
                }}
                formatter={(value, name, props) => [
                    `R$ ${Number(value).toFixed(2)}`, 
                    "Saldo Total"
                ]}
                labelFormatter={(date) => format(new Date(date), "dd/MM/yyyy", { locale: ptBR })}
              />
              <Area 
                type="monotone" 
                dataKey="balance"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorBalance)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-[#1a1d27] rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">APOSTAS</div>
          <div className="text-white text-lg font-bold">{statsCards.totalBets}</div>
        </div>
        
        <div className="bg-[#1a1d27] rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">LUCRO</div>
          <div className={`text-lg font-bold ${statsCards.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            R$ {statsCards.totalProfit.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-[#1a1d27] rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">ROI</div>
          <div className={`text-lg font-bold ${statsCards.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {statsCards.roi.toFixed(2)}%
          </div>
        </div>
        
        <div className="bg-[#1a1d27] rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">PROGRESSO</div>
          <div className={`text-lg font-bold ${statsCards.progress >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {statsCards.progress.toFixed(2)}%
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {Object.entries(groupBetsByMonth(filteredBets)).map(([monthKey, monthData]) => (
          <div key={monthKey} className="space-y-1">
            <button 
              onClick={() => toggleMonth(monthKey)}
              className="flex items-center justify-between w-full p-2 bg-[#1a1d27] hover:bg-[#22263A] rounded-md"
            >
              <div className="flex items-center gap-2">
                {monthsExpanded[monthKey] ? 
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down w-4 h-4"><path d="m6 9 6 6 6-6"/></svg> : 
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up w-4 h-4"><path d="m18 15-6-6-6 6"/></svg>
                }
                <span className="font-medium text-white text-sm">{monthData.display}</span>
              </div>
              <div className={`py-1 px-2 rounded-md text-white text-sm ${monthData.total >= 0 ? 'bg-green-600' : 'bg-red-600'}`}>
                R$ {monthData.total.toFixed(2)}
              </div>
            </button>

            {monthsExpanded[monthKey] && (
              <div className="space-y-3">
                {Object.entries(monthData.weeks).map(([week, weekBets]) => (
                  <div key={week} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-xs">{week}</span>
                      <div className={`py-1 px-2 rounded-md text-white text-xs ${getWeekProfit(weekBets) >= 0 ? 'bg-green-600' : 'bg-red-600'}`}>
                        R$ {getWeekProfit(weekBets).toFixed(2)}
                      </div>
                    </div>
                    
                    {weekBets.map((bet) => (
                      <div key={bet.id} className="relative mb-1 bg-[#1a1d27] rounded-md overflow-hidden">
                        <div className="pr-8">
                          <div 
                            className="bet-row flex cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBetSelection(bet);
                            }}
                          >
                            <div className="flex-1 flex items-center p-3">
                              <div className="flex items-center gap-2 w-52">
                                <span className="text-gray-400 text-sm whitespace-nowrap">
                                  {format(new Date(bet.date), "dd/MM/yyyy - HH:mm")}
                                </span>
                                <Badge 
                                  className={`
                                    ${bet.bet_type === "Lay" ? "bg-red-500/20 text-red-400 border-red-500/40" :
                                      bet.bet_type === "Back" ? "bg-green-500/20 text-green-400 border-green-500/40" :
                                      "bg-blue-500/20 text-blue-400 border-blue-500/30"}
                                    border`}
                                >
                                  {bet.bet_type}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getSportIcon(bet.sport_id)}</span>
                                  <span className="text-white">{bet.match}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-end gap-6">
                                <div className="w-24 flex justify-center items-center">
                                  {bet.bookie_id && (
                                    <img 
                                      src={getBookieLogo(bet.bookie_id)} 
                                      alt={getBookieName(bet.bookie_id)} 
                                      className="h-6 opacity-80"
                                      style={{ borderRadius: "0.25rem" }}
                                    />
                                  )}
                                </div>
                                
                                <div className="w-24 text-center">
                                  <div className="text-xs text-gray-400">COTAÇÃO</div>
                                  <div className="text-white">{bet.odds.toFixed(2)}</div>
                                </div>
                                
                                <div className="w-28 text-center">
                                  <div className="text-xs text-gray-400">VALOR</div>
                                  <div className="text-white whitespace-nowrap">R$ {bet.stake.toFixed(2)}</div>
                                </div>
                                
                                <div className="w-28 text-center">
                                  <div className="text-xs text-gray-400">GANHO</div>
                                  <div className={`${bet.status === "won" ? "text-green-500" : "text-gray-400"} whitespace-nowrap`}>
                                    {bet.status === "won" 
                                      ? `R$ ${(bet.stake * bet.odds - bet.stake).toFixed(2)}` 
                                      : `R$ 0.00`}
                                  </div>
                                </div>
                                
                                <div className="w-28 text-center">
                                  <div className="text-xs text-gray-400">LUCRO</div>
                                  <div className={
                                    `${bet.profit > 0 ? "text-green-500" : 
                                    bet.profit < 0 ? "text-red-500" : 
                                    "text-gray-400"} whitespace-nowrap`
                                  }>
                                    {bet.profit !== 0 ? `R$ ${bet.profit.toFixed(2)}` : "R$ 0.00"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {selectedBet?.id === bet.id && (
                            <div className="flex border-t border-gray-700/50 bet-actions">
                              <div className="flex-1 grid grid-cols-3">
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleEditBet(bet);
                                  }}
                                  className="flex items-center justify-center gap-1 py-2 text-blue-400 hover:bg-[#242838] text-sm"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Editar</span>
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleCopyBet(bet);
                                  }}
                                  className="flex items-center justify-center gap-1 py-2 text-cyan-400 hover:bg-[#242838] text-sm"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copiar</span>
                                </button>
                                
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRemoveBet(bet.id);
                                  }}
                                  className="flex items-center justify-center gap-1 py-2 text-red-400 hover:bg-[#242838] text-sm"
                                >
                                  <Trash className="w-3 h-3" />
                                  <span>Remover</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div 
                          className={`absolute top-0 right-0 h-full w-8 flex items-center justify-center cursor-pointer bet-status-column ${
                            bet.status === "won" ? "bg-green-600" : 
                            bet.status === "lost" ? "bg-red-600" : 
                            "bg-gray-600"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStatusUpdate(bet);
                          }}
                        >
                          <span 
                            className="text-white transform rotate-180" 
                            style={{ writingMode: 'vertical-rl' }}
                          >
                            <span className={`uppercase transition-all duration-200 ${selectedBet?.id === bet.id ? 'font-extrabold tracking-wider text-sm' : 'font-semibold'}`} style={{ fontSize: selectedBet?.id === bet.id ? undefined : '0.60rem' }}>
                              {bet.status === "won" ? "GANHO" : 
                               bet.status === "lost" ? "PERDA" : 
                               "PENDENTE"}
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <Dialog open={showNewBet} onOpenChange={setShowNewBet}>
        <DialogContent className="bg-[#1a1d27] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>{editingBetId ? "Editar Aposta" : "Nova Aposta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Casa de Apostas</label>
                <Select
                  value={newBet.bookie_id}
                  onValueChange={(value) => setNewBet(prev => ({ ...prev, bookie_id: value }))}
                >
                  <SelectTrigger className="bg-[#12141c] border-gray-700 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d27] border-gray-700 text-white">
                    {bookies.map(bookie => (
                      <SelectItem key={bookie.id} value={bookie.id} className="text-white">
                        {bookie.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Esporte</label>
                <Select
                  value={newBet.sport_id}
                  onValueChange={(value) => setNewBet(prev => ({ ...prev, sport_id: value }))}
                >
                  <SelectTrigger className="bg-[#12141c] border-gray-700 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d27] border-gray-700 text-white">
                    {sports.map(sport => (
                      <SelectItem key={sport.id} value={sport.id} className="text-white">
                        {sport.icon} {sport.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Partida/Evento</label>
              <Input
                value={newBet.match}
                onChange={(e) => setNewBet(prev => ({ ...prev, match: e.target.value }))}
                className="bg-[#12141c] border-gray-700 text-white"
                placeholder="Time A x Time B"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Data e Hora</label>
                <Input
                  type="datetime-local"
                  value={newBet.date}
                  onChange={(e) => setNewBet(prev => ({ ...prev, date: e.target.value }))}
                  className="bg-[#12141c] border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Stake</label>
                <Input
                  type="number"
                  value={newBet.stake}
                  onChange={(e) => setNewBet(prev => ({ ...prev, stake: e.target.value }))}
                  className="bg-[#12141c] border-gray-700 text-white"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Odds</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newBet.odds}
                  onChange={(e) => setNewBet(prev => ({ ...prev, odds: e.target.value }))}
                  className="bg-[#12141c] border-gray-700 text-white"
                  placeholder="1.50"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Tipo de Aposta</label>
                <div className="flex gap-2">
                  <Badge 
                    variant="outline" 
                    className={`cursor-pointer ${newBet.bet_type === "Simples" 
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/40" 
                      : "text-gray-400 border-gray-700"}`}
                    onClick={() => setNewBet(prev => ({ ...prev, bet_type: "Simples" }))}
                  >
                    Simples
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`cursor-pointer ${newBet.bet_type === "Back" 
                      ? "bg-green-500/20 text-green-400 border-green-500/40" 
                      : "text-gray-400 border-gray-700"}`}
                    onClick={() => setNewBet(prev => ({ ...prev, bet_type: "Back" }))}
                  >
                    Back
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`cursor-pointer ${newBet.bet_type === "Lay" 
                      ? "bg-red-500/20 text-red-400 border-red-500/40" 
                      : "text-gray-400 border-gray-700"}`}
                    onClick={() => setNewBet(prev => ({ ...prev, bet_type: "Lay" }))}
                  >
                    Lay
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Status</label>
                <Select
                  value={newBet.status}
                  onValueChange={(value) => setNewBet(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="bg-[#12141c] border-gray-700 text-white">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d27] border-gray-700 text-white">
                    <SelectItem value="pending" className="text-white">Pendente</SelectItem>
                    <SelectItem value="won" className="text-white">Ganho</SelectItem>
                    <SelectItem value="lost" className="text-white">Perda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(newBet.bet_type === "Back" || newBet.bet_type === "Lay") && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Comissão (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newBet.commission || ""}
                  onChange={(e) => setNewBet(prev => ({ ...prev, commission: parseFloat(e.target.value) || 0 }))}
                  className="bg-[#12141c] border-gray-700 text-white"
                  placeholder="Ex: 5"
                />
              </div>
            )}

            {newBet.bet_type === "Lay" && newBet.stake && newBet.odds && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Responsabilidade</label>
                <div className="bg-[#12141c] border border-gray-700 rounded-md p-3 text-white">
                  R$ {((newBet.odds - 1) * newBet.stake).toFixed(2)}
                </div>
              </div>
            )}

            {newBet.stake && newBet.odds && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Lucro Líquido {newBet.bet_type === "Lay" ? "(se vencer)" : ""}
                </label>
                <div className="bg-[#12141c] border border-gray-700 rounded-md p-3 text-white">
                  {(() => {
                    const stake = parseFloat(newBet.stake);
                    const odds = parseFloat(newBet.odds);
                    const commission = parseFloat(newBet.commission) || 0;
                    
                    if (newBet.bet_type === "Back") {
                      const grossProfit = stake * (odds - 1);
                      const commissionAmount = (grossProfit * commission) / 100;
                      return `R$ ${(grossProfit - commissionAmount).toFixed(2)}`;
                    } else if (newBet.bet_type === "Lay") {
                      const profit = stake;
                      const commissionAmount = (profit * commission) / 100;
                      return `R$ ${(profit - commissionAmount).toFixed(2)}`;
                    } else {
                      return `R$ ${(stake * (odds - 1)).toFixed(2)}`;
                    }
                  })()}
                </div>
              </div>
            )}
            
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowNewBet(false);
                setEditingBetId(null);
              }}
              className="text-red-400 hover:bg-red-900/20 hover:text-red-300"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateBet}
              className="bg-green-600 hover:bg-green-700"
              disabled={!newBet.match || !newBet.stake || !newBet.odds}
            >
              {editingBetId ? "Salvar" : "Criar Aposta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        isOpen={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, id: null })}
        onConfirm={confirmDeleteBet}
        title="Confirmar exclusão da Aposta"
        description="Tem certeza que deseja excluir esta aposta? Esta ação não pode ser desfeita."
      />

      <BetFiltersModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        bookies={bookies}
      />
      
      {/* Bet Status Update Modal */}
      <BetStatusUpdateModal
        isOpen={showStatusUpdateModal}
        onClose={() => {
          setShowStatusUpdateModal(false);
          setBetForStatusUpdate(null);
        }}
        bet={betForStatusUpdate}
        onUpdate={handleUpdateBetStatus}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}
