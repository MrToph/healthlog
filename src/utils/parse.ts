import { ZodError, type ZodType } from "zod";

export function stringifyJson(value: object): string {
  return JSON.stringify(value);
}

export function parseJson(value: string, label: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch (error) {
    throw new Error(
      `Invalid JSON in ${label}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

export function parseSchema<T>(
  schema: ZodType<T>,
  value: unknown,
  label: string,
): T {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues
        .map((issue) => {
          const path =
            issue.path.length === 0 ? "<root>" : issue.path.join(".");
          return `${path}: ${issue.message}`;
        })
        .join("; ");
      throw new Error(`Invalid ${label}: ${details}`);
    }
    throw error;
  }
}

export function optionalFiniteNumber(
  value: number | null | undefined,
): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export function metricNumber(value: number | null | undefined): number {
  return optionalFiniteNumber(value) ?? 0;
}
