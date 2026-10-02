type ServiceError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

const textOf = (error: unknown) => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const value = error as ServiceError;
    return [value.message, value.details, value.hint].filter(Boolean).join(" ");
  }
  return "";
};

export function adminErrorMessage(
  error: unknown,
  action: string,
  itemLabel = "item",
) {
  const serviceError = (error && typeof error === "object" ? error : {}) as ServiceError;
  const raw = textOf(error).toLowerCase();

  if (serviceError.code === "23505" || raw.includes("duplicate key") || raw.includes("already exists")) {
    return `A ${itemLabel} with this name or URL name already exists. Choose a different name.`;
  }
  if (serviceError.code === "23503" || raw.includes("foreign key constraint")) {
    return `This ${itemLabel} is still used by other learning content. Remove or move those linked records first.`;
  }
  if (serviceError.code === "42501" || raw.includes("permission denied") || raw.includes("row-level security")) {
    return `Your admin session cannot ${action}. Refresh the page and sign in again if this continues.`;
  }
  if (raw.includes("jwt") || raw.includes("not authenticated") || raw.includes("invalid token")) {
    return `Your sign-in session has expired. Sign in again, then retry.`;
  }
  if (raw.includes("failed to fetch") || raw.includes("network") || raw.includes("load failed")) {
    return `We could not reach the service. Check your connection and try again.`;
  }
  if (raw.includes("timeout") || raw.includes("timed out")) {
    return `The request took too long. Nothing was changed; please try again.`;
  }

  return `We could not ${action}. Nothing was changed. Please try again.`;
}

export function technicalErrorMessage(error: unknown) {
  return textOf(error) || "No technical details were provided.";
}