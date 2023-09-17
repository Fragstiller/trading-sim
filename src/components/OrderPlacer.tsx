import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import type { OrderInfo } from "../shared/atoms";
import { marketDataAtom, orderListAtom } from "../shared/atoms";

export default function OrderPlacer() {
  const [marketDataState] = useAtom(marketDataAtom);
  const [, setOrderList] = useAtom(orderListAtom);
  const [pendingOrder, setPendingOrder] = useState<OrderInfo>({
    type: "market",
    direction: "long",
    value: 0,
    profit: 0,
    executed: false,
    close: false,
  });

  let ld:
    | undefined
    | {
        ohlc: number[][];
        v: [number, number][];
      } = undefined;

  if (
    marketDataState.loadedData !== undefined &&
    marketDataState.selectedTimeframe !== undefined
  ) {
    ld = marketDataState.loadedData?.[marketDataState.selectedTimeframe];
  }

  useEffect(() => {
    if (ld !== undefined && pendingOrder.type === "market") {
      setPendingOrder((order) => ({
        ...order,
        value: ld !== undefined ? ld.ohlc[marketDataState.endIndex - 1][4] : 0,
      }));
    }
  }, [marketDataState]);

  return (
    <div className="flex flex-col items-stretch gap-2 rounded-sm border border-gray-400 bg-gray-50 p-2">
      <div>
        <button
          className={`w-1/2 rounded-l-sm ${
            pendingOrder.type === "market" ? "bg-gray-300" : "bg-gray-200"
          } hover:bg-gray-300`}
          onClick={() =>
            setPendingOrder((order) => ({
              ...order,
              type: "market",
              value:
                ld !== undefined ? ld.ohlc[marketDataState.endIndex - 1][4] : 0,
            }))
          }
        >
          Market
        </button>
        <button
          className={`w-1/2 rounded-r-sm ${
            pendingOrder.type === "limit" ? "bg-gray-300" : "bg-gray-200"
          } hover:bg-gray-300`}
          onClick={() =>
            setPendingOrder((order) => ({ ...order, type: "limit" }))
          }
        >
          Limit
        </button>
      </div>
      <input
        className="disabled: rounded-sm border border-gray-300 bg-gray-50 pl-1"
        type="number"
        step="0.01"
        value={
          ld !== undefined && pendingOrder.type === "market"
            ? ld.ohlc[marketDataState.endIndex - 1][4]
            : pendingOrder.value
        }
        disabled={ld === undefined || pendingOrder.type === "market"}
        placeholder="-"
        onChange={(e) =>
          setPendingOrder((order) => ({
            ...order,
            value: e.target.value === "" ? 0 : parseFloat(e.target.value),
          }))
        }
      />
      <div className="flex justify-stretch gap-1">
        <div className="w-5">TP:</div>
        <input
          type="number"
          step="0.01"
          defaultValue={""}
          disabled={ld === undefined}
          placeholder="-"
          className="flex-grow rounded-sm border border-gray-300 pl-1"
          onChange={(e) =>
            setPendingOrder((order) => ({
              ...order,
              tp:
                e.target.value === "" ? undefined : parseFloat(e.target.value),
            }))
          }
        />
      </div>
      <div className="flex justify-stretch gap-1">
        <div className="w-5">SL:</div>
        <input
          type="number"
          step="0.01"
          defaultValue={""}
          disabled={ld === undefined}
          placeholder="-"
          className="flex-grow rounded-sm border border-gray-300 pl-1"
          onChange={(e) =>
            setPendingOrder((order) => ({
              ...order,
              sl:
                e.target.value === "" ? undefined : parseFloat(e.target.value),
            }))
          }
        />
      </div>
      <div>
        <button
          className={`w-1/2 rounded-l-sm ${
            pendingOrder.direction === "long" ? "bg-green-500" : "bg-green-100"
          } hover:bg-green-500`}
          onClick={() =>
            setPendingOrder((order) => ({ ...order, direction: "long" }))
          }
        >
          Long
        </button>
        <button
          className={`w-1/2 rounded-r-sm ${
            pendingOrder.direction === "short" ? "bg-red-500" : "bg-red-100"
          } hover:bg-red-500`}
          onClick={() =>
            setPendingOrder((order) => ({ ...order, direction: "short" }))
          }
        >
          Short
        </button>
      </div>
      <div className="border border-b-0 border-gray-400"></div>
      <button
        className="rounded-sm bg-gray-200 py-1 enabled:hover:bg-gray-300 disabled:bg-gray-100"
        disabled={
          ld === undefined ||
          (pendingOrder.direction === "long" &&
            ((pendingOrder.tp ?? Infinity) < pendingOrder.value ||
              (pendingOrder.sl ?? 0) > pendingOrder.value)) ||
          (pendingOrder.direction === "short" &&
            ((pendingOrder.tp ?? 0) > pendingOrder.value ||
              (pendingOrder.sl ?? Infinity) < pendingOrder.value))
        }
        onClick={() =>
          setOrderList((prevOrderList) => [
            ...prevOrderList,
            { ...pendingOrder },
          ])
        }
      >
        Place
      </button>
    </div>
  );
}
