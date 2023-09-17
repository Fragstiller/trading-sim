import type { Chart as HighchartsChart, Options } from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useRef, useState } from "react";
import Chart from "./components/Chart";
import DataLoader from "./components/DataLoader";
import OrderList from "./components/OrderList";
import OrderPlacer from "./components/OrderPlacer";
import OrderStatistics from "./components/OrderStatistics";

export default function App() {
  const [chartOptions, setChartOptions] = useState<Options>({
    stockTools: {
      gui: {
        buttons: [
          "indicators",
          "separator",
          "simpleShapes",
          "lines",
          "crookedLines",
          "measure",
          "advanced",
          "toggleAnnotations",
          "separator",
          "verticalLabels",
          "flags",
          "separator",
          "currentPriceIndicator",
        ],
      },
    },
    chart: {
      animation: false,
    },
    time: {
      useUTC: false,
    },
    plotOptions: {
      candlestick: {
        color: "red",
        upColor: "green",
        dataGrouping: {
          forced: false,
        },
      },
    },
    rangeSelector: {
      enabled: false,
    },
    tooltip: {
      shape: "square",
      headerShape: "callout",
      borderWidth: 0,
      shadow: false,
      // eslint-disable-next-line
      // @ts-ignore
      positioner: function (width, height, point) {
        const chart: HighchartsChart = this.chart;
        let position;

        if (point.isHeader) {
          position = {
            x: Math.max(
              // Left side limit
              chart.plotLeft,
              Math.min(
                point.plotX + chart.plotLeft - width / 2,
                // Right side limit
                // eslint-disable-next-line
                // @ts-ignore
                chart.chartWidth - width - chart.marginRight,
              ),
            ),
            y: point.plotY,
          };
        } else {
          position = {
            x: point.series.chart.plotLeft,
            // eslint-disable-next-line
            // @ts-ignore
            y: point.series.yAxis.top - chart.plotTop,
          };
        }

        return position;
      },
    },
    yAxis: [
      {
        labels: {
          align: "left",
        },
        height: "80%",
        resize: {
          enabled: true,
        },
      },
      {
        labels: {
          align: "left",
        },
        top: "80%",
        height: "20%",
        offset: 0,
      },
    ],
  });
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  return (
    <div className="grid h-screen" style={{ gridTemplateColumns: "1fr 16rem" }}>
      <Chart
        options={chartOptions}
        chartComponentRef={chartComponentRef}
      ></Chart>
      <div className="flex flex-col gap-2 p-1">
        <DataLoader
          setChartOptions={setChartOptions}
          chartComponentRef={chartComponentRef}
        ></DataLoader>
        <OrderPlacer></OrderPlacer>
        <OrderStatistics></OrderStatistics>
        <OrderList></OrderList>
      </div>
    </div>
  );
}
