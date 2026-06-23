import { useMutation } from "@tanstack/react-query";
import client from "../api/client";

// POST /api/v1/file/upload — multipart, fileCategory required
async function uploadFile(file, fileCategory) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileCategory", fileCategory);

  const res = await client.post("/file/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data; // { id, url, fileType, ... }
}

export function useUploadFile() {
  return useMutation({
    mutationFn: ({ file, fileCategory }) => uploadFile(file, fileCategory),
  });
}

// POST /api/v1/communities
// body: { name, slug, description, category[], contactEmail, contactPhone,
//         publicVisible, requiresMemberApproval, logoFileId, brandingAssetFileId }
// returns full community object incl. id/slug — used to chain onboarding steps
async function createCommunity(payload) {
  const res = await client.post("/communities", payload);
  return res.data.data;
}

export function useCreateCommunity() {
  return useMutation({
    mutationFn: createCommunity,
  });
}

// PATCH /api/v1/communities/{communityIdentifier}
async function updateCommunity({ communityIdentifier, payload }) {
  const res = await client.patch(`/communities/${communityIdentifier}`, payload);
  return res.data.data;
}

export function useUpdateCommunity() {
  return useMutation({
    mutationFn: updateCommunity,
  });
}

// POST /api/v1/communities/{communityIdentifier}/account
// body: { settlementBank, settlementBankCode, accountNumber }
async function createCommunityAccount({ communityIdentifier, payload }) {
  const res = await client.post(`/communities/${communityIdentifier}/account`, payload);
  return res.data.data;
}

export function useCreateCommunityAccount() {
  return useMutation({
    mutationFn: createCommunityAccount,
  });
}

// GET /api/v1/finance/resolve-account?bankCode=&accountNumber=
async function resolveAccount({ bankCode, accountNumber }) {
  const res = await client.get("/finance/resolve-account", {
    params: { bankCode, accountNumber },
  });
  return res.data.data; // { accountNumber, accountName, bankCode, bankName }
}

export function useResolveAccount() {
  return useMutation({
    mutationFn: resolveAccount,
  });
}

// GET /api/v1/finance/banks
async function fetchBanks() {
  const res = await client.get("/finance/banks");
  return res.data.data; // [{ name, code, slug }]
}

export function useBanks() {
  return useMutation({
    mutationFn: fetchBanks,
  });
}

// POST /api/v1/communities/{communityIdentifier}/members
// body: { roleId, memberRef, firstName, lastName, middleName, email,
//         phoneNumber, address, billingExempt, customAttributes }
async function createMember({ communityIdentifier, payload }) {
  const res = await client.post(`/communities/${communityIdentifier}/members`, payload);
  return res.data.data;
}

export function useCreateMember() {
  return useMutation({
    mutationFn: createMember,
  });
}