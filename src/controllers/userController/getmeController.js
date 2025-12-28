const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getmeController(req,res) {
    const id=req.user.id;
    const user = await prisma.user.findUnique({
        where:{id:id},select: {
            id: true,
            email: true,
            role: true,
            organizationId: true,
            createdAt: true
          }
    })
    if(!user){
        return res.status(400).json({err:"User not found"})
    }
    return res.status(200).json(user)
}
module.exports=getmeController