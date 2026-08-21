import request from 'supertest';

let counter = 0;

export async function createUser(app, role = 'CLIENT') {
  counter += 1;
  const email = `${role.toLowerCase()}${counter}@example.com`;
  const res = await request(app).post('/api/auth/register').send({
    nom: `Utilisateur ${role}`,
    email,
    motDePasse: 'motdepasse123',
    role: role === 'ADMIN' ? 'CLIENT' : role, // ADMIN cannot self-register; promoted below
  });

  if (role === 'ADMIN') {
    const { prisma } = await import('../src/config/prisma.js');
    await prisma.user.update({ where: { id: res.body.user.id }, data: { role: 'ADMIN' } });
    // Re-login to get a token carrying the ADMIN role claim.
    const login = await request(app).post('/api/auth/login').send({ email, motDePasse: 'motdepasse123' });
    return { user: login.body.user, accessToken: login.body.accessToken };
  }

  return { user: res.body.user, accessToken: res.body.accessToken };
}

export async function createCategory(app, adminToken, nom = 'Électronique') {
  const res = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nom });
  return res.body;
}
