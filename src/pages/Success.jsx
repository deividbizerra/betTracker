import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { confirmPaymentSession } from '@/api/functions';

export default function Success() {
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      confirmPayment(sessionId);
    } else {
      setLoading(false);
    }
  }, []);

  const confirmPayment = async (sessionId) => {
    try {
      const { data } = await confirmPaymentSession({ session_id: sessionId });
      setConfirmed(data.success);
    } catch (error) {
      console.error('Error confirming payment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#12141c] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#12141c] flex items-center justify-center p-6">
      <Card className="bg-[#1a1d27] border-0 max-w-md w-full text-center">
        <div className="p-8">
          {confirmed ? (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Pagamento Confirmado!</h1>
              <p className="text-gray-400 mb-6">
                Parabéns! Sua conta foi atualizada para o Plano PRO. Agora você tem acesso a todos os recursos premium.
              </p>
              
              <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2">
                  <Crown className="w-5 h-5" />
                  <span className="font-semibold">Plano PRO Ativo</span>
                </div>
                <div className="text-sm text-gray-300">
                  • Apostas ilimitadas<br/>
                  • Análises avançadas<br/>
                  • Suporte prioritário
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Erro na Confirmação</h1>
              <p className="text-gray-400 mb-6">
                Não foi possível confirmar seu pagamento. Entre em contato com o suporte.
              </p>
            </>
          )}
          
          <Link to={createPageUrl("Dashboard")}>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}