
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MessageSquare, Send, Inbox, CheckCircle } from "lucide-react";
import { Ticket, User } from "@/api/entities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import UserTicketList from "../components/support/UserTicketList";

export default function Support() {
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    message: "",
    category: "duvida"
  });
  const [activeTab, setActiveTab] = useState("new");

  useEffect(() => {
    loadUserAndTickets();
  }, []);

  const loadUserAndTickets = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      // Load user's tickets
      const ticketsData = await Ticket.filter({ user_email: userData.email }, "-created_date");
      setTickets(ticketsData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading user data:", error);
      setLoading(false);
    }
  };

  const handleSubmitTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    
    try {
      setSending(true);
      await Ticket.create({
        ...newTicket,
        status: "aberto",
        user_email: user.email,
        user_name: user.full_name,
        responses: []
      });
      
      // Success message
      alert("Ticket enviado com sucesso! Nossa equipe responderá em breve.");
      
      // Reset form
      setNewTicket({
        subject: "",
        message: "",
        category: "duvida"
      });
      
      // Reload tickets
      loadUserAndTickets();
      
      // Switch to tickets tab
      setActiveTab("tickets");
    } catch (error) {
      console.error("Error sending ticket:", error);
      alert("Erro ao enviar ticket. Por favor, tente novamente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Suporte</h1>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger 
            value="new" 
            className="text-gray-400 bg-gray-800 hover:bg-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Novo Ticket
          </TabsTrigger>
          <TabsTrigger 
            value="tickets" 
            className="text-gray-400 bg-gray-800 hover:bg-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Inbox className="w-4 h-4 mr-2" />
            Meus Tickets {!loading && tickets.length > 0 && `(${tickets.length})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="new">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-[#1a1d27] border-0">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                  </div>
                  <h2 className="text-lg font-medium text-white">Enviar Ticket</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400 mb-1 block">Assunto</label>
                    <Input
                      placeholder="Resumo do seu problema ou dúvida"
                      className="bg-[#12141c] border-gray-700 text-white"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-400 mb-1 block">Categoria</label>
                    <Select 
                      value={newTicket.category} 
                      onValueChange={(value) => setNewTicket({...newTicket, category: value})}
                    >
                      <SelectTrigger className="bg-[#12141c] border-gray-700 text-white">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1d27] border-gray-700">
                        <SelectItem value="duvida">Dúvida</SelectItem>
                        <SelectItem value="problema">Problema</SelectItem>
                        <SelectItem value="bug">Bug</SelectItem>
                        <SelectItem value="sugestao">Sugestão</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-400 mb-1 block">Mensagem</label>
                    <Textarea
                      placeholder="Descreva sua dúvida ou problema em detalhes..."
                      className="bg-[#12141c] border-gray-700 text-white h-36"
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({...newTicket, message: e.target.value})}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSubmitTicket} 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={sending}
                  >
                    {sending ? (
                      <>
                        <span className="animate-spin mr-2">◌</span>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Ticket
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="bg-[#1a1d27] border-0">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-500" />
                  </div>
                  <h2 className="text-lg font-medium text-white">Contato Direto</h2>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-400">
                    Se preferir, você também pode entrar em contato conosco diretamente através do e-mail:
                  </p>
                  <a 
                    href="mailto:suporte@bettracker.com"
                    className="text-blue-500 hover:text-blue-400 block"
                  >
                    suporte@bettracker.com
                  </a>
                  <p className="text-gray-400">
                    Nossa equipe está disponível em horário comercial e responderá sua mensagem em até 24 horas úteis.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tickets">
          <UserTicketList tickets={tickets} loading={loading} onTicketUpdated={loadUserAndTickets} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
