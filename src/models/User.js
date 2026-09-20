import mongoose from 'mongoose';
const userSchema=new mongoose.Schema({
 username:{type:String,required:true,unique:true,trim:true,minlength:3,maxlength:24,index:true},
 email:{type:String,required:true,unique:true,lowercase:true,trim:true,index:true},
 passwordHash:{type:String,required:true,select:false},
 stats:{played:{type:Number,default:0,min:0},wins:{type:Number,default:0,min:0},losses:{type:Number,default:0,min:0},draws:{type:Number,default:0,min:0}},
 active:{type:Boolean,default:true}
},{timestamps:true,versionKey: "__v"});
userSchema.set('toJSON',{transform:(_doc,ret)=>{delete ret.passwordHash;delete ret.email;return ret;}});
export const User=mongoose.model('User',userSchema);
