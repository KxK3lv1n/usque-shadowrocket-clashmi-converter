(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const ids = ["fileInput","dropZone","chooseButton","fileReady","fileName","error","endpointIp","endpointPort","tunnelIp","dns","udp","cc","flag","name","result","copyButton","hint","status","shadowrocketTab","clashTab","shadowrocketPanel","clashPanel","clashHint","clashStatus","yamlPreview","downloadYamlButton"];
  const e = Object.fromEntries(ids.map((id) => [id, $(id)]));
  let config = null, udpEnabled = true, clashYaml = "";
  const pemBody = (v="") => v.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----/g, "").replace(/\s/g, "");
  const enc = (v) => encodeURIComponent(v).replace(/%2C/gi, ",");

  function applyEndpoint() { generate(); }
  function applyJsonEndpoint(value) {
    e.endpointIp.querySelectorAll("option[data-json-endpoint]").forEach((option)=>option.remove());
    e.endpointPort.querySelectorAll("option[data-json-port]").forEach((option)=>option.remove());
    const raw=String(value||"").trim().replace(/^https?:\/\//i,"");
    const match=raw.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::(\d+))?$/);
    if(!match)return;
    const [,ip,jsonPort]=match;
    if(!Array.from(e.endpointIp.options).some((option)=>option.value===ip)){
      const option=document.createElement("option");option.value=ip;option.textContent=`${ip}（JSON Endpoint）`;option.dataset.jsonEndpoint="true";e.endpointIp.prepend(option);
    }
    e.endpointIp.value=ip;
    if(jsonPort){
      if(!Array.from(e.endpointPort.options).some((option)=>option.value===jsonPort)){
        const option=document.createElement("option");option.value=jsonPort;option.textContent=`${jsonPort}（JSON Port）`;option.dataset.jsonPort="true";e.endpointPort.prepend(option);
      }
      e.endpointPort.value=jsonPort;
    }
  }
  function generate() {
    if (!config || !e.endpointIp.value || !e.tunnelIp.value || !config.private_key || !config.endpoint_pub_key) {
      e.result.textContent="masque://…"; e.copyButton.disabled=true; e.yamlPreview.textContent="# 等待載入 Usque JSON…"; e.downloadYamlButton.disabled=true; return;
    }
    const params = [["publicKey",pemBody(config.endpoint_pub_key)],["privateKey",config.private_key.trim()],["ip",e.tunnelIp.value],["dns",e.dns.value.trim()],["udp",udpEnabled?"1":"0"],["cc",e.cc.value],["flag",e.flag.value.trim()]].map(([k,v])=>`${k}=${enc(v)}`).join("&");
    e.result.textContent=`masque://${e.endpointIp.value}:${e.endpointPort.value}?${params}#${enc(e.name.value.trim()||"WARP-MASQUE")}`;
    e.copyButton.disabled=false; e.hint.textContent="已完成轉換，可以直接複製並匯入 Shadowrocket。"; e.status.textContent="準備就緒"; e.status.classList.add("ready");
    const clashDns=e.dns.value.split(/[\s,]+/).filter(Boolean).join(", ");
    clashYaml=window.MIHOMO_MASQUE_TEMPLATE.replace(/^(\s{4}server:)\s*.*$/m,`$1 ${e.endpointIp.value}`).replace(/^(\s{4}port:)\s*.*$/m,`$1 ${e.endpointPort.value}`).replace(/^(\s{4}private-key:)\s*.*$/m,`$1 ${config.private_key.trim()}`).replace(/^(\s{4}public-key:)\s*.*$/m,`$1 ${pemBody(config.endpoint_pub_key)}`).replace(/^(\s{4}ip:)\s*.*$/m,`$1 ${e.tunnelIp.value}`).replace(/^(\s{4}udp:)\s*.*$/m,`$1 ${udpEnabled}`).replace(/^(\s{4}remote-dns-resolve:)\s*.*$/m,"$1 true").replace(/^(\s{4}dns:)\s*.*$/m,`$1 [ ${clashDns} ]`);
    e.yamlPreview.textContent=clashYaml; e.downloadYamlButton.disabled=false; e.clashHint.textContent="已套用目前 Endpoint 與 usque 金鑰，可直接下載並匯入 Clash Mi。"; e.clashStatus.textContent="準備就緒"; e.clashStatus.classList.add("ready");
  }
  async function load(file) {
    if (!file) return; e.error.textContent="";
    try {
      const c=JSON.parse(await file.text());
      const missing=["private_key","endpoint_pub_key","ipv4"].filter((k)=>!c[k]);
      if(missing.length) throw new Error(`缺少必要欄位：${missing.join(", ")}`);
      config=c; e.tunnelIp.value=c.ipv4; e.fileName.textContent=file.name; e.fileReady.hidden=false;
      applyJsonEndpoint(c.endpoint_v4);
      generate();
    } catch(err) { config=null; e.fileReady.hidden=true; e.error.textContent=err instanceof Error?err.message:"無法解析 JSON"; generate(); }
  }
  e.endpointIp.addEventListener("change",applyEndpoint); e.endpointPort.addEventListener("change",applyEndpoint); applyEndpoint();
  function showPlatform(platform){const clash=platform==="clash";e.shadowrocketPanel.hidden=clash;e.clashPanel.hidden=!clash;e.shadowrocketTab.classList.toggle("active",!clash);e.clashTab.classList.toggle("active",clash)}
  e.shadowrocketTab.addEventListener("click",()=>showPlatform("shadowrocket"));e.clashTab.addEventListener("click",()=>showPlatform("clash"));
  e.chooseButton.addEventListener("click",(x)=>{x.stopPropagation();e.fileInput.click()}); e.dropZone.addEventListener("click",()=>e.fileInput.click());
  e.dropZone.addEventListener("keydown",(x)=>{if(x.key==="Enter"||x.key===" ")e.fileInput.click()}); e.fileInput.addEventListener("change",()=>load(e.fileInput.files[0]));
  e.dropZone.addEventListener("dragover",(x)=>{x.preventDefault();e.dropZone.classList.add("dragging")}); e.dropZone.addEventListener("dragleave",()=>e.dropZone.classList.remove("dragging"));
  e.dropZone.addEventListener("drop",(x)=>{x.preventDefault();e.dropZone.classList.remove("dragging");load(x.dataTransfer.files[0])});
  e.udp.addEventListener("click",()=>{udpEnabled=!udpEnabled;e.udp.classList.toggle("on",udpEnabled);e.udp.setAttribute("aria-checked",String(udpEnabled));generate()});
  [e.dns,e.cc,e.flag,e.name].forEach((x)=>x.addEventListener("input",generate));
  e.copyButton.addEventListener("click",async()=>{await navigator.clipboard.writeText(e.result.textContent);const old=e.copyButton.innerHTML;e.copyButton.innerHTML="✓<br><strong>已複製</strong>";setTimeout(()=>e.copyButton.innerHTML=old,1500)});
  e.downloadYamlButton.addEventListener("click",()=>{if(!clashYaml)return;const blob=new Blob([clashYaml],{type:"application/yaml;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="Mihomo-Masque.yaml";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)});
})();
