import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetDb } from './setup.js';
import { createUser } from './helpers.js';

const app = createApp();

beforeEach(async () => {
  await resetDb();
});

async function createPublishedProduct(app, vendeurToken, overrides = {}) {
  const created = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${vendeurToken}`)
    .send({
      nom: 'Montre connectée',
      description: 'Montre connectée avec suivi santé et notifications.',
      prix: 30000,
      stock: 3,
      images: [],
      ...overrides,
    });

  const init = await request(app)
    .post(`/api/payments/publish/${created.body.id}`)
    .set('Authorization', `Bearer ${vendeurToken}`)
    .send({ prestataire: 'ORANGE_MONEY', numeroTelephone: '+22670000000' });

  await request(app)
    .post('/api/payments/mock/simulate')
    .set('Authorization', `Bearer ${vendeurToken}`)
    .send({ reference: init.body.payment.referenceTransaction, resultat: 'REUSSI' });

  return created.body;
}

describe('Commandes (sans paiement client)', () => {
  it('un client peut commander un produit publié, sans étape de paiement', async () => {
    const vendeur = await createUser(app, 'VENDEUR');
    const product = await createPublishedProduct(app, vendeur.accessToken);
    const client = await createUser(app, 'CLIENT');

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send({
        items: [{ productId: product.id, quantite: 2 }],
        adresseLivraison: '123 Rue de la Paix, Ouagadougou',
        notes: 'Livrer le matin de préférence',
      });

    expect(res.status).toBe(201);
    expect(res.body.total).toBe(60000);
    expect(res.body.statut).toBe('EN_ATTENTE');
    expect(res.body.items).toHaveLength(1);
  });

  it('décrémente le stock de manière transactionnelle', async () => {
    const vendeur = await createUser(app, 'VENDEUR');
    const product = await createPublishedProduct(app, vendeur.accessToken, { stock: 3 });
    const client = await createUser(app, 'CLIENT');

    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send({ items: [{ productId: product.id, quantite: 2 }], adresseLivraison: 'Adresse test' });

    const productCheck = await request(app)
      .get(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${vendeur.accessToken}`);
    expect(productCheck.body.stock).toBe(1);
  });

  it('refuse une commande dépassant le stock disponible', async () => {
    const vendeur = await createUser(app, 'VENDEUR');
    const product = await createPublishedProduct(app, vendeur.accessToken, { stock: 1 });
    const client = await createUser(app, 'CLIENT');

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send({ items: [{ productId: product.id, quantite: 5 }], adresseLivraison: 'Adresse test' });

    expect(res.status).toBe(409);
  });

  it('un vendeur voit les commandes reçues contenant ses produits', async () => {
    const vendeur = await createUser(app, 'VENDEUR');
    const product = await createPublishedProduct(app, vendeur.accessToken);
    const client = await createUser(app, 'CLIENT');

    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send({ items: [{ productId: product.id, quantite: 1 }], adresseLivraison: 'Adresse test' });

    const res = await request(app)
      .get('/api/orders/received')
      .set('Authorization', `Bearer ${vendeur.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('la réponse de commande ne contient aucune information de paiement', async () => {
    const vendeur = await createUser(app, 'VENDEUR');
    const product = await createPublishedProduct(app, vendeur.accessToken);
    const client = await createUser(app, 'CLIENT');

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send({ items: [{ productId: product.id, quantite: 1 }], adresseLivraison: 'Adresse test' });

    expect(res.body.paiement).toBeUndefined();
    expect(res.body.paymentMethod).toBeUndefined();
  });
});
