const request = require('supertest');

const { getApp } = require('../app');
const { setupDB } = require('../database');
const { createToken } = require('../utils/Auth');

const db = setupDB();
const app = getApp();

describe('Test API endpoints', () => {
    it('should authenticate user', async () => {
        let res = await request(app)
            .post('/api/authenticate')
            .send({
                email: 'wrong-email',
                password: 'wrong-password'
            });
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Email or password is wrong');

        res = await request(app)
            .post('/api/authenticate')
            .send({ 
                email: 'abcd', 
                password: 'abcd' 
            });
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Logged in successfully');
        expect(res.body.token).toBeDefined();
    });

    it('should follow user', async () => {

    });
});

afterAll(async () => {
    await db.close();
});