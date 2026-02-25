const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");
const Form = require("../models/Form"); 
const Response = require("../models/Response");

/* ============================================================
   0. CRITICAL BULK OPERATIONS (Top Priority)
   ============================================================ */

// DELETE all forms - MUST BE AT THE TOP
router.delete("/all", async (req, res) => {
    try {
        await Form.deleteMany({});
        await Response.deleteMany({}); 
        res.json({ message: "All data cleared successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ============================================================
   1. SPECIFIC ACTION ROUTES (High Priority)
   ============================================================ */

// --- 📥 CSV EXPORT ---
router.get("/:formId/export", async (req, res) => {
    try {
        const form = await Form.findById(req.params.formId);
        const responses = await Response.find({ formId: req.params.formId });

        if (!responses.length) {
            return res.status(404).json({ message: "No responses found to export." });
        }

        const headers = form.questions.map(q => q.label).join(",");
        const rows = responses.map(r => {
            return form.questions.map(q => {
                const answer = r.answers.find(a => a.questionId.toString() === q._id.toString());
                let val = answer ? (Array.isArray(answer.value) ? answer.value.join("; ") : answer.value) : "";
                return `"${String(val).replace(/"/g, '""')}"`; 
            }).join(",");
        }).join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=responses_${req.params.formId}.csv`);
        res.status(200).send(`${headers}\n${rows}`);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 📦 REORDER QUESTIONS ---
router.put('/:id/reorder', async (req, res) => {
  try {
    const { questionIds } = req.body;
    const form = await Form.findById(req.params.id);
    const reorderedQuestions = questionIds.map(id => 
      form.questions.find(q => q._id.toString() === id)
    );
    form.questions = reorderedQuestions;
    await form.save();
    res.json({ message: "Order updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   2. NESTED SUB-DOCUMENT ROUTES (Options)
   ============================================================ */

router.put('/:id/questions/:questionId/options', async (req, res) => {
    try {
        const { index, value } = req.body;
        const form = await Form.findById(req.params.id);
        const question = form.questions.id(req.params.questionId);
        question.options[index] = value; 
        await form.save();
        res.json({ message: "Option updated" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/questions/:questionId/options', async (req, res) => {
    try {
        const form = await Form.findById(req.params.id);
        const question = form.questions.id(req.params.questionId);
        question.options.push("New Option"); 
        await form.save();
        res.json({ message: "Option added" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/questions/:questionId/options/:optIndex', async (req, res) => {
    try {
        const form = await Form.findById(req.params.id);
        const question = form.questions.id(req.params.questionId);
        question.options.splice(req.params.optIndex, 1); 
        await form.save();
        res.json({ message: "Option deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ============================================================
   3. STANDARD CONTROLLER ROUTES
   ============================================================ */
router.post("/", formController.createForm);
router.get("/", formController.getAllForms);
router.post("/:formId/responses", formController.submitResponse);
router.get("/:formId/responses", formController.getResponses);
router.post("/:id/questions", formController.addQuestion);
router.put("/:formId/questions/:questionId", formController.updateQuestion);
router.delete("/:formId/questions/:questionId", formController.deleteQuestion);

// Catch-all MUST BE LAST
router.get("/:id", formController.getForm); 

module.exports = router;