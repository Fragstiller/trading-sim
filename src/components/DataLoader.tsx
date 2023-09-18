import { Semaphore } from "async-mutex";
import type { KlineInterval } from "binance";
import { MainClient } from "binance";
import feather from "feather-icons";
import type { Options } from "highcharts";
import HighchartsReact from "highcharts-react-official";
import parse from "html-react-parser";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import { createSearchParams, useSearchParams } from "react-router-dom";
import Select from "react-select";
import type { MarketDataState } from "../shared/atoms";
import { marketDataAtom } from "../shared/atoms";

import "react-datepicker/dist/react-datepicker.css";

function getTimeframeStepSize(timeframe: KlineInterval): number {
  let stepSize = 60000;
  switch (timeframe) {
    case "1m":
      stepSize = 60000;
      break;
    case "3m":
      stepSize = 60000 * 3;
      break;
    case "5m":
      stepSize = 60000 * 5;
      break;
    case "15m":
      stepSize = 60000 * 15;
      break;
    case "1h":
      stepSize = 60000 * 60;
      break;
    case "4h":
      stepSize = 60000 * 60 * 4;
      break;
  }
  return stepSize;
}

export default function DataLoader(props: {
  setChartOptions: React.Dispatch<React.SetStateAction<Options>>;
  chartComponentRef: React.RefObject<HighchartsReact.RefObject>;
}) {
  const { setChartOptions, chartComponentRef } = props;
  const [searchParams, setSearchParams] = useSearchParams();
  const [marketDataState, setMarketDataState] = useAtom(marketDataAtom);
  const fastForwardEnabledLocal = useRef(false);
  const loadingNewData = useRef(false);

  const client = new MainClient();
  const possibleTimeframes: KlineInterval[] = [
    "1m",
    "3m",
    "5m",
    "15m",
    "1h",
    "4h",
  ];

  function changeTimeframe(timeframe: KlineInterval) {
    if (marketDataState.loadedData === undefined) {
      const loadedData: MarketDataState["loadedData"] = {};
      const semaphore = new Semaphore(1);
      possibleTimeframes.forEach((timeframe) => {
        client
          .getKlines({
            symbol: marketDataState.selectedPair,
            interval: timeframe,
            endTime: marketDataState.currentTime,
          })
          .then((klines) => {
            semaphore.runExclusive(() => {
              loadedData[timeframe] = {
                ohlc: klines.map((kline) =>
                  kline
                    .map((v) => (typeof v === "string" ? parseFloat(v) : v))
                    .slice(0, 5),
                ),
                v: klines.map((kline) => [
                  kline[0],
                  typeof kline[5] === "string"
                    ? parseFloat(kline[5])
                    : kline[5],
                ]),
              };
              semaphore.setValue(semaphore.getValue() + 1);
            });
          });
      });
      semaphore.runExclusive(() => {
        let endIndex = -1;

        const ld = loadedData[timeframe];

        if (ld !== undefined) {
          for (let i = ld.ohlc.length - 1; i > 0; i--) {
            if (
              ld.ohlc[i][0] <=
              marketDataState.currentTime - getTimeframeStepSize(timeframe)
            ) {
              endIndex = i + 1;
              break;
            }
          }
        }

        setMarketDataState((prev) => ({
          ...prev,
          endIndex,
          loadedData: loadedData,
          selectedTimeframe: timeframe,
          fastForwardEnabled: fastForwardEnabledLocal.current,
        }));
      }, 7);
    } else if (timeframe != marketDataState.selectedTimeframe) {
      let endIndex = -1;

      const ld = marketDataState.loadedData?.[timeframe];

      if (ld !== undefined) {
        for (let i = ld.ohlc.length - 1; i > 0; i--) {
          if (
            ld.ohlc[i][0] <=
            marketDataState.currentTime - getTimeframeStepSize(timeframe)
          ) {
            endIndex = i + 1;
            break;
          }
        }
      }

      setMarketDataState((prev) => ({
        ...prev,
        endIndex,
        selectedTimeframe: timeframe,
        fastForwardEnabled: fastForwardEnabledLocal.current,
      }));
    }
  }

  function updateNext() {
    if (
      marketDataState.selectedTimeframe === undefined ||
      marketDataState.loadedData === undefined
    ) {
      return;
    }

    const stepSize = getTimeframeStepSize(marketDataState.selectedTimeframe);

    const newCurrentTime =
      marketDataState.currentTime -
      (marketDataState.currentTime % stepSize) +
      stepSize;

    if (newCurrentTime > marketDataState.loadedTime) {
      loadingNewData.current = true;
      const ldStepSize = 60000 * 60 * 4 * 4;
      const newLoadedTime = marketDataState.loadedTime + ldStepSize;
      const newLoadedData: MarketDataState["loadedData"] = {};
      const semaphore = new Semaphore(1);
      possibleTimeframes.forEach((timeframe) => {
        client
          .getKlines({
            symbol: marketDataState.selectedPair,
            interval: timeframe,
            startTime:
              marketDataState.loadedTime -
              (marketDataState.loadedTime % getTimeframeStepSize(timeframe)),
            endTime: newLoadedTime,
            limit: 1000,
          })
          .then((klines) => {
            semaphore.runExclusive(() => {
              newLoadedData[timeframe] = {
                ohlc: klines.map((kline) =>
                  kline
                    .map((v) => (typeof v === "string" ? parseFloat(v) : v))
                    .slice(0, 5),
                ),
                v: klines.map((kline) => [
                  kline[0],
                  typeof kline[5] === "string"
                    ? parseFloat(kline[5])
                    : kline[5],
                ]),
              };
              semaphore.setValue(semaphore.getValue() + 1);
            });
          });
      });
      semaphore.runExclusive(() => {
        possibleTimeframes.forEach((timeframe) => {
          const nld = newLoadedData[timeframe];
          const old = marketDataState.loadedData?.[timeframe];
          if (nld !== undefined && old !== undefined) {
            nld.ohlc.shift();
            nld.ohlc = old.ohlc.concat(nld.ohlc);
            nld.v.shift();
            nld.v = old.v.concat(nld.v);
          }
        });
        loadingNewData.current = false;

        const ld = newLoadedData?.[marketDataState.selectedTimeframe ?? "1m"];

        let endIndex = -1;
        if (ld !== undefined) {
          for (let i = ld.ohlc.length - 1; i > 0; i--) {
            if (ld.ohlc[i][0] <= newCurrentTime - stepSize) {
              endIndex = i + 1;
              break;
            }
          }
        }

        setMarketDataState((prev) => ({
          ...prev,
          currentTime: newCurrentTime,
          endIndex,
          loadedTime: newLoadedTime,
          loadedData: newLoadedData,
          fastForwardEnabled: fastForwardEnabledLocal.current,
        }));
      }, 7);
    } else {
      const ld =
        marketDataState.loadedData?.[marketDataState.selectedTimeframe];

      let endIndex = -1;
      if (ld !== undefined) {
        for (let i = ld.ohlc.length - 1; i > 0; i--) {
          if (ld.ohlc[i][0] <= newCurrentTime - stepSize) {
            endIndex = i + 1;
            break;
          }
        }
      }

      setMarketDataState((prev) => ({
        ...prev,
        endIndex,
        currentTime: newCurrentTime,
        fastForwardEnabled: fastForwardEnabledLocal.current,
      }));
    }
  }

  useEffect(() => {
    client.getExchangeInfo().then((exchangeInfo) => {
      const pairs: Array<{ value: string; label: string }> = [];
      exchangeInfo.symbols.forEach((symbol) => {
        if (symbol.status === "TRADING" && symbol.symbol.endsWith("USDT")) {
          pairs.push({ value: symbol.symbol, label: symbol.symbol });
        }
      });
      setMarketDataState((prev) => ({
        ...prev,
        currentTime: parseInt(
          searchParams.get("time") ?? prev.currentTime.toString(),
        ),
        loadedTime: parseInt(
          searchParams.get("time") ?? prev.currentTime.toString(),
        ),
        selectedPair: searchParams.get("pair") ?? prev.selectedPair,
        availablePairs: pairs,
      }));
    });
  }, []);

  useEffect(() => {
    setSearchParams(
      createSearchParams({
        pair: marketDataState.selectedPair,
        time: marketDataState.currentTime.toString(),
      }),
    );
    if (
      marketDataState.loadedData !== undefined &&
      marketDataState.selectedTimeframe !== undefined
    ) {
      const currentExtremes =
        chartComponentRef.current?.chart.xAxis[0].getExtremes();
      if (
        currentExtremes?.max !== undefined &&
        currentExtremes?.min !== undefined
      ) {
        const gap = marketDataState.currentTime - currentExtremes.max;
        chartComponentRef.current?.chart.xAxis[0].setExtremes(
          currentExtremes.min + gap,
          marketDataState.currentTime -
            getTimeframeStepSize(marketDataState.selectedTimeframe),
        );
      }

      setChartOptions({
        series: [
          {
            type: "candlestick",
            id: `${marketDataState.selectedPair.toLowerCase()}-ohlc`,
            name: `${marketDataState.selectedPair} Price`,
            data: marketDataState.loadedData[
              marketDataState.selectedTimeframe
            ]?.ohlc.slice(0, marketDataState.endIndex),
          },
          {
            type: "column",
            id: `${marketDataState.selectedPair.toLowerCase()}-volume`,
            name: `${marketDataState.selectedPair} Volume`,
            data: marketDataState.loadedData[
              marketDataState.selectedTimeframe
            ]?.v.slice(0, marketDataState.endIndex),
            yAxis: 1,
          },
        ],
      });
    }
  }, [marketDataState]);

  if (marketDataState.fastForwardEnabled) {
    setTimeout(
      () => {
        if (loadingNewData.current) return;
        updateNext();
      },
      marketDataState.selectedTimeframe === "4h" ? 310 : 100,
    );
  }

  return (
    <div className="flex flex-col items-center rounded-sm border border-gray-400 bg-gray-50 p-2">
      <div className="mb-2">
        {possibleTimeframes.map((timeframe) => (
          <button
            disabled={marketDataState.fastForwardEnabled}
            key={timeframe}
            onClick={() => changeTimeframe(timeframe)}
            className={`${
              timeframe === marketDataState.selectedTimeframe
                ? "bg-gray-300 disabled:bg-gray-200"
                : "bg-gray-200 disabled:bg-gray-100"
            } mr-1 rounded-sm pl-1 pr-1 enabled:hover:bg-gray-300`}
          >
            {timeframe}
          </button>
        ))}
      </div>
      <div className="mt-1 flex">
        <DatePicker
          className="mr-1 h-8 w-40 rounded-sm border border-gray-300 p-1 disabled:bg-gray-50"
          selected={new Date(marketDataState.currentTime)}
          dateFormat="MMM d, yyyy H:mm"
          disabled={marketDataState.loadedData === undefined ? false : true}
          maxDate={new Date()}
          onChange={(date) => {
            setMarketDataState((prev) => ({
              ...prev,
              currentTime: date?.getTime() ?? Date.now(),
              loadedTime: date?.getTime() ?? Date.now(),
            }));
          }}
        ></DatePicker>
        <div className="mr-1">
          <button
            disabled={
              marketDataState.loadedData === undefined ||
              marketDataState.fastForwardEnabled
                ? true
                : false
            }
            onClick={updateNext}
            className="rounded-sm bg-gray-200 p-1 enabled:hover:bg-gray-300 disabled:bg-gray-100"
          >
            {parse(feather.icons["skip-forward"].toSvg({ "stroke-width": 2 }))}
          </button>
        </div>
        <div>
          <button
            disabled={marketDataState.loadedData === undefined ? true : false}
            onClick={() => {
              fastForwardEnabledLocal.current =
                !fastForwardEnabledLocal.current;
              setMarketDataState((prev) => ({
                ...prev,
                fastForwardEnabled: !prev.fastForwardEnabled,
              }));
            }}
            className={`${
              marketDataState.fastForwardEnabled ? "bg-gray-300" : "bg-gray-200"
            } rounded-sm p-1 enabled:hover:bg-gray-300 disabled:bg-gray-50`}
          >
            {marketDataState.fastForwardEnabled
              ? parse(feather.icons["pause"].toSvg({ "stroke-width": 2 }))
              : parse(
                  feather.icons["fast-forward"].toSvg({ "stroke-width": 2 }),
                )}
          </button>
        </div>
      </div>
      <Select
        className="mt-2 w-56"
        isSearchable={true}
        options={marketDataState.availablePairs}
        value={{
          value: marketDataState.selectedPair,
          label: marketDataState.selectedPair,
        }}
        isDisabled={marketDataState.loadedData === undefined ? false : true}
        onChange={(value) =>
          setMarketDataState((prev) => ({
            ...prev,
            selectedPair: value?.value ?? "BTCUSDT",
          }))
        }
      ></Select>
    </div>
  );
}
