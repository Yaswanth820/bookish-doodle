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
        email: 'user1@hmail.com',
        password: 'user1',
        followers: [],
        following: []
    });
    await db.collection('users').insertOne({
        name: 'user2',
        email: 'user2@hmail.com',
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
                    email: 'user1@hmail.com',     // user1 exists in the database (see beforeEach)
                    password: 'user1'
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
            const user = await db.collection('users').findOne({ email: 'user1@hmail.com' });
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
            const user1 = await db.collection('users').findOne({ email: 'user1@hmail.com' });
            const user2 = await db.collection('users').findOne({ email: 'user2@hmail.com' });

            const user1Id = new mongoose.Types.ObjectId(user1._id).toString();
            const user2Id = new mongoose.Types.ObjectId(user2._id).toString();

            const token = createToken(user1);

            const response = await request(app)
                .post('/api/follow/' + user2._id)
                .set('auth-token', token);
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe('You are now following ' + user2.name);

            // Check if user1 is following user2
            const updatedUser1 = await db.collection('users').findOne({ email: 'user1@hmail.com' });
            const updatedUser2 = await db.collection('users').findOne({ email: 'user2@hmail.com' });

            expect(updatedUser2.followers).toContain(user1Id);
            expect(updatedUser1.following).toContain(user2Id);
        });

        it('should unfollow a user', async () => {
            const user1 = await db.collection('users').findOne({ email: 'user1@hmail.com' });
            const user2 = await db.collection('users').findOne({ email: 'user2@hmail.com' });

            // update user1 to follow user2
            await db.collection('users').updateOne(
                { email: 'user1@hmail.com' },
                { $push: { following: user2._id } }
            );
            await db.collection('users').updateOne(
                { email: 'user2@hmail.com' },
                { $push: { followers: user1._id } }
            );
            const currentUser = await db.collection('users').findOne({ email: 'user1@hmail.com' });
            const token = createToken(currentUser);
            
            const response = await request(app)
                .post('/api/unfollow/' + user2._id)
                .set('auth-token', token);
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe('You are no longer following ' + user2.name);

            // check if user1 is no longer following user2
            const updatedUser1 = await db.collection('users').findOne({ email: 'user1@hmail.com' });
            const updatedUser2 = await db.collection('users').findOne({ email: 'user2@hmail.com' });

            expect(updatedUser2.followers).not.toContainEqual(updatedUser1._id);
            expect(updatedUser1.following).not.toContainEqual(updatedUser2._id);
        });

        it('should create a post', async () => {
            const user = await db.collection('users').findOne({ email: 'user1@hmail.com' });
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
            
            // check if post is created in database
            const post = await db.collection('posts').findOne({ title: 'This is a test post' });
            expect(post).toBeDefined();
        });

        it('should delete a post', async () => {
            const user = await db.collection('users').findOne({ email: 'user1@hmail.com' });
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

            const deletedPost = await db.collection('posts').findOne({ title: 'This is a test post' });
            expect(deletedPost).toBeNull(); // post should be deleted
        });

        it('should like a post', async () => {
            const user = await db.collection('users').findOne({ email: 'user1@hmail.com' });
            const token = createToken(user);
            await db.collection('posts').insertOne({
                title: 'This is a test post',
                desc: 'This is a test post description',
                userId: user._id,
                createdAt: new Date(),
                likes: [],
                comments: []
            });

            const user1Id = new mongoose.Types.ObjectId(user._id).toString();

            const post = await db.collection('posts').findOne({ title: 'This is a test post' });
            const response = await request(app)
                .post('/api/like/' + post._id)
                .set('auth-token', token);
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe('Liked successfully');

            // Check if post is liked by user1
            const updatedPost = await db.collection('posts').findOne({ title: 'This is a test post' });
            expect(updatedPost.likes).toContain(user1Id);
        });

        it('should unlike a post', async () => {
            const user = await db.collection('users').findOne({ email: 'user1@hmail.com' });
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
            expect(response.body.likes).toEqual(0);

            // Check if user is no longer in likes array
            const updatedPost = await db.collection('posts').findOne({ title: 'This is a test post' });
            expect(updatedPost.likes).not.toContain(user._id);
        });

        it('should comment on a post', async () => {
            const user = await db.collection('users').findOne({ email: 'user1@hmail.com' });
            const token = createToken(user);
            // Initialize a post
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
            
            // DB check
            const updatedPost = await db.collection('posts').findOne({ title: 'This is a test post' });
            expect(updatedPost.comments[0].desc).toBe('This is a test comment');
        });
    });
});

afterEach(async () => {
    await db.collection('users').deleteOne({ email: 'user1@hmail.com' });
    await db.collection('users').deleteOne({ email: 'user2@hmail.com' });
    await db.collection('posts').deleteOne({ title: 'This is a test post' });
});

afterAll(async () => {
    await db.close();
});