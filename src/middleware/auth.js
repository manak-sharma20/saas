const JWT=require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const authMiddleware=async (req,res,next)=>

{

const header=req.headers.authorization;
try{
if (!header){
    return res.status(401).json({error:"missing header"})
}
if(!header.startsWith("Bearer ")){
    return res.status(401).json({error:"Invalid token"})
}
const token=header.split(" ")[1]

const decoded=JWT.verify(token,JWT_SECRET);
req.user=decoded;

next()}
catch(err){
    res.status(401).json({error:"Unauthorized"})
}}
module.exports=authMiddleware;

