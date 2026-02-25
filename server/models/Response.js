const mongoose = require("mongoose");
console.log("EXPORT ROUTE HIT");

const AnswerSchema = new mongoose.Schema({
  questionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  value: { 
    type: mongoose.Schema.Types.Mixed, // Supports String (short answer) or Array (checkboxes)
    required: true 
  } 
});

const ResponseSchema = new mongoose.Schema({
  formId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Form', 
    required: true 
  },
  answers: [AnswerSchema]
}, { timestamps: true });

module.exports = mongoose.model("Response", ResponseSchema);