const logger = require('../config/logConfig')
const systemDecisionService = require("../services/systemDecisionService")
const { buildSystemDecisionResponse } = require("../services/systemDecisionResponse")


const generateSystemDecision = async(req, res, next)=>{
    try {
        const { policyData } = req.body || {}
        let result = 'Success'
        let result1 = 'Success'

        try {
            result = await systemDecisionService.generateSystemDecision(policyData)
        } catch (err) {
            logger.warn(`generateSystemDecision: ${err.message}`)
            result = err.message
        }

        try {
            result1 = await systemDecisionService.generateSystemDecision1(policyData)
        } catch (err) {
            logger.warn(`generateSystemDecision1: ${err.message}`)
            result1 = err.message
        }

        return res.status(201).json(buildSystemDecisionResponse(policyData, result, result1))
    } catch (error) {
        logger.error("Issue in calling the service")
        next(error)
    }
}

module.exports ={
    generateSystemDecision
}