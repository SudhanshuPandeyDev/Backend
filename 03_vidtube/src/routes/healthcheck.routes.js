import { Router } from "express";

import { healtcheck } from "../controllers/healthcheck.controllers.js";

const router = Router();

router.route("/").get(healtcheck);

export default router;
