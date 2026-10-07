/**
 * Reusable Pagination Helper for any model
 * @param {any} model
 * @param {object} options
 * @param {number} options.pageNumber
 * @param {number} options.pageSize
 * @param {object} filters
 * @returns {Promise<{ data: any[], totalCount: number, hasNext: boolean }>}
 */
export const paginate = async (
  model: any,
  { pageNumber, pageSize }: { pageNumber: number; pageSize: number },
  filters: any = {},
  aggregationPipeline: any[] = [],
) => {
  console.log(pageNumber, pageSize);
  const paginationPipeline = [...aggregationPipeline, { $sort: { createdAt: -1 } }, { $skip: (pageNumber - 1) * pageSize }, { $limit: pageSize }];

  const projectionPipeline = [
    {
      $project: {
        __v: 0,
        createdUser: 0,
        updatedUser: 0,
        updatedAt: 0,
        documentStatus: 0,
        password: 0,
      },
    },
  ];

  const pipeline = [{ $match: filters }, ...paginationPipeline, ...projectionPipeline];

  const data = await model.aggregate(pipeline);

  const totalCount = await model.countDocuments(filters).exec();
  const hasNext = totalCount > pageNumber * pageSize;

  return { data, totalCount, hasNext };
};

export const excludedItems = '-__v -createdUser -updatedUser -updatedAt -documentStatus';
