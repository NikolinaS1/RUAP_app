const mongoose = require("mongoose");

const predictorSchema = new mongoose.Schema({
    User: { type: mongoose.Types.ObjectId, ref: "User", unique: true},
    FAVC: { type: String },
    FCVC: { type: String },
    NCP: { type: String },
    CAEC: { type: String },
    SMOKE: { type: String },
    CH20: { type: String },
    SCC: { type: String },
    FAF: { type: String },
    TUE: { type: String },
    CALC: { type: String },
    MTRANS: { type: String },
    NObeyesdad: { type: String },
});

module.exports = mongoose.model("Predictor", predictorSchema);
