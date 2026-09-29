import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../api/client", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const client = (await import("../../api/client")).default;
const {
  getCommunityGroups,
  createCommunityGroup,
  getCommunityGroup,
  updateCommunityGroup,
  deleteCommunityGroup,
  archiveCommunityGroup,
  unarchiveCommunityGroup,
  getCommunityGroupMembers,
  addCommunityGroupMembers,
  removeCommunityGroupMembers,
} = await import("../../api/groups");

const COMMUNITY = "glass-crew";
const GROUP = "group-1";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("groups API — paths", () => {
  it("scopes every route to the community and group identifiers", () => {
    getCommunityGroups(COMMUNITY);
    createCommunityGroup(COMMUNITY, { name: "Choir" });
    getCommunityGroup(COMMUNITY, GROUP);
    updateCommunityGroup(COMMUNITY, GROUP, { name: "Choir 2" });
    deleteCommunityGroup(COMMUNITY, GROUP);
    getCommunityGroupMembers(COMMUNITY, GROUP);
    archiveCommunityGroup(COMMUNITY, GROUP);
    unarchiveCommunityGroup(COMMUNITY, GROUP);

    const base = `/communities/${COMMUNITY}/groups`;
    const one = `${base}/${GROUP}`;
    expect(client.get.mock.calls[0][0]).toBe(base);
    expect(client.post.mock.calls[0][0]).toBe(base);
    expect(client.get.mock.calls[1][0]).toBe(one);
    expect(client.patch.mock.calls[0][0]).toBe(one);
    expect(client.delete.mock.calls[0][0]).toBe(one);
    expect(client.get.mock.calls[2][0]).toBe(`${one}/members`);
    expect(client.patch.mock.calls[1][0]).toBe(`${one}/archive`);
    expect(client.patch.mock.calls[2][0]).toBe(`${one}/unarchive`);
  });

  it("treats archive and unarchive as PATCH transitions, not deletes", () => {
    archiveCommunityGroup(COMMUNITY, GROUP);
    unarchiveCommunityGroup(COMMUNITY, GROUP);

    expect(client.patch).toHaveBeenCalledWith(`/communities/${COMMUNITY}/groups/${GROUP}/archive`);
    expect(client.patch).toHaveBeenCalledWith(
      `/communities/${COMMUNITY}/groups/${GROUP}/unarchive`,
    );
    expect(client.delete).not.toHaveBeenCalled();
  });
});

describe("groups API — membership", () => {
  it("sends memberIds in the body when adding", () => {
    addCommunityGroupMembers(COMMUNITY, GROUP, ["m1", "m2"]);

    expect(client.post).toHaveBeenCalledWith(`/communities/${COMMUNITY}/groups/${GROUP}/members`, {
      memberIds: ["m1", "m2"],
    });
  });

  it("sends memberIds in `data` when removing — the route has no id segment", () => {
    // The backend takes the IDENTICAL AddGroupMembersRequest for both verbs, so
    // a DELETE with no body has nothing to match on and silently removes
    // nothing. Axios only sends `data` if it is passed explicitly.
    removeCommunityGroupMembers(COMMUNITY, GROUP, ["m1"]);

    const [url, config] = client.delete.mock.calls[0];
    expect(url).toBe(`/communities/${COMMUNITY}/groups/${GROUP}/members`);
    expect(config).toEqual({ data: { memberIds: ["m1"] } });
  });
});

describe("groups API — list params", () => {
  it("forwards the query DTO untouched", () => {
    const params = { search: "choir", pageNumber: 0, pageSize: 20, status: undefined };
    getCommunityGroups(COMMUNITY, params);

    expect(client.get).toHaveBeenCalledWith(`/communities/${COMMUNITY}/groups`, { params });
  });

  it("defaults to an empty params object, never undefined", () => {
    // The OpenAPI marks the single `query` parameter required on every one of
    // these list routes.
    getCommunityGroups(COMMUNITY);
    expect(client.get.mock.calls[0][1]).toEqual({ params: {} });
  });
});
