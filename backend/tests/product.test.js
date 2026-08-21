import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetDb } from './setup.js';
import { createUser } from './helpers.js';

const app = createApp();

beforeEach(async () => {
  await resetDb();
});

describe('Produits', () => {
  const productPayload = {
    nom: 'Chaise en bois',
    description: 'Une belle chaise artisanale en bois massif.',
    prix: 15000,
    stock: 10,
    images: [{ url: '/uploads/chaise.jpg', ordre: 0 }],
  };

  it('un vendeur peut créer un produit qui démarre en BROUILLON', async () => {
    const vendeur = await createUser(app, 'VENDEUR');
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${vendeur.accessToken}`)
      .send(productPayload);

    expect(res.status).toBe(201);
    expect(res.body.statut).toBe('BROUILLON');
    expect(res.body.vendeurId).toBe(vendeur.user.id);
  });

  it('un client ne voit pas les produits non publiés dans la liste', async () => {
    const vendeur = await createUser(app, 'VENDEUR');
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${vendeur.accessToken}`)
      .send(productPayload);

    const client = await createUser(app, 'CLIENT');
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${client.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it('un client ne peut pas accéder à la fiche d\'un produit non publié', async () => {
    const vendeur = await createUser(app, 'VENDEUR');
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${vendeur.accessToken}`)
      .send(productPayload);

    const client = await createUser(app, 'CLIENT');
    const res = await request(app)
      .get(`/api/products/${created.body.id}`)
      .set('Authorization', `Bearer ${client.accessToken}`);

    expect(res.status).toBe(404);
  });

  it('un vendeur voit ses propres brouillons', async () => {
    const vendeur = await createUser(app, 'VENDEUR');
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${vendeur.accessToken}`)
      .send(productPayload);

    const res = await request(app)
      .get(`/api/products/${created.body.id}`)
      .set('Authorization', `Bearer ${vendeur.accessToken}`);

    expect(res.status).toBe(200);
  });

  it('un vendeur ne peut pas modifier le produit d\'un autre vendeur', async () => {
    const vendeurA = await createUser(app, 'VENDEUR');
    const vendeurB = await createUser(app, 'VENDEUR');
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${vendeurA.accessToken}`)
      .send(productPayload);

    const res = await request(app)
      .patch(`/api/products/${created.body.id}`)
      .set('Authorization', `Bearer ${vendeurB.accessToken}`)
      .send({ prix: 20000 });

    expect(res.status).toBe(403);
  });
});
