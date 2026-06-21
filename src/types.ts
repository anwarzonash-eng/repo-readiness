export type Severity = "error" | "warn" | "info";

export interface Finding {
  check: string;
  severity: Severity;
  message: string;
  file?: string;
  line?: number;
}
