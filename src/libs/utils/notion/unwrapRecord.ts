// notion-client@6 wraps each record as { spaceId, value: { value: data, role } }
// instead of the expected { value: data, role }.
// This helper unwraps to the actual record data.
export function unwrapRecordValue<T = any>(record: any): T | undefined {
  if (record?.value?.value !== undefined) return record.value.value as T
  return record?.value as T | undefined
}
