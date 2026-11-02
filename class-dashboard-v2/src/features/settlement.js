// Contract for stage four. No command in stage two grants fish or settles a round.
export function validateSettlement(round) {
 const s=round.settlement, fail=()=>{throw new Error('進化結算資料不一致。');};
 if(!s||s.version!==1||!['UNSETTLED','SETTLED'].includes(s.status)) fail();
 if(s.status==='UNSETTLED') {if(s.result!==null||round.status==='COMPLETED') fail();return;}
 const result=s.result;
 if(round.status!=='COMPLETED'||round.checkins.length<round.threshold||!result||result.roundId!==round.id||result.rewardId!==`round:${round.id}`||typeof result.speciesId!=='string'||!result.speciesId||!['COMMON','RARE','LEGENDARY'].includes(result.rarity)||typeof result.settledAt!=='string'||!Number.isFinite(Date.parse(result.settledAt))||round.endedAt!==result.settledAt) fail();
}
