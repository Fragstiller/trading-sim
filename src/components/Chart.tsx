import type { Options } from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import indicatorsAll from "highcharts/indicators/indicators-all";
import accessibility from "highcharts/modules/accessibility";
import annotationsAdvanced from "highcharts/modules/annotations-advanced";
import fullScreen from "highcharts/modules/full-screen";
import priceIndicator from "highcharts/modules/price-indicator";
import stockTools from "highcharts/modules/stock-tools";
import { useEffect } from "react";

indicatorsAll(Highcharts);
annotationsAdvanced(Highcharts);
priceIndicator(Highcharts);
fullScreen(Highcharts);
stockTools(Highcharts);
accessibility(Highcharts);

export default function Chart(props: {
  options: Options;
  chartComponentRef: React.RefObject<HighchartsReact.RefObject>;
}) {
  useEffect(() => {
    const highchartsSubmenuButtons = Array.from(
      document.getElementsByClassName("highcharts-submenu-item-arrow"),
    );
    highchartsSubmenuButtons.forEach((element) =>
      element.addEventListener("click", () => {
        const highchartsSubmenus = Array.from(
          document.getElementsByClassName(
            "highcharts-submenu-wrapper",
          ) as HTMLCollectionOf<HTMLElement>,
        );
        highchartsSubmenus.forEach((element) => (element.style.left = "43px"));
      }),
    );
  }, []);

  return (
    <HighchartsReact
      highcharts={Highcharts}
      constructorType={"stockChart"}
      options={props.options}
      ref={props.chartComponentRef}
    />
  );
}
