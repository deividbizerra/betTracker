
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Check, Clock, CheckCircle, MessageSquare, ArrowLeft, Filter, Search, X
} from "lucide-react";
import { Ticket, User } from "@/api/entities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [newResponse, setNewResponse] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    search: ""
  });
  const [activeTab, setActiveTab] = useState("open");

  useEffect(() => {
    loadTickets();
  }, [activeTab]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      let allTickets = await Ticket.list("-created_date");
      
      // Filter tickets based on tab
      if (activeTab === "open") {
        allTickets = allTickets.filter(ticket => ticket.status !== "fechado");
      } else if (activeTab === "closed") {
        allTickets = allTickets.filter(ticket => ticket.status === "fechado");
      }
      
      setTickets(allTickets);
      setLoading(false);
    } catch (error) {
      console.error("Error loading tickets:", error);
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredTickets = tickets.filter(ticket => {
    // Status filter
    if (filters.status !== "all" && ticket.status !== filters.status) {
      return false;
    }
    
    // Category filter
    if (filters.category !== "all" && ticket.category !== filters.category) {
      return false;
    }
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        ticket.subject.toLowerCase().includes(searchLower) ||
        ticket.message.toLowerCase().includes(searchLower) ||
        ticket.user_name.toLowerCase().includes(searchLower) ||
        ticket.user_email.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const handleSelectTicket = (ticket) => {
    setActiveTicket(ticket);
    setNewResponse("");
  };

  const handleAddResponse = async () => {
    if (!activeTicket || !newResponse.trim()) return;
    
    try {
      setSendingResponse(true);
      
      const updatedResponses = [
        ...(activeTicket.responses || []),
        {
          message: newResponse,
          created_by: "admin", // We'll use a special admin identifier
          is_admin: true,
          created_date: new Date().toISOString()
        }
      ];
      
      await Ticket.update(activeTicket.id, {
        responses: updatedResponses,
        status: "respondido" // Update status to responded
      });
      
      setNewResponse("");
      loadTickets();
      
      // Update active ticket to show the new response
      const updatedTicket = { 
        ...activeTicket, 
        responses: updatedResponses,
        status: "respondido"
      };
      setActiveTicket(updatedTicket);
    } catch (error) {
      console.error("Error adding response:", error);
      alert("Erro ao adicionar resposta. Por favor, tente novamente.");
    } finally {
      setSendingResponse(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!activeTicket) return;
    
    try {
      await Ticket.update(activeTicket.id, {
        status: "fechado"
      });
      
      // Update active ticket to show it's closed
      const updatedTicket = { ...activeTicket, status: "fechado" };
      setActiveTicket(updatedTicket);
      loadTickets();
    } catch (error) {
      console.error("Error closing ticket:", error);
      alert("Erro ao fechar o ticket. Por favor, tente novamente.");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          size="icon"
          onClick={() => setActiveTicket(null)}
          className={`bg-gray-600 text-white hover:bg-gray-700 border border-gray-700 ${!activeTicket ? 'invisible' : ''}`}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-white">
          {activeTicket ? `Ticket: ${activeTicket.subject}` : "Tickets de Suporte"}
        </h1>
      </div>

      {!activeTicket ? (
        <>
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger 
                value="all" 
                className="text-gray-400 bg-gray-800 hover:bg-gray-700 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
              >
                Todos
              </TabsTrigger>
              <TabsTrigger 
                value="open" 
                className="text-gray-400 bg-gray-800 hover:bg-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Em Aberto
              </TabsTrigger>
              <TabsTrigger 
                value="closed" 
                className="text-gray-400 bg-gray-800 hover:bg-gray-700 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
              >
                Fechados
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Card className="bg-[#1a1d27] border-0 mb-6">
            <div className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      placeholder="Buscar tickets..."
                      className="pl-10 bg-[#12141c] border-gray-700 text-white"
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Select 
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange("status", value)}
                  >
                    <SelectTrigger className="w-[150px] bg-[#12141c] border-gray-700 text-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d27] border-gray-700">
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="aberto">Abertos</SelectItem>
                      <SelectItem value="respondido">Respondidos</SelectItem>
                      <SelectItem value="fechado">Fechados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={filters.category}
                    onValueChange={(value) => handleFilterChange("category", value)}
                  >
                    <SelectTrigger className="w-[150px] bg-[#12141c] border-gray-700 text-white">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d27] border-gray-700">
                      <SelectItem value="all">Todas Categorias</SelectItem>
                      <SelectItem value="duvida">Dúvidas</SelectItem>
                      <SelectItem value="problema">Problemas</SelectItem>
                      <SelectItem value="bug">Bugs</SelectItem>
                      <SelectItem value="sugestao">Sugestões</SelectItem>
                      <SelectItem value="outro">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="ghost"
                    className="text-gray-400 hover:bg-gray-800 hover:text-white"
                    onClick={() => setFilters({ status: "all", category: "all", search: "" })}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-[#1a1d27] border-0">
                  <div className="p-6 animate-pulse">
                    <div className="h-5 bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <Card className="bg-[#1a1d27] border-0">
              <div className="p-6 text-center">
                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">Nenhum ticket encontrado</h3>
                <p className="text-gray-400">
                  Não há tickets que correspondam aos filtros selecionados.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map(ticket => (
                <Card 
                  key={ticket.id} 
                  className={`bg-[#1a1d27] border-0 hover:bg-[#1f2333] transition-colors cursor-pointer ${
                    ticket.status === "aberto" ? "border-l-4 border-l-yellow-500" : ""
                  }`}
                  onClick={() => handleSelectTicket(ticket)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-white">
                        {ticket.subject}
                        {ticket.status === "aberto" && !ticket.responses?.length && (
                          <Badge className="ml-2 bg-red-500 text-white">Novo</Badge>
                        )}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(ticket.category)}
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                          {ticket.message}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>
                            {ticket.user_name} ({ticket.user_email})
                          </span>
                          <span>
                            {format(new Date(ticket.created_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 text-center">
                        <div className="bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center text-white text-sm">
                          {ticket.responses?.length || 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">respostas</div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <Card className="bg-[#1a1d27] border-0">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-lg">
                    {activeTicket.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{activeTicket.user_name}</h3>
                    <div className="text-sm text-gray-400">{activeTicket.user_email}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {getCategoryBadge(activeTicket.category)}
                  {getStatusBadge(activeTicket.status)}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Criado em: {format(new Date(activeTicket.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
                  <h4 className="text-base font-medium text-blue-500 mb-2">{activeTicket.subject}</h4>
                  <div className="p-4 bg-[#12141c] rounded-lg text-gray-300">
                    {activeTicket.message}
                  </div>
                </div>
                
                {activeTicket.responses && activeTicket.responses.length > 0 && (
                  <div className="border-t border-gray-800 pt-4 mt-4">
                    <h4 className="text-gray-400 text-sm mb-4">Respostas ({activeTicket.responses.length})</h4>
                    <div className="space-y-4">
                      {activeTicket.responses.map((response, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                            response.is_admin ? 'bg-blue-700' : 'bg-gray-700'
                          }`}>
                            {response.is_admin ? 'A' : activeTicket.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <div>
                                <span className="text-white font-medium">
                                  {response.is_admin ? 'Administrador' : activeTicket.user_name}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {format(new Date(response.created_date), "dd/MM/yyyy HH:mm")}
                                </span>
                              </div>
                            </div>
                            <div className={`p-3 rounded-lg text-gray-300 ${
                              response.is_admin ? 'bg-blue-900/30' : 'bg-[#12141c]'
                            }`}>
                              {response.message}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {activeTicket.status !== "fechado" && (
                  <div className="border-t border-gray-800 pt-4 mt-4">
                    <label className="text-gray-400 text-sm mb-2 block">Responder ao Ticket</label>
                    <Textarea
                      placeholder="Digite sua resposta ao ticket..."
                      className="bg-[#12141c] border-gray-700 text-white h-32 mb-3"
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                    />
                    <div className="flex justify-between">
                      <Button
                        variant="ghost"
                        className="text-gray-400 hover:bg-gray-800 hover:text-white"
                        onClick={handleCloseTicket}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Fechar Ticket
                      </Button>
                      <Button
                        onClick={handleAddResponse}
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
                            <Check className="w-4 h-4 mr-2" />
                            Enviar Resposta
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
