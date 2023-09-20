import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { marketDataAtom, orderListAtom, type OrderInfo } from "../shared/atoms";

export default function OrderList() {
  const [marketDataState] = useAtom(marketDataAtom);
  const [orderList, setOrderList] = useAtom(orderListAtom);
  const [orderListLocalStorage, setOrderListLocalStorage] = useLocalStorage(
    "orderList",
    orderList,
  );
  const lastUpdateTime = useRef(0);
  const lastUpdateIndex = useRef(0);

  let ld:
    | undefined
    | {
        ohlc: number[][];
        v: [number, number][];
      } = undefined;

  if (marketDataState.loadedData !== undefined) {
    ld = marketDataState.loadedData["1m"];
  }

  if (ld !== undefined && lastUpdateIndex.current === 0) {
    lastUpdateIndex.current = ld.ohlc.length - 1;
  }

  useEffect(() => {
    if (orderListLocalStorage.length !== orderList.length) {
      orderListLocalStorage.forEach((orderInfo) => {
        orderInfo.close = true;
      });
      setOrderList(orderListLocalStorage);
    }
  }, []);

  useEffect(() => {
    setOrderListLocalStorage(orderList);
  }, [orderList]);

  useEffect(() => {
    if (
      ld !== undefined &&
      marketDataState.currentTime > lastUpdateTime.current
    ) {
      let newLastUpdateIndex = 0;
      orderList.forEach((order) => {
        // https://github.com/microsoft/TypeScript/issues/35124
        if (ld !== undefined && !order.close) {
          for (
            let i = lastUpdateIndex.current;
            i < ld.ohlc.length && ld.ohlc[i][0] < marketDataState.currentTime;
            i++
          ) {
            if (i > newLastUpdateIndex) newLastUpdateIndex = i;
            if (ld.ohlc[i][0] < lastUpdateTime.current) continue;

            if (order.type === "market" && !order.executed) {
              order.executed = true;
              order.value = ld.ohlc[i][1];
            } else if (
              order.type === "limit" &&
              !order.executed &&
              ld.ohlc[i][2] >= order.value &&
              ld.ohlc[i][3] <= order.value
            ) {
              order.executed = true;
            }

            if (
              order.tp !== undefined &&
              order.executed &&
              ld.ohlc[i][2] >= order.tp &&
              ld.ohlc[i][3] <= order.tp
            ) {
              order.close = true;
            }

            if (
              order.sl !== undefined &&
              order.executed &&
              ld.ohlc[i][2] >= order.sl &&
              ld.ohlc[i][3] <= order.sl
            ) {
              order.close = true;
            }

            if (order.executed) {
              order.profit =
                order.direction === "long"
                  ? (1 - order.value / ld.ohlc[i][4]) * 100
                  : (1 - ld.ohlc[i][4] / order.value) * 100;
            }
          }
        }
      });
      if (newLastUpdateIndex !== 0)
        lastUpdateIndex.current = newLastUpdateIndex;
      lastUpdateTime.current = marketDataState.currentTime;
      setOrderList([...orderList]);
    }
  }, [marketDataState]);

  return (
    <div className="flex flex-col items-stretch gap-2 rounded-sm border border-gray-400 bg-gray-50 p-2">
      <div className="-my-1 text-center">Orders</div>
      <div className="border border-b-0 border-gray-400"></div>
      <div className="flex max-h-64 flex-col gap-1 overflow-auto">
        {orderList.filter((o) => !o.close).length !== 0 ? (
          orderList
            .filter((orderInfo) => !orderInfo.close)
            .map((orderInfo, i) => {
              return <Order orderInfo={orderInfo} key={i}></Order>;
            })
            .reverse()
        ) : (
          <div className="text-center text-gray-500">None</div>
        )}
      </div>
    </div>
  );
}

function Order(props: { orderInfo: OrderInfo }) {
  const { orderInfo } = props;
  const [closing, setClosing] = useState(false);
  return (
    <div className="flex flex-col rounded-sm border border-slate-400 bg-slate-200 px-1">
      <div className="flex justify-end gap-1">
        <div
          className={
            orderInfo.direction === "long" ? "text-green-700" : "text-red-700"
          }
        >
          {orderInfo.direction === "long" ? "L" : "S"}
        </div>
        <div className="text-slate-400">/</div>
        <div className="flex-grow text-center">{orderInfo.value}</div>
        <div className="text-slate-400">/</div>
        <div
          className={
            orderInfo.profit > 0
              ? "text-green-700"
              : orderInfo.profit < 0
              ? "text-red-700"
              : "text-black"
          }
        >
          {!orderInfo.executed
            ? "..."
            : `${orderInfo.profit < 0 ? "" : "+"}${orderInfo.profit.toFixed(
                2,
              )}%`}
        </div>
        <div className="text-slate-400">/</div>
        <div
          className="underline hover:cursor-pointer"
          onClick={() => {
            orderInfo.close = true;
            setClosing(true);
          }}
        >
          {closing || orderInfo.close ? "..." : "Close"}
        </div>
      </div>
      <div className="border border-b-0 border-slate-400"></div>
      <div className="flex gap-2">
        <div className="flex w-1/2">
          <div>TP:</div>
          <div className="flex-grow text-center">{orderInfo.tp ?? "-"}</div>
        </div>
        <div className="text-slate-400">/</div>
        <div className="flex w-1/2">
          <div>SL:</div>
          <div className="flex-grow text-center">{orderInfo.sl ?? "-"}</div>
        </div>
      </div>
    </div>
  );
}
