const JWT =  require('jsonwebtoken')
const createError = require('http-errors')
const client = require('./init_redis')

module.exports = {
    signAccessToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {
            }

            const secret = process.env.ACCESS_TOKEN_SECRET
            const option = {
                expiresIn: "30s",
                issuer: "auth_app.com",
                audience: userId
            };
            
            JWT.sign(payload, secret, option, (err, token) => {
                if(err) reject(err)
                resolve(token)
            })
        })
    },

    verifyAccessToken: (req, res, next) => {
        if(!req.headers['authorization']) return next(createError.Unauthorized());
        const authHeader = req.headers['authorization'];
        const bearerToken = authHeader.split(' ');
        const token = bearerToken[1];
        JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
            if(err) return next(err);
            req.payload = payload;
            next();
        })
    },

    signRefreshToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {}

            const secret = process.env.REFRESH_TOKEN_SECRET
            const option = {
                expiresIn: "1y",
                issuer: "auth_app.com",
                audience: userId
            };
            
            JWT.sign(payload, secret, option, (err, token) => {
                if(err) reject(createError.InternalServerError())
                
                
                client.SET(userId, token, 'EX', 365*24*60*60, (err, resp) => {
                    if(err)
                    {
                        reject(createError.InternalServerError())
                        return 
                    } 
                    
                    resolve(token)
                })
            })
        })
    },

    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve, reject) => {
            JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
                console.log(err, payload)
                if(err) return reject(createError.Unauthorized())
                const userId = payload.aud

                client.GET(userId, (err, result) => {
                    if(err){
                        console.log(err);
                        reject(createError.InternalServerError());
                        return;
                    }
                    if(refreshToken == result) return resolve(userId)

                    reject(createError.Unauthorized());
                })
            })
        })
    },
}