"use client";

import { useState, useTransition } from "react";
import { Accessibility, Baby, Car, Check, Wifi } from "lucide-react";
import { updateBusinessProfile } from "@/app/configuracoes/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const AMENITIES = [
  { key: "hasWifi", label: "Wi-Fi", icon: Wifi },
  { key: "hasKidsArea", label: "Atendimento kids", icon: Baby },
  { key: "hasParking", label: "Estacionamento", icon: Car },
  { key: "hasAccessibility", label: "Acessibilidade", icon: Accessibility },
] as const;

type AmenityKey = (typeof AMENITIES)[number]["key"];

export function BusinessProfileForm({
  initialAddress,
  initialMapsUrl,
  initialHasWifi,
  initialHasKidsArea,
  initialHasParking,
  initialHasAccessibility,
}: {
  initialAddress: string;
  initialMapsUrl: string;
  initialHasWifi: boolean;
  initialHasKidsArea: boolean;
  initialHasParking: boolean;
  initialHasAccessibility: boolean;
}) {
  const [address, setAddress] = useState(initialAddress);
  const [mapsUrl, setMapsUrl] = useState(initialMapsUrl);
  const [amenities, setAmenities] = useState<Record<AmenityKey, boolean>>({
    hasWifi: initialHasWifi,
    hasKidsArea: initialHasKidsArea,
    hasParking: initialHasParking,
    hasAccessibility: initialHasAccessibility,
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleAmenity(key: AmenityKey) {
    setSaved(false);
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateBusinessProfile({ address, mapsUrl, ...amenities });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <p className="text-xs uppercase tracking-wide text-paper-500">Localização</p>
        <Input
          label="Endereço"
          value={address}
          onChange={(e) => {
            setSaved(false);
            setAddress(e.target.value);
          }}
          placeholder="Rua, número, bairro, cidade"
        />
        <Input
          label="Link do Google Maps"
          value={mapsUrl}
          onChange={(e) => {
            setSaved(false);
            setMapsUrl(e.target.value);
          }}
          placeholder="Cole aqui o link de 'Compartilhar' do Google Maps"
          hint='No Google Maps: toque em "Compartilhar" no seu endereço e copie o link.'
        />
      </Card>

      <Card className="p-6 space-y-3">
        <p className="text-xs uppercase tracking-wide text-paper-500 mb-1">Amenidades</p>
        {AMENITIES.map(({ key, label, icon: Icon }) => (
          <label
            key={key}
            className="flex items-center gap-3 py-1 text-sm text-paper-400 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={amenities[key]}
              onChange={() => toggleAmenity(key)}
              className="accent-signal-500 w-4 h-4"
            />
            <Icon size={16} className="text-brass-400" />
            <span className={amenities[key] ? "text-paper-50" : undefined}>{label}</span>
          </label>
        ))}
      </Card>

      {error && (
        <p className="text-danger text-xs border border-danger/40 bg-danger/10 rounded-xs px-3 py-2.5">
          {error}
        </p>
      )}

      <Button onClick={save} disabled={isPending} className="w-full">
        {isPending ? (
          "Salvando..."
        ) : saved ? (
          <>
            <Check size={16} /> Salvo
          </>
        ) : (
          "Salvar alterações"
        )}
      </Button>
    </div>
  );
}
