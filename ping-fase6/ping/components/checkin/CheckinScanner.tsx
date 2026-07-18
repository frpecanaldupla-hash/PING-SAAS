"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ScanLine, CheckCircle2, Search, Camera, CameraOff } from "lucide-react";
import { PingMark } from "@/components/shared/PingMark";
import { checkinByQrToken, checkinClient, searchCheckinClients } from "@/app/checkin/actions";

type ClientRow = { id: string; name: string; points: number };
type ConfirmedCheckin = { name: string; points: number; pointsAdded: number };
type CheckinResult = { error: string | null; name?: string; points?: number; pointsAdded?: number };

const SCANNER_ELEMENT_ID = "ping-qr-reader";

// TODO(fase seguinte) resolvido: a busca manual e a leitura de câmera agora
// creditam pontos de verdade via Server Action (ver app/checkin/actions.ts),
// em vez de só trocar de tela.
export function CheckinScanner({ initialClients }: { initialClients: ClientRow[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientRow[]>(initialClients);
  const [confirmed, setConfirmed] = useState<ConfirmedCheckin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isChecking, startCheckin] = useTransition();

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const scanningRef = useRef(false); // trava contra leituras duplicadas do mesmo QR em frames seguidos

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(initialClients);
      return;
    }
    const handle = setTimeout(() => {
      startSearch(async () => {
        const { clients } = await searchCheckinClients(query);
        setResults(clients);
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function stopCamera() {
    const scanner = scannerRef.current;
    if (scanner) {
      scanner
        .stop()
        .catch(() => {})
        .finally(() => {
          try {
            scanner.clear();
          } catch {
            // já limpo, sem problema
          }
        });
      scannerRef.current = null;
    }
    scanningRef.current = false;
  }

  function runCheckin(action: () => Promise<CheckinResult>) {
    setError(null);
    startCheckin(async () => {
      const result = await action();
      if (result.error || !result.name) {
        setError(result.error ?? "Não foi possível fazer o check-in.");
        scanningRef.current = false;
        return;
      }
      setConfirmed({
        name: result.name,
        points: result.points ?? 0,
        pointsAdded: result.pointsAdded ?? 0,
      });
      stopCamera();
      setCameraOn(false);
    });
  }

  function onCheckinById(id: string) {
    runCheckin(() => checkinClient(id));
  }

  // Câmera — só importa a lib no navegador (evita quebrar no build/SSR,
  // já que ela acessa navigator.mediaDevices).
  useEffect(() => {
    if (!cameraOn) return;
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          (decodedText: string) => {
            if (scanningRef.current) return;
            scanningRef.current = true;
            runCheckin(() => checkinByQrToken(decodedText));
          },
          () => {
            // erro de leitura de um frame — acontece o tempo todo enquanto
            // a câmera ainda não achou o código, não é um problema real.
          }
        );
      } catch {
        setCameraError("Não foi possível acessar a câmera. Verifique a permissão do navegador.");
        setCameraOn(false);
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOn]);

  function nextClient() {
    setConfirmed(null);
    setQuery("");
    setError(null);
  }

  if (confirmed) {
    return (
      <div className="ping-card p-10 text-center animate-rise max-w-md mx-auto">
        <CheckCircle2 size={64} className="text-signal-500 mx-auto mb-5" />
        <p className="font-display text-3xl tracking-wide mb-2">Check-in feito!</p>
        <p className="text-paper-400 mb-1">{confirmed.name} chegou.</p>
        <p className="ping-figure text-brass-400 text-lg font-semibold mb-8">
          +{confirmed.pointsAdded} pontos · {confirmed.points} no total
        </p>
        <button
          onClick={nextClient}
          className="w-full py-3 border border-ink-700 hover:border-paper-500 rounded-sm transition-colors text-sm"
        >
          Próximo cliente
        </button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="ping-card p-10 text-center flex flex-col items-center justify-center">
        {cameraOn ? (
          <div className="w-full">
            <div id={SCANNER_ELEMENT_ID} className="w-full rounded-sm overflow-hidden mb-4" />
            <button
              onClick={() => setCameraOn(false)}
              className="inline-flex items-center gap-2 text-sm text-paper-400 hover:text-paper-50"
            >
              <CameraOff size={15} /> Parar câmera
            </button>
          </div>
        ) : (
          <>
            <div className="relative mb-6">
              <PingMark size={140} />
              <ScanLine size={28} className="absolute inset-0 m-auto text-ink-950" strokeWidth={2.5} />
            </div>
            <p className="font-semibold text-lg">Aponte o QR Code do cliente</p>
            <p className="text-sm text-paper-500 mt-1.5 mb-5">
              O check-in acontece assim que a câmera reconhece o código
            </p>
            <button
              onClick={() => {
                setCameraError(null);
                setCameraOn(true);
              }}
              className="inline-flex items-center gap-2 bg-signal-500 hover:bg-signal-400 text-ink-950 font-semibold px-5 py-2.5 rounded-sm transition-colors text-sm"
            >
              <Camera size={16} /> Ativar câmera
            </button>
            {cameraError && <p className="text-danger text-xs mt-3">{cameraError}</p>}
          </>
        )}
      </div>

      <div className="ping-card p-6">
        <p className="text-xs uppercase tracking-wide text-paper-500 mb-3">Ou busque pelo nome</p>
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome do cliente"
            className="w-full bg-ink-800 border border-ink-700 rounded-sm pl-9 pr-3 py-2.5 text-sm focus:border-signal-500 outline-none"
          />
        </div>
        {error && <p className="text-danger text-xs mb-3">{error}</p>}
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {results.map((c) => (
            <button
              key={c.id}
              onClick={() => onCheckinById(c.id)}
              disabled={isChecking}
              className="w-full text-left px-4 py-3 rounded-sm border border-ink-700 hover:border-signal-500/50 transition-colors flex justify-between items-center disabled:opacity-50"
            >
              <span className="text-sm font-medium">{c.name}</span>
              <span className="ping-figure text-xs text-brass-400">{c.points} pts</span>
            </button>
          ))}
          {results.length === 0 && !isSearching && (
            <p className="text-sm text-paper-500 text-center py-6">Nenhum cliente encontrado</p>
          )}
        </div>
      </div>
    </div>
  );
}
