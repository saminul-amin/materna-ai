import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, parseBody, withErrors } from "@/lib/api-helpers";
import { DEMO_PRODUCTS } from "@/lib/static-data";

const schema = z.object({ items: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(20) })).min(1) });

export const GET = withErrors(async () => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const orders = await prisma.medicineOrder.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return ok(orders.map((o) => ({ ...o, items: JSON.parse(o.itemsJson) })));
});

/** Demo checkout: no payment is processed. Creates a record with status "demo_placed". */
export const POST = withErrors(async (req: Request) => {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const lines = [];
  let total = 0;
  for (const it of data.items) {
    const p = DEMO_PRODUCTS.find((x) => x.id === it.productId);
    if (!p) return fail("Unknown product in cart.", 422);
    if (p.requiresPrescription) return fail(`"${p.name}" requires a verified prescription and cannot be ordered in the demo.`, 422);
    lines.push({ productId: p.id, name: p.name, qty: it.qty, price: p.price });
    total += p.price * it.qty;
  }
  const order = await prisma.medicineOrder.create({ data: { userId: user.id, itemsJson: JSON.stringify(lines), total, status: "demo_placed" } });
  return ok({ ...order, items: lines }, { status: 201 });
});
