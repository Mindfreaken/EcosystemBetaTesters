// Helpers for chat attachments

// Currently we are not rewriting Convex storage URLs; return as-is.
export const convertToPublicHttpsUrl = (url: string | null): string | null => {
  return url;
};
