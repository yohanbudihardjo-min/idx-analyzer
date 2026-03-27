"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  LineSeries,
  HistogramSeries,
  type Time,
} from "lightweight-charts";
import type { MACDData } from "@/lib/indicators";

export function MACDChart({ macdData, height = 180 }: { macdData: MACDData[]; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || macdData.length === 0) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: { background: { color: "transparent" }, textColor: "#a1a1aa" },
      grid: { vertLines: { color: "#27272a" }, horzLines: { color: "#27272a" } },
      rightPriceScale: { borderColor: "#3f3f46", scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { borderColor: "#3f3f46", timeVisible: true, secondsVisible: false },
    });

    // Histogram
    const hist = chart.addSeries(HistogramSeries, {
      color: "#3b82f6",
      priceLineVisible: false,
    });
    hist.setData(
      macdData.map((d) => ({
        time: d.date as Time,
        value: d.histogram,
        color: d.histogram >= 0 ? "#22c55e66" : "#ef444466",
      }))
    );

    // MACD line
    const macdLine = chart.addSeries(LineSeries, {
      color: "#3b82f6",
      lineWidth: 1,
      priceLineVisible: false,
    });
    macdLine.setData(macdData.map((d) => ({ time: d.date as Time, value: d.macd })));

    // Signal line
    const signalLine = chart.addSeries(LineSeries, {
      color: "#f97316",
      lineWidth: 1,
      priceLineVisible: false,
    });
    signalLine.setData(macdData.map((d) => ({ time: d.date as Time, value: d.signal })));

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [macdData, height]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
