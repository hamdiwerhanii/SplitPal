import type { Activity } from "@/types/activity/ActivityTypes";
import API from "./client";
import type { CursorPage } from "@/types/common/CommonTypes";

export const getActivity = async (
  cursor?: string | null,
): Promise<CursorPage<Activity>> => {
  const { data } = await API.get<CursorPage<Activity>>("/activity", {
    params: { limit: 25, ...(cursor ? { cursor } : {}) },
  });
  return data;
};
