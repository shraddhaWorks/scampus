import { toast } from "./toast.service";


export async function api(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    const err = await res.json();
    toast.error(err.message || "Something went wrong");
    throw new Error(err.message || "Something went wrong");
  }

  return res;
}

export async function apiJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await api(url, options);
  return res.json();
}
