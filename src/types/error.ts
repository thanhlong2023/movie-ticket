export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  const apiError = error as ApiError;
  return (
    apiError.response?.data?.message || apiError.message || "An error occurred"
  );
};
