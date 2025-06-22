import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Calculator, TrendingUp } from "lucide-react";
import BetLegInput from "@/components/surebet/BetLegInput";

export default function SurebetCalculator() {
  const [totalStake, setTotalStake] = useState("");
  const [legs, setLegs] = useState([
    { odd: "", fixedStake: "", distributeProfit: false },
    { odd: "", fixedStake: "", distributeProfit: false }
  ]);
  const [results, setResults] = useState(null);

  const addLeg = () => {
    setLegs([...legs, { odd: "", fixedStake: "", distributeProfit: false }]);
  };

  const removeLeg = (index) => {
    if (legs.length > 2) {
      setLegs(legs.filter((_, i) => i !== index));
    }
  };

  const updateLeg = (index, updatedLeg) => {
    const newLegs = [...legs];
    newLegs[index] = updatedLeg;
    setLegs(newLegs);
  };

  const calculateSurebet = () => {
    const validLegs = legs.filter(leg => leg.odd && parseFloat(leg.odd) > 0);
    
    if (validLegs.length < 2 || !totalStake || parseFloat(totalStake) <= 0) {
      alert("Por favor, preencha pelo menos 2 odds válidas e o stake total.");
      return;
    }

    const stake = parseFloat(totalStake);
    const odds = validLegs.map(leg => parseFloat(leg.odd));
    
    // Calculate if it's a surebet
    const impliedProbabilities = odds.map(odd => 1 / odd);
    const totalProbability = impliedProbabilities.reduce((sum, prob) => sum + prob, 0);
    const isSurebet = totalProbability < 1;
    const arbitragePercentage = ((1 / totalProbability) - 1) * 100;

    // Calculate optimal stakes
    const optimalStakes = odds.map(odd => stake / (odd * totalProbability));
    
    // Calculate profits for each outcome
    const profits = optimalStakes.map((stakeAmount, index) => 
      (stakeAmount * odds[index]) - stake
    );

    // Handle fixed stakes and profit distribution
    let finalStakes = [...optimalStakes];
    let remainingStake = stake;
    let fixedStakeTotal = 0;

    // First, allocate fixed stakes
    validLegs.forEach((leg, index) => {
      if (leg.fixedStake && parseFloat(leg.fixedStake) > 0) {
        finalStakes[index] = parseFloat(leg.fixedStake);
        fixedStakeTotal += parseFloat(leg.fixedStake);
      }
    });

    remainingStake = stake - fixedStakeTotal;

    // Then distribute remaining stake among non-fixed legs
    const nonFixedIndices = validLegs
      .map((leg, index) => (!leg.fixedStake || parseFloat(leg.fixedStake) === 0) ? index : null)
      .filter(index => index !== null);

    if (nonFixedIndices.length > 0 && remainingStake > 0) {
      const nonFixedProbSum = nonFixedIndices.reduce((sum, index) => sum + impliedProbabilities[index], 0);
      
      nonFixedIndices.forEach(index => {
        finalStakes[index] = (remainingStake * impliedProbabilities[index]) / nonFixedProbSum;
      });
    }

    // Calculate final profits
    const finalProfits = finalStakes.map((stakeAmount, index) => 
      (stakeAmount * odds[index]) - stake
    );

    setResults({
      isSurebet,
      arbitragePercentage,
      stakes: finalStakes,
      profits: finalProfits,
      totalStakeUsed: finalStakes.reduce((sum, stake) => sum + stake, 0)
    });
  };

  const clearCalculation = () => {
    setTotalStake("");
    setLegs([
      { odd: "", fixedStake: "", distributeProfit: false },
      { odd: "", fixedStake: "", distributeProfit: false }
    ]);
    setResults(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-8 h-8 text-blue-500" />
        <h1 className="text-2xl font-bold text-white">Calculadora Surebet</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1d27] border-0">
          <div className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">Configuração da Aposta</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400 block mb-2">
                  Stake Total (R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="1000.00"
                  value={totalStake}
                  onChange={(e) => setTotalStake(e.target.value)}
                  className="bg-[#12141c] border-gray-700 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400 block mb-2">
                  Odds das Casas de Apostas
                </label>
                <div className="space-y-3">
                  {legs.map((leg, index) => (
                    <BetLegInput
                      key={index}
                      leg={leg}
                      index={index}
                      onLegChange={updateLeg}
                      onRemoveLeg={removeLeg}
                    />
                  ))}
                </div>
                
                <Button
                  onClick={addLeg}
                  variant="outline"
                  className="w-full mt-3 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Odd
                </Button>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={calculateSurebet}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calcular
                </Button>
                <Button
                  onClick={clearCalculation}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-[#1a1d27] border-0">
          <div className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">Resultados</h2>
            
            {!results ? (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">
                  Configure as odds e clique em "Calcular" para ver os resultados
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  results.isSurebet 
                    ? "bg-green-500/20 border border-green-500/40" 
                    : "bg-red-500/20 border border-red-500/40"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">
                      {results.isSurebet ? "✅ Surebet Detectada!" : "❌ Não é Surebet"}
                    </span>
                    <span className={`font-bold ${
                      results.isSurebet ? "text-green-400" : "text-red-400"
                    }`}>
                      {results.arbitragePercentage.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-medium">Stakes Recomendadas:</h3>
                  {results.stakes.map((stake, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-[#12141c] rounded-md">
                      <span className="text-gray-300">Casa #{index + 1}</span>
                      <span className="text-white font-medium">R$ {stake.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-medium">Lucro por Resultado:</h3>
                  {results.profits.map((profit, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-[#12141c] rounded-md">
                      <span className="text-gray-300">Se Casa #{index + 1} vencer</span>
                      <span className={`font-medium ${
                        profit >= 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        R$ {profit.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Investido:</span>
                    <span className="text-white font-medium">
                      R$ {results.totalStakeUsed.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="bg-[#1a1d27] border-0 mt-6">
        <div className="p-6">
          <h3 className="text-lg font-medium text-white mb-4">Como usar a Calculadora</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-300">
            <div>
              <h4 className="text-white font-medium mb-2">Configuração Básica:</h4>
              <ul className="space-y-1">
                <li>• Insira o valor total que deseja apostar</li>
                <li>• Adicione as odds de diferentes casas de apostas</li>
                <li>• Clique em "Calcular" para ver os resultados</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Configurações Avançadas:</h4>
              <ul className="space-y-1">
                <li>• <strong>Stake Fixo (C):</strong> Define um valor fixo para uma casa específica</li>
                <li>• <strong>Lucro (D):</strong> Distribui o lucro igualmente entre os resultados</li>
                <li>• Use essas opções para estratégias mais específicas</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}