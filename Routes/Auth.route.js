const express = require('express');
const router = express.Router();
const createError = require('http-errors');
const User = require('../Models/User.model')
const authSchema = require('../Helpers/validation_schema')
// const {authSchema}  = require('../Helpers/validation_schema')
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../Helpers/jwt_helper')
const client = require('../Helpers/init_redis')


router.post('/register', async (req, res, next) => {
    try{
        // const { email, password } = req.body;

        const result = await authSchema.validateAsync(req.body)

        // if(!email || !password) throw createError.BadRequest()

        const doesExist = await User.findOne({ email: result.email})
        if(doesExist) throw createError.Conflict(`${result.email} is already registered`)
        
        const user = new User(result)

        const savedUser = await user.save()
        const accessToken = await signAccessToken(savedUser.id)
        const refreshToken = await signRefreshToken(savedUser.id)

        res.send({accessToken, refreshToken})
        
    } catch(error){
        if(error.isJoi) error.status = 422
        next(error)
    }
})


router.post('/login', async (req, res, next) => {
    try{
        const result = await authSchema.validateAsync(req.body)
        const user = await User.findOne({ email: result.email })

        if (!user) throw createError.NotFound("User not registered")
        const accessToken = await signAccessToken(user.id)
        const refreshToken = await signRefreshToken(user.id)
        res.send({accessToken, refreshToken})
    } catch(error) {
        if(error.isJoi) return next(createError.BadRequest('Invalid Username/Password'))
        next(error)
    }
})


router.post('/refresh-token', async (req, res, next) => {
    try{
        const { refreshToken } = req.body
        if(!refreshToken) throw createError.BadRequest()
        const userId = await verifyRefreshToken(refreshToken)

        const accessToken =  await signAccessToken(userId);
        const refreshedToken = await signRefreshToken(accessToken)
        res.send({accessToken: accessToken, refreshToken: refreshedToken})
    }
    catch(err){
        next(err)
    }
})

router.post('/logout', async (req, res, next) => {
    try{
        const { refreshToken } = req.body
        if(!refreshToken) throw createError.BadRequest()

        const userId = await verifyRefreshToken(refreshToken)
        client.DELETE(userId, (err, val) => {
            if(err) throw createError.InternalServerError();

            res.sendStatus(204);
        })
    } catch (err) {
        next(err)
    }
})

module.exports = router