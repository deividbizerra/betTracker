
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BetFiltersModal({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onClearFilters,
  bookies
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-[#1a1d27] text-white border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar Apostas</DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Data De</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal bg-[#12141c] border-gray-700 text-white hover:bg-gray-800 hover:text-white"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(new Date(filters.dateFrom), "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#1a1d27] border-gray-700 text-white" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom ? new Date(filters.dateFrom) : null}
                    onSelect={(date) => onFilterChange("dateFrom", date)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Data Até</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal bg-[#12141c] border-gray-700 text-white hover:bg-gray-800 hover:text-white"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(new Date(filters.dateTo), "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#1a1d27] border-gray-700 text-white" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo ? new Date(filters.dateTo) : null}
                    onSelect={(date) => onFilterChange("dateTo", date)}
                    initialFocus
                    locale={ptBR}
                    disabled={(date) => filters.dateFrom && date < new Date(filters.dateFrom)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Status</label>
            <Select value={filters.status} onValueChange={(value) => onFilterChange("status", value)}>
              <SelectTrigger className="w-full bg-[#12141c] border-gray-700 text-white">
                <SelectValue placeholder="Todos Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1d27] border-gray-700 text-white">
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="won">Ganho</SelectItem>
                <SelectItem value="lost">Perda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Tipo de Aposta</label>
            <Select value={filters.betType} onValueChange={(value) => onFilterChange("betType", value)}>
              <SelectTrigger className="w-full bg-[#12141c] border-gray-700 text-white">
                <SelectValue placeholder="Todos Tipos" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1d27] border-gray-700 text-white">
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value="Simples">Simples</SelectItem>
                <SelectItem value="Back">Back</SelectItem>
                <SelectItem value="Lay">Lay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Casa de Apostas</label>
            <Select value={filters.bookieId} onValueChange={(value) => onFilterChange("bookieId", value)}>
              <SelectTrigger className="w-full bg-[#12141c] border-gray-700 text-white">
                <SelectValue placeholder="Todas Casas" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1d27] border-gray-700 text-white">
                <SelectItem value="all">Todas Casas</SelectItem>
                {bookies.map(bookie => (
                  <SelectItem key={bookie.id} value={bookie.id}>{bookie.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="sm:justify-between pt-6">
          <Button
            variant="ghost"
            onClick={() => {
              onClearFilters();
            }}
            className="text-red-400 hover:bg-red-900/20 hover:text-red-300 gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            Limpar Filtros
          </Button>
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Aplicar Filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
