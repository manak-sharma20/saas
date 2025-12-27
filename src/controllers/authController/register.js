const bcrypt=require("bcryptjs")
const {PrismaClient}=require("@prisma/client")
const prisma = new PrismaClient()


const register= async(req,res)=>{
    try{
    const{name,email,password}=req.body;
    if(!name||!email || !password){
        return res.status(400).json({error:"Missing credientals"})
    }
    
    
    const user=await prisma.User.findUnique({where:{email}});
    if(user){
        return res.status(409).json({error:"User already exists"})
    }
    const organization= await prisma.Organization.create({data:{name:name}});
    const id= organization.id;
    
    const hashed=await bcrypt.hash(password,10)
    const newUser=await prisma.User.create({data:{organizationId:id,email:email,password:hashed,role:"ADMIN"}})
    return res.status(201).json({"message":"User Created Successfully",id,email})




}
    catch(err){
        res.status(500).json({"error":"Unknown error"})

    }



}
module.exports=register;