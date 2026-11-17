import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import {
  adaptUser,
  adaptConnection,
  adaptPost,
  adaptScan,
  UserViewModel,
  PageConnectionViewModel,
  PostViewModel,
  ScanViewModel,
} from "./adapters";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const data = await apiClient<any>("/auth/me");
      return adaptUser(data);
    },
    retry: false,
  });
}

export function useConnections() {
  return useQuery({
    queryKey: ["facebook", "connection"],
    queryFn: async () => {
      const data = await apiClient<{
        pages: any[];
        facebook_ready: boolean;
        demo_available: boolean;
      }>("/facebook/connection");
      return {
        pages: (data.pages || []).map(adaptConnection),
        facebookReady: data.facebook_ready,
        demoAvailable: data.demo_available,
      };
    },
  });
}

export function usePosts(limit = 24, offset = 0) {
  return useQuery({
    queryKey: ["posts", { limit, offset }],
    queryFn: async () => {
      const data = await apiClient<{
        page: any;
        posts: any[];
        total: number;
        limit: number;
        offset: number;
        has_more: boolean;
      }>(`/posts?limit=${limit}&offset=${offset}`);
      return {
        page: data.page ? adaptConnection(data.page) : null,
        posts: (data.posts || []).map(adaptPost),
        total: data.total || 0,
        limit: data.limit || limit,
        offset: data.offset || offset,
        hasMore: Boolean(data.has_more),
      };
    },
  });
}

export function useScans() {
  return useQuery({
    queryKey: ["scans"],
    queryFn: async () => {
      const data = await apiClient<any[]>("/scans");
      return (data || []).map(adaptScan);
    },
  });
}

export function useScan(scanId: string) {
  return useQuery({
    queryKey: ["scan", scanId],
    queryFn: async () => {
      const data = await apiClient<any>(`/scans/${scanId}`);
      return adaptScan(data);
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.status === "running") {
        return 1500;
      }
      return false;
    },
    enabled: Boolean(scanId),
  });
}

export function useSelectPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) =>
      apiClient<{ selected_connection_id: string }>("/facebook/select-page", {
        method: "POST",
        body: JSON.stringify({ connection_id: connectionId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facebook", "connection"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useDisconnectPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) =>
      apiClient<{ ok: boolean }>(`/facebook/connection?connection_id=${connectionId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facebook", "connection"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useDemoConnect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient<{ ok: boolean; connection_id: string; is_demo: boolean }>(
        "/facebook/demo-connect",
        { method: "POST" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facebook", "connection"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useSyncPosts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mode: "latest" | "older" = "latest") =>
      apiClient<{
        synced: number;
        is_demo: boolean;
        has_older_on_facebook: boolean;
        last_synced_at: string;
      }>("/posts/sync", {
        method: "POST",
        body: JSON.stringify({ mode }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["facebook", "connection"] });
    },
  });
}

export function useCreateScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postIds: string[]) =>
      apiClient<{ id: string; status: string }>("/scans", {
        method: "POST",
        body: JSON.stringify({ post_ids: postIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scans"] });
    },
  });
}
