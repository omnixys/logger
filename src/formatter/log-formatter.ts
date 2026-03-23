export function formatLog(message: string, metadata?: any): string {
  if (!metadata) return message;

  try {
    return `${message} ${JSON.stringify(metadata)}`;
  } catch {
    return message;
  }
}
