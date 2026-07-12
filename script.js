(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const ids = ["fileInput","dropZone","chooseButton","fileReady","fileName","error","endpointPreset","jsonEndpointGroup","endpoint","port","tunnelIp","dns","udp","cc","flag","name","result","copyButton","hint","status"];
  const e = Object.fromEntries(ids.map((id) => [id, $(id)]));
  let config = null, udpEnabled = true;
  const pemBody = (v="") => v.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----/g, "").replace(/\s/g, "");
  const enc = (v) => encodeURIComponent(v).replace(/%2C/gi, ",");

  function applyEndpoint() {
    const i = e.endpointPreset.value.lastIndexOf(":");
    e.endpoint.value = e.endpointPreset.value.slice(0, i);
    e.port.value = e.endpointPreset.value.slice(i + 1);
    generate();
  }
  function generate() {
    if (!config || !e.endpoint.value || !e.tunnelIp.value || !config.private_key || !config.endpoint_pub_key) {
      e.result.textContent="masque://…"; e.copyButton.disabled=true; return;
    }
    const params = [["publicKey",pemBody(config.endpoint_pub_key)],["privateKey",config.private_key.trim()],["ip",e.tunnelIp.value],["dns",e.dns.value.trim()],["udp",udpEnabled?"1":"0"],["cc",e.cc.value],["flag",e.flag.value.trim()]].map(([k,v])=>`${k}=${enc(v)}`).join("&");
    e.result.textContent=`masque://${e.endpoint.value}:${e.port.value}?${params}#${enc(e.name.value.trim()||"WARP-MASQUE")}`;
    e.copyButton.disabled=false; e.hint.textContent="已完成轉換，可以直接複製並匯入 Shadowrocket。"; e.status.textContent="準備就緒"; e.status.classList.add("ready");
  }
  async function load(file) {
    if (!file) return; e.error.textContent="";
    try {
      const c=JSON.parse(await file.text());
      const missing=["private_key","endpoint_pub_key","ipv4"].filter((k)=>!c[k]);
      if(missing.length) throw new Error(`缺少必要欄位：${missing.join(", ")}`);
      config=c; e.tunnelIp.value=c.ipv4; e.fileName.textContent=file.name; e.fileReady.hidden=false;
      if(c.endpoint_v4){ e.jsonEndpointGroup.hidden=false; e.jsonEndpointGroup.innerHTML=""; const o=document.createElement("option"); o.value=`${c.endpoint_v4}:443`; o.textContent=`${c.endpoint_v4}:443（JSON）`; e.jsonEndpointGroup.appendChild(o); }
      generate();
    } catch(err) { config=null; e.fileReady.hidden=true; e.error.textContent=err instanceof Error?err.message:"無法解析 JSON"; generate(); }
  }
  e.endpointPreset.addEventListener("change",applyEndpoint); applyEndpoint();
  e.chooseButton.addEventListener("click",(x)=>{x.stopPropagation();e.fileInput.click()}); e.dropZone.addEventListener("click",()=>e.fileInput.click());
  e.dropZone.addEventListener("keydown",(x)=>{if(x.key==="Enter"||x.key===" ")e.fileInput.click()}); e.fileInput.addEventListener("change",()=>load(e.fileInput.files[0]));
  e.dropZone.addEventListener("dragover",(x)=>{x.preventDefault();e.dropZone.classList.add("dragging")}); e.dropZone.addEventListener("dragleave",()=>e.dropZone.classList.remove("dragging"));
  e.dropZone.addEventListener("drop",(x)=>{x.preventDefault();e.dropZone.classList.remove("dragging");load(x.dataTransfer.files[0])});
  e.udp.addEventListener("click",()=>{udpEnabled=!udpEnabled;e.udp.classList.toggle("on",udpEnabled);e.udp.setAttribute("aria-checked",String(udpEnabled));generate()});
  [e.dns,e.cc,e.flag,e.name].forEach((x)=>x.addEventListener("input",generate));
  e.copyButton.addEventListener("click",async()=>{await navigator.clipboard.writeText(e.result.textContent);const old=e.copyButton.innerHTML;e.copyButton.innerHTML="✓<br><strong>已複製</strong>";setTimeout(()=>e.copyButton.innerHTML=old,1500)});
})();
