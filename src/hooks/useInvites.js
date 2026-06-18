import { useEffect, useState } from "react";

import {
  getMyInvites,
  acceptInvite,
  rejectInvite,
} from "../api/invites";

export function useInvites() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchInvites() {
    try {
      const res = await getMyInvites();

      setInvites(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function accept(communityId, inviteId) {
    await acceptInvite(communityId, inviteId);

    setInvites((prev) =>
      prev.filter((i) => i.id !== inviteId)
    );
  }

  async function reject(communityId, inviteId) {
    await rejectInvite(communityId, inviteId);

    setInvites((prev) =>
      prev.filter((i) => i.id !== inviteId)
    );
  }

  useEffect(() => {
    fetchInvites();
  }, []);

  return {
    invites,
    loading,
    accept,
    reject,
    refresh: fetchInvites,
  };
}