const isAdmin=async (req,res,next)=>{
    const role=req.user.role;
    if(role!=="ADMIN"){
        return res.status(403).json({error:"You are not an admin"})
    }
    return next()
}
module.exports=isAdmin;