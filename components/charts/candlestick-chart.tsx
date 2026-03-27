"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import type { OHLCVData } from "@/lib/mock-data";
import type { MAData } from "@/lib/indicators";

interface CandlestickChartProps {
  ohlcv: OHLCVData[];
  maData?: MAData[];
  height?: number;
  showVolume?: boolean;
}

export function CandlestickChart({
  ohlcv,
  maData,
  height = 420,
  showVolume = true,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || ohlcv.length === 0) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { color: "transparent" },
        textColor: "#a1a1aa",
      },
      grid: {
        vertLines: { color: "#27272a" },
        horzLines: { color: "#27272a" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: "#3f3f46",
        scaleMargins: showVolume ? { top: 0.1, bottom: 0.25 } : { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "#3f3f46",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    candleSeries.setData(
      ohlcv.map((d) => ({
        time: d.date as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    );

    // MA lines overlay
    if (maData && maData.length > 0) {
      const ma50Data = maData
        .filter((d) => d.ma50 !== null)
        .map((d) => ({ time: d.date as Time, value: d.ma50! }));

      const ma100Data = maData
        .filter((d) => d.ma100 !== null)
        .map((d) => ({ time: d.date as Time, value: d.ma100! }));

      const ma200Data = maData
        .filter((d) => d.ma200 !== null)
        .map((d) => ({ time: d.date as Time, value: d.ma200! }));

      if (ma50Data.length > 0) {
        const ma50 = chart.addSeries(LineSeries, {
          color: "#3b82f6",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        ma50.setData(ma50Data);
      }

      if (ma100Data.length > 0) {
        const ma100 = chart.addSeries(LineSeries, {
          color: "#f59e0b",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        ma100.setData(ma100Data);
      }

      if (ma200Data.length > 0) {
        const ma200 = chart.addSeries(LineSeries, {
          color: "#a855f7",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        ma200.setData(ma200Data);
      }
    }

    // Volume series in separate pane
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: "#3f3f46",
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });

      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
        visible: false,
      });

      volumeSeries.setData(
        ohlcv.map((d) => ({
          time: d.date as Time,
          value: d.volume,
          color: d.close >= d.open ? "#22c55e33" : "#ef444433",
        }))
      );
    }

    chart.timeScale().fitContent();

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [ohlcv, maData, height, showVolume]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
