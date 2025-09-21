import { api } from "@/services/api";

export type Language = {
  code: string;
  label: string;
};

export async function languages_get_current_languages(): Promise<Language[]> {
  try {
    const { data } = await api.get<{ ok: boolean; data: Language[] }>("/languages/current");
    return data?.data ?? [];
  } catch {
    return [];
  }
}

export async function languages_get_target_languages(): Promise<Language[]> {
  try {
    const { data } = await api.get<{ ok: boolean; data: Language[] }>("/languages/target");
    return data?.data ?? [];
  } catch {
    return [];
  }
}
