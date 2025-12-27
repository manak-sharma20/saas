const express= require("express");
const router= express.Router();
const adminMiddleware=require("../../middleware/admin_check");
const authMiddleware=require("../../middleware/auth");
const getmeController=require("../../controllers/userController/getmeController");
const inviteContoller=require("../../controllers/userController/inviteController")

router.get("/me",authMiddleware,getmeController);
router.post("/invite",authMiddleware,adminMiddleware,inviteContoller);

module.exports=router;