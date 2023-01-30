const mongoose = require("mongoose")
mongoose.set('strictQuery', false);

/*mongoose.connect("mongodb+srv://MarijaPuskaric:<password>@ruapdb.0fnfjrr.mongodb.net/?retryWrites=true&w=majority",{
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(()=>{
    console.log("mongodb connceted");
})
.catch(()=>{
    console.log("failed to connect");
})*/

mongoose.connect("mongodb://localhost:27017/RuapDb",{
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(()=>{
    console.log("mongodb connceted");
})
.catch(()=>{
    console.log("failed to connect");
})

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
})

const collection = new mongoose.model("RUAPCollection", UserSchema)

module.exports = collection