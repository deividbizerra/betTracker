
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, AlertTriangle, TrendingUp, TrendingDown, Wallet, CheckCircle } from 'lucide-react'; // Added X, Plus, CheckCircle
import { Badge } from "@/components/ui/badge";
import { Bet, Bankroll, Bookie, Sport, User } from "@/api/entities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const initialLeg = () => ({
  id: Date.now() + Math.random(),
  odd: '',
  bookieId: '',
  fixedStake: '',
  distributeProfit: true,
  calculatedStake: 0,
  potentialProfit: 0,
});

export default function SurebetCalculator() {
  const [legs, setLegs] = useState([initialLeg(), initialLeg()]);
  const [totalStakeInput, setTotalStakeInput] = useState('100'); // Renamed from totalInvestment in outline to match existing
  const [bookies, setBookies] = useState([]);
  const [bankrolls, setBankrolls] = useState([]);
  const [sports, setSports] = useState([]);
  const [selectedBankroll, setSelectedBankroll] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [matchDescription, setMatchDescription] = useState('');
  const [showAddToBankrollModal, setShowAddToBankrollModal] = useState(false);
  const [isAddingToBankroll, setIsAddingToBankroll] = useState(false); // Renamed from addingToBankroll in outline to match existing
  
  const [results, setResults] = useState({
    totalCalculatedStake: 0,
    overallProfitPercentage: 0,
    isSurebet: false,
    calculationMessage: '',
    totalStakeInputDisabled: false,
    effectiveTotalInvestmentForInput: null 
  });

  // Derived state for compact layout improvements
  const allLegsHaveProfit = legs.every(leg => leg.distributeProfit);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const user = await User.me();
      const [bookiesData, bankrollsData, sportsData] = await Promise.all([
        Bookie.list(),
        Bankroll.filter({ created_by: user.email }),
        Sport.list()
      ]);
      setBookies(bookiesData);
      setBankrolls(bankrollsData);
      setSports(sportsData);
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const handleAddLeg = () => {
    setLegs([...legs, initialLeg()]);
  };

  const handleRemoveLeg = (idToRemove) => { // Modified to filter by ID
    if (legs.length > 2) {
      setLegs(legs.filter((leg) => leg.id !== idToRemove));
    }
  };

  const handleLegChange = (index, updatedLeg) => {
    const newLegs = legs.map((leg, i) => (i === index ? updatedLeg : leg));
    setLegs(newLegs);
  };

  const performCalculationLogic = useCallback((currentLegsSource, currentTotalStakeInputValue) => {
    const numLegs = currentLegsSource.length;
    let localCalculationMessage = "";
    let localTotalStakeInputDisabled = false;
    let otherLegsToCalculate = null;

    let tempResults = {
        totalCalculatedStake: 0,
        overallProfitPercentage: 0,
        isSurebet: false,
        calculationMessage: "",
        totalStakeInputDisabled: false,
        effectiveTotalInvestmentForInput: null
    };
    let tempUpdatedLegs = currentLegsSource.map(l => ({ ...l, calculatedStake: 0, potentialProfit: 0 }));

    if (numLegs < 2) {
        tempResults.calculationMessage = "Adicione pelo menos 2 resultados.";
        return { finalUpdatedLegs: tempUpdatedLegs, finalResultsObject: tempResults };
    }
    
    const parsedLegs = currentLegsSource.map((leg, index) => ({
      ...leg,
      odd: parseFloat(leg.odd) || 0,
      fixedStake: parseFloat(leg.fixedStake) || 0,
      originalIndex: index,
    }));

    if (parsedLegs.some(leg => leg.odd !== 0 && leg.odd <= 1)) {
        tempResults.calculationMessage = "Todas as odds devem ser maiores que 1.";
        return { finalUpdatedLegs: tempUpdatedLegs, finalResultsObject: tempResults };
    }
    
    let calculatedStakesArray = new Array(numLegs).fill(0);
    
    parsedLegs.forEach(leg => {
      if (leg.fixedStake > 0) {
        calculatedStakesArray[leg.originalIndex] = leg.fixedStake;
      }
    });

    const fixedLegs = parsedLegs.filter(leg => leg.fixedStake > 0);
    const nonFixedLegs = parsedLegs.filter(leg => leg.fixedStake === 0);
    const fixedDLegs = fixedLegs.filter(leg => leg.distributeProfit);
    const fixedNonDLegs = fixedLegs.filter(leg => !leg.distributeProfit);
    const nonFixedDLegs = nonFixedLegs.filter(leg => leg.distributeProfit);
    const nonFixedNonDLegs = nonFixedLegs.filter(leg => !leg.distributeProfit);

    let designatedBreakEvenLegOriginalIndex = -1;
    let targetGrossReturn = 0; 
    let forcedActualTotalStakeSum = 0; 

    if (fixedLegs.length > 0) {
        localTotalStakeInputDisabled = true;

        if (fixedNonDLegs.length === 1 && fixedDLegs.length === 0) {
            const breakEvenLeg = fixedNonDLegs[0];
            if (breakEvenLeg.odd > 0) {
                designatedBreakEvenLegOriginalIndex = breakEvenLeg.originalIndex;
                forcedActualTotalStakeSum = breakEvenLeg.fixedStake * breakEvenLeg.odd;
                calculatedStakesArray[breakEvenLeg.originalIndex] = breakEvenLeg.fixedStake;

                otherLegsToCalculate = parsedLegs.filter(leg => leg.originalIndex !== breakEvenLeg.originalIndex);
                
                if (otherLegsToCalculate.length === 1) {
                    const otherLeg = otherLegsToCalculate[0];
                    const stakeForOtherLeg = forcedActualTotalStakeSum - breakEvenLeg.fixedStake;
                    if (stakeForOtherLeg >= 0) {
                        if (otherLeg.fixedStake > 0 && Math.abs(otherLeg.fixedStake - stakeForOtherLeg) > 0.01) {
                             localCalculationMessage = `Conflito: Perna #${otherLeg.originalIndex + 1} tem stake fixa ${otherLeg.fixedStake.toFixed(2)}, mas precisaria ser ${stakeForOtherLeg.toFixed(2)} para Perna #${breakEvenLeg.originalIndex + 1} ser break-even.`;
                             calculatedStakesArray[otherLeg.originalIndex] = otherLeg.fixedStake;
                             forcedActualTotalStakeSum = 0;
                             designatedBreakEvenLegOriginalIndex = -1;
                             otherLegsToCalculate = null; 
                        } else if (otherLeg.fixedStake === 0){
                             calculatedStakesArray[otherLeg.originalIndex] = stakeForOtherLeg;
                        }
                    } else {
                        localCalculationMessage = `Não é possível calcular stake positiva para a perna #${otherLeg.originalIndex + 1} para manter a perna #${breakEvenLeg.originalIndex + 1} em break-even.` ;
                        calculatedStakesArray[otherLeg.originalIndex] = 0;
                        forcedActualTotalStakeSum = breakEvenLeg.fixedStake; 
                        otherLegsToCalculate = null; 
                    }
                } else if (otherLegsToCalculate.length > 1) {
                    const remainingStakeToDistribute = forcedActualTotalStakeSum - breakEvenLeg.fixedStake;
                    
                    if (remainingStakeToDistribute < 0) {
                        localCalculationMessage = `Não é possível distribuir stake negativa entre as outras pernas para manter break-even.`;
                        otherLegsToCalculate.forEach(leg => {
                            if (leg.fixedStake === 0) {
                                calculatedStakesArray[leg.originalIndex] = 0;
                            }
                        });
                        forcedActualTotalStakeSum = 0;
                        designatedBreakEvenLegOriginalIndex = -1;
                        otherLegsToCalculate = null;
                    } else {
                        const otherFixedLegsInGroup = otherLegsToCalculate.filter(leg => leg.fixedStake > 0);
                        const otherNonFixedLegsInGroup = otherLegsToCalculate.filter(leg => leg.fixedStake === 0);
                        
                        const sumOtherFixedStakesInGroup = otherFixedLegsInGroup.reduce((sum, leg) => sum + leg.fixedStake, 0);
                        let remainingForNonFixedInGroup = remainingStakeToDistribute - sumOtherFixedStakesInGroup;
                        
                        if (remainingForNonFixedInGroup < 0) {
                            localCalculationMessage = `Stakes fixas das outras pernas excedem o necessário para break-even.`;
                            otherNonFixedLegsInGroup.forEach(leg => {
                                calculatedStakesArray[leg.originalIndex] = 0;
                            });
                        } else if (otherNonFixedLegsInGroup.length === 0) {
                            if (Math.abs(sumOtherFixedStakesInGroup - remainingForNonFixedInGroup) > 0.01 && sumOtherFixedStakesInGroup > 0) {
                                localCalculationMessage = `Stakes fixas das outras pernas (${sumOtherFixedStakesInGroup.toFixed(2)}) não somam o necessário para break-even (${remainingForNonFixedInGroup.toFixed(2)}).`;
                            }
                        } else {
                            const dLegs = otherNonFixedLegsInGroup.filter(l => l.distributeProfit && l.odd > 0);
                            const nonDLegs = otherNonFixedLegsInGroup.filter(l => !l.distributeProfit && l.odd > 0);
                            const invalidOddLegs = otherNonFixedLegsInGroup.filter(l => l.odd <= 0);
                            invalidOddLegs.forEach(l => calculatedStakesArray[l.originalIndex] = 0);

                            if (dLegs.length > 0 && nonDLegs.length === 0) {
                                let sumInverseOdds_D = dLegs.reduce((s, l) => s + (1 / l.odd), 0);
                                if (sumInverseOdds_D > 0) {
                                    const commonProfitTarget_D = (remainingForNonFixedInGroup - forcedActualTotalStakeSum * sumInverseOdds_D) / sumInverseOdds_D;

                                    dLegs.forEach(l => {
                                        calculatedStakesArray[l.originalIndex] = (commonProfitTarget_D + forcedActualTotalStakeSum) / l.odd;
                                        if (calculatedStakesArray[l.originalIndex] < 0) calculatedStakesArray[l.originalIndex] = 0;
                                    });
                                    let currentSumNonFixedStakes = dLegs.reduce((s, l) => s + calculatedStakesArray[l.originalIndex], 0);
                                    if (currentSumNonFixedStakes > 0 && Math.abs(currentSumNonFixedStakes - remainingForNonFixedInGroup) > 0.01 && remainingForNonFixedInGroup > 0) {
                                        const adjustmentFactor = remainingForNonFixedInGroup / currentSumNonFixedStakes;
                                        dLegs.forEach(l => {
                                            if (calculatedStakesArray[l.originalIndex] > 0) calculatedStakesArray[l.originalIndex] *= adjustmentFactor;
                                        });
                                    }
                                } else {
                                    dLegs.forEach(l => calculatedStakesArray[l.originalIndex] = 0);
                                }
                            } else if (nonDLegs.length > 0 && dLegs.length === 0) {
                                let sumInvOdds_NonD = nonDLegs.reduce((s, l) => s + (1 / l.odd), 0);
                                if (sumInvOdds_NonD > 0) {
                                    nonDLegs.forEach(l => calculatedStakesArray[l.originalIndex] = ((1 / l.odd) / sumInvOdds_NonD) * remainingForNonFixedInGroup);
                                } else {
                                    nonDLegs.forEach(l => calculatedStakesArray[l.originalIndex] = 0);
                                }
                            } else if (dLegs.length > 0 && nonDLegs.length > 0) {
                                let stakeAllocatedToNonD = 0;
                                nonDLegs.forEach(ndLeg => {
                                    if (ndLeg.odd > 0) {
                                        const stakeForThisNonD = forcedActualTotalStakeSum / ndLeg.odd;
                                        if (stakeAllocatedToNonD + stakeForThisNonD <= remainingForNonFixedInGroup) {
                                            calculatedStakesArray[ndLeg.originalIndex] = stakeForThisNonD;
                                            stakeAllocatedToNonD += stakeForThisNonD;
                                        } else {
                                            calculatedStakesArray[ndLeg.originalIndex] = Math.max(0, remainingForNonFixedInGroup - stakeAllocatedToNonD);
                                            stakeAllocatedToNonD += calculatedStakesArray[ndLeg.originalIndex];
                                            if (!localCalculationMessage.includes("insuficiente")) {
                                                localCalculationMessage += (localCalculationMessage ? " " : "") + "Stake insuficiente para todas as pernas 'Não-D' serem break-even. Algumas podem ter stake reduzida/zerada.";
                                            }
                                        }
                                    } else {
                                        calculatedStakesArray[ndLeg.originalIndex] = 0;
                                    }
                                });

                                const remainingForDLegs = remainingForNonFixedInGroup - stakeAllocatedToNonD;

                                if (remainingForDLegs > 0 && dLegs.length > 0) {
                                    let sumInverseOdds_D = dLegs.reduce((s, l) => s + (1 / l.odd), 0);
                                    if (sumInverseOdds_D > 0) {
                                        const commonProfitTarget_D_for_group = (remainingForDLegs - forcedActualTotalStakeSum * sumInverseOdds_D) / sumInverseOdds_D;
                                        dLegs.forEach(l => {
                                            calculatedStakesArray[l.originalIndex] = (commonProfitTarget_D_for_group + forcedActualTotalStakeSum) / l.odd;
                                            if (calculatedStakesArray[l.originalIndex] < 0) calculatedStakesArray[l.originalIndex] = 0;
                                        });
                                        let currentSumDStakes = dLegs.reduce((s, l) => s + calculatedStakesArray[l.originalIndex], 0);
                                        if (currentSumDStakes > 0 && Math.abs(currentSumDStakes - remainingForDLegs) > 0.01 && remainingForDLegs > 0) {
                                            const adjustmentFactor = remainingForDLegs / currentSumDStakes;
                                            dLegs.forEach(l => {
                                                if (calculatedStakesArray[l.originalIndex] > 0) calculatedStakesArray[l.originalIndex] *= adjustmentFactor;
                                            });
                                        }
                                    } else {
                                        dLegs.forEach(l => calculatedStakesArray[l.originalIndex] = 0); 
                                    }
                                } else if (remainingForDLegs <= 0 && dLegs.length > 0) {
                                    dLegs.forEach(l => calculatedStakesArray[l.originalIndex] = 0);
                                }
                            } else {
                                otherNonFixedLegsInGroup.forEach(l => calculatedStakesArray[l.originalIndex] = 0);
                                if (otherNonFixedLegsInGroup.length > 0 && invalidOddLegs.length !== otherNonFixedLegsInGroup.length && !localCalculationMessage.includes("inválidas")) {
                                   localCalculationMessage += (localCalculationMessage ? " " : "") + "Odds inválidas nas pernas não-fixas restantes.";
                                }
                            } 
                        } 
                    } 
                } 
            } else { 
                localCalculationMessage = `Odd da perna break-even #${breakEvenLeg.originalIndex + 1} inválida.`;
                parsedLegs.forEach(leg => { if(leg.originalIndex !== breakEvenLeg.originalIndex && leg.fixedStake === 0) calculatedStakesArray[leg.originalIndex] = 0; });
                designatedBreakEvenLegOriginalIndex = -1;
                forcedActualTotalStakeSum = 0; 
                otherLegsToCalculate = null;
            } 
        } else {
            if (fixedDLegs.length === 1 && fixedNonDLegs.length === 0 && 
                nonFixedDLegs.length === 0 && nonFixedNonDLegs.length === (numLegs - 1) &&
                nonFixedNonDLegs.length > 0) {
                
                const fixedDLeg = fixedDLegs[0];
                let sumInverseOdds_NonFixedNonD = 0;
                let allNonFixedNonDOddsValid = true;

                nonFixedNonDLegs.forEach(leg => {
                    if (leg.odd > 0) {
                        sumInverseOdds_NonFixedNonD += (1 / leg.odd);
                    } else {
                        allNonFixedNonDOddsValid = false;
                    }
                });

                if (allNonFixedNonDOddsValid && (1 - sumInverseOdds_NonFixedNonD) > 0.0001) {
                    forcedActualTotalStakeSum = fixedDLeg.fixedStake / (1 - sumInverseOdds_NonFixedNonD);
                    
                    calculatedStakesArray[fixedDLeg.originalIndex] = fixedDLeg.fixedStake;
                    nonFixedNonDLegs.forEach(leg => {
                        if (leg.odd > 0) {
                           calculatedStakesArray[leg.originalIndex] = forcedActualTotalStakeSum / leg.odd;
                        } else {
                           calculatedStakesArray[leg.originalIndex] = 0;
                        }
                    });
                } else {
                    if (!allNonFixedNonDOddsValid) {
                        localCalculationMessage = "Odds inválidas nas pernas não-fixas sem 'D'.";
                    } else {
                        localCalculationMessage = "Combinação de odds nas pernas não-fixas sem 'D' impede cálculo para break-even. Ajuste as odds ou as configurações 'Lucro Alvo'.";
                    }
                    calculatedStakesArray[fixedDLeg.originalIndex] = fixedDLeg.fixedStake;
                    nonFixedNonDLegs.forEach(leg => calculatedStakesArray[leg.originalIndex] = 0);
                    forcedActualTotalStakeSum = calculatedStakesArray.reduce((s, st) => s + (Number(st) || 0), 0);
                }

            } else {
                targetGrossReturn = 0;
                let validReferenceFound = false;
                fixedLegs.forEach(leg => {
                    if (leg.odd > 0) {
                        targetGrossReturn = Math.max(targetGrossReturn, leg.fixedStake * leg.odd);
                        validReferenceFound = true;
                    } else {
                        localCalculationMessage += (localCalculationMessage ? " " : "") + `Odd da perna fixa #${leg.originalIndex + 1} inválida.`;
                    }
                });

                if (validReferenceFound && !localCalculationMessage.includes("inválida.")) {
                    nonFixedDLegs.forEach(leg => {
                        if (leg.odd > 0) {
                            calculatedStakesArray[leg.originalIndex] = targetGrossReturn / leg.odd;
                        } else {
                            calculatedStakesArray[leg.originalIndex] = 0;
                            localCalculationMessage += (localCalculationMessage ? " " : "") + `Odd da perna não-fixa com D #${leg.originalIndex + 1} inválida.`;
                        }
                    });

                    let sumOfFixedAndNonFixedDStakes = 0;
                    parsedLegs.forEach((leg, idx) => { 
                        if (leg.fixedStake > 0 || (nonFixedDLegs.some(nfdLeg => nfdLeg.originalIndex === leg.originalIndex) && calculatedStakesArray[idx] > 0) ) {
                            sumOfFixedAndNonFixedDStakes += calculatedStakesArray[idx];
                        }
                    });
                    
                    nonFixedNonDLegs.forEach(leg => { 
                        if (leg.odd > 1) { 
                            calculatedStakesArray[leg.originalIndex] = sumOfFixedAndNonFixedDStakes / (leg.odd - 1);
                        } else {
                            calculatedStakesArray[leg.originalIndex] = 0;
                            localCalculationMessage += (localCalculationMessage ? " " : "") + `Odd da perna não-fixa sem D #${leg.originalIndex + 1} deve ser > 1 para break-even neste contexto.`;
                        }
                    });
                    forcedActualTotalStakeSum = calculatedStakesArray.reduce((s, st) => s + (Number(st) || 0), 0);

                } else {
                     if (!localCalculationMessage.includes("inválida") && fixedLegs.length > 0) {
                        localCalculationMessage = (localCalculationMessage ? localCalculationMessage + " " : "") + "Nenhuma perna fixa válida para referência de cálculo das não-fixas.";
                     }
                     nonFixedLegs.forEach(leg => { if(leg.fixedStake === 0) calculatedStakesArray[leg.originalIndex] = 0; });
                     forcedActualTotalStakeSum = calculatedStakesArray.reduce((s, st) => s + (Number(st) || 0), 0);
                }
            }
        }
    } else {
        localTotalStakeInputDisabled = false;
        const currentTotalStakeFromInput = parseFloat(currentTotalStakeInputValue) || 0;
        
        if (currentTotalStakeFromInput <= 0 && numLegs > 0) { 
            localCalculationMessage = "Investimento Total deve ser maior que zero.";
            nonFixedLegs.forEach(leg => { calculatedStakesArray[leg.originalIndex] = 0; });
        } else {
            if (nonFixedDLegs.length === 0) { 
                let sumInverseOdds = 0;
                let allOddsValid = true;
                nonFixedNonDLegs.forEach(leg => { 
                    if (leg.odd > 0) { 
                        sumInverseOdds += (1 / leg.odd); 
                    } else { 
                        allOddsValid = false; 
                    }
                });

                if (allOddsValid && sumInverseOdds > 0) {
                    nonFixedNonDLegs.forEach(leg => { 
                        if (leg.odd > 0) {
                           calculatedStakesArray[leg.originalIndex] = ((1 / leg.odd) / sumInverseOdds) * currentTotalStakeFromInput;
                        }
                    });
                } else { 
                    if (!allOddsValid) { 
                        localCalculationMessage = "Pelo menos uma das odds é inválida para o cálculo proporcional.";
                    } else if (nonFixedLegs.length > 0) { 
                        localCalculationMessage = "Nenhuma odd válida para cálculo (soma das inversas é zero ou inválida).";
                    } 
                    nonFixedNonDLegs.forEach(leg => { calculatedStakesArray[leg.originalIndex] = 0; });
                }
            } else if (nonFixedNonDLegs.length === 0) {
                let allNonFixedOddsValid = true;
                nonFixedDLegs.forEach(leg => { 
                    if (leg.odd <= 0) { 
                        allNonFixedOddsValid = false;
                    }
                });
                
                if (!allNonFixedOddsValid) {
                    localCalculationMessage = "Todas as odds das pernas com Lucro Alvo devem ser válidas.";
                    nonFixedDLegs.forEach(leg => { calculatedStakesArray[leg.originalIndex] = 0; });
                } else {
                    let sumInverseOdds = 0;
                    nonFixedDLegs.forEach(leg => {
                        sumInverseOdds += (1 / leg.odd);
                    });
                    
                    const uniformProfitOrLoss = currentTotalStakeFromInput * (1 - sumInverseOdds) / sumInverseOdds;
                    if (sumInverseOdds >= 1 && !localCalculationMessage) {
                        localCalculationMessage = "Surebet negativa detectada. Não é possível ter lucro positivo uniforme com essas odds.";
                    }
                        
                    let stakesSumCheck = 0;
                    nonFixedDLegs.forEach(leg => {
                        const stakeVal = (currentTotalStakeFromInput + uniformProfitOrLoss) / leg.odd;
                        if (stakeVal < 0 && currentTotalStakeFromInput > 0) { 
                            calculatedStakesArray[leg.originalIndex] = 0;
                            if (!localCalculationMessage.includes("negativa.")){
                               localCalculationMessage += (localCalculationMessage ? " " : "") + "Cálculo resultou em stake zerada para uma ou mais pernas 'D' devido a odds/lucro alvo.";
                            }
                        } else {
                            calculatedStakesArray[leg.originalIndex] = stakeVal < 0 ? 0 : stakeVal;
                        }
                        stakesSumCheck += calculatedStakesArray[leg.originalIndex];
                    });

                    if (Math.abs(stakesSumCheck - currentTotalStakeFromInput) > 0.01 * currentTotalStakeFromInput && stakesSumCheck > 0 && currentTotalStakeFromInput > 0) {
                       const adjustmentFactor = currentTotalStakeFromInput / stakesSumCheck;
                       nonFixedDLegs.forEach(leg => {
                           if (calculatedStakesArray[leg.originalIndex] > 0) { 
                               calculatedStakesArray[leg.originalIndex] *= adjustmentFactor;
                           }
                       });
                       if (!localCalculationMessage.includes("Ajuste") && !localCalculationMessage.includes("negativa.")) { 
                         localCalculationMessage += (localCalculationMessage ? " " : "") + "Ajuste aplicado para igualar stakes ao investimento total.";
                       }
                    } else if (stakesSumCheck === 0 && currentTotalStakeFromInput > 0 && !localCalculationMessage.includes("negativa.") && !localCalculationMessage.includes("inválidas") && !localCalculationMessage.includes("zerada")) {
                        localCalculationMessage += (localCalculationMessage ? " " : "") + "Não foi possível calcular stakes válidas para as pernas com Lucro Alvo.";
                    }
                }
            } else { 
                let sumInverseOddsAllNonFixed = 0;
                let allNonFixedOddsValid = true;
                nonFixedLegs.forEach(leg => { 
                    if (leg.odd > 0) { 
                        sumInverseOddsAllNonFixed += (1 / leg.odd); 
                    } else { 
                        allNonFixedOddsValid = false;
                    }
                });
                
                if (!allNonFixedOddsValid && nonFixedLegs.length > 0) {
                     localCalculationMessage = "Todas as odds das pernas não-fixas devem ser válidas para este cálculo.";
                     nonFixedLegs.forEach(leg => { calculatedStakesArray[leg.originalIndex] = 0; });
                } else if (sumInverseOddsAllNonFixed > 0) {
                    let sumInverseOdds_D_Marked = 0;
                    nonFixedDLegs.forEach(leg => {
                         if(leg.odd > 0) sumInverseOdds_D_Marked += (1 / leg.odd);
                    });

                    if (sumInverseOdds_D_Marked === 0 && nonFixedDLegs.length > 0) {
                        localCalculationMessage = "Odds das pernas não-fixas com Lucro Alvo devem ser válidas.";
                        nonFixedLegs.forEach(leg => { calculatedStakesArray[leg.originalIndex] = 0; });
                    } else if (sumInverseOdds_D_Marked > 0) { 
                        const desiredProfitForEachDLeg = currentTotalStakeFromInput * (1 - sumInverseOddsAllNonFixed) / sumInverseOdds_D_Marked;
                        
                        if (1 - sumInverseOddsAllNonFixed < 0 && currentTotalStakeFromInput > 0 && sumInverseOddsAllNonFixed >=1) {
                           if(!localCalculationMessage.includes("Surebet negativa detectada")) {
                                localCalculationMessage = (localCalculationMessage ? localCalculationMessage + " " : "") + "Surebet negativa detectada. As pernas com 'Lucro Alvo' podem resultar em perda.";
                           }
                        }
                        
                        let tempStakesOkay = true;
                        nonFixedLegs.forEach(leg => { 
                            if (leg.odd > 0) {
                                if (leg.distributeProfit) { 
                                    calculatedStakesArray[leg.originalIndex] = (currentTotalStakeFromInput + desiredProfitForEachDLeg) / leg.odd;
                                } else { 
                                    calculatedStakesArray[leg.originalIndex] = currentTotalStakeFromInput / leg.odd;
                                }

                                if (calculatedStakesArray[leg.originalIndex] < 0 && currentTotalStakeFromInput > 0) {
                                    calculatedStakesArray[leg.originalIndex] = 0;
                                    tempStakesOkay = false;
                                } else if (calculatedStakesArray[leg.originalIndex] < 0) {
                                     calculatedStakesArray[leg.originalIndex] = 0;
                                }
                            } else {
                                calculatedStakesArray[leg.originalIndex] = 0; 
                            }
                        });

                        if (!tempStakesOkay && !localCalculationMessage.includes("negativa.") && !localCalculationMessage.includes("zerada")) {
                            localCalculationMessage = (localCalculationMessage ? " " : "") + "Cálculo resultou em stake zerada para uma ou mais pernas.";
                        }
                        
                        let currentCalculatedTotalStake = calculatedStakesArray.reduce((sum, stake) => sum + (Number(stake) || 0), 0);
                        if (currentCalculatedTotalStake > 0 && Math.abs(currentCalculatedTotalStake - currentTotalStakeFromInput) > 0.01 * currentTotalStakeFromInput && currentTotalStakeFromInput > 0) {
                            const adjustmentFactor = currentTotalStakeFromInput / currentCalculatedTotalStake;
                            nonFixedLegs.forEach(leg => {
                                if (calculatedStakesArray[leg.originalIndex] > 0) {
                                    calculatedStakesArray[leg.originalIndex] *= adjustmentFactor;
                                }
                            });
                             if (!localCalculationMessage.includes("Ajuste") && !localCalculationMessage.includes("negativa.")) { 
                                localCalculationMessage += (localCalculationMessage ? " " : "") + "Ajuste de stakes aplicado para corresponder ao investimento total.";
                            }
                        }
                    } else { 
                         let sumInvNonD = 0;
                         nonFixedNonDLegs.forEach(l => { if(l.odd > 0) sumInvNonD += (1/l.odd); });
                         if (sumInvNonD > 0) {
                             nonFixedNonDLegs.forEach(l => {
                                 if(l.odd > 0) calculatedStakesArray[l.originalIndex] = ((1/l.odd) / sumInvNonD) * currentTotalStakeFromInput;
                             });
                         } else {
                            nonFixedLegs.forEach(leg => { calculatedStakesArray[leg.originalIndex] = 0; });
                         }
                    }
                } else { 
                     if (nonFixedLegs.length > 0 && allNonFixedOddsValid) { 
                        localCalculationMessage = "Erro nas odds das pernas não-fixas (soma das inversas é zero).";
                     } else if (nonFixedLegs.length > 0 && !allNonFixedOddsValid && !localCalculationMessage.includes("válidas")) {
                        localCalculationMessage = "Pelo menos uma odd é inválida para cálculo.";
                     }
                    nonFixedLegs.forEach(leg => { calculatedStakesArray[leg.originalIndex] = 0; });
                }
            }
        }
    }
    
    let hasNegativeStake = false;
    for(let i=0; i < calculatedStakesArray.length; i++) {
        if (calculatedStakesArray[i] < 0) {
            calculatedStakesArray[i] = 0;
            hasNegativeStake = true;
        }
    }
    if (hasNegativeStake && !localCalculationMessage.includes("negativa")) {
        localCalculationMessage += (localCalculationMessage ? " " : "") + "Alguma(s) stake(s) resultaram negativas e foram zeradas.";
    }

    const actualTotalStakeSumFromCalculatedArray = calculatedStakesArray.reduce((sum, stake) => sum + (Number(stake) || 0), 0);
    const finalActualTotalStakeSum = forcedActualTotalStakeSum > 0 ? forcedActualTotalStakeSum : actualTotalStakeSumFromCalculatedArray;
    
    tempUpdatedLegs = currentLegsSource.map((legData, idx) => {
        const currentParsedLeg = parsedLegs[idx]; 
        const stake = Number(calculatedStakesArray[idx]) || 0; 
        const oddInput = currentParsedLeg.odd; 
        let potentialProfit = 0;

        if (currentParsedLeg.originalIndex === designatedBreakEvenLegOriginalIndex) {
            potentialProfit = 0;
        } else if (stake > 0 && oddInput > 0) { 
            potentialProfit = (stake * oddInput) - finalActualTotalStakeSum;
        } else if (stake > 0 && oddInput <= 0 && finalActualTotalStakeSum > 0) { 
            potentialProfit = -finalActualTotalStakeSum; 
        } else if (stake === 0 && finalActualTotalStakeSum > 0 && parsedLegs.some(p=>p.fixedStake > 0 || calculatedStakesArray[p.originalIndex] > 0)) {
             potentialProfit = 0; 
        }
        
        if (designatedBreakEvenLegOriginalIndex === -1 && 
            potentialProfit !== 0 && 
            Math.abs(potentialProfit) < 0.01) {
            if (otherLegsToCalculate && otherLegsToCalculate.length > 0 && otherLegsToCalculate.length <= 2) {
                 potentialProfit = 0;
            } else if (!otherLegsToCalculate) {
                 potentialProfit = 0;
            }
        }
        
        if ( designatedBreakEvenLegOriginalIndex === -1 && 
             fixedLegs.length > 0 && 
             nonFixedNonDLegs.some(nfnDLeg => nfnDLeg.originalIndex === currentParsedLeg.originalIndex) &&
             Math.abs(potentialProfit) < 0.01 && stake > 0 && calculatedStakesArray[currentParsedLeg.originalIndex] > 0) { 
            potentialProfit = 0;
        }

        return {
            ...legData, 
            odd: legData.odd, 
            fixedStake: legData.fixedStake, 
            calculatedStake: stake,
            potentialProfit: potentialProfit,
        };
    });
    
    let isSurebetVal = false;
    const profitsFromNewLegs = tempUpdatedLegs.map(l => l.potentialProfit);

    if (finalActualTotalStakeSum > 0 && profitsFromNewLegs.length > 0 && profitsFromNewLegs.length === numLegs) {
        const minProfit = Math.min(...profitsFromNewLegs);
        const maxProfit = Math.max(...profitsFromNewLegs);

        if (numLegs === profitsFromNewLegs.filter(p => typeof p === 'number').length) { 
            if (minProfit >= -0.01 && (maxProfit - minProfit) < 0.015 * Math.max(1, finalActualTotalStakeSum * 0.01) ) {
                isSurebetVal = true;
            } else {
                const dLegsIndicesFromUpdated = tempUpdatedLegs.reduce((acc, currentLeg, legIdx) => { 
                    if(parsedLegs[legIdx]?.distributeProfit) acc.push(legIdx); 
                    return acc; 
                }, []);

                if (dLegsIndicesFromUpdated.length > 0) {
                    const profitsOfDLegs = dLegsIndicesFromUpdated.map(i => profitsFromNewLegs[i]).filter(p => typeof p === 'number');
                    
                    let allNonDAreBreakEvenOrPositive = true;
                    for(let i=0; i<tempUpdatedLegs.length; i++) {
                        if(!parsedLegs[i]?.distributeProfit && profitsFromNewLegs[i] < -0.01) { 
                            allNonDAreBreakEvenOrPositive = false; break;
                        }
                    }

                    if (profitsOfDLegs.length > 0) {
                        const minProfitD = Math.min(...profitsOfDLegs);
                        const maxProfitD = Math.max(...profitsOfDLegs);
                        if ((maxProfitD - minProfitD) < 0.015 * Math.max(1, finalActualTotalStakeSum * 0.01) && minProfitD >= -0.01 && allNonDAreBreakEvenOrPositive) {
                            isSurebetVal = true;
                        }
                    }
                }
            }
        }
    }

    let displayOverallProfitPercentage = 0;
    if (isSurebetVal && finalActualTotalStakeSum > 0) {
        const validProfitsForSurebet = profitsFromNewLegs.filter(p => p >= -0.01); 
        if (validProfitsForSurebet.length > 0) {
            const minPositiveProfit = Math.min(...validProfitsForSurebet.filter(p => p > 0.005));
            if (minPositiveProfit !== Infinity && minPositiveProfit > 0) {
                displayOverallProfitPercentage = (minPositiveProfit / finalActualTotalStakeSum) * 100;
            } else { 
                const avgProfit = validProfitsForSurebet.reduce((s,p) => s+p, 0) / validProfitsForSurebet.length;
                displayOverallProfitPercentage = ((avgProfit < -0.001 ? 0 : avgProfit) / finalActualTotalStakeSum) * 100;
            }
        }
    } else if (numLegs > 0 && finalActualTotalStakeSum > 0) { 
        if (!localTotalStakeInputDisabled) {
            let sumInverseOddsAllLegs = 0;
            let validOddsForIdealCalc = 0;
            parsedLegs.forEach(leg => {
                if (leg.odd > 0) { 
                    sumInverseOddsAllLegs += (1 / leg.odd); 
                    validOddsForIdealCalc++;
                }
            });
            if (validOddsForIdealCalc === numLegs && sumInverseOddsAllLegs > 0) { 
                displayOverallProfitPercentage = ((1 / sumInverseOddsAllLegs) - 1) * 100;
            }
        } else {
            let relevantProfits = profitsFromNewLegs;
            if (designatedBreakEvenLegOriginalIndex !== -1) {
                relevantProfits = profitsFromNewLegs.filter((p,idx) => idx !== designatedBreakEvenLegOriginalIndex);
            }
            
            if (relevantProfits.length > 0) {
                 const minRelProfit = Math.min(...relevantProfits);
                 const maxRelProfit = Math.max(...relevantProfits);

                 if ( (maxRelProfit - minRelProfit) < 0.015 * Math.max(1, finalActualTotalStakeSum * 0.01) ) { 
                    displayOverallProfitPercentage = (minRelProfit / finalActualTotalStakeSum) * 100;
                 } else {
                    const positiveProfits = relevantProfits.filter(p => p > 0.005);
                    if (positiveProfits.length > 0) {
                        displayOverallProfitPercentage = (Math.min(...positiveProfits) / finalActualTotalStakeSum) * 100;
                    } else {
                         displayOverallProfitPercentage = (minRelProfit / finalActualTotalStakeSum) * 100; 
                    }
                 }
            }
        }
    }

    if (Math.abs(displayOverallProfitPercentage) < 0.005 && displayOverallProfitPercentage !== 0) displayOverallProfitPercentage = 0;
    
    tempResults = {
      totalCalculatedStake: finalActualTotalStakeSum, 
      overallProfitPercentage: displayOverallProfitPercentage, 
      isSurebet: isSurebetVal, 
      calculationMessage: localCalculationMessage,
      totalStakeInputDisabled: localTotalStakeInputDisabled,
      effectiveTotalInvestmentForInput: localTotalStakeInputDisabled ? finalActualTotalStakeSum : null 
    };
    
    return { finalUpdatedLegs: tempUpdatedLegs, finalResultsObject: tempResults };

  }, []);

  useEffect(() => {
    const { finalUpdatedLegs, finalResultsObject } = performCalculationLogic(legs, totalStakeInput);
    
    setLegs(finalUpdatedLegs);
    setResults(finalResultsObject);

    if (finalResultsObject.totalStakeInputDisabled && finalResultsObject.effectiveTotalInvestmentForInput !== null) {
        const displayValue = finalResultsObject.effectiveTotalInvestmentForInput.toFixed(2);
        if (totalStakeInput !== displayValue && parseFloat(displayValue) >= 0) {
            setTotalStakeInput(displayValue);
        }
    }
  }, [legs, totalStakeInput, performCalculationLogic]);

  const validateForBankrollAddition = () => {
    const errors = [];
    
    if (!selectedBankroll) {
      errors.push("Selecione um bankroll");
    }

    if (!selectedSport) {
      errors.push("Selecione um esporte");
    }
    
    if (!matchDescription.trim()) {
      errors.push("Descreva a partida/evento");
    }

    const validLegs = legs.filter(leg => 
      parseFloat(leg.odd) > 0 && 
      leg.calculatedStake > 0
    );

    if (validLegs.length < 2) {
      errors.push("Pelo menos 2 odds válidas com stakes calculadas são necessárias");
    }

    validLegs.forEach((leg, index) => {
      if (!leg.bookieId) {
        errors.push(`Selecione uma casa de aposta para a Odd ${index + 1}`);
      }
    });

    return errors;
  };

  const handleAddToBankroll = () => {
    const errors = validateForBankrollAddition();
    if (errors.length > 0) {
      alert(`Erro(s) encontrado(s):\n${errors.join('\n')}`);
      return;
    }

    setShowAddToBankrollModal(true);
  };

  const confirmAddToBankroll = async () => {
    setIsAddingToBankroll(true);
    try {
      const user = await User.me();
      
      if (user.is_blocked) {
        alert("Sua conta está bloqueada. Você não pode adicionar apostas.");
        setIsAddingToBankroll(false);
        return;
      }
      
      const userBets = await Bet.filter({ created_by: user.email });
      const currentBetLimit = (user.bet_limit_override !== null && user.bet_limit_override !== undefined)
        ? user.bet_limit_override
        : 50; 
      
      const validLegs = legs.filter(leg => 
        parseFloat(leg.odd) > 0 && 
        leg.calculatedStake > 0 && 
        leg.bookieId 
      );

      if (userBets.length + validLegs.length > currentBetLimit) {
        alert(`Você atingirá o limite de ${currentBetLimit} apostas. Atualmente você tem ${userBets.length} apostas e está tentando adicionar ${validLegs.length}.`);
        setIsAddingToBankroll(false);
        return;
      }

      const betPromises = validLegs.map((leg, index) => {
        const stake = leg.calculatedStake;
        const odds = parseFloat(leg.odd);
        
        return Bet.create({
          bankroll_id: selectedBankroll,
          bookie_id: leg.bookieId,
          sport_id: selectedSport,
          match: matchDescription,
          date: new Date().toISOString(),
          stake: parseFloat(stake.toFixed(2)),
          odds: parseFloat(odds.toFixed(2)),
          bet_type: "Simples",
          status: "pending",
          profit: 0,
          net_profit: 0,
          commission: 0,
          responsibility: 0,
          created_by: user.email
        });
      });

      await Promise.all(betPromises);
      
      setShowAddToBankrollModal(false);
      
      setSelectedBankroll('');
      setSelectedSport('');
      setMatchDescription('');
      
      alert(`${validLegs.length} apostas adicionadas com sucesso ao bankroll!`);
      
      loadInitialData();

    } catch (error) {
      console.error("Error adding bets to bankroll:", error);
      alert("Erro ao adicionar apostas ao bankroll. Tente novamente.");
    } finally {
      setIsAddingToBankroll(false);
    }
  };

  const getBookieName = (bookieId) => {
    const bookie = bookies.find(b => b.id === bookieId);
    return bookie ? bookie.name : '';
  };

  const getBankrollName = (bankrollId) => {
    const bankroll = bankrolls.find(b => b.id === bankrollId);
    return bankroll ? bankroll.name : '';
  };

  const getSportName = (sportId) => {
    const sport = sports.find(s => s.id === sportId);
    return sport ? sport.name : '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Calculadora Surebet</h1>
            <p className="text-slate-400 text-sm">Calcule apostas seguras e maximize seus lucros</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white mb-2">Investimento Total</h2>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="10000"
                    value={totalStakeInput} // Corrected from totalInvestment
                    onChange={(e) => setTotalStakeInput(e.target.value)} // Corrected from setTotalInvestment
                    disabled={results.totalStakeInputDisabled}
                    className="pl-8 h-10 bg-slate-900/50 border-slate-600 text-white text-base focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-slate-400 text-xs">Margem de Lucro</span>
                  <span className={`font-bold text-base ${
                    results.overallProfitPercentage > 0.005 ? 'text-emerald-400' : 
                    results.overallProfitPercentage < -0.005 ? 'text-red-400' : 'text-slate-300'
                  }`}>
                    {results.overallProfitPercentage.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-amber-400 mb-3 -mt-1 sm:mt-0">
                    {results.totalStakeInputDisabled && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                        Calculado automaticamente
                      </div>
                    )}
                    {!results.totalStakeInputDisabled && <div className="h-5"></div>} 
                </div>
              </div>

              <div className="mb-3">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-800/30 rounded-lg text-xs font-medium text-slate-300">
                  <div className="col-span-1">#</div>
                  <div className="col-span-2">Cotação</div>
                  <div className="col-span-2">Casa de Aposta</div>
                  <div className="col-span-3">Stake</div>
                  <div className="col-span-2 text-center">Stake Fixo</div>
                  <div className="col-span-1 text-center">Lucro Alvo</div>
                  <div className="col-span-1"></div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {legs.map((leg, index) => (
                  <div key={leg.id} className="group">
                    <div className="grid grid-cols-12 gap-2 p-3 bg-slate-800/20 hover:bg-slate-800/40 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all duration-200 items-end">
                      <div className="col-span-1">
                        <div className="h-10 w-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="text-xs text-slate-400 mb-1">Cotação</div>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="2.00"
                          value={leg.odd}
                          onChange={(e) => handleLegChange(index, { ...leg, odd: e.target.value })}
                          className="h-10 bg-slate-900/50 border-slate-600 text-white font-semibold focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>

                      <div className="col-span-2">
                        <div className="text-xs text-slate-400 mb-1">Casa de Aposta</div>
                        <Select
                          value={leg.bookieId}
                          onValueChange={(value) => handleLegChange(index, { ...leg, bookieId: value })}
                        >
                          <SelectTrigger className="h-10 bg-slate-900/50 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20">
                            <SelectValue placeholder="Selecione">
                              {getBookieName(leg.bookieId)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            {bookies.map(bookie => (
                              <SelectItem key={bookie.id} value={bookie.id} className="text-white hover:bg-slate-700">
                                {bookie.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-3">
                        <div className="text-xs text-slate-400 mb-1">Stake Calculada</div>
                        <div className="h-10 bg-slate-900/30 border border-slate-600 rounded-md flex items-center px-2 overflow-hidden">
                          <span className="text-slate-400 mr-1 flex-shrink-0 text-sm">R$</span>
                          <span className="text-white font-semibold truncate text-sm" title={`R$ ${leg.calculatedStake?.toFixed(2) || '0.00'}`}>
                            {leg.calculatedStake?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="text-xs text-slate-400 mb-1 text-center">Stake Fixo</div>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 text-xs">R$</span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder=""
                            value={leg.fixedStake}
                            onChange={(e) => handleLegChange(index, { ...leg, fixedStake: e.target.value })}
                            className="pl-6 h-10 bg-slate-900/50 border-slate-600 text-white text-center text-sm focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>

                      <div className="col-span-1">
                        <div className="text-xs text-slate-400 mb-1 text-center">Lucro Alvo</div>
                        <div className="h-10 flex items-center justify-center">
                          <button
                            onClick={() => handleLegChange(index, { ...leg, distributeProfit: !leg.distributeProfit })}
                            className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                              leg.distributeProfit
                                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-400 shadow-lg shadow-emerald-500/25'
                                : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                            }`}
                          >
                            {leg.distributeProfit && (
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="col-span-1 flex items-center justify-center">
                        {legs.length > 2 && ( // Conditionally render delete button
                            <Button
                            onClick={() => handleRemoveLeg(leg.id)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                            <X className="w-3 h-3" />
                            </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-1 flex justify-between items-center text-xs text-slate-400 px-3">
                      <span>Lucro Possível:</span>
                      <span className={`font-bold ${
                        leg.potentialProfit > 0.005 ? 'text-emerald-400' : 
                        leg.potentialProfit < -0.005 ? 'text-red-400' : 'text-slate-300'
                      }`}>
                        R$ {leg.potentialProfit?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleAddLeg}
                className="w-full mb-4 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-semibold h-10 text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Resultado
              </Button>

              <div className="bg-slate-800/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="w-4 h-4 text-blue-400" />
                  <h3 className="text-base font-semibold text-white">Adicionar ao Bankroll</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1 block">Bankroll</label>
                    <Select value={selectedBankroll} onValueChange={setSelectedBankroll}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white h-9">
                        <SelectValue placeholder="Selecione um bankroll" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {bankrolls.map(bankroll => (
                          <SelectItem key={bankroll.id} value={bankroll.id} className="text-white hover:bg-slate-700">
                            {bankroll.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1 block">Esporte</label>
                    <Select value={selectedSport} onValueChange={setSelectedSport}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white h-9">
                        <SelectValue placeholder="Selecione um esporte" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {sports.map(sport => (
                          <SelectItem key={sport.id} value={sport.id} className="text-white hover:bg-slate-700">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{sport.icon}</span>
                              {sport.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1 block">Descrição da Partida</label>
                    <Input
                      placeholder="Ex: Arsenal vs Chelsea"
                      value={matchDescription}
                      onChange={(e) => setMatchDescription(e.target.value)}
                      className="bg-slate-900/50 border-slate-600 text-white h-9"
                    />
                  </div>
                </div>
                
                <Button
                  onClick={handleAddToBankroll}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold h-9"
                  disabled={isAddingToBankroll || !selectedBankroll || !selectedSport || !matchDescription.trim()}
                >
                  {isAddingToBankroll ? (
                    <>
                      <span className="animate-spin mr-2">◌</span>
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Apostas ao Bankroll
                    </>
                  )}
                </Button>
                
                {allLegsHaveProfit && (
                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-amber-400 text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Todas as pernas têm Lucro Alvo ativo. Nem todos os lucros podem ser obtidos.
                    </p>
                  </div>
                )}
              </div>

              {results.calculationMessage && (
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <p className="text-amber-200 text-sm">{results.calculationMessage}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 sticky top-4">
              <h3 className="text-lg font-bold text-white mb-4">Resumo</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Investimento Total</span>
                  <span className="text-white font-semibold">R$ {results.totalCalculatedStake.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Margem de Lucro</span>
                  <span className={`font-bold ${
                    results.overallProfitPercentage > 0.005 ? 'text-emerald-400' : 
                    results.overallProfitPercentage < -0.005 ? 'text-red-400' : 'text-slate-300'
                  }`}>
                    {results.overallProfitPercentage.toFixed(2)}% 
                    {results.overallProfitPercentage > 0.005 && <span className="ml-1">📈</span>}
                    {results.overallProfitPercentage < -0.005 && <span className="ml-1">📉</span>}
                  </span>
                </div>
              </div>

              {results.isSurebet && (
                <div className="mb-4 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-semibold text-sm">Surebet Detectada</span>
                  </div>
                  <p className="text-emerald-300 text-xs">
                    Lucro garantido independente do resultado
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-300 mb-2">Detalhamento por Resultado</div>
                {legs.map((leg, index) => (
                  <div key={`summary-${leg.id}`} className="p-2 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-300">
                        {leg.bookieId ? getBookieName(leg.bookieId) : `Resultado #${index + 1}`}
                      </span>
                      <span className="text-xs text-slate-400">
                        {leg.odd ? `@ ${parseFloat(leg.odd).toFixed(2)}` : '--'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                      <div>
                        <div className="text-slate-500">Stake</div>
                        <div className="text-slate-300">R$ {leg.calculatedStake?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Lucro</div>
                        <div className={`${
                          leg.potentialProfit > 0.005 ? 'text-emerald-400' : 
                          leg.potentialProfit < -0.005 ? 'text-red-400' : 'text-slate-300'
                        }`}>
                          R$ {leg.potentialProfit?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Dialog open={showAddToBankrollModal} onOpenChange={setShowAddToBankrollModal}>
          <DialogContent className="bg-slate-800 border-slate-600 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-400" />
                Confirmar Adição ao Bankroll
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="mb-6">
                <p className="text-slate-300 mb-2">
                  <strong>Bankroll:</strong> {getBankrollName(selectedBankroll)}
                </p>
                <p className="text-slate-300 mb-2">
                  <strong>Esporte:</strong> {getSportName(selectedSport)}
                </p>
                <p className="text-slate-300 mb-4">
                  <strong>Partida:</strong> {matchDescription}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-400 mb-3">Apostas a serem adicionadas:</h4>
                {legs
                  .filter(leg => parseFloat(leg.odd) > 0 && leg.calculatedStake > 0 && leg.bookieId)
                  .map((leg, index) => (
                    <div key={leg.id} className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-white">{getBookieName(leg.bookieId)}</div>
                          <div className="text-sm text-slate-400">
                            Odd: {parseFloat(leg.odd).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">R$ {leg.calculatedStake.toFixed(2)}</div>
                        <div className="text-xs text-slate-400">Stake</div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-blue-300 font-medium">Total a Investir:</span>
                  <span className="text-blue-300 font-bold text-xl">
                    R$ {results.totalCalculatedStake.toFixed(2)}
                  </span>
                </div>
              </div>

              {results.isSurebet && (
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium mb-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    Surebet Detectada
                  </div>
                  <p className="text-emerald-300 text-sm">
                    Lucro garantido de aproximadamente {results.overallProfitPercentage.toFixed(2)}% independente do resultado
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddToBankrollModal(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmAddToBankroll}
                disabled={isAddingToBankroll}
                className="bg-green-600 hover:bg-green-700"
              >
                {isAddingToBankroll ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adicionando...
                  </>
                ) : (
                  'Confirmar Adição'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
