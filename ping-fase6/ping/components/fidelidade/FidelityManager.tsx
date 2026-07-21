"use client";

import { useEffect, useState, useTransition } from "react";
import { Pencil, Check, Search, Gift, PartyPopper } from "lucide-react";
import { updateFidelityConfig, searchFidelityClients, redeemReward } from "@/app/fidelidade/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type ClientRow = { id: string; name: string; points: number; totalVisits: number };

export function FidelityManager({
  visitsRequired: initialVisitsRequired,
  rewardValue: initialRewardValue,
  initialClients,
}: {
  visitsRequired: number;
  rewardValue: number;
  initialClients: ClientRow[];
}) {
  const [visitsRequired, setVisitsRequired] = useState(initialVisitsRequired);
  const [rewardValue, setRewardValue] = useState(initialRewardValue);
  const [editingConfig, setEditingConfig] = useState(false);
  const [visitsInput, setVisitsInput] = useState(String(initialVisitsRequired));
  const [rewardInput, setRewardInput] = useState(String(initialRewardValue));
  const [configError, setConfigError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [clients, setClients] = useState(initialClients);
  const [isSearching, startSearch] = useTransition();
  const [isRedeeming, startRedeem] = useTransition();
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [justRedeemed, setJustRedeemed] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      startSearch(async () => {
        const { clients } = await searchFidelityClients(query);
        setClients(clients);
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  function saveConfig() {
    const visits = Number(visitsInput);
    const reward = Number(rewardInput.replace(",", "."));
    if (!visits || visits < 1) {
      setConfigError("Precisa ser pelo menos 1 visita.");
      return;
    }
    setConfigError(null);
    setVisitsRequired(visits);
    setRewardValue(reward);
    setEditingConfig(false);

    startSearch(async () => {
      const result = await updateFidelityConfig({ visitsRequired: visits, rewardValue: reward });
      if (result.error) setConfigError(result.error);
    });
  }

  function handleRedeem(client: ClientRow) {
    setRedeemError(null);
    startRedeem(async () => {
      const result = await redeemReward(client.id);
      if (result.error) {
        setRedeemError(result.error);
        return;
      }
      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? { ...c, points: result.remainingPoints ?? 0 } : c))
      );
      setJustRedeemed(result.name ?? client.name);
      setTimeout(() => setJustRedeemed(null), 3000);
    });
  }

  return (
    <div className="space-y-6">
      {/* Configuração do cartão */}
      <Card tone="gold" className="p-6">
        {editingConfig ? (
          <div className="space-y-3 max-w-sm">
            <Input
              label="Carimbos necessários"
              autoFocus
              value={visitsInput}
              onChange={(e) => setVisitsInput(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
            />
            <Input
              label="Valor do prêmio (R$)"
              value={rewardInput}
              onChange={(e) => setRewardInput(e.target.value.replace(/[^\d.,]/g, ""))}
              inputMode="decimal"
            />
            {configError && <p className="text-danger text-xs">{configError}</p>}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setVisitsInput(String(visitsRequired));
                  setRewardInput(String(rewardValue));
                  setConfigError(null);
                  setEditingConfig(false);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button onClick={saveConfig} className="flex-1">
                <Check size={13} /> Salvar
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingConfig(true)}
            className="group flex items-start gap-3 text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brass-500/15 text-brass-400">
              <Gift size={20} />
            </div>
            <div>
              <p className="font-semibold flex items-center gap-1.5">
                A cada {visitsRequired} visitas, o cliente ganha R$ {rewardValue.toFixed(0)} de desconto
                <Pencil size={12} className="text-paper-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-xs text-paper-500 mt-1">
                Cada check-in soma 1 carimbo automaticamente. Clique aqui pra ajustar a regra.
              </p>
            </div>
          </button>
        )}
      </Card>

      {justRedeemed && (
        <div className="rounded-lg border border-signal-400/40 bg-signal-500/10 p-4 flex items-center gap-3 animate-rise">
          <PartyPopper size={20} className="text-signal-400 shrink-0" />
          <p className="text-sm">
            Prêmio resgatado para <span className="font-semibold">{justRedeemed}</span>!
          </p>
        </div>
      )}

      {/* Lista de clientes */}
      <Card className="p-6">
        <p className="text-xs uppercase tracking-wide text-paper-500 mb-3">Clientes</p>
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente..."
            className="pl-9 py-2.5"
          />
        </div>

        {redeemError && <p className="text-danger text-xs mb-3">{redeemError}</p>}
        {isSearching && <p className="text-xs text-paper-500 mb-3">Buscando...</p>}

        {clients.length === 0 ? (
          <p className="text-sm text-paper-500 text-center py-6">Nenhum cliente ainda.</p>
        ) : (
          <ul className="space-y-2">
            {clients.map((c) => {
              const canRedeem = c.points >= visitsRequired;
              const percent = Math.min((c.points / visitsRequired) * 100, 100);
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-sm border border-ink-700"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <div className="h-1.5 rounded-full bg-ink-800 overflow-hidden mt-2 max-w-[180px]">
                      <div
                        className={`h-full rounded-full transition-all ${canRedeem ? "bg-gradient-to-r from-signal-500 to-signal-400" : "bg-gradient-to-r from-brass-500 to-brass-400"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-paper-500 mt-1">
                      {c.points} de {visitsRequired} carimbos
                    </p>
                  </div>
                  <button
                    onClick={() => handleRedeem(c)}
                    disabled={!canRedeem || isRedeeming}
                    className="shrink-0 px-3.5 py-2 rounded-sm text-xs font-semibold transition-colors bg-signal-500 hover:bg-signal-400 disabled:bg-ink-800 disabled:text-paper-500 disabled:cursor-not-allowed text-ink-950"
                  >
                    Resgatar
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
