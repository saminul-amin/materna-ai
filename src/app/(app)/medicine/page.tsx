"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart, Plus, Minus, Trash2, Loader2, Lock } from "lucide-react";
import { api, useApi } from "@/lib/use-api";
import { useToast } from "@/components/providers";
import { Card, PageHeader, Alert, Badge, DemoBadge, Modal } from "@/components/ui";
import { DEMO_PRODUCTS, type Product } from "@/lib/static-data";
import { formatDateTime } from "@/lib/utils";

const CATS: { key: Product["category"] | "all"; label: string }[] = [{ key: "all", label: "All" }, { key: "prenatal", label: "Prenatal medicine" }, { key: "supplement", label: "Supplements" }, { key: "baby", label: "Baby-care essentials" }];
type Cart = Record<string, number>;

export default function MedicinePage() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]["key"]>("all");
  const [cart, setCart] = useState<Cart>({});
  const [detail, setDetail] = useState<Product | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [receipt, setReceipt] = useState<{ id: string; total: number } | null>(null);
  const orders = useApi<{ id: string; total: number; status: string; createdAt: string; items: { name: string; qty: number }[] }[]>("/api/orders");

  useEffect(() => {
    try { const s = localStorage.getItem("materna_cart"); if (s) setCart(JSON.parse(s)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("materna_cart", JSON.stringify(cart)); } catch {}
  }, [cart]);

  const list = useMemo(() => DEMO_PRODUCTS.filter((p) => (cat === "all" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase())), [q, cat]);
  const lines = Object.entries(cart).map(([id, qty]) => ({ p: DEMO_PRODUCTS.find((x) => x.id === id)!, qty })).filter((l) => l.p);
  const total = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const add = (p: Product) => { if (p.requiresPrescription) return toast("This item needs a verified prescription and cannot be added in the demo.", "error"); setCart((c) => ({ ...c, [p.id]: (c[p.id] ?? 0) + 1 })); toast(`${p.name} added to cart`, "success"); };
  const setQty = (id: string, qty: number) => setCart((c) => { const n = { ...c }; if (qty <= 0) delete n[id]; else n[id] = qty; return n; });

  async function place() {
    setPlacing(true);
    try {
      const r = await api<{ id: string; total: number }>("/api/orders", { method: "POST", json: { items: lines.map((l) => ({ productId: l.p.id, qty: l.qty })) } });
      setReceipt(r);
      setCart({});
      orders.reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="E-Medicine" subtitle="Browse prenatal medicine, supplements and baby-care essentials." action={<button onClick={() => setCheckout(true)} className="btn-primary !min-h-[40px]"><ShoppingCart className="h-4 w-4" aria-hidden /> Cart ({count})</button>} />
      <Alert tone="warn" title="Demo Marketplace">Products, prices and checkout are simulated. Materna AI has no pharmacy partnership and no real orders are placed or paid. Take only what your healthcare professional has advised.</Alert>

      <Card>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden /><input aria-label="Search products" className="input !pl-9" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="flex flex-wrap gap-1.5">{CATS.map((c) => <button key={c.key} onClick={() => setCat(c.key)} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${cat === c.key ? "bg-brand-600 text-white border-brand-600" : "bg-white border-slate-300 hover:bg-slate-50"}`} aria-pressed={cat === c.key}>{c.label}</button>)}</div>
        </div>
      </Card>

      {list.length === 0 ? <Card><p className="text-sm text-slate-500 text-center py-6">No products match.</p></Card> : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map((p) => (
            <li key={p.id} className="card p-4 flex flex-col">
              <div className="flex items-start justify-between gap-2"><p className="font-semibold text-slate-900">{p.name}</p><DemoBadge /></div>
              <p className="text-sm text-slate-600 mt-1 flex-1">{p.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="font-bold text-slate-900">{p.requiresPrescription ? <span className="inline-flex items-center gap-1 text-slate-500 text-sm"><Lock className="h-4 w-4" aria-hidden /> Prescription required</span> : `৳${p.price}`}</p>
                <div className="flex gap-1"><button onClick={() => setDetail(p)} className="btn-secondary !min-h-[36px] !py-1 text-xs">Details</button><button onClick={() => add(p)} disabled={p.requiresPrescription} className="btn-primary !min-h-[36px] !py-1 text-xs"><Plus className="h-3.5 w-3.5" aria-hidden /> Add</button></div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(orders.data ?? []).length > 0 && (
        <Card title="Demo order history">
          <ul className="divide-y divide-slate-100 text-sm">
            {orders.data!.map((o) => <li key={o.id} className="py-2 flex items-center gap-2"><div className="flex-1"><p className="text-slate-900">{o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}</p><p className="text-slate-500">{formatDateTime(o.createdAt)}</p></div><Badge tone="demo">{o.status.replace("_", " ")}</Badge><span className="font-semibold">৳{o.total}</span></li>)}
          </ul>
        </Card>
      )}

      {detail && (
        <Modal open onClose={() => setDetail(null)} title={detail.name}>
          <DemoBadge label="Demo listing" />
          <p className="mt-3 text-slate-700">{detail.description}</p>
          <p className="mt-2 text-sm text-slate-500">Category: {CATS.find((c) => c.key === detail.category)?.label}</p>
          <p className="mt-4 text-2xl font-bold">{detail.requiresPrescription ? "Prescription required" : `৳${detail.price}`}</p>
          <button onClick={() => { add(detail); setDetail(null); }} disabled={detail.requiresPrescription} className="btn-primary w-full mt-4">Add to cart</button>
        </Modal>
      )}

      {checkout && (
        <Modal open onClose={() => { setCheckout(false); setReceipt(null); }} title="Cart & demo checkout">
          {receipt ? (
            <Alert tone="success" title="Demo order placed">Order {receipt.id.slice(-8).toUpperCase()} · Total ৳{receipt.total}. <strong>No payment was taken and nothing will be delivered</strong> — this is a demonstration only.</Alert>
          ) : lines.length === 0 ? <p className="text-slate-500">Your cart is empty.</p> : (
            <div className="space-y-3">
              {lines.map((l) => (
                <div key={l.p.id} className="flex items-center gap-3">
                  <div className="flex-1"><p className="font-medium text-slate-900">{l.p.name}</p><p className="text-sm text-slate-500">৳{l.p.price} each</p></div>
                  <div className="flex items-center gap-1"><button onClick={() => setQty(l.p.id, l.qty - 1)} className="p-2 rounded-lg border" aria-label="Decrease"><Minus className="h-4 w-4" /></button><span className="w-8 text-center font-semibold">{l.qty}</span><button onClick={() => setQty(l.p.id, l.qty + 1)} className="p-2 rounded-lg border" aria-label="Increase"><Plus className="h-4 w-4" /></button><button onClick={() => setQty(l.p.id, 0)} className="p-2 rounded-lg text-red-600" aria-label="Remove"><Trash2 className="h-4 w-4" /></button></div>
                </div>
              ))}
              <div className="border-t pt-3 flex items-center justify-between"><p className="font-semibold">Total</p><p className="text-xl font-bold">৳{total}</p></div>
              <Alert tone="warn">Demo checkout: no payment method is collected and no order is fulfilled.</Alert>
              <button onClick={place} disabled={placing} className="btn-primary w-full">{placing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Place demo order</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
