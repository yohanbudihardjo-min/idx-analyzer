/**
 * DCF calculation utilities — Morgan Stanley Framework
 */

import type { FinancialStatement } from "./mock-data";

export interface DCFInputs {
  revenueGrowthRates: number[]; // 5 years, as decimals (e.g. 0.10 = 10%)
  operatingMarginTarget: number; // decimal
  taxRate: number; // decimal
  capexPct: number; // % of revenue
  wacc: number; // decimal
  terminalGrowthRate: number; // decimal
  exitMultiple: number; // EV/EBITDA
  sharesOutstanding: number; // millions
}

export interface DCFYear {
  year: number;
  revenue: number;
  ebitda: number;
  ebit: number;
  nopat: number;
  capex: number;
  fcf: number;
  discountFactor: number;
  pvFCF: number;
}

export interface DCFResult {
  years: DCFYear[];
  terminalValueGrowth: number;
  terminalValueExit: number;
  pvTerminalGrowth: number;
  pvTerminalExit: number;
  enterpriseValueGrowth: number;
  enterpriseValueExit: number;
  equityValueGrowth: number;
  equityValueExit: number;
  intrinsicPriceGrowth: number;
  intrinsicPriceExit: number;
  sensitivityTable: SensitivityRow[];
}

export interface SensitivityRow {
  wacc: number;
  fairValueAt1pctGrowth: number;
  fairValueAt2pctGrowth: number;
  fairValueAt3pctGrowth: number;
  fairValueAt4pctGrowth: number;
}

export function estimateWACC(
  beta: number,
  biRate: number = 5.75, // BI Rate as risk-free proxy
  equityRiskPremium: number = 6.5,
  debtRatio: number = 0.3,
  taxRate: number = 0.22
): number {
  const costOfEquity = biRate / 100 + beta * (equityRiskPremium / 100);
  const costOfDebt = (biRate / 100 + 0.02) * (1 - taxRate);
  const wacc = costOfEquity * (1 - debtRatio) + costOfDebt * debtRatio;
  return Math.round(wacc * 10000) / 10000; // 4 decimal places
}

export function runDCF(
  baseYear: FinancialStatement,
  inputs: DCFInputs,
  netDebt: number, // billion IDR
  sharesOutstanding: number // million shares
): DCFResult {
  const years: DCFYear[] = [];
  let prevRevenue = baseYear.revenue;

  for (let i = 0; i < 5; i++) {
    const year = baseYear.year + i + 1;
    const growthRate = inputs.revenueGrowthRates[i] ?? inputs.revenueGrowthRates.at(-1) ?? 0.08;
    const revenue = prevRevenue * (1 + growthRate);
    const ebitda = revenue * inputs.operatingMarginTarget * 1.25; // EBITDA margin ~25% higher
    const ebit = revenue * inputs.operatingMarginTarget;
    const nopat = ebit * (1 - inputs.taxRate);
    const capex = revenue * inputs.capexPct;
    const fcf = nopat - capex;
    const discountFactor = Math.pow(1 + inputs.wacc, i + 1);
    const pvFCF = fcf / discountFactor;

    years.push({ year, revenue, ebitda, ebit, nopat, capex, fcf, discountFactor, pvFCF });
    prevRevenue = revenue;
  }

  const lastFCF = years[years.length - 1].fcf;
  const lastEBITDA = years[years.length - 1].ebitda;
  const lastDiscountFactor = years[years.length - 1].discountFactor;

  // Terminal value — perpetuity growth method
  const terminalValueGrowth = (lastFCF * (1 + inputs.terminalGrowthRate)) /
    (inputs.wacc - inputs.terminalGrowthRate);
  const pvTerminalGrowth = terminalValueGrowth / lastDiscountFactor;

  // Terminal value — exit multiple method
  const terminalValueExit = lastEBITDA * inputs.exitMultiple;
  const pvTerminalExit = terminalValueExit / lastDiscountFactor;

  const sumPVFCF = years.reduce((a, b) => a + b.pvFCF, 0);

  const enterpriseValueGrowth = sumPVFCF + pvTerminalGrowth;
  const enterpriseValueExit = sumPVFCF + pvTerminalExit;

  const equityValueGrowth = enterpriseValueGrowth - netDebt;
  const equityValueExit = enterpriseValueExit - netDebt;

  const intrinsicPriceGrowth = (equityValueGrowth * 1e9) / (sharesOutstanding * 1e6);
  const intrinsicPriceExit = (equityValueExit * 1e9) / (sharesOutstanding * 1e6);

  // Sensitivity table
  const sensitivityTable: SensitivityRow[] = [0.08, 0.09, 0.10, 0.11, 0.12].map((w) => ({
    wacc: w,
    fairValueAt1pctGrowth: calcFairValue(sumPVFCF, lastFCF, lastDiscountFactor, w, 0.01, netDebt, sharesOutstanding),
    fairValueAt2pctGrowth: calcFairValue(sumPVFCF, lastFCF, lastDiscountFactor, w, 0.02, netDebt, sharesOutstanding),
    fairValueAt3pctGrowth: calcFairValue(sumPVFCF, lastFCF, lastDiscountFactor, w, 0.03, netDebt, sharesOutstanding),
    fairValueAt4pctGrowth: calcFairValue(sumPVFCF, lastFCF, lastDiscountFactor, w, 0.04, netDebt, sharesOutstanding),
  }));

  return {
    years,
    terminalValueGrowth,
    terminalValueExit,
    pvTerminalGrowth,
    pvTerminalExit,
    enterpriseValueGrowth,
    enterpriseValueExit,
    equityValueGrowth,
    equityValueExit,
    intrinsicPriceGrowth: Math.round(intrinsicPriceGrowth),
    intrinsicPriceExit: Math.round(intrinsicPriceExit),
    sensitivityTable,
  };
}

function calcFairValue(
  sumPVFCF: number,
  lastFCF: number,
  lastDiscountFactor: number,
  wacc: number,
  growth: number,
  netDebt: number,
  shares: number
): number {
  const tv = (lastFCF * (1 + growth)) / (wacc - growth);
  const pvTV = tv / lastDiscountFactor;
  const ev = sumPVFCF + pvTV;
  const equity = ev - netDebt;
  return Math.round((equity * 1e9) / (shares * 1e6));
}

export function formatBillion(n: number): string {
  if (Math.abs(n) >= 1000) return `Rp ${(n / 1000).toFixed(1)}T`;
  return `Rp ${n.toFixed(0)}B`;
}

export function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
