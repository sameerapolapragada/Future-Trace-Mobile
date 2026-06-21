import { products as mockProducts } from "../data/mockData";
import { supabase } from "./supabaseClient";
import type { Product, ProductId } from "../types";

function formatPrice(cents: number, interval: string): { price: string; suffix: string } {
  if (cents <= 0) return { price: "Free", suffix: "" };
  const dollars = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
  const price = `$${dollars}`;
  if (interval === "month") return { price, suffix: "/month" };
  return { price, suffix: " one-time" };
}

function toProductId(id: string): ProductId {
  if (id.includes("xray")) return "xray";
  if (id.includes("radar") || id.includes("transition")) return "radar";
  return "free-scan";
}

function mapRow(row: {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  price_interval: string;
}): Product {
  const { price, suffix } = formatPrice(row.price_cents, row.price_interval);
  return {
    id: toProductId(row.id),
    name: row.name,
    description: row.description,
    price,
    priceSuffix: suffix,
    features: [],
  };
}

export async function fetchCatalogProducts(): Promise<{
  xray: Product;
  radar: Product;
  freeScan: Product;
}> {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,description,price_cents,price_interval,sort_order")
    .eq("is_active", true)
    .order("sort_order");

  if (error || !data?.length) {
    return mockProducts;
  }

  const byId = new Map(data.map((row) => [row.id, mapRow(row as (typeof data)[0])]));
  return {
    freeScan: mockProducts.freeScan,
    xray:
      byId.get("career_xray_one_time") ??
      byId.get("career_xray_extra") ??
      byId.get("xray") ??
      mockProducts.xray,
    radar:
      byId.get("ai_career_transition_monthly") ??
      byId.get("ai_career_radar_monthly") ??
      byId.get("radar") ??
      mockProducts.radar,
  };
}
