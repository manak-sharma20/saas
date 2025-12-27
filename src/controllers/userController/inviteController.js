const {PrismaClient}=require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt= require("bcryptjs")
async function inviteContoller (req,res)
{
    const {email,password}=req.body;
    if(!email || !password){
        return res.status(401).json({err:"Missing credentials"})
    }
    if(req.user.role!=="ADMIN"){
        return res.status(403).json({err:"Forbidden"})
    }
    const user=await prisma.User.findUnique({where:{email:email}})
    if(user){
        return res.status(409).json({err:"Conflict"})
    }
    const hashed= await bcrypt.hash(password,10)
    const new_user= await prisma.User.create({data:{
        email:email,password:hashed,role:"MEMBER",organizationId : req.user.organizationId
    }})
    return res.status(201).json({"message":"Created successfully"})


}
module.exports=inviteContoller;
