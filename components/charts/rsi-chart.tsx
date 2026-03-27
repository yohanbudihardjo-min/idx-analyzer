"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  LineSeries,
  type Time,
} from "lightweight-charts";
import type { RSIData } from "@/lib/indicators";

export function RSIChart({ rsiData, height = 180 }: { rsiData: RSIData[]; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || rsiData.length === 0) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: { background: { color: "transparent" }, textColor: "#a1a1aa" },
      grid: { vertLines: { color: "#27272a" }, horzLines: { color: "#27272a" } },
      rightPriceScale: { borderColor: "#3f3f46", scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { borderColor: "#3f3f46", timeVisible: true, secondsVisible: false },
    });

    // RSI line
    const rsiSeries = chart.addSeries(LineSeries, {
      color: "#f59e0b",
      lineWidth: 1,
      priceLineVisible: false,
    });

    rsiSeries.setData(
      rsiData.map((d) => ({ time: d.date as Time, value: d.rsi }))
    );

    // Overbought / oversold lines
    const ob = chart.addSeries(LineSeries, {
      color: "#ef4444",
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    ob.setData(rsiData.map((d) => ({ time: d.date as Time, value: 70 })));

    const os = chart.addSeries(LineSeries, {
      color: "#22c55e",
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    os.setData(rsiData.map((d) => ({ time: d.date as Time, value: 30 })));

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [rsiData, height]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
