type CreateResponse = {
  errors: {
    count: number;
    items: any[];
  };
  success: {
    count: number;
    items: any[];
  };
};

export const formatBulkCreateResponse = (
  uploaded: any[] = [],
  errors: any[] = [],
): CreateResponse => {
  return {
    errors: { count: errors.length, items: errors },
    success: { count: uploaded.length, items: uploaded },
  };
};

export const formatErrorResponse = (message: string) => {
  return { formErrors: [message] };
};
