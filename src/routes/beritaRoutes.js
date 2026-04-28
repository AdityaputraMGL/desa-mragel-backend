const express = require("express");
const router = express.Router();
const beritaController = require("../controllers/beritaController");
const upload = require("../middleware/upload");

router.get("/", beritaController.getAllBerita);
router.get("/:id", beritaController.getBeritaById);
router.post("/", upload.single("gambar"), beritaController.createBerita);
router.put("/:id", upload.single("gambar"), beritaController.updateBerita);
router.delete("/:id", beritaController.deleteBerita);

module.exports = router;
