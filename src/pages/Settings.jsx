
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "@/api/entities";
import { Settings2, Bell, Shield, LogOut, Wallet, Crown } from "lucide-react"; // Added Crown icon
import { createPortalSession } from '@/api/functions'; // Added new import

export default function Settings() {
  const [user, setUser] = React.useState(null);
  const [userSettings, setUserSettings] = React.useState({
    notifications: {
      email: true,
      push: false
    },
    preferences: {
      defaultStake: "",
      defaultBookie: "",
      stakingMethod: "fixed", // fixed, percentage
      stakePercentage: "1",
      currency: "BRL",
      timeFormat: "24h"
    }
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      // Load user settings from user data if they exist
      if (userData.settings) {
        setUserSettings(prevSettings => ({
          ...prevSettings,
          ...userData.settings // Merge existing settings with loaded ones
        }));
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await User.updateMyUserData({
        settings: userSettings
      });
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data } = await createPortalSession();
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No URL returned from portal session creation.');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert('Erro ao abrir portal de assinatura. Tente novamente.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Configurações</h1>

      <div className="grid gap-6">
        <Card className="bg-[#1a1d27] border-0">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-lg font-medium text-white">Configurações da Conta</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Nome</label>
                <Input
                  value={user?.full_name || ""}
                  className="bg-[#12141c] border-gray-700 text-white"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Email</label>
                <Input
                  value={user?.email || ""}
                  className="bg-[#12141c] border-gray-700 text-white"
                  disabled
                />
              </div>
              
              {/* Subscription Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Plano Atual</label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {user?.plan_type === 'pro' && user?.subscription_status === 'active' ? (
                      <>
                        <Crown className="w-5 h-5 text-yellow-500" />
                        <span className="text-yellow-500 font-semibold">Plano PRO</span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-400">Plano Gratuito</span>
                      </>
                    )}
                  </div>
                  {user?.plan_type === 'pro' && user?.subscription_status === 'active' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleManageSubscription}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Gerenciar Assinatura
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-[#1a1d27] border-0">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-500" />
              </div>
              <h2 className="text-lg font-medium text-white">Preferências de Apostas</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Método de Stake</label>
                  <Select 
                    value={userSettings.preferences.stakingMethod}
                    onValueChange={(value) => setUserSettings({
                      ...userSettings,
                      preferences: { ...userSettings.preferences, stakingMethod: value }
                    })}
                  >
                    <SelectTrigger className="bg-[#12141c] border-gray-700 text-white">
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d27] border-gray-700">
                      <SelectItem value="fixed">Valor Fixo</SelectItem>
                      <SelectItem value="percentage">Porcentagem do Bankroll</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {userSettings.preferences.stakingMethod === "fixed" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Stake Padrão</label>
                    <Input
                      type="number"
                      value={userSettings.preferences.defaultStake}
                      onChange={(e) => setUserSettings({
                        ...userSettings,
                        preferences: { ...userSettings.preferences, defaultStake: e.target.value }
                      })}
                      className="bg-[#12141c] border-gray-700 text-white"
                      placeholder="100.00"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Porcentagem do Bankroll</label>
                    <Select 
                      value={userSettings.preferences.stakePercentage}
                      onValueChange={(value) => setUserSettings({
                        ...userSettings,
                        preferences: { ...userSettings.preferences, stakePercentage: value }
                      })}
                    >
                      <SelectTrigger className="bg-[#12141c] border-gray-700 text-white">
                        <SelectValue placeholder="Selecione a porcentagem" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1d27] border-gray-700">
                        <SelectItem value="0.5">0.5%</SelectItem>
                        <SelectItem value="1">1%</SelectItem>
                        <SelectItem value="2">2%</SelectItem>
                        <SelectItem value="3">3%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Moeda</label>
                  <Select 
                    value={userSettings.preferences.currency}
                    onValueChange={(value) => setUserSettings({
                      ...userSettings,
                      preferences: { ...userSettings.preferences, currency: value }
                    })}
                  >
                    <SelectTrigger className="bg-[#12141c] border-gray-700 text-white">
                      <SelectValue placeholder="Selecione a moeda" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d27] border-gray-700">
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                      <SelectItem value="USD">Dólar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Formato de Hora</label>
                  <Select 
                    value={userSettings.preferences.timeFormat}
                    onValueChange={(value) => setUserSettings({
                      ...userSettings,
                      preferences: { ...userSettings.preferences, timeFormat: value }
                    })}
                  >
                    <SelectTrigger className="bg-[#12141c] border-gray-700 text-white">
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d27] border-gray-700">
                      <SelectItem value="12h">12 horas (AM/PM)</SelectItem>
                      <SelectItem value="24h">24 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-[#1a1d27] border-0">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-lg font-medium text-white">Notificações</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Notificações por Email</p>
                  <p className="text-sm text-gray-400">Receba atualizações no seu email</p>
                </div>
                <Switch
                  checked={userSettings.notifications.email}
                  onCheckedChange={(checked) => setUserSettings({
                    ...userSettings,
                    notifications: { ...userSettings.notifications, email: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Notificações Push</p>
                  <p className="text-sm text-gray-400">Receba notificações no navegador</p>
                </div>
                <Switch
                  checked={userSettings.notifications.push}
                  onCheckedChange={(checked) => setUserSettings({
                    ...userSettings,
                    notifications: { ...userSettings.notifications, push: checked }
                  })}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-between items-center">
          <Button 
            variant="ghost"
            className="text-gray-400 hover:bg-gray-800 hover:text-white"
            onClick={() => User.logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>

          <Button 
            onClick={saveSettings}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
