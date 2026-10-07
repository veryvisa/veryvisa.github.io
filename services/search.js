/* Static service search; shared by browser and Node acceptance tests. */
(function(root){
  "use strict";
  function normalize(value){return String(value || "").normalize("NFKC").toLowerCase().replace(/\s+/gu,"");}
  function tokens(value){
    const parts=String(value || "").normalize("NFKC").toLowerCase().match(/[\u3400-\u9fff]+|[a-z0-9]+/gu)||[];
    const out=[];
    for(const part of parts){
      if(/^[a-z0-9]+$/.test(part)||part.length<2) out.push(part);
      else for(let i=0;i<part.length-1;i++)out.push(part.slice(i,i+2));
    }
    return [...new Set(out)];
  }
  function search(index,query,limit=8){
    const q=normalize(query), ts=tokens(query);
    if(!q||!ts.length)return [];
    const weights={name:5,synonyms:4,faq:3,line:2,description:2,keywords:1};
    return index.map((row,order)=>{
      let score=0;
      for(const [field,weight] of Object.entries(weights)){
        const value=row[field], values=Array.isArray(value)?value:[value||""];
        let hit=0;
        for(const val of values){
          const text=normalize(val);if(!text)continue;
          const part=ts.filter(token=>text.includes(token)).length/ts.length;
          hit=Math.max(hit,part+(text.includes(q)?2:0));
        }
        score+=hit*weight;
      }
      const exact=[row.name,...(row.synonyms||[])].some(x=>normalize(x)===q);
      return {...row,score:score*(exact?2:1),highConfidence:exact,order};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.order-b.order).slice(0,limit);
  }
  const api={normalize,tokens,search};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.VVSearch=api;
  if(typeof document==="undefined")return;
  const form=document.querySelector("[data-service-search]"), results=document.getElementById("service-results");
  if(!form||!results)return;
  const input=form.querySelector("input[name=q]"), status=document.getElementById("search-status");
  let indexPromise;
  function getIndex(){return indexPromise||(indexPromise=fetch("/services/search-index.json").then(r=>{if(!r.ok)throw new Error("index");return r.json();}).catch(e=>{indexPromise=null;throw e;}));}
  let request=0;
  async function run(q){
    const n=++request;results.replaceChildren();
    if(!normalize(q)){status.textContent="可按下方事项或家庭处境查找。";return;}
    status.textContent="正在查找…";
    try{
      const rows=search(await getIndex(),q);if(n!==request)return;
      status.textContent=rows.length?"找到 "+rows.length+" 项结果。":"暂无匹配，可浏览下面的目录或联系说明事项。";
      for(const type of ["服务","说明页"]){
        const subset=rows.filter(x=>x.type===type);if(!subset.length)continue;
        const section=document.createElement("section"), heading=document.createElement("h2"), list=document.createElement("ul");
        heading.textContent=type;section.append(heading,list);
        for(const row of subset){
          const li=document.createElement("li"), a=document.createElement("a"), p=document.createElement("p");
          a.href=row.url;a.textContent=row.name;p.textContent=row.line||row.description||"";li.append(a,p);list.append(li);
        }
        results.append(section);
      }
    }catch(e){if(n===request)status.textContent="搜索暂时无法载入，请按下方目录查找。";}
  }
  form.addEventListener("submit",event=>{event.preventDefault();const q=input.value.trim();const url=new URL(location.href);q?url.searchParams.set("q",q):url.searchParams.delete("q");history.replaceState(null,"",url);run(q);});
  input.value=new URLSearchParams(location.search).get("q")||"";run(input.value);
})(typeof globalThis!=="undefined"?globalThis:this);
