const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  options: [String],
  required: {
    type: Boolean,
    default: false
  },
  order: Number
});

const FormSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  questions: [QuestionSchema]
}, { timestamps: true });

module.exports = mongoose.model("Form", FormSchema);