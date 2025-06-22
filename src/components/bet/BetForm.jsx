import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { BET_TYPES, BET_STATUS } from '@/utils/constants';
import { calculateBetProfit } from '@/utils/betCalculations';

export default function BetForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  bet = null, 
  bankrollId,
  sports = [],
  bookies = [],
  loading = false 
}) {
  const [formData, setFormData] = useState({
    bankroll_id: bankrollId || "",
    bookie_id: "",
    sport_id: "",
    match: "",
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    stake: "",
    odds: "",
    bet_type: BET_TYPES.SIMPLE,
    status: BET_STATUS.PENDING,
    commission: 0
  });

  useEffect(() => {
    if (bet) {
      setFormData({
        ...bet,
        date: format(new Date(bet.date), "yyyy-MM-dd'T'HH:mm")
      });
    } else {
      setFormData({
        bankroll_id: bankrollId || "",
        bookie_id: "",
        sport_id: "",
        match: "",
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        stake: "",
        odds: "",
        bet_type: BET_TYPES.SIMPLE,
        status: BET_STATUS.PENDING,
        commission: 0
      });
    }
  }, [bet, bankrollId, isOpen]);

  const handleSubmit = () => {
    const betData = {
      ...formData,
      stake: parseFloat(formData.stake),
      odds: parseFloat(formData.odds),
      commission: parseFloat(formData.commission) || 0,
      profit: calculateBetProfit(formData)
    };
    
    onSubmit(betData);
  };

  const isValid = formData.match && formData.stake && formData.odds && formData.bookie_id && formData.sport_id;

  const calculatePotentialProfit = () => {
    if (!formData.stake || !formData.odds) return 0;
    
    const stake = parseFloat(formData.stake);
    const odds = parseFloat(formData.odds);
    const commission = parseFloat(formData.commission) || 0;
    
    if (formData.bet_type === BET_TYPES.BACK) {
      const grossProfit = stake * (odds - 1);
      return grossProfit - (grossProfit * commission / 100);
    } else if (formData.bet_type === BET_TYPES.LAY) {
      return stake - (stake * commission / 100);
    } else {
      return stake * (odds - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1d27] text-white border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle>{bet ? "Editar Aposta" : "Nova Aposta"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Casa de Apostas</label>
              <Select
                value={formData.bookie_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, bookie_id: value }))}
              >
                <SelectTrigger className="bg-[#12141c] border-gray-700 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d27] border-gray-700 text-white">
                  {bookies.map(bookie => (
                    <SelectItem key={bookie.id} value={bookie.id}>
                      {bookie.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Esporte</label>
              <Select
                value={formData.sport_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, sport_id: value }))}
              >
                <SelectTrigger className="bg-[#12141c] border-gray-700 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d27] border-gray-700 text-white">
                  {sports.map(sport => (
                    <SelectItem key={sport.id} value={sport.id}>
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
              value={formData.match}
              onChange={(e) => setFormData(prev => ({ ...prev, match: e.target.value }))}
              className="bg-[#12141c] border-gray-700 text-white"
              placeholder="Time A x Time B"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Data e Hora</label>
              <Input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="bg-[#12141c] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Stake</label>
              <Input
                type="number"
                step="0.01"
                value={formData.stake}
                onChange={(e) => setFormData(prev => ({ ...prev, stake: e.target.value }))}
                className="bg-[#12141c] border-gray-700 text-white"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Odds</label>
              <Input
                type="number"
                step="0.01"
                value={formData.odds}
                onChange={(e) => setFormData(prev => ({ ...prev, odds: e.target.value }))}
                className="bg-[#12141c] border-gray-700 text-white"
                placeholder="1.50"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Tipo de Aposta</label>
              <div className="flex gap-2">
                {Object.values(BET_TYPES).map(type => (
                  <Badge 
                    key={type}
                    variant="outline" 
                    className={`cursor-pointer ${
                      formData.bet_type === type
                        ? type === BET_TYPES.SIMPLE ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                        : type === BET_TYPES.BACK ? "bg-green-500/20 text-green-400 border-green-500/40"
                        : "bg-red-500/20 text-red-400 border-red-500/40"
                        : "text-gray-400 border-gray-700"
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, bet_type: type }))}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="bg-[#12141c] border-gray-700 text-white">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d27] border-gray-700 text-white">
                  <SelectItem value={BET_STATUS.PENDING}>Pendente</SelectItem>
                  <SelectItem value={BET_STATUS.WON}>Ganho</SelectItem>
                  <SelectItem value={BET_STATUS.LOST}>Perda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(formData.bet_type === BET_TYPES.BACK || formData.bet_type === BET_TYPES.LAY) && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Comissão (%)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.commission || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, commission: parseFloat(e.target.value) || 0 }))}
                className="bg-[#12141c] border-gray-700 text-white"
                placeholder="Ex: 5"
              />
            </div>
          )}

          {formData.bet_type === BET_TYPES.LAY && formData.stake && formData.odds && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Responsabilidade</label>
              <div className="bg-[#12141c] border border-gray-700 rounded-md p-3 text-white">
                R$ {((parseFloat(formData.odds) - 1) * parseFloat(formData.stake)).toFixed(2)}
              </div>
            </div>
          )}

          {formData.stake && formData.odds && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                Lucro Potencial {formData.bet_type === BET_TYPES.LAY ? "(se vencer)" : ""}
              </label>
              <div className="bg-[#12141c] border border-gray-700 rounded-md p-3 text-white">
                R$ {calculatePotentialProfit().toFixed(2)}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="text-red-400 hover:bg-red-900/20 hover:text-red-300"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700"
            disabled={!isValid || loading}
          >
            {loading ? "Salvando..." : bet ? "Salvar" : "Criar Aposta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}