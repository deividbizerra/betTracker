
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

const DEFAULT_BET_LIMIT = 50;

export default function BetLimitDialog({ isOpen, onClose, user, onSaveBetLimit }) {
  const [newLimit, setNewLimit] = useState("");

  useEffect(() => {
    if (user) {
      setNewLimit(user.bet_limit_override !== null && user.bet_limit_override !== undefined ? String(user.bet_limit_override) : "");
    }
  }, [isOpen, user]);

  const handleSave = () => {
    const limitValue = newLimit === "" ? null : parseInt(newLimit, 10);
    if (newLimit !== "" && (isNaN(limitValue) || limitValue < 0)) {
      alert("Por favor, insira um número válido para o limite de apostas.");
      return;
    }
    onSaveBetLimit(user.id, limitValue);
    onClose();
  };

  const handleRemoveOverride = () => {
    setNewLimit("");
  };

  if (!user) return null;

  const currentEffectiveLimit = user.bet_limit_override !== null && user.bet_limit_override !== undefined 
    ? user.bet_limit_override 
    : DEFAULT_BET_LIMIT;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1d27] text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Gerenciar Limite de Apostas</DialogTitle>
          <DialogDescription>
            Usuário: {user.full_name} ({user.email})<br />
            Limite Padrão: {DEFAULT_BET_LIMIT} apostas. O limite atual é: {currentEffectiveLimit}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label htmlFor="betLimit" className="text-sm font-medium text-gray-400">
              Novo Limite de Apostas (deixe em branco para usar o padrão: {DEFAULT_BET_LIMIT})
            </label>
            <Input
              id="betLimit"
              type="number"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              className="bg-[#12141c] border-gray-700 text-white mt-1"
              placeholder={`Ex: 100 (Padrão: ${DEFAULT_BET_LIMIT})`}
            />
          </div>
           { (user.bet_limit_override !== null && user.bet_limit_override !== undefined) && (
              <Button variant="ghost" size="sm" onClick={handleRemoveOverride} className="mt-1 text-yellow-400 hover:text-yellow-300">
                  <X className="w-4 h-4 mr-1"/> Remover Limite Personalizado
              </Button>
            )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:bg-gray-800 hover:text-white">Cancelar</Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">Salvar Limite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
