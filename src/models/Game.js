import mongoose from 'mongoose';
const gameSchema=new mongoose.Schema({
 players:[{user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},symbol:{type:String,enum:['X','O'],required:true}}],
 board:{type:[String],default:['','','','','','','','',''],validate:v=>v.length===9},
 turn:{type:String,enum:['X','O'],default:'X'},status:{type:String,enum:['waiting','active','won','draw','abandoned'],default:'waiting',index:true},
 winner:{type:mongoose.Schema.Types.ObjectId,ref:'User',default:null},finishedAt:{type:Date,default:null},lastMoveAt:{type:Date,default:Date.now}
},{timestamps:true});
gameSchema.index({'players.user':1,createdAt:-1});
export const Game=mongoose.model('Game',gameSchema);
