
import React, { useState, useEffect } from "react";
import { Bankroll, Bet, User } from "@/api/entities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, TrendingUp, Percent, MoreVertical, Pencil, Trash } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UpgradeModal from "@/components/modals/UpgradeModal";

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, description }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1d27] text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function Bankrolls() {
  const [bankrolls, setBankrolls] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBankroll, setEditingBankroll] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    initial_amount: ""
  });
  const [loading, setLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ open: false, id: null });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadBankrolls();
  }, []);

  const loadBankrolls = async () => {
    try {
      const user = await User.me();
      const data = await Bankroll.filter({ created_by: user.email });
      const bets = await Bet.list();
      
      const updatedBankrolls = await Promise.all(data.map(async (bankroll) => {
        const bankrollBets = bets.filter(bet => bet.bankroll_id === bankroll.id);
        
        const totalStake = bankrollBets.reduce((sum, bet) => sum + bet.stake, 0);
        const totalProfit = bankrollBets.reduce((sum, bet) => sum + (bet.profit || 0), 0);
        
        const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
        const progress = bankroll.initial_amount > 0 
          ? (totalProfit / bankroll.initial_amount) * 100 
          : 0;
        
        const currentAmount = bankroll.initial_amount + totalProfit;
        
        // This update operation should ideally be done in a single transaction if supported,
        // or carefully considered for performance if there are many bankrolls/bets.
        // For this context, assuming Bankroll.update handles it efficiently.
        await Bankroll.update(bankroll.id, {
          ...bankroll,
          current_amount: currentAmount,
          roi: roi,
          progress: progress
        });
        
        return {
          ...bankroll,
          current_amount: currentAmount,
          roi: roi,
          progress: progress
        };
      }));
      
      setBankrolls(updatedBankrolls);
      setLoading(false);
    } catch (error) {
      console.error("Error loading bankrolls:", error);
      setLoading(false);
    }
  };

  const handleOpenDialog = async (bankroll = null) => {
    try {
      const currentUser = await User.me();
      if (currentUser.is_blocked) {
        alert("Sua conta está bloqueada. Você não pode adicionar novos bankrolls.");
        return;
      }

      // Check if user is PRO when creating new bankroll
      if (!bankroll) {
        const isPro = currentUser.plan_type === 'pro' && currentUser.subscription_status === 'active';
        
        if (!isPro) {
          const userBankrolls = await Bankroll.filter({ created_by: currentUser.email });
          if (userBankrolls.length >= 3) { // Limit free users to 3 bankrolls
            setShowUpgradeModal(true);
            return;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user status:", error);
      return;
    }

    if (bankroll) {
      setEditingBankroll(bankroll);
      setFormData({
        name: bankroll.name,
        initial_amount: bankroll.initial_amount.toString()
      });
    } else {
      setEditingBankroll(null);
      setFormData({
        name: "",
        initial_amount: ""
      });
    }
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    try {
      const user = await User.me();
      if (user.is_blocked) {
        alert("Sua conta está bloqueada. Você não pode salvar bankrolls.");
        setShowDialog(false);
        return;
      }
      if (editingBankroll) {
        await Bankroll.update(editingBankroll.id, {
          ...editingBankroll,
          name: formData.name,
          initial_amount: parseFloat(formData.initial_amount)
        });
      } else {
        await Bankroll.create({
          ...formData,
          initial_amount: parseFloat(formData.initial_amount),
          current_amount: parseFloat(formData.initial_amount),
          roi: 0,
          progress: 0,
          created_by: user.email
        });
      }
      
      setShowDialog(false);
      setEditingBankroll(null);
      setFormData({ name: "", initial_amount: "" });
      loadBankrolls();
    } catch (error) {
      console.error("Error saving bankroll:", error);
    }
  };

  const handleDelete = async (bankrollId) => {
    setDeleteConfirmation({ open: true, id: bankrollId });
  };
  
  const confirmDelete = async () => {
    try {
      await Bankroll.delete(deleteConfirmation.id);
      loadBankrolls();
      setDeleteConfirmation({ open: false, id: null });
    } catch (error) {
      console.error("Error deleting bankroll:", error);
      alert("Erro ao excluir bankroll. Tente novamente.");
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-white">Meus Bankrolls</h1>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar Bankroll
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="bg-[#1a1d27] border-0 p-4 animate-pulse">
              <div className="h-5 w-32 bg-gray-700 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-6 w-24 bg-gray-700 rounded" />
                <div className="h-3 w-16 bg-gray-700 rounded" />
              </div>
            </Card>
          ))
        ) : (
          bankrolls.map(bankroll => (
            <Card key={bankroll.id} className="bg-[#1a1d27] border-0 p-4 relative group">
              <div className="absolute top-3 right-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1a1d27] border-gray-700">
                    <DropdownMenuItem
                      onClick={() => handleOpenDialog(bankroll)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-gray-800 cursor-pointer text-sm"
                    >
                      <Pencil className="mr-2 h-3 w-3" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(bankroll.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-gray-800 cursor-pointer text-sm"
                    >
                      <Trash className="mr-2 h-3 w-3" />
                      <span>Excluir</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Link
                to={createPageUrl(`BankrollDetail?id=${bankroll.id}`)}
                className="block hover:opacity-90 transition-opacity"
              >
                <h3 className="text-base font-medium text-white mb-3">{bankroll.name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1 text-lg font-bold text-white">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      {bankroll.roi.toFixed(2)}%
                    </div>
                    <p className="text-xs text-gray-400 mt-1">ROI</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-lg font-bold text-white">
                      <Percent className="w-4 h-4 text-green-500" />
                      {bankroll.progress.toFixed(2)}%
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Progresso</p>
                  </div>
                </div>
              </Link>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1d27] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>{editingBankroll ? "Editar Bankroll" : "Novo Bankroll"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Nome</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-[#12141c] border-gray-700 text-white"
                placeholder="Nome do bankroll"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Valor Inicial</label>
              <Input
                type="number"
                value={formData.initial_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, initial_amount: e.target.value }))}
                className="bg-[#12141c] border-gray-700 text-white"
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowDialog(false);
                setEditingBankroll(null);
                setFormData({ name: "", initial_amount: "" });
              }}
              className="text-red-400 hover:bg-red-900/20 hover:text-red-300"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!formData.name || !formData.initial_amount}
            >
              {editingBankroll ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        isOpen={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, id: null })}
        onConfirm={confirmDelete}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir este bankroll? Esta ação não pode ser desfeita."
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}
