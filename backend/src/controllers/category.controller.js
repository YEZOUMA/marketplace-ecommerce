import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const list = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { nom: 'asc' } });
  res.json(categories);
});

export const create = asyncHandler(async (req, res) => {
  const category = await prisma.category.create({ data: { nom: req.body.nom } });
  res.status(201).json(category);
});

export const update = asyncHandler(async (req, res) => {
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: { nom: req.body.nom },
  });
  res.json(category);
});

export const remove = asyncHandler(async (req, res) => {
  const inUse = await prisma.product.count({ where: { categorieId: req.params.id } });
  if (inUse > 0) {
    throw ApiError.conflict('Impossible de supprimer une catégorie utilisée par des produits');
  }
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
