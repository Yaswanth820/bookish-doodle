const request = require('supertest');
const mongoose = require('mongoose');

const { getApp } = require('../app');
const { setupDB } = require('../database');
const { createToken } = require('../utils/Auth');

const db = setupDB();
const app = getApp();

beforeEach(async () => {
    await db.collection('users').insertOne({
        name: 'user1',
        email: 'user1',
        password: 'user1',
        followers: [],
        following: []
    });
    await db.collection('users').insertOne({
        name: 'user2',
        email: 'user2',
        password: 'user2',
        followers: [],
        following: []
    });
});

describe('Test API endpoints', () => {
    describe('given user does not exist', () => {
        it('should return 404', async () => {
            const response = await request(app)
                .post('/api/authenticate')
                .send({
                    email: 'wrong-email',
                    password: 'wrong-password'
                });
            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe('Email or password is wrong');
        });
    });

    describe('given user exists', () => {
        it('should authenticate user', async () => {
            const response = await request(app)
                .post('/api/authenticate')
                .send({
                    email: 'abcd',
                    password: 'abcd'
                });
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe('Logged in successfully');
            expect(response.body.token).toBeDefined();
        });
    });

    describe('given user is not authenticated', () => {
        it('should return 401', async () => {
            const response = await request(app)
                .get('/api/user');
            expect(response.statusCode).toBe(401);
            expect(response.text).toBe('Access Denied'); // Missing Token
        });
    });

    describe('given user is authenticated', () => {
        it('should return profile of authenticated user', async () => {
            const user = await db.collection('users').findOne({ email: 'user1' });
            const token = createToken(user);

            const response = await request(app)
                .get('/api/user')
                .set('auth-token', token);
            expect(response.statusCode).toBe(200);
            expect(response.body.name).toBe('user1');
            expect(response.body.followerCount).toBeDefined();
            expect(response.body.followingCount).toBeDefined();
        });

        it('should follow a user', async () => {
            let user1 = await db.collection('users').findOne({ email: 'user1' });
            let user2 = await db.collection('users').findOne({ email: 'user2' });

            const user1Id = new mongoose.Types.ObjectId(user1._id).toString();
            const user2Id = new mongoose.Types.ObjectId(user2._id).toString();

            const token = createToken(user1);

            const response = await request(app)
                .post('/api/follow/' + user2._id)
                .set('auth-token', token);
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe('You are now following ' + user2.name);

            user1 = await db.collection('users').findOne({ email: 'user1' });
            user2 = await db.collection('users').findOne({ email: 'user2' });

            expect(user2.followers).toContain(user1Id);
            expect(user1.following).toContain(user2Id);
        });

        it('should unfollow a user', async () => {
            let user1 = await db.collection('users').findOne({ email: 'user1' });
            let user2 = await db.collection('users').findOne({ email: 'user2' });
            
            // update user1 to follow user2
            await db.collection('users').updateOne(
                { email: 'user1' },
                { $push: { following: user2._id } }
            );
            await db.collection('users').updateOne(
                { email: 'user2' },
                { $push: { followers: user1._id } }
            );
            user1 = await db.collection('users').findOne({ email: 'user1' });
            const token = createToken(user1);
            
            const response = await request(app)
                .post('/api/unfollow/' + user2._id)
                .set('auth-token', token);
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe('You are no longer following ' + user2.name);
        });

        it('should create a post', async () => {
            const user = await db.collection('users').findOne({ email: 'user1' });
            const token = createToken(user);

            const response = await request(app)
                .post('/api/posts')
                .set('auth-token', token)
                .send({
                    title: 'This is a test post',
                    desc: 'This is a test post description'
                });
            expect(response.statusCode).toBe(200);
            expect(response.body.title).toBe('This is a test post');
            expect(response.body.desc).toBe('This is a test post description');

            const post = await db.collection('posts').findOne({ title: 'This is a test post' });
            expect(post).toBeDefined();
        });

        it('should delete a post', async () => {
            const user = await db.collection('users').findOne({ email: 'user1' });
            const token = createToken(user);
            await db.collection('posts').insertOne({
                title: 'This is a test post',
                desc: 'This is a test post description',
                userId: user._id,
                createdAt: new Date(),
                likes: [],
                comments: []
            });
            const post = await db.collection('posts').findOne({ title: 'This is a test post' });
            const response = await request(app)
                .delete('/api/posts/' + post._id)
                .set('auth-token', token);
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe('Post deleted successfully');

            let oldPost = await db.collection('posts').findOne({ title: 'This is a test post' });
            expect(oldPost).toBeNull(); // post should be deleted
        });

        it('should like a post', async () => {
            const user = await db.collection('users').findOne({ email: 'user1' });
            const token = createToken(user);
            await db.collection('posts').insertOne({
                title: 'This is a test post',
                desc: 'This is a test post description',
                userId: user._id,
                createdAt: new Date(),
                likes: [],
                comments: []
            });
            const post = await db.collection('posts').findOne({ title: 'This is a test post' });
            const response = await request(app)
                .post('/api/like/' + post._id)
                .set('auth-token', token);
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe('Liked successfully');

            // const updatedPost = await db.collection('posts').findOne({ title: 'This is a test post' });
            // expect(updatedPost.likes[0]).toEqual(user._id);
        });

        it('should unlike a post', async () => {
            const user = await db.collection('users').findOne({ email: 'user1' });
            const token = createToken(user);
            await db.collection('posts').insertOne({
                title: 'This is a test post',
                desc: 'This is a test post description',
                userId: user._id,
                createdAt: new Date(),
                likes: [user._id],
                comments: []
            });
            const post = await db.collection('posts').findOne({ title: 'This is a test post' });
            const response = await request(app)
                .post('/api/unlike/' + post._id)
                .set('auth-token', token);
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe('Unliked successfully');
        });

        it('should comment on a post', async () => {
            const user = await db.collection('users').findOne({ email: 'user1' });
            const token = createToken(user);
            await db.collection('posts').insertOne({
                title: 'This is a test post',
                desc: 'This is a test post description',
                userId: user._id,
                createdAt: new Date(),
                likes: [],
                comments: []
            });
            const post = await db.collection('posts').findOne({ title: 'This is a test post' });
            const response = await request(app)
                .post('/api/comment/' + post._id)
                .set('auth-token', token)
                .send({
                    desc: 'This is a test comment'
                });
            expect(response.statusCode).toBe(200);
        });
    });
});

afterEach(async () => {
    await db.collection('users').deleteOne({ email: 'user1' });
    await db.collection('users').deleteOne({ email: 'user2' });
    await db.collection('posts').deleteOne({ title: 'This is a test post' });
});

afterAll(async () => {
    await db.close();
});