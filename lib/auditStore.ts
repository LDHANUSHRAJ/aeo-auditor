"use client";

import { create } from "zustand";
import type { BusinessInput, QueryResult, AuditReport } from "./types";
import type { SeoReport } from "./seoTypes";

export type AuditStep = "input" | "queries" | "running" | "report";
export type SeoStatus = "idle" | "running" | "done" | "failed";

interface AuditState {
  step: AuditStep;
  input: BusinessInput | null;
  generatedQueries: string[];
  liveResults: QueryResult[];
  report: AuditReport | null;
  reportId: string | null;
  isGeneratingQueries: boolean;
  queryGenError: string | null;

  // SEO audit state (runs in parallel with AEO on server)
  seoStatus: SeoStatus;
  seoReport: SeoReport | null;
  seoError: string | null;

  setStep: (step: AuditStep) => void;
  setInput: (input: BusinessInput) => void;
  setGeneratedQueries: (queries: string[]) => void;
  updateQuery: (index: number, value: string) => void;
  removeQuery: (index: number) => void;
  addQuery: (query: string) => void;
  setLiveResults: (results: QueryResult[]) => void;
  setReport: (report: AuditReport, id: string) => void;
  setIsGeneratingQueries: (v: boolean) => void;
  setQueryGenError: (e: string | null) => void;
  setSeoStatus: (s: SeoStatus) => void;
  setSeoReport: (r: SeoReport | null) => void;
  setSeoError: (e: string | null) => void;
  reset: () => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  step: "input",
  input: null,
  generatedQueries: [],
  liveResults: [],
  report: null,
  reportId: null,
  isGeneratingQueries: false,
  queryGenError: null,
  seoStatus: "idle",
  seoReport: null,
  seoError: null,

  setStep: (step) => set({ step }),
  setInput: (input) => set({ input }),
  setGeneratedQueries: (queries) => set({ generatedQueries: queries }),
  updateQuery: (index, value) =>
    set((s) => { const q = [...s.generatedQueries]; q[index] = value; return { generatedQueries: q }; }),
  removeQuery: (index) =>
    set((s) => ({ generatedQueries: s.generatedQueries.filter((_, i) => i !== index) })),
  addQuery: (query) =>
    set((s) => ({ generatedQueries: [...s.generatedQueries, query] })),
  setLiveResults: (liveResults) => set({ liveResults }),
  setReport: (report, reportId) => set({ report, reportId }),
  setIsGeneratingQueries: (isGeneratingQueries) => set({ isGeneratingQueries }),
  setQueryGenError: (queryGenError) => set({ queryGenError }),
  setSeoStatus: (seoStatus) => set({ seoStatus }),
  setSeoReport: (seoReport) => set({ seoReport }),
  setSeoError: (seoError) => set({ seoError }),
  reset: () => set({
    step: "input", input: null, generatedQueries: [], liveResults: [],
    report: null, reportId: null, isGeneratingQueries: false, queryGenError: null,
    seoStatus: "idle", seoReport: null, seoError: null,
  }),
}));
