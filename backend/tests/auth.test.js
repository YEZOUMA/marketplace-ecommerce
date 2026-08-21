import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetDb } from './setup.js';

const app = createApp();

beforeEach(async () => {
  await resetDb();
});

describe('Auth', () => {
  const credentials = {
    nom: 'Jean Dupont',
    email: 'jean@example.com',
    motDePasse: 'motdepasse123',
    role: 'CLIENT',
  };

  it('inscrit un nouvel utilisateur et renvoie des tokens', async () => {
    const res = await request(app).post('/api/auth/register').send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.user.motDePasse).toBeUndefined();
  });

  it('refuse une inscription en double', async () => {
    await request(app).post('/api/auth/register').send(credentials);
    const res = await request(app).post('/api/auth/register').send(credentials);
    expect(res.status).toBe(409);
  });

  it('connecte un utilisateur avec les bons identifiants', async () => {
    await request(app).post('/api/auth/register').send(credentials);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, motDePasse: credentials.motDePasse });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('refuse un mauvais mot de passe', async () => {
    await request(app).post('/api/auth/register').send(credentials);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, motDePasse: 'mauvais-mot-de-passe' });
    expect(res.status).toBe(401);
  });

  it('renvoie le profil courant via /me avec un token valide', async () => {
    const register = await request(app).post('/api/auth/register').send(credentials);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${register.body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(credentials.email);
  });

  it('rejette /me sans token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rafraîchit les tokens avec un refresh token valide', async () => {
    const register = await request(app).post('/api/auth/register').send(credentials);
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: register.body.refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });
});
