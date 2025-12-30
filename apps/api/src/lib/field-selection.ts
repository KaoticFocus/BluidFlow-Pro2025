/**
 * Field selection utilities for mobile-first API design
 * Allows clients to request only necessary fields to minimize payload size
 */

/**
 * Select specific fields from an object based on a comma-separated field list
 * @param obj - Object to select fields from
 * @param fields - Comma-separated list of field names (e.g., "id,name,email")
 * @returns Object with only selected fields, or original object if fields not specified
 */
export function selectFields<T extends Record<string, any>>(
  obj: T,
  fields?: string
): Partial<T> {
  if (!fields) return obj;
  
  const fieldSet = new Set(fields.split(",").map(f => f.trim()));
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => fieldSet.has(key))
  ) as Partial<T>;
}

/**
 * Select fields from an array of objects
 */
export function selectFieldsFromArray<T extends Record<string, any>>(
  items: T[],
  fields?: string
): Partial<T>[] {
  if (!fields) return items;
  return items.map(item => selectFields(item, fields));
}

