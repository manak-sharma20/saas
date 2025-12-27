const express = require("express");
const cors = require("cors");

const app = express();
const authRoute=require("./routes/authRoutes/auth.Route")
const projectRoute=require("./routes/projectRoutes/project.Route")
const userRoute=require("./routes/userRoutes/user.Route")


app.use(cors());
app.use(express.json());
app.use("/auth",authRoute);
app.use("/projects",projectRoute);
app.use("/users",userRoute)

module.exports = app;
