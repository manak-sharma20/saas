const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createProjectController(req, res) {
  try {
    const userOrgId = req.user.organizationId;
    const { name, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    await prisma.Project.create({
      data: {
        name: name,
        status: status || "ACTIVE",
        organizationId: userOrgId,
      },
    });

    return res.status(201).json({ message: "Project created successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = createProjectController;
