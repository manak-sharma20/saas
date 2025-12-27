const {PrismaClient}=require("@prisma/client");

const prisma = new PrismaClient();
async function deleteProjectController(req, res){

    const projectId = req.params.projectId
    const userOrgId = req.user.organizationId

    const project = await prisma.Project.findUnique({where:{id:projectId}})

    if (!project)
    {return res.status(404).json({error:"project not found"})}

    if (project.organizationId != userOrgId)
        return res.status(403).json({err:"Forbidden"})

    await prisma.Project.delete({where:{id:projectId}});
    return res.status(200).json({"message":"Project deleted successfully"})


}
module.exports=deleteProjectController;


