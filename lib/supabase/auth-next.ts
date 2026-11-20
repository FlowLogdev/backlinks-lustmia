export function authNext(value: string | null) {
  const origin = "https://auth.rankcore.invalid";
  if (!value?.startsWith("/")) return "/dashboard";

  try {
    const url = new URL(value, origin);
    if (url.origin === origin) {
      const destination = url.pathname + url.search + url.hash;
      if (!destination.startsWith("//")) return destination;
    }
  } catch {
    // Invalid URLs fall back to the dashboard.
  }

  return "/dashboard";
}
