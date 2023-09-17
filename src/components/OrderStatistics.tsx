import { useAtom } from "jotai";
import { orderListAtom } from "../shared/atoms";

export default function OrderStatistics() {
  const [orderList] = useAtom(orderListAtom);

  let totalProfit = 0;
  let tradesWon = 0;
  orderList.forEach((order) => {
    totalProfit += order.profit;
    if (order.profit > 0) {
      tradesWon++;
    }
  });
  const winrate =
    (tradesWon / (orderList.length > 0 ? orderList.length : 1)) * 100;

  return (
    <div className="flex flex-col gap-2 rounded-sm border border-gray-400 bg-gray-50 p-2">
      <div className="-my-1 text-center">Statistics</div>
      <div className="border border-b-0 border-gray-400"></div>
      <div className="flex flex-col">
        <div className="flex justify-stretch border-b border-gray-200">
          <div className="w-2/3 border-r border-gray-200 text-center">
            Total Net Profit (%)
          </div>
          <div
            className={`w-1/3 text-center ${
              totalProfit !== 0
                ? totalProfit > 0
                  ? "text-green-700"
                  : "text-red-700"
                : "text-black"
            }`}
          >
            {totalProfit !== 0
              ? (totalProfit > 0 ? "+" : "") + (totalProfit.toFixed(2) + "%")
              : "-"}
          </div>
        </div>
        <div className="flex justify-stretch">
          <div className="w-2/3 border-r border-gray-200 text-center">
            Winrate (%)
          </div>
          <div
            className={`w-1/3 text-center ${
              winrate !== 0
                ? winrate >= 50
                  ? "text-green-700"
                  : "text-red-700"
                : "text-black"
            }`}
          >
            {winrate !== 0 ? winrate.toFixed(2) + "%" : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
