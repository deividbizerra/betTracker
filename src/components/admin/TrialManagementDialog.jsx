
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TrialManagementDialog({ isOpen, onClose, user, onSaveTrial }) {
  const [trialEndDate, setTrialEndDate] = useState(null);
  const [daysToAdd, setDaysToAdd] = useState("");

  useEffect(() => {
    if (user?.trial_ends_at) {
      setTrialEndDate(new Date(user.trial_ends_at));
    } else {
      setTrialEndDate(null);
    }
    setDaysToAdd(""); // Reset days to add when dialog opens or user changes
  }, [isOpen, user]);

  const handleSave = () => {
    onSaveTrial(user.id, trialEndDate);
    onClose();
  };

  const handleAddDays = () => {
    const numDays = parseInt(daysToAdd);
    if (!isNaN(numDays)) {
      const currentBaseDate = trialEndDate || new Date(); // Extend from current trial or today
      setTrialEndDate(addDays(currentBaseDate, numDays));
    }
  };
  
  const handleRemoveTrial = () => {
    setTrialEndDate(null);
    // Optionally, you could call onSaveTrial(user.id, null) directly here if preferred
    // For now, it just sets the local state, user confirms with "Salvar"
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1d27] text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Gerenciar Período de Teste</DialogTitle>
          <DialogDescription>
            Usuário: {user.full_name} ({user.email})
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-400">Data Final do Teste</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal mt-1 bg-[#12141c] border-gray-700 text-white hover:bg-gray-800 hover:text-white"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {trialEndDate ? format(trialEndDate, "PPP", { locale: ptBR }) : <span>Sem teste ativo</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#1a1d27] border-gray-700 text-white" align="start">
                <Calendar
                  mode="single"
                  selected={trialEndDate}
                  onSelect={(date) => {
                    setTrialEndDate(date);
                    setDaysToAdd(""); // Clear days to add if a specific date is picked
                  }}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
             {trialEndDate && (
                <Button variant="ghost" size="sm" onClick={handleRemoveTrial} className="mt-1 text-red-400 hover:text-red-300">
                    <X className="w-4 h-4 mr-1"/> Remover Teste
                </Button>
            )}
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <label htmlFor="daysToAdd" className="text-sm font-medium text-gray-400">Adicionar/Estender Dias</label>
              <Input
                id="daysToAdd"
                type="number"
                value={daysToAdd}
                onChange={(e) => setDaysToAdd(e.target.value)}
                className="bg-[#12141c] border-gray-700 text-white mt-1"
                placeholder="Ex: 7"
              />
            </div>
            <Button onClick={handleAddDays} className="bg-blue-600 hover:bg-blue-700">Adicionar</Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:bg-gray-800 hover:text-white">Cancelar</Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
