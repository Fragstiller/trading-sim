import type { KlineInterval } from "binance";
import { atom } from "jotai";

export type OrderType = "market" | "limit";
export type OrderDirection = "long" | "short";
export type OrderInfo = {
  type: OrderType;
  direction: OrderDirection;
  value: number;
  tp?: number;
  sl?: number;
  profit: number;
  executed: boolean;
  close: boolean;
};

export type MarketDataState = {
  selectedTimeframe?: KlineInterval;
  selectedPair: string;
  availablePairs: { value: string; label: string }[];
  currentTime: number;
  endIndex: number;
  loadedTime: number;
  loadedData?: {
    [key in KlineInterval]?: {
      ohlc: number[][];
      v: [number, number][];
    };
  };
  fastForwardEnabled: boolean;
};

export const marketDataAtom = atom<MarketDataState>({
  selectedPair: "BTCUSDT",
  availablePairs: [{ value: "BTCUSDT", label: "BTCUSDT" }],
  currentTime: Date.UTC(2023, 0, 1),
  loadedTime: Date.UTC(2023, 0, 1),
  endIndex: -1,
  fastForwardEnabled: false,
});

export const orderListAtom = atom<OrderInfo[]>([]);
