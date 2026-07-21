"use client";

import { useState, useTransition } from "react";
import { Scissors, Plus, X, Sparkles } from "lucide-react";
import { createService, deleteService, updateServicePrice } from "@/app/servicos/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface ServiceRow {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  is_combo: boolean;
  active: boolean;
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ServicesManager({ initialServices }: { initialServices: ServiceRow[] }) {
  const [services, setServices] = useState(initialServices);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [isCombo, setIsCombo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!name.trim()) {
      setError("Dê um nome pro serviço.");
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("price", price);
    formData.set("duration", duration);
    if (isCombo) formData.set("isCombo", "on");

    // Otimista: já mostra na lista enquanto salva de verdade no servidor.
    const optimisticId = `optimistic-${Date.now()}`;
    setServices((prev) => [
      ...prev,
      {
        id: optimisticId,
        name: name.trim(),
        price: Number(price.replace(",", ".")) || 0,
        duration_minutes: Number(duration) || 30,
        is_combo: isCombo,
        active: true,
      },
    ]);
    setName(""); setPrice(""); setDuration("30"); setIsCombo(false); setAdding(false);

    startTransition(async () => {
      const result = await createService(formData);
      if (result?.error) {
        setError(result.error);
        setServices((prev) => prev.filter((s) => s.id !== optimisticId));
      }
    });
  };

  const handleRemove = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    startTransition(async () => {
      await deleteService(id);
    });
  };

  const handlePriceChange = (id: string, newPrice: number) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, price: newPrice } : s)));
  };

  const handlePriceCommit = (id: string, rawValue: string) => {
    const value = Number(rawValue.replace(",", ".")) || 0;
    handlePriceChange(id, value);
    startTransition(async () => {
      await updateServicePrice(id, value);
    });
  };

  const simples = services.filter((s) => !s.is_combo);
  const combos = services.filter((s) => s.is_combo);

  return (
    <div className="space-y-8">
      <p className="text-sm text-paper-400 leading-relaxed">
        Esse é o cardápio que aparece na agenda e no check-in. Vem com um
        ponto de partida pronto — edite o preço, remova o que você não
        oferece, e adicione cortes ou combos novos, do seu jeito.
      </p>

      <ServiceGroup
        title="Serviços"
        icon={Scissors}
        items={simples}
        onPriceCommit={handlePriceCommit}
        onRemove={handleRemove}
      />

      <ServiceGroup
        title="Combos"
        icon={Sparkles}
        items={combos}
        onPriceCommit={handlePriceCommit}
        onRemove={handleRemove}
        emptyLabel='Nenhum combo ainda — ex: "Corte + Barba + Progressiva da esposa".'
      />

      <Card className="p-5">
        {adding ? (
          <div className="space-y-3">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do serviço ou combo"
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^\d.,]/g, ""))}
                  placeholder="Preço (R$)"
                  inputMode="decimal"
                />
              </div>
              <div className="w-24">
                <Input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value.replace(/\D/g, ""))}
                  placeholder="Min."
                  inputMode="numeric"
                />
              </div>
            </div>
            <label className="flex items-center gap-2.5 text-sm text-paper-400">
              <input
                type="checkbox"
                checked={isCombo}
                onChange={(e) => setIsCombo(e.target.checked)}
                className="accent-signal-500 w-4 h-4"
              />
              É um combo (mistura de serviços)
            </label>
            {error && <p className="text-danger text-xs">{error}</p>}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => { setAdding(false); setError(null); }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={isPending} className="flex-1">
                Adicionar
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-ink-700 rounded-sm text-sm text-paper-400 hover:text-paper-50 hover:border-signal-400/40 transition-colors"
          >
            <Plus size={16} /> Adicionar serviço ou combo
          </button>
        )}
      </Card>
    </div>
  );
}

function ServiceGroup({
  title, icon: Icon, items, onPriceCommit, onRemove, emptyLabel,
}: {
  title: string;
  icon: React.ElementType;
  items: ServiceRow[];
  onPriceCommit: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  emptyLabel?: string;
}) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-paper-400 uppercase tracking-wide mb-3">
        <Icon size={15} className="text-brass-400" /> {title}
      </h2>
      {items.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-paper-500">{emptyLabel ?? "Nada por aqui ainda."}</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {items.map((s) => (
            <li key={s.id}>
              <Card className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-sm font-medium truncate">{s.name}</span>
                  <span className="text-xs text-paper-500">{s.duration_minutes} min</span>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-paper-500">R$</span>
                    <input
                      defaultValue={s.price}
                      onBlur={(e) => onPriceCommit(s.id, e.target.value)}
                      inputMode="decimal"
                      className="w-16 bg-ink-800 border border-ink-700 rounded-sm px-2 py-1.5 text-sm text-right focus:border-signal-500 outline-none transition-colors"
                    />
                  </div>
                  <button
                    onClick={() => onRemove(s.id)}
                    className="text-paper-500 hover:text-danger transition-colors"
                    aria-label={`Remover ${s.name}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
