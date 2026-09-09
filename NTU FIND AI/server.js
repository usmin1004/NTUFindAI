import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {existsSync, readFileSync} from 'node:fs';
import {extname, join, normalize} from 'node:path';
import {fileURLToPath} from 'node:url';
import {items, publicItems} from './data.js';
import {matchPrompts, questionPrompts, answerPrompts} from './prompts.js';

const root=fileURLToPath(new URL('.',import.meta.url));
const publicRoot=join(root,'public');
if(existsSync(join(root,'.env'))){for(const line of readFileSync(join(root,'.env'),'utf8').split(/\r?\n/)){const match=line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^['"]|['"]$/g,'')}}
const port=Number(process.env.PORT||4173);
const model=process.env.GEMINI_MODEL||'gemini-3.8-flash';

const matchSchema={type:'object',additionalProperties:false,properties:{interpreted_query:{type:'object',additionalProperties:false,properties:{item_type:{type:'string'},color:{type:'string'},location:{type:'string'},time:{type:'string'},other_attributes:{type:'array',items:{type:'string'}}},required:['item_type','color','location','time','other_attributes']},candidates:{type:'array',maxItems:3,items:{type:'object',additionalProperties:false,properties:{record_id:{type:'string'},match_score:{type:'integer',minimum:0,maximum:100},explanation:{type:'string'}},required:['record_id','match_score','explanation']}},follow_up_question:{type:'string'}},required:['interpreted_query','candidates','follow_up_question']};
const questionSchema={type:'object',additionalProperties:false,properties:{question:{type:'string'}},required:['question']};
const answerSchema={type:'object',additionalProperties:false,properties:{strength:{type:'string',enum:['weak','medium','strong']},reason:{type:'string'},additional_question_needed:{type:'boolean'},next_question:{type:'string'},final_message:{type:'string'}},required:['strength','reason','additional_question_needed','next_question','final_message']};

function sendJson(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value))}
async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100000)throw new Error('Request is too large.')}return JSON.parse(raw||'{}')}
function chosenVariant(value){const upper=String(value||'A').toUpperCase();if(!['A','B','C'].includes(upper))throw new Error('Variant must be A, B, or C.');return upper}
function extractText(response){const text=(response.candidates||[]).flatMap(candidate=>candidate.content?.parts||[]).map(part=>part.text||'').join('').trim();if(text)return text;throw new Error('Gemini returned no usable text.')}
function geminiSchema(value){if(Array.isArray(value))return value.map(geminiSchema);if(!value||typeof value!=='object')return value;return Object.fromEntries(Object.entries(value).filter(([key])=>key!=='additionalProperties').map(([key,item])=>[key,geminiSchema(item)]))}
async function ask(instructions,input,name,schema){
  if(!process.env.GEMINI_API_KEY)throw new Error('GEMINI_API_KEY is missing. Copy .env.example to .env and add your key.');
  const endpoint=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response=await fetch(endpoint,{method:'POST',headers:{'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:instructions}]},contents:[{role:'user',parts:[{text:input}]}],generationConfig:{responseFormat:{text:{mimeType:'application/json',schema:geminiSchema(schema)}}}})});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error?.message||`Gemini API error (${response.status})`);
  try{return JSON.parse(extractText(data))}catch{throw new Error(`Gemini returned invalid JSON for ${name}.`)}
}

async function api(req,res,path){const input=await body(req);const variant=chosenVariant(input.variant);
  if(path==='/api/match'){
    const report=String(input.report||'').trim();if(!report)return sendJson(res,400,{error:'Please describe the lost item first.'});
    const result=await ask(matchPrompts[variant],`Lost-item report:\n${report}\n\nPublic found-item records:\n${JSON.stringify(publicItems)}`,'match_result',matchSchema);
    const byId=new Map(publicItems.map(item=>[item.id,item]));result.candidates=result.candidates.filter(candidate=>byId.has(candidate.record_id)).slice(0,3).map(candidate=>({...candidate,item:byId.get(candidate.record_id)}));
    return sendJson(res,200,{variant,model,...result});
  }
  const record=items.find(item=>item.id===input.recordId);if(!record)return sendJson(res,404,{error:'Selected record was not found.'});
  if(path==='/api/verify/question'){
    const result=await ask(questionPrompts[variant],`Public record:\n${JSON.stringify({...record,hidden:undefined})}\n\nPrivate verification features (server only):\n${JSON.stringify(record.hidden)}`,'verification_question',questionSchema);return sendJson(res,200,{variant,...result});
  }
  if(path==='/api/verify/answer'){
    const answer=String(input.answer||'').trim();if(!answer)return sendJson(res,400,{error:'Please enter an answer.'});
    const result=await ask(answerPrompts[variant],`Question asked:\n${String(input.question||'')}\n\nClaimant answer:\n${answer}\n\nPrivate verification features (server only):\n${JSON.stringify(record.hidden)}`,'verification_result',answerSchema);return sendJson(res,200,{variant,...result});
  }
  sendJson(res,404,{error:'Not found'});
}

const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(req.method==='POST'&&url.pathname.startsWith('/api/'))return await api(req,res,url.pathname);if(req.method!=='GET')return sendJson(res,405,{error:'Method not allowed'});const relative=url.pathname==='/'?'index.html':url.pathname.slice(1);const file=normalize(join(publicRoot,relative));if(!file.startsWith(publicRoot))return sendJson(res,403,{error:'Forbidden'});const content=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(content)}catch(error){if(error.code==='ENOENT')return sendJson(res,404,{error:'Not found'});sendJson(res,503,{error:error.message||'Unexpected server error'})}});
server.listen(port,'0.0.0.0',()=>console.log(`NTU FindAI A/B/C is running on port ${port} with ${model}.`));
