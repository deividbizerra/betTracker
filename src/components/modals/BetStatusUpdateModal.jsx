import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export default function BetStatusUpdateModal({ isOpen, onClose, bet, onUpdate }) {
  const [selectedStatus, setSelectedStatus] = useState(bet?.status || "pending");
  const [cashoutValue, setCashoutValue] = useState("");
  const [isCashout, setIsCashout] = useState(false);

  // Reset state when bet changes
  React.useEffect(() => {
    if (bet) {
      setSelectedStatus(bet.status || "pending");
      setCashoutValue("");
      setIsCashout(false);
    }
  }, [bet]);

  const handleUpdateStatus = () => {
    if (!bet) return;

    let updateData = { status: selectedStatus };
    
    // If cashout is selected, include the cashout value
    if (isCashout && cashoutValue) {
      updateData.cashout_value = parseFloat(cashoutValue);
    }
    
    onUpdate(bet.id, updateData);
    onClose();
  };

  if (!bet) return null;

  const statusOptions = [
    { id: "won", label: "Ganho", color: "bg-green-500" },
    { id: "lost", label: "Perdida", color: "bg-red-500" },
    { id: "pending", label: "Pendente", color: "bg-gray-500" },
    { id: "cashout", label: "Cashout", color: "bg-orange-500" },
    // Additional status options you might want to add
    // { id: "void", label: "Cancelado", color: "bg-gray-400" },
    // { id: "half_won", label: "Meio ganho", color: "bg-green-400" },
    // { id: "half_lost", label: "Meio perdido", color: "bg-red-400" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1d27] text-white border-gray-700 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{bet.match}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
          {statusOptions.map(status => (
            <Button
              key={status.id}
              variant="outline"
              className={`w-full justify-center text-white border-transparent hover:bg-opacity-80 ${
                selectedStatus === status.id || (isCashout && status.id === "cashout")
                  ? `${status.color} border-white`
                  : "bg-gray-700"
              }`}
              onClick={() => {
                setSelectedStatus(status.id);
                setIsCashout(status.id === "cashout");
              }}
            >
              {status.label}
            </Button>
          ))}
          
          {isCashout && (
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-gray-300">Valor do Cashout</label>
              <Input
                type="number"
                value={cashoutValue}
                onChange={(e) => setCashoutValue(e.target.value)}
                className="bg-[#12141c] border-gray-700 text-white"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-400">
                Insira o valor recebido do cashout feito na casa de apostas
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            onClick={handleUpdateStatus}
            className="bg-blue-600 hover:bg-blue-700 w-full"
          >
            Atualizar Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}