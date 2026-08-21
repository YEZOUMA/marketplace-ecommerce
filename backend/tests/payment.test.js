import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetDb } from './setup.js';
import { createUser } from './helpers.js';

const app = createApp();

beforeEach(async () => {
  await resetDb();
});

describe('Paiement de publication (mode mock)', () => {
  const productPayload = {
    nom: 'Sac à main',
    description: 'Sac à main en cuir véritable, fait à la main.',
    prix: 25000,
    stock: 5,
    images: [],
  };

  async function createProduct(app, token) {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productPayload);
    return res.body;
  }

  it('passe le produit en EN_ATTENTE_PAIEMENT après initiation du paiement', async () => {
    const vendeur = await createUser(app, 'VENDEUR');
    const product = await createProduct(app, vendeur.accessToken);

    const res = await request(app)
      .post(`/api/payments/publish/${product.id}`)
      .set('Authorization', `Bearer ${vendeur.accessToken}`)
      .send({ prestataire: 'ORANGE_MONEY', numeroTelephone: '+22670000000' });

    expect(res.status).toBe(201);
    expect(res.body.payment.statut).toBe('EN_ATTENTE');
    expect(res.body.redirectUrl).toBeDefined();

    const productCheck = await request(app)
      .get(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${vendeur.accessToken}`);
    expect(productCheck.body.statut).toBe('EN_ATTENTE_PAIEMENT');
  });

  it('publie le produit une fois le paiement simulé comme réussi', async () => {
    const vendeur = await createUser(app, 'VENDEUR');
    const product = await createProduct(app, vendeur.accessToken);

    const init = await request(app)
      .post(`/api/payments/publish/${product.id}`)
      .set('Authorization', `Bearer ${vendeur.accessToken}`)
      .send({ prestataire: 'WAVE', numeroTelephone: '+22670000000' });

    const simulate = await request(app)
      .post('/api/payments/mock/simulate')
      .set('Authorization', `Bearer ${vendeur.accessToken}`)
      .send({ reference: init.body.payment.referenceTransaction, resultat: 'REUSSI' });

    expect(simulate.status).toBe(200);
    expect(simulate.body.statut).toBe('REUSSI');

    const productCheck = await request(app)
      .get(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${vendeur.accessToken}`);
    expect(productCheck.body.statut).toBe('PUBLIE');
  });

  it('un client voit le produit dans le catalogue une fois publié', async () => {
    const vendeur = await createUser(app, 'VENDEUR');
    const product = await createProduct(app, vendeur.accessToken);
    const init = await request(app)
      .post(`/api/payments/publish/${product.id}`)
      .set('Authorization', `Bearer ${vendeur.accessToken}`)
      .send({ prestataire: 'MOOV_MONEY', numeroTelephone: '+22670000000' });
    await request(app)
      .post('/api/payments/mock/simulate')
      .set('Authorization', `Bearer ${vendeur.accessToken}`)
      .send({ reference: init.body.payment.referenceTransaction, resultat: 'REUSSI' });

    const client = await createUser(app, 'CLIENT');
    const list = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${client.accessToken}`);

    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].id).toBe(product.id);
  });

  it('remet le produit en BROUILLON si le paiement échoue', async () => {
    const vendeur = await createUser(app, 'VENDEUR');
    const product = await createProduct(app, vendeur.accessToken);
    const init = await request(app)
      .post(`/api/payments/publish/${product.id}`)
      .set('Authorization', `Bearer ${vendeur.accessToken}`)
      .send({ prestataire: 'SANK_MONEY', numeroTelephone: '+22670000000' });

    await request(app)
      .post('/api/payments/mock/simulate')
      .set('Authorization', `Bearer ${vendeur.accessToken}`)
      .send({ reference: init.body.payment.referenceTransaction, resultat: 'ECHOUE' });

    const productCheck = await request(app)
      .get(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${vendeur.accessToken}`);
    expect(productCheck.body.statut).toBe('BROUILLON');
  });

  it('rejette un webhook sans signature valide', async () => {
    const res = await request(app)
      .post('/api/payments/webhook/ORANGE_MONEY')
      .send({ reference: 'inexistant', status: 'REUSSI', providerTransactionId: 'x' });
    expect(res.status).toBe(401);
  });
});
