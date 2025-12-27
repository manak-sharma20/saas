const bcrypt=require("bcryptjs");
const {PrismaClient}=require("@prisma/client");
const JWT= require("jsonwebtoken");
const prisma = new PrismaClient();



const login=async(req,res)=>{
    try{
        const{email,password}=req.body
    if(!email || !password){
        return res.status(400).json({error:"Missing credientals"})
    }
    const user= await prisma.User.findUnique({where:{email}});
    if(!user){
        return res.status(401).json({error:"Wrong email OR wrong password"});

    }
    const isValid= await bcrypt.compare(password,user.password)
    if(!isValid){
        return res.status(401).json({error:"Invalid credientanls"})
    }
    payload={id:user.id,organizationId:user.organizationId,role:user.role};
    const token=JWT.sign(payload,JWT_SECRET);
    

    return res.status(200).json({"message":"LogIn Successful",token})

}
    
    catch(err){
        res.status(500).json({"error":"Unknown error"})

    }
}
module.exports=login;
