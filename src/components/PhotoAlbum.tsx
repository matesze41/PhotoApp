"use client";

import { useEffect, useMemo, useState } from "react";

type SortBy = "name" | "date";
type SortDir = "asc" | "desc";

type PhotoRow = {
  id: string;
  name: string;
  createdAt: string; // ISO
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatHuDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(
    d.getMinutes()
  )}`;
}

export default function PhotoAlbum() {
  const [items, setItems] = useState<PhotoRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [dir, setDir] = useState<SortDir>("desc");

  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const qs = new URLSearchParams({ sort: sortBy, dir });
    const res = await fetch(`/api/photos?${qs.toString()}`, { cache: "no-store" });
    const data = (await res.json()) as PhotoRow[];
    setItems(data);
    if (selectedId && !data.some((x) => x.id === selectedId)) setSelectedId(null);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, dir]);

  const selected = useMemo(() => items.find((x) => x.id === selectedId) ?? null, [items, selectedId]);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length === 0) return setError("A név kötelező.");
    if (name.trim().length > 40) return setError("A név maximum 40 karakter lehet.");
    if (!file) return setError("Válassz ki egy képfájlt.");

    setBusy(true);
    try {
      const form = new FormData();
      form.set("name", name.trim());
      form.set("file", file);

      const res = await fetch("/api/photos", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body?.error ?? "Feltöltési hiba");
        return;
      }

      setName("");
      setFile(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Törlési hiba");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="rounded-xl border p-4">
        <form onSubmit={onUpload} className="space-y-3">
          <div className="text-lg font-semibold">Feltöltés</div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <div className="text-sm">Kép neve (max 40)</div>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                disabled={busy}
              />
            </label>

            <label className="space-y-1">
                <div className="text-sm">Fájl</div>

                <input
                    id="fileInput"
                    className="hidden"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    disabled={busy}
                />

                <label
                    htmlFor="fileInput"
                    className={`inline-block cursor-pointer rounded-md bg-orange-700 hover:bg-orange-600 text-white px-4 py-2 ${
                    busy ? "pointer-events-none opacity-50" : ""
                    }`}
                >
                    Fájl kiválasztása
                </label>

                {file ? (
                    <div className="text-xs text-gray-300 break-all">Kiválasztva: {file.name}</div>
                ) : (
                    <div className="text-xs text-gray-400">Nincs fájl kiválasztva</div>
                )}
            </label>
          </div>

          <button
            className="rounded-md bg-orange-700 text-white px-4 py-2 disabled:opacity-50"
            disabled={busy}
            type="submit"
          >
            Feltöltés
          </button>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </form>
      </div>

      <div className="rounded-xl border p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-lg font-semibold">Képek</div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label className="text-sm">
              Rendezés:
              <select
                className="ml-2 rounded-md border px-2 py-1"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                disabled={busy}
              >
                <option value="date">Dátum</option>
                <option value="name">Név</option>
              </select>
            </label>

            <label className="text-sm">
              Irány:
              <select
                className="ml-2 rounded-md border px-2 py-1"
                value={dir}
                onChange={(e) => setDir(e.target.value as SortDir)}
                disabled={busy}
              >
                <option value="desc">Csökkenő</option>
                <option value="asc">Növekvő</option>
              </select>
            </label>

            <button
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
              onClick={() => void load()}
              disabled={busy}
              type="button"
            >
              Frissítés
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-3">
            <div className="text-sm font-semibold mb-2">Lista</div>
            <div className="space-y-1">
              {items.length === 0 ? <div className="text-sm text-gray-500">Nincs feltöltött kép.</div> : null}

              {items.map((p) => (
                <div
                    key={p.id}
                    className={`flex items-center gap-2 rounded-md px-2 py-2 ${
                        selectedId === p.id
                        ? "bg-gray-100 text-black"
                        : "text-white hover:bg-white/5"
                    }`}
                >
                  <button
                    className="flex-1 text-left"
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    disabled={busy}
                    title="Kattints a megtekintéshez"
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-600">{formatHuDate(p.createdAt)}</div>
                  </button>

                  <button
                    className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                    onClick={() => void onDelete(p.id)}
                    disabled={busy}
                    type="button"
                    title="Törlés"
                  >
                    Törlés
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-sm font-semibold mb-2">Előnézet</div>

            {!selected ? (
              <div className="text-sm text-gray-500">Válassz egy képet a listából.</div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm">
                  <div className="font-medium">{selected.name}</div>
                  <div className="text-xs text-gray-600">{formatHuDate(selected.createdAt)}</div>
                </div>

                <img
                  src={`/api/photos/${selected.id}/image`}
                  alt={selected.name}
                  className="w-full rounded-lg border object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}