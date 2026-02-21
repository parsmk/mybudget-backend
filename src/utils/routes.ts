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

export const formatCreateResponse = (
  uploaded: any[],
  errors: any[],
): [status: number, response: CreateResponse] => {
  const hasSuccess = uploaded.length > 0;
  const hasErrors = errors.length > 0;

  return [
    !hasSuccess && hasErrors ? 400 : hasSuccess && !hasErrors ? 201 : 200,
    {
      errors: { count: errors.length, items: errors },
      success: { count: uploaded.length, items: uploaded },
    },
  ];
};
