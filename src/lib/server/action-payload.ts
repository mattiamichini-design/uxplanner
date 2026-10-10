import "server-only";

export type BoundedStringOptions = {
  minLength?: number;
  maxLength: number;
  singleLine?: boolean;
};

type BoundedArrayOptions<T> = {
  maxLength: number;
  itemName: string;
  parseItem: (value: unknown, field: string) => T;
};

type BoundedRecordOptions = {
  maxKeys: number;
  allowedKeys: readonly string[];
};

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

export function assertBoundedString(
  value: unknown,
  field: string,
  { minLength = 0, maxLength, singleLine = false }: BoundedStringOptions,
): string {
  if (
    typeof value !== "string" ||
    value.length < minLength ||
    value.length > maxLength ||
    CONTROL_CHARACTER_PATTERN.test(value) ||
    (singleLine && /[\r\n]/.test(value))
  ) {
    throw new Error(`Invalid ${field}`);
  }

  return value;
}

export function assertBoundedBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Invalid ${field}`);
  }

  return value;
}

export function assertBoundedIndex(value: unknown, field: string, maxValue = 10_000): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > maxValue
  ) {
    throw new Error(`Invalid ${field}`);
  }

  return value;
}

export function assertBoundedArray<T>(
  value: unknown,
  field: string,
  { maxLength, itemName, parseItem }: BoundedArrayOptions<T>,
): T[] {
  if (!Array.isArray(value) || value.length > maxLength) {
    throw new Error(`Invalid ${field}`);
  }

  return value.map((item, index) => parseItem(item, `${itemName} ${index + 1}`));
}

export function assertBoundedRecord(
  value: unknown,
  field: string,
  { maxKeys, allowedKeys }: BoundedRecordOptions,
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  ) {
    throw new Error(`Invalid ${field}`);
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length > maxKeys || keys.some((key) => !allowedKeys.includes(key))) {
    throw new Error(`Invalid ${field}`);
  }

  return record;
}

export function optionalBoundedString(
  value: unknown,
  field: string,
  options: BoundedStringOptions,
): string | undefined {
  return value === undefined ? undefined : assertBoundedString(value, field, options);
}

/** JSON double-quoted strings are valid YAML 1.2 scalars and escape line breaks safely. */
export function escapeYamlString(value: string): string {
  return JSON.stringify(value);
}
