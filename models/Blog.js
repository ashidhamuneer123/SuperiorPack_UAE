import mongoose from 'mongoose';
const blogSchema =new mongoose.Schema ({
    title:{
        type:String,
        required:true
    },
    content:{
        type:String,
        required:true
    },
    image:{
        type: [String],
        
    },
    isDeleted: { type: Boolean, default: false }
   
},{
    timestamps:true
})

export default mongoose.model('Blog', blogSchema);