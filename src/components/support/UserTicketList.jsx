
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Clock, CheckCircle, MessageSquare, Send, X } from "lucide-react";
import { Ticket } from "@/api/entities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function getCategoryBadge(category) {
  const styles = {
    duvida: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    problema: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    bug: "bg-red-500/20 text-red-400 border-red-500/40",
    sugestao: "bg-green-500/20 text-green-400 border-green-500/40",
    outro: "bg-purple-500/20 text-purple-400 border-purple-500/40"
  };
  
  const labels = {
    duvida: "Dúvida",
    problema: "Problema",
    bug: "Bug",
    sugestao: "Sugestão",
    outro: "Outro"
  };
  
  return (
    <Badge variant="outline" className={styles[category]}>
      {labels[category]}
    </Badge>
  );
}

function getStatusBadge(status) {
  if (status === "aberto") {
    return (
      <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 gap-1">
        <Clock className="w-3 h-3" />
        Aberto
      </Badge>
    );
  } else if (status === "respondido") {
    return (
      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/40 gap-1">
        <MessageSquare className="w-3 h-3" />
        Respondido
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/40 gap-1">
        <CheckCircle className="w-3 h-3" />
        Fechado
      </Badge>
    );
  }
}

export default function UserTicketList({ tickets, loading, onTicketUpdated }) {
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [newResponse, setNewResponse] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);

  const toggleTicket = (ticketId) => {
    setExpandedTicketId(expandedTicketId === ticketId ? null : ticketId);
    setNewResponse("");
  };

  const handleAddResponse = async (ticketId) => {
    if (!newResponse.trim()) return;
    
    try {
      setSendingResponse(true);
      
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) return;
      
      const updatedResponses = [
        ...(ticket.responses || []),
        {
          message: newResponse,
          created_by: ticket.user_email,
          is_admin: false,
          created_date: new Date().toISOString()
        }
      ];
      
      await Ticket.update(ticketId, {
        responses: updatedResponses
      });
      
      setNewResponse("");
      if (onTicketUpdated) onTicketUpdated();
    } catch (error) {
      console.error("Error adding response:", error);
      alert("Erro ao adicionar resposta. Por favor, tente novamente.");
    } finally {
      setSendingResponse(false);
    }
  };

  const handleCloseTicket = async (ticketId) => {
    try {
      await Ticket.update(ticketId, {
        status: "fechado"
      });
      
      if (onTicketUpdated) onTicketUpdated();
    } catch (error) {
      console.error("Error closing ticket:", error);
      alert("Erro ao fechar o ticket. Por favor, tente novamente.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-[#1a1d27] border-0">
            <div className="p-6 animate-pulse">
              <div className="h-5 bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-700/50 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className="bg-[#1a1d27] border-0">
        <div className="p-6 text-center">
          <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhum ticket encontrado</h3>
          <p className="text-gray-400 mb-4">
            Você ainda não abriu nenhum ticket de suporte. Use o formulário para enviar sua primeira mensagem.
          </p>
          <Button 
            onClick={() => {
              // This onClick is likely intended to switch to the "new ticket" tab.
              // Since setActiveTab is not directly available here, we'd need to pass a function from parent
              // or use a different navigation method. For now, keeping it as a no-op.
            }}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Criar novo ticket
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map(ticket => (
        <Card key={ticket.id} className="bg-[#1a1d27] border-0 overflow-hidden">
          <div 
            className="p-6 cursor-pointer"
            onClick={() => toggleTicket(ticket.id)}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-white">{ticket.subject}</h3>
              <div className="flex items-center gap-2">
                {getCategoryBadge(ticket.category)}
                {getStatusBadge(ticket.status)}
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-2 line-clamp-2">
              {ticket.message}
            </p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Criado em {format(new Date(ticket.created_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
              <span>{ticket.responses?.length || 0} {(ticket.responses?.length || 0) === 1 ? 'resposta' : 'respostas'}</span>
            </div>
          </div>
          
          {expandedTicketId === ticket.id && (
            <div className="border-t border-gray-800">
              <div className="p-6 bg-[#12141c]">
                <div className="mb-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white">
                      {ticket.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <span className="text-white font-medium">{ticket.user_name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {format(new Date(ticket.created_date), "dd/MM/yyyy HH:mm")}
                          </span>
                        </div>
                        {getCategoryBadge(ticket.category)}
                      </div>
                      <div className="p-3 bg-[#1a1d27] rounded-lg text-gray-300">
                        {ticket.message}
                      </div>
                    </div>
                  </div>
                  
                  {ticket.responses && ticket.responses.length > 0 && (
                    <div className="space-y-4 mt-6">
                      {ticket.responses.map((response, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                            response.is_admin ? 'bg-blue-700' : 'bg-gray-700'
                          }`}>
                            {response.is_admin ? 'A' : ticket.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <div>
                                <span className="text-white font-medium">
                                  {response.is_admin ? 'Administrador' : ticket.user_name}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {format(new Date(response.created_date), "dd/MM/yyyy HH:mm")}
                                </span>
                              </div>
                            </div>
                            <div className={`p-3 rounded-lg text-gray-300 ${
                              response.is_admin ? 'bg-blue-900/30' : 'bg-[#1a1d27]'
                            }`}>
                              {response.message}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {ticket.status !== "fechado" && (
                  <div>
                    <Textarea
                      placeholder="Digite sua resposta..."
                      className="bg-[#1a1d27] border-gray-700 text-white h-24 mb-3"
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                    />
                    <div className="flex justify-between">
                      <Button
                        variant="ghost"
                        className="text-gray-400 hover:bg-gray-800 hover:text-white"
                        onClick={() => handleCloseTicket(ticket.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Fechar Ticket
                      </Button>
                      <Button
                        onClick={() => handleAddResponse(ticket.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={sendingResponse || !newResponse.trim()}
                      >
                        {sendingResponse ? (
                          <>
                            <span className="animate-spin mr-2">◌</span>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Responder
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
