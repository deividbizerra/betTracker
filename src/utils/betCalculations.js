export function calculateBetProfit(bet) {
  const { stake, odds, bet_type, status, commission = 0 } = bet;
  
  if (status === "pending") return 0;
  
  const stakeAmount = parseFloat(stake);
  const oddsValue = parseFloat(odds);
  const commissionPercent = parseFloat(commission);
  
  switch (bet_type) {
    case "Back":
      if (status === "won") {
        const grossWin = stakeAmount * (oddsValue - 1);
        return grossWin - (grossWin * commissionPercent / 100);
      } else if (status === "lost") {
        return -stakeAmount;
      }
      break;
      
    case "Lay":
      const responsibility = (oddsValue - 1) * stakeAmount;
      if (status === "won") {
        return stakeAmount - (stakeAmount * commissionPercent / 100);
      } else if (status === "lost") {
        return -responsibility;
      }
      break;
      
    default: // Simples
      if (status === "won") {
        return stakeAmount * (oddsValue - 1);
      } else if (status === "lost") {
        return -stakeAmount;
      }
  }
  
  return 0;
}

export function calculateBankrollStats(bets, initialAmount) {
  const totalBets = bets.length;
  const totalProfit = bets.reduce((sum, bet) => sum + (bet.profit || 0), 0);
  const totalStake = bets.reduce((sum, bet) => sum + parseFloat(bet.stake), 0);
  
  const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
  const progress = initialAmount > 0 ? (totalProfit / initialAmount) * 100 : 0;
  const currentAmount = initialAmount + totalProfit;
  
  return {
    totalBets,
    totalProfit,
    totalStake,
    roi,
    progress,
    currentAmount
  };
}

export function groupBetsByDate(bets) {
  const grouped = {};
  
  bets.forEach(bet => {
    const date = new Date(bet.date);
    const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
    const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = {
        month: date,
        days: {},
        totalProfit: 0
      };
    }
    
    if (!grouped[monthKey].days[dayKey]) {
      grouped[monthKey].days[dayKey] = {
        date: date,
        bets: [],
        profit: 0
      };
    }
    
    grouped[monthKey].days[dayKey].bets.push(bet);
    grouped[monthKey].days[dayKey].profit += (bet.profit || 0);
    grouped[monthKey].totalProfit += (bet.profit || 0);
  });
  
  return grouped;
}