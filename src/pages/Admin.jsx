
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User } from "@/api/entities";
import { Bookie } from "@/api/entities";
import { Sport } from "@/api/entities";
import { Ticket } from "@/api/entities";
import { Bet } from "@/api/entities";
import { Tutorial } from "@/api/entities"; // New import
import { Users, ShieldCheck, Gamepad2, Plus, Pencil, Trash, CalendarDays, UserCog, MessageSquare, PlayCircle } from "lucide-react"; // PlayCircle added
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import BetLimitDialog from "@/components/admin/BetLimitDialog";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Textarea } from "@/components/ui/textarea"; // New import for tutorial description

const DEFAULT_BET_LIMIT = 50; // Define default bet limit for display

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bookie State
  const [bookies, setBookies] = useState([]);
  const [showBookieDialog, setShowBookieDialog] = useState(false);
  const [editingBookie, setEditingBookie] = useState(null);
  const [bookieFormData, setBookieFormData] = useState({ name: "", logo_url: "" });

  // Sport State
  const [sports, setSports] = useState([]);
  const [showSportDialog, setShowSportDialog] = useState(false);
  const [editingSport, setEditingSport] = useState(null);
  const [sportFormData, setSportFormData] = useState({ name: "", icon: "" });
  
  // Tutorial State // New state
  const [tutorials, setTutorials] = useState([]);
  const [showTutorialDialog, setShowTutorialDialog] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState(null);
  const [tutorialFormData, setTutorialFormData] = useState({ title: "", description: "", video_url: "", category: "" });
  
  const [deleteConfirmation, setDeleteConfirmation] = useState({ open: false, id: null, type: null });

  // User Management State
  const [showBetLimitDialog, setShowBetLimitDialog] = useState(false);
  const [selectedUserForBetLimit, setSelectedUserForBetLimit] = useState(null);
  const [newTicketsCount, setNewTicketsCount] = useState(0);
  const navigate = useNavigate();


  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [usersData, bookiesData, sportsData, ticketsData, allBetsData, tutorialsData] = await Promise.all([
        User.list(),
        Bookie.list(),
        Sport.list(),
        Ticket.filter({ status: "aberto" }), // Get all open tickets
        Bet.list(), // Adicionar busca de todas as apostas
        Tutorial.list(), // Fetch tutorials
      ]);
      
      // Contar apostas por usuário
      const betCountByUser = {};
      allBetsData.forEach(bet => {
        if (bet.created_by) {
          betCountByUser[bet.created_by] = (betCountByUser[bet.created_by] || 0) + 1;
        }
      });

      // Adicionar contagem de apostas aos dados dos usuários
      const usersWithBetCount = usersData.map(user => ({
        ...user,
        bet_count: betCountByUser[user.email] || 0
      }));

      setUsers(usersWithBetCount);
      setBookies(bookiesData);
      setSports(sportsData);
      setTutorials(tutorialsData); // Set tutorials state
      
      // Count new tickets that have no responses yet
      const newTickets = ticketsData.filter(ticket => 
        !ticket.responses || ticket.responses.length === 0
      );
      setNewTicketsCount(newTickets.length);
    } catch (error) {
      console.error("Error loading admin data:", error);
    }
    setLoading(false);
  };

  // Bookie Handlers
  const handleOpenBookieDialog = (bookie = null) => {
    if (bookie) {
      setEditingBookie(bookie);
      setBookieFormData({ name: bookie.name, logo_url: bookie.logo_url || "" });
    } else {
      setEditingBookie(null);
      setBookieFormData({ name: "", logo_url: "" });
    }
    setShowBookieDialog(true);
  };

  const handleBookieSubmit = async () => {
    if (!bookieFormData.name) return; // Basic validation
    try {
      if (editingBookie) {
        await Bookie.update(editingBookie.id, bookieFormData);
      } else {
        await Bookie.create(bookieFormData);
      }
      setShowBookieDialog(false);
      loadAdminData(); // Reload bookies
    } catch (error) {
      console.error("Error saving bookie:", error);
    }
  };

  const handleDeleteBookie = (id) => {
    setDeleteConfirmation({ open: true, id, type: 'bookie' });
  };

  // Sport Handlers
  const handleOpenSportDialog = (sport = null) => {
    if (sport) {
      setEditingSport(sport);
      setSportFormData({ name: sport.name, icon: sport.icon || "" });
    } else {
      setEditingSport(null);
      setSportFormData({ name: "", icon: "" });
    }
    setShowSportDialog(true);
  };

  const handleSportSubmit = async () => {
    if (!sportFormData.name) return; // Basic validation
    try {
      if (editingSport) {
        await Sport.update(editingSport.id, sportFormData);
      } else {
        await Sport.create(sportFormData);
      }
      setShowSportDialog(false);
      loadAdminData(); // Reload sports
    } catch (error) {
      console.error("Error saving sport:", error);
    }
  };

  const handleDeleteSport = (id) => {
    setDeleteConfirmation({ open: true, id, type: 'sport' });
  };

  // Tutorial Handlers // New handlers
  const handleOpenTutorialDialog = (tutorial = null) => {
    if (tutorial) {
      setEditingTutorial(tutorial);
      setTutorialFormData({ ...tutorial });
    } else {
      setEditingTutorial(null);
      setTutorialFormData({ title: "", description: "", video_url: "", category: "" });
    }
    setShowTutorialDialog(true);
  };

  const handleTutorialSubmit = async () => {
    if (!tutorialFormData.title || !tutorialFormData.video_url || !tutorialFormData.category) return;
    try {
      if (editingTutorial) {
        await Tutorial.update(editingTutorial.id, tutorialFormData);
      } else {
        await Tutorial.create(tutorialFormData);
      }
      setShowTutorialDialog(false);
      loadAdminData();
    } catch (error) {
      console.error("Error saving tutorial:", error);
    }
  };

  const handleDeleteTutorial = (id) => {
    setDeleteConfirmation({ open: true, id, type: 'tutorial' });
  };
  
  const confirmDelete = async () => {
    const { id, type } = deleteConfirmation;
    try {
      if (type === 'bookie') {
        await Bookie.delete(id);
      } else if (type === 'sport') {
        await Sport.delete(id);
      } else if (type === 'tutorial') { // New condition
        await Tutorial.delete(id);
      }
      loadAdminData();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
    setDeleteConfirmation({ open: false, id: null, type: null });
  };

  // User Management Handlers
  const handleToggleUserBlock = async (userId, isBlocked) => {
    try {
      await User.update(userId, { is_blocked: isBlocked });
      // Update local state for immediate UI feedback
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, is_blocked: isBlocked } : u));
    } catch (error) {
      console.error("Error updating user block status:", error);
      // Optionally, reload all data or show an error message
      loadAdminData(); 
    }
  };

  const handleOpenBetLimitDialog = (user) => {
    setSelectedUserForBetLimit(user);
    setShowBetLimitDialog(true);
  };

  const handleSaveBetLimit = async (userId, newLimit) => {
    try {
      await User.update(userId, { bet_limit_override: newLimit });
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, bet_limit_override: newLimit } : u));
      setShowBetLimitDialog(false);
    } catch (error) {
      console.error("Error saving bet limit:", error);
      loadAdminData(); // Reload to be safe
    }
  };


  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Painel Administrativo</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <Card className="bg-[#1a1d27] border-0">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <h3 className="mt-4 text-sm font-medium text-gray-400">Usuários Ativos</h3>
            <p className="mt-1 text-2xl font-semibold text-white">
              {loading ? "..." : users.filter(u => !u.is_blocked).length}
            </p>
          </div>
        </Card>
        <Card className="bg-[#1a1d27] border-0">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-green-500" />
              </div>
            </div>
            <h3 className="mt-4 text-sm font-medium text-gray-400">Casas de Apostas</h3>
            <p className="mt-1 text-2xl font-semibold text-white">
              {loading ? "..." : bookies.length}
            </p>
          </div>
        </Card>
        <Card className="bg-[#1a1d27] border-0">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <h3 className="mt-4 text-sm font-medium text-gray-400">Esportes</h3>
            <p className="mt-1 text-2xl font-semibold text-white">
              {loading ? "..." : sports.length}
            </p>
          </div>
        </Card>
        <Card 
          className={`bg-[#1a1d27] border-0 cursor-pointer hover:bg-[#1f2333] transition-colors ${
            newTicketsCount > 0 ? "border-l-4 border-l-red-500" : ""
          }`}
          onClick={() => navigate(createPageUrl("AdminTickets"))}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-red-500" />
              </div>
              {newTicketsCount > 0 && (
                <Badge className="bg-red-500 text-white">{newTicketsCount}</Badge>
              )}
            </div>
            <h3 className="mt-4 text-sm font-medium text-gray-400">Tickets de Suporte</h3>
            <p className="mt-1 text-2xl font-semibold text-white">
              {loading ? "..." : (
                newTicketsCount > 0 ? 
                  <span className="flex items-center gap-2 text-red-400">
                    {newTicketsCount} {newTicketsCount === 1 ? 'novo' : 'novos'}
                    <span className="animate-pulse">•</span>
                  </span> 
                : "0 novos"
              )}
            </p>
          </div>
        </Card>
        {/* New Tutorials Stats Card */}
        <Card className="bg-[#1a1d27] border-0">
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <PlayCircle className="w-5 h-5 text-cyan-500" />
                    </div>
                </div>
                <h3 className="mt-4 text-sm font-medium text-gray-400">Tutoriais</h3>
                <p className="mt-1 text-2xl font-semibold text-white">
                    {loading ? "..." : tutorials.length}
                </p>
            </div>
        </Card>
      </div>

      {/* Manage Bookies */}
      <Card className="bg-[#1a1d27] border-0 mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-white">Gerenciar Casas de Apostas</CardTitle>
          <Button onClick={() => handleOpenBookieDialog()} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Adicionar Bookie
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-gray-400">Carregando...</p> :
            bookies.length === 0 ? <p className="text-gray-400">Nenhuma casa de aposta cadastrada.</p> : (
            <div className="space-y-3">
              {bookies.map(bookie => (
                <div key={bookie.id} className="flex items-center justify-between p-3 bg-[#12141c] rounded-md">
                  <div className="flex items-center gap-3">
                    {bookie.logo_url && <img src={bookie.logo_url} alt={bookie.name} className="h-8 w-auto rounded-sm bg-white p-0.5"/>}
                    <span className="text-white">{bookie.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenBookieDialog(bookie)} className="text-blue-400 hover:text-blue-300">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteBookie(bookie.id)} className="text-red-400 hover:text-red-300">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage Sports */}
       <Card className="bg-[#1a1d27] border-0 mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-white">Gerenciar Esportes</CardTitle>
          <Button onClick={() => handleOpenSportDialog()} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Adicionar Esporte
          </Button>
        </CardHeader>
        <CardContent>
           {loading ? <p className="text-gray-400">Carregando...</p> :
            sports.length === 0 ? <p className="text-gray-400">Nenhum esporte cadastrado.</p> : (
            <div className="space-y-3">
              {sports.map(sport => (
                <div key={sport.id} className="flex items-center justify-between p-3 bg-[#12141c] rounded-md">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sport.icon}</span>
                    <span className="text-white">{sport.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenSportDialog(sport)} className="text-blue-400 hover:text-blue-300">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSport(sport.id)} className="text-red-400 hover:text-red-300">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage Tutorials */}
      <Card className="bg-[#1a1d27] border-0 mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-white">Gerenciar Tutoriais</CardTitle>
          <Button onClick={() => handleOpenTutorialDialog()} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Adicionar Tutorial
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-gray-400">Carregando...</p> :
            tutorials.length === 0 ? <p className="text-gray-400">Nenhum tutorial cadastrado.</p> : (
            <div className="space-y-3">
              {tutorials.map(tutorial => (
                <div key={tutorial.id} className="flex items-center justify-between p-3 bg-[#12141c] rounded-md">
                  <div className="flex flex-col">
                    <span className="text-white">{tutorial.title}</span>
                    <span className="text-xs text-gray-500">{tutorial.category}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenTutorialDialog(tutorial)} className="text-blue-400 hover:text-blue-300">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTutorial(tutorial.id)} className="text-red-400 hover:text-red-300">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Users Table - MODIFIED */}
      <Card className="bg-[#1a1d27] border-0">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
            <UserCog />
            Gerenciamento de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Nome</th>
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Email</th>
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Função</th>
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Limite Apostas</th>
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Qtd. Apostas</th>
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Data de Registro</th>
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-gray-400">
                      Carregando usuários...
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="border-b border-gray-700/50 hover:bg-[#12141c]/50">
                      <td className="py-3 px-2 text-white">{user.full_name}</td>
                      <td className="py-3 px-2 text-white">{user.email}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin" 
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {user.role === "admin" ? "Admin" : "Usuário"}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_blocked
                            ? "bg-red-500/20 text-red-400"
                            : "bg-green-500/20 text-green-400"
                        }`}>
                          {user.is_blocked ? "Bloqueado" : "Ativo"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-white">
                        {user.bet_limit_override !== null && user.bet_limit_override !== undefined 
                          ? user.bet_limit_override 
                          : DEFAULT_BET_LIMIT}
                         {user.bet_limit_override !== null && user.bet_limit_override !== undefined && <span className="text-xs text-yellow-400 ml-1">(S)</span>}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-white font-medium ${
                          user.bet_count >= (user.bet_limit_override !== null && user.bet_limit_override !== undefined 
                            ? user.bet_limit_override 
                            : DEFAULT_BET_LIMIT) 
                            ? "text-red-400" 
                            : user.bet_count >= (user.bet_limit_override !== null && user.bet_limit_override !== undefined 
                              ? user.bet_limit_override 
                              : DEFAULT_BET_LIMIT) * 0.8 
                                ? "text-yellow-400" 
                                : "text-green-400"
                        }`}>
                          {user.bet_count}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          / {user.bet_limit_override !== null && user.bet_limit_override !== undefined 
                            ? user.bet_limit_override 
                            : DEFAULT_BET_LIMIT}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-400">
                        {new Date(user.created_date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-2 flex items-center gap-2">
                        <Switch
                          checked={!user.is_blocked}
                          onCheckedChange={(checked) => handleToggleUserBlock(user.id, !checked)}
                          title={user.is_blocked ? "Desbloquear usuário" : "Bloquear usuário"}
                          className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 transform scale-75"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleOpenBetLimitDialog(user)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white h-7 w-7"
                          title="Gerenciar limite de apostas"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bookie Dialog */}
      <Dialog open={showBookieDialog} onOpenChange={setShowBookieDialog}>
        <DialogContent className="bg-[#1a1d27] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>{editingBookie ? "Editar" : "Adicionar"} Casa de Aposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="bookieName" className="text-sm font-medium text-gray-400">Nome</label>
              <Input
                id="bookieName"
                value={bookieFormData.name}
                onChange={(e) => setBookieFormData({ ...bookieFormData, name: e.target.value })}
                className="bg-[#12141c] border-gray-700 text-white mt-1"
                placeholder="Nome da casa de aposta"
              />
            </div>
            <div>
              <label htmlFor="bookieLogo" className="text-sm font-medium text-gray-400">URL do Logo</label>
              <Input
                id="bookieLogo"
                value={bookieFormData.logo_url}
                onChange={(e) => setBookieFormData({ ...bookieFormData, logo_url: e.target.value })}
                className="bg-[#12141c] border-gray-700 text-white mt-1"
                placeholder="https://exemplo.com/logo.png"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowBookieDialog(false)} className="text-gray-400 hover:bg-gray-800 hover:text-white">Cancelar</Button>
            <Button onClick={handleBookieSubmit} className="bg-blue-600 hover:bg-blue-700">{editingBookie ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sport Dialog */}
      <Dialog open={showSportDialog} onOpenChange={setShowSportDialog}>
        <DialogContent className="bg-[#1a1d27] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>{editingSport ? "Editar" : "Adicionar"} Esporte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="sportName" className="text-sm font-medium text-gray-400">Nome</label>
              <Input
                id="sportName"
                value={sportFormData.name}
                onChange={(e) => setSportFormData({ ...sportFormData, name: e.target.value })}
                className="bg-[#12141c] border-gray-700 text-white mt-1"
                placeholder="Nome do esporte"
              />
            </div>
            <div>
              <label htmlFor="sportIcon" className="text-sm font-medium text-gray-400">Ícone (Emoji)</label>
              <Input
                id="sportIcon"
                value={sportFormData.icon}
                onChange={(e) => setSportFormData({ ...sportFormData, icon: e.target.value })}
                className="bg-[#12141c] border-gray-700 text-white mt-1"
                placeholder="⚽️"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSportDialog(false)} className="text-gray-400 hover:bg-gray-800 hover:text-white">Cancelar</Button>
            <Button onClick={handleSportSubmit} className="bg-blue-600 hover:bg-blue-700">{editingSport ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Tutorial Dialog */} {/* New Dialog */}
      <Dialog open={showTutorialDialog} onOpenChange={setShowTutorialDialog}>
        <DialogContent className="bg-[#1a1d27] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>{editingTutorial ? "Editar" : "Adicionar"} Tutorial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="tutorialTitle" className="text-sm font-medium text-gray-400">Título</label>
              <Input
                id="tutorialTitle"
                value={tutorialFormData.title}
                onChange={(e) => setTutorialFormData({ ...tutorialFormData, title: e.target.value })}
                className="bg-[#12141c] border-gray-700 text-white mt-1"
                placeholder="Título do vídeo"
              />
            </div>
            <div>
              <label htmlFor="tutorialCategory" className="text-sm font-medium text-gray-400">Categoria</label>
              <Input
                id="tutorialCategory"
                value={tutorialFormData.category}
                onChange={(e) => setTutorialFormData({ ...tutorialFormData, category: e.target.value })}
                className="bg-[#12141c] border-gray-700 text-white mt-1"
                placeholder="Ex: Primeiros Passos"
              />
            </div>
            <div>
              <label htmlFor="tutorialDesc" className="text-sm font-medium text-gray-400">Descrição</label>
              <Textarea
                id="tutorialDesc"
                value={tutorialFormData.description}
                onChange={(e) => setTutorialFormData({ ...tutorialFormData, description: e.target.value })}
                className="bg-[#12141c] border-gray-700 text-white mt-1"
                placeholder="Breve descrição do vídeo"
              />
            </div>
            <div>
              <label htmlFor="tutorialUrl" className="text-sm font-medium text-gray-400">URL de Embed do Vídeo</label>
              <Input
                id="tutorialUrl"
                value={tutorialFormData.video_url}
                onChange={(e) => setTutorialFormData({ ...tutorialFormData, video_url: e.target.value })}
                className="bg-[#12141c] border-gray-700 text-white mt-1"
                placeholder="https://www.youtube.com/embed/VIDEO_ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTutorialDialog(false)} className="text-gray-400 hover:bg-gray-800 hover:text-white">Cancelar</Button>
            <Button onClick={handleTutorialSubmit} className="bg-blue-600 hover:bg-blue-700">{editingTutorial ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, id: null, type: null })}
        onConfirm={confirmDelete}
        title={`Confirmar exclusão de ${deleteConfirmation.type === 'bookie' ? 'Casa de Aposta' : deleteConfirmation.type === 'sport' ? 'Esporte' : 'Tutorial'}`}
        description={`Tem certeza que deseja excluir est${deleteConfirmation.type === 'bookie' ? 'a casa de aposta' : deleteConfirmation.type === 'sport' ? 'e esporte' : 'e tutorial'}? Esta ação não pode ser desfeita.`}
      />

      {/* Bet Limit Management Dialog */}
      {selectedUserForBetLimit && (
        <BetLimitDialog
          isOpen={showBetLimitDialog}
          onClose={() => {
            setShowBetLimitDialog(false);
            setSelectedUserForBetLimit(null);
          }}
          user={selectedUserForBetLimit}
          onSaveBetLimit={handleSaveBetLimit}
        />
      )}
    </div>
  );
}
