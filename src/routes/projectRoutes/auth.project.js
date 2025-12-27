const express= require("express");
const router= express.Router()
const adminMiddleware=require("../../middleware/admin_check")
const authMiddleware=require("../../middleware/auth")
const createProjectController=require("../../controllers/projectController/createProject")
const deleteProjectController=require("../../controllers/projectController/deleteProject");
const getProjectsController = require("../../controllers/projectController/viewProject");

router.get("/",authMiddleware,getProjectsController);
router.post("/",authMiddleware,createProjectController);
router.delete("/:projectId",authMiddleware,adminMiddleware,deleteProjectController)

module.exports=router;