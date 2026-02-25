const Form = require("../models/Form");
const Response = require("../models/Response");

// CREATE FORM
exports.createForm = async (req, res) => {
  try {
    const { title, description } = req.body;
    const form = await Form.create({ title, description, questions: [] });
    res.status(201).json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL FORMS
exports.getAllForms = async (req, res) => {
  try {
    const forms = await Form.find().sort({ createdAt: -1 });
    res.json(forms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET SINGLE FORM
exports.getForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ADD QUESTION
exports.addQuestion = async (req, res) => {
  try {
    const { type, label, options, required } = req.body;
    const form = await Form.findById(req.params.id);
    
    if (!form) return res.status(404).json({ message: "Form not found" });

    form.questions.push({
      type,
      label,
      options: options || [],
      required: required || false,
      order: form.questions.length
    });

    await form.save();
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE QUESTION
exports.updateQuestion = async (req, res) => {
  try {
    const { formId, questionId } = req.params;
    const { type, label, options, required } = req.body;

    const form = await Form.findById(formId);
    if (!form) return res.status(404).json({ message: "Form not found" });

    const question = form.questions.id(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    if (type !== undefined) question.type = type;
    if (label !== undefined) question.label = label;
    if (options !== undefined) question.options = options;
    if (required !== undefined) question.required = required;

    await form.save();
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE QUESTION
exports.deleteQuestion = async (req, res) => {
  try {
    const { formId, questionId } = req.params;
    const form = await Form.findByIdAndUpdate(
      formId,
      { $pull: { questions: { _id: questionId } } },
      { new: true } 
    );

    if (!form) return res.status(404).json({ message: "Form not found" });
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// SUBMIT RESPONSE (With Real-Time Socket Event)
exports.submitResponse = async (req, res) => {
  try {
    const { formId } = req.params;
    const { answers } = req.body;

    const form = await Form.findById(formId);
    if (!form) return res.status(404).json({ message: "Form not found" });

    const newResponse = await Response.create({ formId, answers });

    // Emit real-time event to the specific form room
    const io = req.app.get("io"); 
    if (io) {
      io.to(formId).emit("new-response", newResponse);
    }

    res.status(201).json(newResponse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET RESPONSES
exports.getResponses = async (req, res) => {
  try {
    const { formId } = req.params;
    const responses = await Response.find({ formId }).sort({ createdAt: -1 });
    res.json(responses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};