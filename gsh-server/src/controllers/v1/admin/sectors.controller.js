const { prisma } = require('../../../../lib/prisma');
const ApiResponse = require("../../../utils/ApiResponse");
const AppError = require("../../../utils/AppError");

exports.list = async (req, res) => {
  const { q, page = 1, limit = 10, sortBy = "id", order = "desc" } = req.query;
  const filter = {};
  if (q) {
    filter.OR = [
      { agency: { contains: q, mode: 'insensitive' } },
      { range: { contains: q, mode: 'insensitive' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const orderBy = { [sortBy]: order };

  const [items, total] = await Promise.all([
    prisma.sector.findMany({
      where: filter,
      orderBy,
      skip,
      take: Number(limit)
    }),
    prisma.sector.count({ where: filter })
  ]);

  console.log('Sectors fetched:', items.length, 'items, total:', total);
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  return ApiResponse.ok(res, "Sectors fetched", {
    items, page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit))
  });
};

exports.create = async (req, res) => {
  const { agency, range } = req.body;
  if (!agency || !range) throw new AppError(400, "Agency and range are required");
  const exists = await prisma.sector.findFirst({
    where: { agency, range }
  });
  if (exists) throw new AppError(409, "Sector already exists");
  const s = await prisma.sector.create({
    data: { agency, range }
  });
  return ApiResponse.ok(res, "Sector created", { id: s.id, agency: s.agency, range: s.range }, 201);
};

exports.getOne = async (req, res) => {
  const s = await prisma.sector.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      _count: {
        select: { users: true, teams: true, doctors: true, distributors: true }
      }
    }
  });
  if (!s) throw new AppError(404, "Sector not found");
  return ApiResponse.ok(res, "Sector fetched", s);
};

exports.update = async (req, res) => {
  const { agency, range } = req.body;
  const update = {};
  if (agency) update.agency = agency;
  if (range) update.range = range;
  if (agency || range) {
    const taken = await prisma.sector.findFirst({
      where: { agency, range, id: { not: parseInt(req.params.id) } }
    });
    if (taken) throw new AppError(409, "Sector already exists");
  }
  const s = await prisma.sector.update({
    where: { id: parseInt(req.params.id) },
    data: update
  });
  if (!s) throw new AppError(404, "Sector not found");
  return ApiResponse.ok(res, "Sector updated", s);
};

exports.remove = async (req, res) => {
  const count = await prisma.sector.count({
    where: {
      OR: [
        { users: { some: { sector_id: parseInt(req.params.id) } } },
        { teams: { some: { sector_id: parseInt(req.params.id) } } },
        { doctors: { some: { sector_id: parseInt(req.params.id) } } },
        { distributors: { some: { sector_id: parseInt(req.params.id) } } }
      ]
    }
  });
  if (count > 0) throw new AppError(400, "Cannot delete sector with existing relations");
  await prisma.sector.delete({
    where: { id: parseInt(req.params.id) }
  });
  return ApiResponse.ok(res, "Sector removed", null, 200);
};
