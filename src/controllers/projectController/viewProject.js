const {PrismaClient}=require("@prisma/client");

const prisma = new PrismaClient();
async function getProjectsController(req, res){
    const userOrgId=req.user.organizationId;
    
    const projects = await prisma.Project.findMany({where:{organizationId:userOrgId}})
    return res.status(200).json(projects)}

module.exports=getProjectsController;

