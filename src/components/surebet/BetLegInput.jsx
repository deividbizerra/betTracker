import React from 'react';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function BetLegInput({ leg, index, onLegChange, onRemoveLeg }) {
  const handleInputChange = (field, value) => {
    onLegChange(index, { ...leg, [field]: value });
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-[#1f2333] rounded-md mb-3">
      <span className="text-gray-400 font-medium w-8">#{index + 1}</span>
      <div className="flex-1">
        <label htmlFor={`odd-${index}`} className="text-xs text-gray-400 block mb-1">Odd</label>
        <Input
          id={`odd-${index}`}
          type="number"
          step="0.01"
          placeholder="Ex: 2.10"
          value={leg.odd}
          onChange={(e) => handleInputChange('odd', e.target.value)}
          className="bg-[#12141c] border-gray-700 text-white w-full"
        />
      </div>
      <div className="w-28">
        <label htmlFor={`c-stake-${index}`} className="text-xs text-gray-400 block mb-1">Stake Fixo (C)</label>
        <Input
          id={`c-stake-${index}`}
          type="number"
          step="0.01"
          placeholder="R$"
          value={leg.fixedStake}
          onChange={(e) => handleInputChange('fixedStake', e.target.value)}
          className="bg-[#12141c] border-gray-700 text-white w-full"
        />
      </div>
      <div className="flex flex-col items-center justify-center pt-4">
        <Checkbox
          id={`d-profit-${index}`}
          checked={leg.distributeProfit}
          onCheckedChange={(checked) => handleInputChange('distributeProfit', checked)}
        />
        <label htmlFor={`d-profit-${index}`} className="text-xs text-gray-400 mt-1">Lucro (D)</label>
      </div>
      {index > 1 && ( // Allow removal only if more than 2 legs
        <Button variant="ghost" size="icon" onClick={() => onRemoveLeg(index)} className="text-red-500 hover:text-red-400">
          <X className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}