import {taiwanParts} from './time.js?v=2.0-stage4B.0';
export function schoolDefaults(at=Date.now()) {
  const periods = [
    ['p1','第一節','08:40','09:20','LESSON'],['b1','下課','09:20','09:30','BREAK'],
    ['p2','第二節','09:30','10:10','LESSON'],['b2','下課','10:10','10:30','BREAK'],
    ['p3','第三節','10:30','11:10','LESSON'],['b3','下課','11:10','11:20','BREAK'],
    ['p4','第四節','11:20','12:00','LESSON'],['lunch','午餐','12:00','12:40','OTHER'],
    ['rest','午休','12:40','13:20','BREAK'],['p5','第五節','13:30','14:10','LESSON'],
    ['b5','下課','14:10','14:20','BREAK'],['p6','第六節','14:20','15:00','LESSON'],
    ['b6','下課','15:00','15:10','BREAK'],['p7','第七節','15:10','15:50','LESSON']
  ].map(([id,name,start,end,kind])=>({id,name,start,end,kind}));
  const {date}=taiwanParts(at),year=Number(date.slice(0,4)),month=Number(date.slice(5,7));
  return {periods,activeTermId:'initial',terms:[{id:'initial',year:year-1911-(month<8?1:0),semester:month>=2&&month<8?2:1,weekly:{},overrides:{}}]};
}
export function toolDefaults() {return {timer:{durationMs:300000,remainingMs:300000,endAt:null,status:'IDLE',generation:0},notes:[],picker:{round:1,drawn:[],lastId:null},preferences:{timerSound:true,volume:0.5}};}
