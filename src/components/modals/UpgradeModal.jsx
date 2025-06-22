import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Zap } from "lucide-react";
import { createCheckoutSession } from '@/api/functions';

export default function UpgradeModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data } = await createCheckoutSession();
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não recebida.');
      }
    } catch (error) {
      console.error("Erro ao criar sessão de checkout:", error);
      alert("Não foi possível iniciar o processo de assinatura. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1d27] text-white border-gray-700">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Crown className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-bold">Desbloqueie todo o Potencial</DialogTitle>
          <DialogDescription className="text-center text-gray-400 pt-2">
            Você atingiu o limite de uso gratuito. Para continuar, assine o Plano PRO por R$ 29,90/mês.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-sm text-gray-300">
            <ul className="space-y-2">
                <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-green-500" /> Apostas e Bankrolls ilimitados</li>
                <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-green-500" /> Análises avançadas e ROI detalhado</li>
                <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-green-500" /> Suporte prioritário</li>
            </ul>
        </div>
        <DialogFooter>
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? "Aguarde..." : "Assinar Plano PRO"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}