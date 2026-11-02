import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { addWorkspaceAssets } from './workspace-assets.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function initScene({skills,projects,onSkillSelect,onPageChange,elements,onOpenTextView,onOpenContact}) {
  const canvas=document.querySelector('#scene');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');
  let selected=0,page=0,highlight=-1,phonePage='home',phoneFocus='',phoneStatus='',renderDirty=true;
  let consent='denied';try{consent=localStorage.getItem('philippe-consent')||'denied';}catch{}
  // Optional integrations are only started after explicit permission on the phone.
  const optionalIntegrations=[];if(consent==='accepted')optionalIntegrations.forEach(start=>start());
  try {
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
    const pixelRatio=()=>Math.min(devicePixelRatio,2,Math.sqrt(3500000/(innerWidth*innerHeight)));
    renderer.setPixelRatio(pixelRatio());renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,100);
    const environment=new RoomEnvironment();
    // Tint the studio reflection sources as well as the direct lights so metal
    // and glass pick up the same warm surroundings as the rest of the desk.
    environment.traverse(object=>{if(object.isLight)object.color.set(0xffe4c4);if(object.material?.emissiveIntensity>0)object.material.emissive.set(0xffe8d1);});
    const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(environment,.08).texture;scene.environmentIntensity=.2;environment.dispose();pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xffdfbc,0x30251f,.85));
    const sun=new THREE.DirectionalLight(0xffc995,2.35);sun.position.set(-4,8,5);sun.castShadow=true;const shadowSize=coarse.matches?1024:2048;sun.shadow.mapSize.set(shadowSize,shadowSize);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.1,far:30});sun.shadow.bias=-.00025;sun.shadow.normalBias=.025;scene.add(sun);
    const rim=new THREE.DirectionalLight(0xffd4a6,.42);rim.position.set(5,4,-6);scene.add(rim);
    const lampLight=new THREE.PointLight(0xffbd75,5.5,4.5,2);lampLight.position.set(-2.35,2.05,-1.35);scene.add(lampLight);
    const mat=(color,options={})=>new THREE.MeshStandardMaterial({color,roughness:.75,...options});
    const ink=mat(0x171f1e),black=mat(0x283431),dark=mat(0x35433d),metal=mat(0x6c7770,{metalness:.65,roughness:.38}),ivory=mat(0xd7d3c3),paper=mat(0xe4decd),sage=mat(0x8ba491),copper=mat(0xbd8860,{metalness:.5,roughness:.4});
    function rounded(parent,w,h,d,r,material,x,y,z){const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,4,r),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
    function box(parent,w,h,d,material,x,y,z){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
    function cylinder(parent,r1,r2,h,material,x,y,z){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,32),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
    function tube(parent,points,radius,material){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,32,radius,10,false),material);mesh.castShadow=true;parent.add(mesh);return mesh;}
    function surface(w,h,draw){const source=document.createElement('canvas');source.width=w;source.height=h;const ctx=source.getContext('2d');const texture=new THREE.CanvasTexture(source);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());const refresh=()=>{draw(ctx,w,h);texture.needsUpdate=true;renderDirty=true;};refresh();return {texture,refresh};}
    function text(c,value,x,y,size,color='#eaf3e8',weight='400',font='system-ui'){c.fillStyle=color;c.font=`${weight} ${size}px ${font}`;c.fillText(value,x,y);}
    function lines(c,value,x,y,max,size,color='#eaf3e8',lineHeight=1.35,weight='400'){c.font=`${weight} ${size}px system-ui`;c.fillStyle=color;let line='';for(const word of value.split(' ')){const next=line?`${line} ${word}`:word;if(c.measureText(next).width>max&&line){c.fillText(line,x,y);y+=size*lineHeight;line=word;}else line=next;}if(line)c.fillText(line,x,y);return y+size*lineHeight;}
    const woodMap=surface(1024,512,(c,w,h)=>{c.fillStyle='#88684c';c.fillRect(0,0,w,h);let seed=73;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};for(let i=0;i<1100;i++){const y=rand()*h;c.strokeStyle=`rgba(${rand()>.5?'40,25,14':'235,198,147'},${.015+rand()*.06})`;c.lineWidth=.4+rand()*2;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(w*.33,y+rand()*8-4,w*.7,y+rand()*10-5,w,y+rand()*6-3);c.stroke();}}).texture;
    const wood=mat(0xffffff,{map:woodMap,roughness:.8}),room=new THREE.Group();scene.add(room);
    // Keep the room in shadow while allowing a muted pool of light behind the desk.
    const wallMap=surface(1024,512,(c,w,h)=>{c.fillStyle='#0f2719';c.fillRect(0,0,w,h);const glow=c.createRadialGradient(w*.48,h*.56,0,w*.48,h*.56,w*.23);glow.addColorStop(0,'#1b412a');glow.addColorStop(.55,'#143522');glow.addColorStop(1,'#0f2719');c.fillStyle=glow;c.fillRect(0,0,w,h);}).texture;
    box(room,30,.1,30,mat(0x101e17,{roughness:1}),0,-1.68,0);box(room,30,10,.16,mat(0xffffff,{map:wallMap,roughness:1}),0,2.7,-4.4);rounded(room,7.15,.25,4.35,.07,wood,0,0,0);rounded(room,7.18,.055,4.38,.04,wood,0,.15,0);
    for(const x of [-3.05,3.05])for(const z of [-1.75,1.75])rounded(room,.17,1.65,.17,.04,ink,x,-.85,z);
    rounded(room,4.1,.035,1.8,.1,mat(0x344940,{roughness:1}),-.1,.2,.55);
    // Soft contact shading supplements the cast shadows where objects meet the desk.
    const contactMap=surface(256,256,(c,w,h)=>{const gradient=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);gradient.addColorStop(0,'rgba(20,13,9,.38)');gradient.addColorStop(.45,'rgba(20,13,9,.2)');gradient.addColorStop(1,'rgba(20,13,9,0)');c.fillStyle=gradient;c.fillRect(0,0,w,h);}).texture;
    const contactMaterial=new THREE.MeshBasicMaterial({map:contactMap,transparent:true,depthWrite:false,toneMapped:false});
    function contactShadow(x,z,w,d,y=.221){const shadow=new THREE.Mesh(new THREE.PlaneGeometry(w,d),contactMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.set(x,y,z);shadow.renderOrder=1;room.add(shadow);}
    contactShadow(-.4,-1.305,1.6,1.3,.179);contactShadow(-2.75,-1.5,.9,.9,.179);contactShadow(.95,-1.3,1.35,.95,.179);
    contactShadow(-.47,.48,2.85,1.25);contactShadow(1.1,.4,.9,1.1);contactShadow(2.15,.98,1.9,1.7);contactShadow(-2.18,.95,1,1.45);contactShadow(-2.4,-.15,.75,.7,.179);contactShadow(2.75,-1.45,.9,.9,.179);
    // The introduction is drawn into the monitor's own screen texture.
    const monitorSurface=surface(2048,1152,(c,w,h)=>{
      c.fillStyle='#17261f';c.fillRect(0,0,w,h);c.fillStyle='#263a2d';c.fillRect(0,0,w,100);
      text(c,'Philippe Saxer',76,70,innerWidth<innerHeight?55:40,'#d7efdc','700');
      if(innerWidth<innerHeight){
        text(c,'Hallo, ich bin Philippe!',90,230,122,'#eaf4e9','700');
        let y=350;y=lines(c,'Lernender Informatiker EFZ Fachrichtung Applikationsentwicklung.',90,y,1840,74,'#d6e6d7',1.25)+45;
        y=lines(c,'Ich lerne bei der Migros und an der BMZ und möchte digitale Ideen zum Leben erwecken.',90,y,1840,74,'#d6e6d7',1.25)+65;
        text(c,'10 Projekte  /  8 Bereiche',90,y,75,'#bde9c0','700');
        text(c,'SCROLLEN, UM MEHR ZU ENTDECKEN',90,920,46,'#abc8b0','700');c.fillStyle='#345a3e';c.fillRect(90,970,700,130);text(c,'INHALTE LESEN  ↗',130,1055,54,'#f1f8ee','700');return;
      }
      text(c,'ÜBER MICH',130,205,31,'#a9d4b1','700');text(c,'Hallo, ich bin',130,345,96,'#f1f6ec','700');text(c,'Philippe!',130,455,110,'#bde9c0','700');
      c.fillStyle='#a5d4ad';c.fillRect(130,495,215,8);
      let y=575;y=lines(c,'Lernender Informatiker EFZ Fachrichtung Applikationsentwicklung.',130,y,1150,43,'#d6e6d7',1.4)+40;
      lines(c,'Ich lerne bei der Migros und an der BMZ und möchte digitale Ideen zum Leben erwecken.',130,y,1150,40,'#c5d9c8',1.4);
      c.fillStyle='#2f4937';c.fillRect(1430,220,465,680);text(c,'MEIN WEG',1480,292,30,'#b2d9b9','700');
      text(c,'10',1480,405,76,'#f2f7ed','700');text(c,'PROJEKTE',1580,405,26,'#d3e7d4','700');text(c,'8',1480,515,76,'#f2f7ed','700');text(c,'BEREICHE',1580,515,26,'#d3e7d4','700');text(c,'16',1480,625,76,'#f2f7ed','700');text(c,'JAHRE',1580,625,26,'#d3e7d4','700');text(c,'2.',1480,735,76,'#f2f7ed','700');text(c,'LEHRJAHR',1580,735,26,'#d3e7d4','700');
      c.fillStyle='#416a4a';c.fillRect(1470,790,385,78);text(c,'INHALTE LESEN  ↗',1493,840,28,'#f1f8ee','700');
      text(c,'SCROLLEN, UM DEN ARBEITSPLATZ ZU ERKUNDEN',130,1040,27,'#abc8b0','700');
    });
    const monitor=new THREE.Group();monitor.name='monitor';room.add(monitor);
    // The base reaches the rear support and rests directly on the desktop.
    rounded(monitor,1.15,.1125,.98,.04,ink,-.4,.23375,-1.305);
    rounded(monitor,.23,.035,.23,.015,dark,-.4,.3,-1.65);
    rounded(monitor,.13,.72,.14,.03,metal,-.4,.6,-1.65);
    rounded(monitor,2.8,1.66,.15,.07,ink,-.4,1.48,-1.52);const screen=new THREE.Mesh(new THREE.PlaneGeometry(2.63,1.48),new THREE.MeshBasicMaterial({map:monitorSurface.texture}));screen.position.set(-.4,1.49,-1.435);monitor.add(screen);const glass=new THREE.Mesh(new THREE.PlaneGeometry(2.63,1.48),new THREE.MeshPhysicalMaterial({color:0xd6eee0,transparent:true,opacity:.035,roughness:.18,metalness:.12,depthWrite:false}));glass.position.set(-.4,1.49,-1.431);monitor.add(glass);rounded(monitor,.42,.035,.04,.015,ink,-.4,2.32,-1.46);cylinder(monitor,.025,.025,.012,mat(0xa4eab7,{emissive:0x72d994,emissiveIntensity:.6}),.83,.73,-1.43);
    // Printed keycaps and the small hardware display form the skills interface.
    const keyboard=new THREE.Group();keyboard.name='keyboard';room.add(keyboard);rounded(keyboard,2.45,.14,.91,.07,ink,-.47,.29,.48);
    const labels=skills.map(skill=>surface(256,256,c=>{c.clearRect(0,0,256,256);c.textAlign='center';text(c,skill[0],128,157,74,'#20382b','700');}));
    const keys=[];for(let row=0;row<4;row++)for(let col=0;col<8;col++){const index=col;const km=mat((row===0&&col%4===0)?0x94b5a1:0xc7c9bc,{emissive:0x9de9af,emissiveIntensity:0,roughness:.5});const x=-1.415+col*.27,z=.18+row*.195;const key=rounded(keyboard,.23,.095,.16,.018,km,x,.4,z);key.userData.skill=index;keys.push(key);const label=new THREE.Mesh(new THREE.PlaneGeometry(.205,.14),new THREE.MeshBasicMaterial({map:labels[index].texture,transparent:true,depthWrite:false}));label.rotation.x=-Math.PI/2;label.position.set(x,.451,z);keyboard.add(label);}
    const skillDisplay=surface(1400,420,(c,w,h)=>{
      c.fillStyle='#10251a';c.fillRect(0,0,w,h);text(c,'TASTE WÄHLEN  /  PROJEKTE ENTDECKEN',45,65,42,'#b8e1bf','700');
      text(c,skills[selected][0],45,250,110,'#f5fbf2','700');
      text(c,skills[selected][1],390,155,65,'#e0f4e2','700');
      const names=projects.filter(project=>project[1]===skills[selected][2]).map(project=>project[0]);
      text(c,'PROJEKTE:',390,230,42,'#b8e1bf','700');lines(c,names.join('  /  '),390,305,960,60,'#f1f8ee',1.1);
    });
    rounded(room,2.15,.065,.61,.035,ink,-.47,.24,-.29);const skillScreen=new THREE.Mesh(new THREE.PlaneGeometry(2.02,.53),new THREE.MeshBasicMaterial({map:skillDisplay.texture}));skillScreen.rotation.x=-Math.PI/2;skillScreen.position.set(-.47,.277,-.29);room.add(skillScreen);
    let skillDisplayInitialized=false;
    function selectSkill(index){if(selected===index&&skillDisplayInitialized)return;selected=index;skillDisplayInitialized=true;keys.forEach(key=>{key.material.emissiveIntensity=key.userData.skill===index?.8:0;});skillDisplay.refresh();onSkillSelect(index);}
    // A real mouse and a small circuit board.
    const mouse=new THREE.Group();mouse.name='mouse';room.add(mouse);
    const mouseShell=new THREE.Mesh(new THREE.SphereGeometry(.3,48,32),mat(0x293b33,{roughness:.32,metalness:.12}));mouseShell.scale.set(.82,.42,1.28);mouseShell.position.set(1.10,.35,.40);mouseShell.castShadow=true;mouse.add(mouseShell);
    const mouseBase=new THREE.Mesh(new THREE.SphereGeometry(.3,40,24),ink);mouseBase.scale.set(.84,.15,1.3);mouseBase.position.set(1.10,.28,.40);mouseBase.castShadow=true;mouse.add(mouseBase);
    tube(mouse,[[1.10,.464,.09],[1.10,.479,.2],[1.10,.48,.29]],.004,ink);rounded(mouse,.037,.035,.13,.016,metal,1.10,.48,.27);rounded(mouse,.035,.04,.12,.015,black,.86,.35,.36);
    // The mouse cord enters a visible socket on the back of the monitor.
    tube(room,[[1.10,.37,.02],[1.18,.27,-.25],[1.29,.235,-.72],[1.30,.24,-1.26],[1.16,.26,-1.70],[.86,.42,-1.72],[.86,.84,-1.62]],.013,ink);
    rounded(monitor,.12,.11,.07,.015,black,.86,.84,-1.64);
    rounded(room,.68,.06,.46,.025,sage,1.8,.26,-.55);for(let i=0;i<3;i++)rounded(room,.12,.07,.12,.015,ink,1.57+i*.21,.32,-.55);for(let i=0;i<6;i++)box(room,.025,.025,.1,copper,1.56+i*.1,.31,-.36);
    // Three projects per physical notebook page. Page corners and entries are raycast targets.
    const notebookSurface=surface(1600,1400,(c,w,h)=>{
      c.fillStyle='#e9e0ca';c.fillRect(0,0,w,h);c.fillStyle='#526e59';c.fillRect(0,0,w,25);
      text(c,'PROJEKTNOTIZEN',95,130,47,'#294b34','700');text(c,`${page+1} / 4`,1360,130,43,'#294b34','700');text(c,'Was ich bisher gebaut habe.',95,215,66,'#172d20','700');
      c.strokeStyle='#b9b9a4';c.lineWidth=3;
      for(let i=0;i<3;i++){
        const y=300+i*300;const index=page*3+i;const project=projects[index];if(!project)continue;
        if(highlight===index){c.fillStyle='#c8d9bd';c.fillRect(75,y-45,1450,275);}
        text(c,String(index+1).padStart(2,'0'),100,y+30,48,'#355a3b','700');
        text(c,project[0],200,y+30,66,'#172d20','700');text(c,project[1].toUpperCase(),200,y+90,39,'#355a3b','700');
        lines(c,project[2],200,y+157,1190,50,'#203429',1.25,'600');
        c.beginPath();c.moveTo(95,y+245);c.lineTo(1500,y+245);c.stroke();
      }
      text(c,'←  VORHERIGE',100,1335,42,'#254c32','700');text(c,'NÄCHSTE  →',1160,1335,42,'#254c32','700');
    });
    const notebook=new THREE.Group();notebook.name='notebook';room.add(notebook);rounded(notebook,1.5,.1,1.34,.025,mat(0x526a5a),2.15,.28,.98);rounded(notebook,1.42,.035,1.26,.015,paper,2.15,.35,.98);const note=new THREE.Mesh(new THREE.PlaneGeometry(1.34,1.18),new THREE.MeshStandardMaterial({map:notebookSurface.texture,roughness:1}));note.rotation.x=-Math.PI/2;note.position.set(2.15,.373,.98);notebook.add(note);
    for(let i=0;i<4;i++)box(notebook,1.39,.003,1.22,mat(i%2?0xcfc8b7:0xe1dac8),2.15,.32+i*.007,.98);
    rounded(notebook,.035,.012,1.28,.008,mat(0x354d3d),1.46,.374,.98);box(notebook,.09,.008,.24,mat(0x9e735c),2.57,.325,1.67);
    function setPage(value){page=THREE.MathUtils.clamp(value,0,3);highlight=-1;notebookSurface.refresh();onPageChange(page);}
    function showProject(index){page=Math.floor(index/3);highlight=index;notebookSurface.refresh();onPageChange(page);}
    // Sticky notes are mounted on the board behind the desk.
    const board=new THREE.Group();board.name='notes';room.add(board);rounded(board,2.16,1.15,.08,.04,mat(0x5d5848),2.17,1.45,-2.04);
    const notes=[
      ['PROGRAMMIEREN','Ich programmiere gerne und verbringe viel Zeit mit dem Schreiben von Code.'],
      ['KI UND LERNEN','Ich interessiere mich stark für Künstliche Intelligenz (KI), Prompt Engineering und Machine Learning.'],
      ['VIDEOSPIELE','Ich spiele gerne Videospiele und interessiere mich auch für deren Entwicklung.']
    ];
    notes.forEach((entry,i)=>{
      const x=1.49+i*.68;rounded(board,.58,.74,.025,.01,mat(i===1?0xe1c995:0xd2ddac),x,1.49,-1.985);
      const noteMap=surface(512,640,(c,w,h)=>{c.fillStyle=i===1?'#e5d2a6':'#dce5b8';c.fillRect(0,0,w,h);text(c,entry[0],38,115,47,'#314a31','700');lines(c,entry[1],38,205,435,41,'#334c33',1.28);});
      const face=new THREE.Mesh(new THREE.PlaneGeometry(.54,.7),new THREE.MeshStandardMaterial({map:noteMap.texture,roughness:1}));face.position.set(x,1.49,-1.966);board.add(face);
    });
    // Phone display doubles as the contact form and privacy settings surface.
    const legal={impressum:['IMPRESSUM','Philippe Saxer','Kontakt: philippesaxer8@gmail.com','Persönliches Portfolio.'],datenschutz:['DATENSCHUTZ','Keine externen Schriftarten oder Analyse-Dienste.','Deine Wahl wird lokal gespeichert.','E-Mails werden in deinem E-Mail-Programm erstellt.'],nutzung:['NUTZUNG','Dieses Portfolio informiert über Projekte und Erfahrungen.','Rechte Dritter bleiben bei den jeweiligen Rechteinhabern.']};
    const currentPhoneTime=()=>{const now=new Date();return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;};
    let phoneTime=currentPhoneTime();
    const phoneSurface=surface(1024,1800,(c,w,h)=>{
      c.fillStyle='#e8f3e8';c.fillRect(0,0,w,h);
      text(c,phoneTime,70,96,56,'#102a1b','700');text(c,'● ● ●',790,96,35,'#102a1b','700');c.fillStyle='#9dbba3';c.fillRect(65,145,894,3);
      if(phonePage==='home'){
        text(c,'HALLO!',70,260,55,'#21462d','700');text(c,'Schreib mir.',70,375,100,'#102a1b','700');
        text(c,'philippesaxer8@gmail.com',70,500,57,'#102a1b','700');
        c.fillStyle='#163a23';c.fillRect(70,700,880,150);text(c,'NACHRICHT SCHREIBEN  ↗',105,797,49,'#ffffff','700');
        c.fillStyle='#c1dfc5';c.fillRect(70,885,880,130);text(c,'NEUIGKEITEN ANFRAGEN  ↗',105,965,47,'#102a1b','700');
        text(c,'IMPRESSUM',70,1165,52,'#173d23','700');text(c,'DATENSCHUTZ',70,1260,52,'#173d23','700');text(c,'NUTZUNG',70,1355,52,'#173d23','700');
        text(c,'DATENSCHUTZ-EINSTELLUNGEN',70,1450,46,'#173d23','700');text(c,'Tippe auf eine Zeile.',70,1620,48,'#254b30','600');
      }else if(phonePage==='form'||phonePage==='newsletter'){
        text(c,'←  ZURÜCK',70,240,49,'#173d23','700');text(c,phonePage==='form'?'NACHRICHT':'NEUIGKEITEN',70,340,65,'#102a1b','700');
        const fields=phonePage==='form'?[['name','NAME'],['email','E-MAIL'],['message','NACHRICHT']]:[['newsletter','E-MAIL']];
        fields.forEach(([key,label],i)=>{const y=430+i*260;c.fillStyle=phoneFocus===key?'#abd5b3':'#c9e1cc';c.fillRect(70,y,880,205);text(c,label,105,y+60,48,'#173d23','700');const value=elements[key].value||'Antippen und schreiben';c.save();c.beginPath();c.rect(100,y+80,810,115);c.clip();lines(c,value,105,y+140,800,57,'#102a1b',1.15);c.restore();});
        const buttonY=phonePage==='form'?1250:760;c.fillStyle='#163a23';c.fillRect(70,buttonY,880,140);if(phoneFocus==='submit'){c.strokeStyle='#82b88c';c.lineWidth=10;c.strokeRect(75,buttonY+5,870,130);}text(c,'E-MAIL VORBEREITEN  ↗',105,buttonY+90,48,'#ffffff','700');
        if(phoneStatus)lines(c,phoneStatus,70,buttonY+205,880,41,'#173d23');
      }else if(phonePage==='privacy'){
        text(c,'←  ZURÜCK',70,240,49,'#173d23','700');text(c,'PRIVATSPHÄRE',70,350,65,'#102a1b','700');
        lines(c,'Es sind keine Analyse- oder Werbedienste aktiv. Optionale Technologien benötigen deine Zustimmung.',70,450,870,48,'#173d23',1.3);
        text(c,`AKTUELL: ${consent==='accepted'?'ERLAUBT':'ABGELEHNT'}`,70,790,48,'#173d23','700');
        c.fillStyle='#163a23';c.fillRect(70,900,880,130);text(c,'OPTIONALE ERLAUBEN',110,980,47,'#ffffff','700');
        c.fillStyle='#c1dfc5';c.fillRect(70,1070,880,130);text(c,'NUR NOTWENDIGE',110,1150,47,'#102a1b','700');
      }else{
        const item=legal[phonePage];text(c,'←  ZURÜCK',70,240,49,'#173d23','700');text(c,item[0],70,350,64,'#102a1b','700');
        let y=460;for(const value of item.slice(1)){y=lines(c,value,70,y,875,50,'#173d23',1.3)+50;}
      }
    });
    let phoneClockTimer;
    function updatePhoneClock(){
      clearTimeout(phoneClockTimer);const current=currentPhoneTime();
      if(current!==phoneTime){phoneTime=current;phoneSurface.refresh();}
      const now=new Date();const untilNextMinute=60000-now.getSeconds()*1000-now.getMilliseconds();
      phoneClockTimer=setTimeout(updatePhoneClock,Math.max(100,untilNextMinute+50));
    }
    updatePhoneClock();document.addEventListener('visibilitychange',()=>{if(!document.hidden)updatePhoneClock();});
    const phone=new THREE.Group();phone.name='phone';room.add(phone);rounded(phone,.66,.09,1.12,.09,ink,-2.18,.29,.95);const phoneScreen=new THREE.Mesh(new THREE.PlaneGeometry(.58,1.02),new THREE.MeshBasicMaterial({map:phoneSurface.texture,toneMapped:false}));phoneScreen.rotation.x=-Math.PI/2;phoneScreen.position.set(-2.18,.342,.95);phone.add(phoneScreen);rounded(phone,.1,.018,.018,.008,black,-2.18,.355,.48);rounded(phone,.065,.018,.018,.008,metal,-2.03,.355,.48);rounded(phone,.025,.035,.18,.01,metal,-1.84,.30,.78);
    function setPhonePage(value,focus=''){phonePage=value;phoneFocus=focus;phoneStatus='';phoneSurface.refresh();}
    function setPhoneStatus(value){phoneStatus=value;phoneSurface.refresh();}
    function setConsent(value){consent=value;try{localStorage.setItem('philippe-consent',value);}catch{}if(value==='accepted')optionalIntegrations.forEach(start=>start());const status=document.querySelector('#consent-status');if(status)status.textContent=value==='accepted'?'Optionale Technologien sind erlaubt.':'Nur notwendige Technologien sind erlaubt.';phoneSurface.refresh();}
    // The remaining objects establish a lived-in environment.
    addWorkspaceAssets(room);
    const chair=new THREE.Group();room.add(chair);rounded(chair,1.2,.2,1.05,.13,ink,-.25,-.65,2.8);rounded(chair,1.16,1.18,.18,.12,dark,-.25,.02,3.23);cylinder(chair,.085,.085,.7,metal,-.25,-1.1,2.8);rounded(chair,1.25,.08,.1,.03,ink,-.25,-1.45,2.8);rounded(chair,.1,.08,1.25,.03,ink,-.25,-1.45,2.8);for(const x of [-.84,.34]){rounded(chair,.09,.25,.09,.035,metal,x,-.42,2.85);rounded(chair,.12,.07,.65,.035,ink,x,-.26,2.75);}for(const x of [-.78,.28])for(const z of [2.27,3.33])cylinder(chair,.09,.09,.08,ink,x,-1.52,z);
    // Fine edge treatments and hardware tie the supporting objects to the same palette.
    const trim=mat(0x75857a,{metalness:.7,roughness:.32}),seam=mat(0x56675c,{roughness:.9});
    rounded(monitor,2.68,.018,.015,.007,trim,-.4,.68,-1.435);
    rounded(monitor,.19,.012,.012,.005,metal,-.4,.715,-1.428);
    rounded(keyboard,2.31,.018,.015,.006,metal,-.47,.355,.91);
    for(const x of [-1.58,.64])cylinder(keyboard,.012,.012,.008,metal,x,.368,.88);
    for(let i=0;i<7;i++)box(room,.012,.004,.18,mat(0xb8ad7c,{metalness:.65,roughness:.45}),1.53+i*.09,.296,-.55);
    for(let i=0;i<4;i++){rounded(room,.055,.035,.075,.009,black,1.5+i*.16,.315,-.73);box(room,.018,.012,.025,copper,1.5+i*.16,.337,-.73);}
    for(const x of [1.12,3.22])rounded(board,.035,1.16,.04,.008,metal,x,1.45,-1.99);
    for(const y of [.89,2.01])rounded(board,2.13,.035,.04,.008,metal,2.17,y,-1.99);
    for(const x of [-2.4,-1.96])rounded(phone,.13,.012,.012,.005,metal,x,.337,1.48);
    rounded(phone,.024,.025,.12,.009,metal,-1.839,.29,1.08);
    rounded(chair,1.02,.035,.87,.08,mat(0x3d4d43,{roughness:.9}),-.25,-.535,2.8);
    rounded(chair,.99,.95,.035,.09,mat(0x415247,{roughness:.9}),-.25,.02,3.12);
    for(const x of [-.66,.16])rounded(chair,.012,.78,.01,.005,seam,x,.02,3.095);
    for(const z of [2.48,3.12])rounded(chair,.82,.008,.012,.005,seam,-.25,-.51,z);
    for(const x of [-3.05,3.05])for(const z of [-1.75,1.75])rounded(room,.18,.05,.18,.015,metal,x,-1.62,z);
    // Camera positions look directly at each physical surface.
    const frames=[{p:[-.4,1.55,2.0],l:[-.4,1.49,-1.43]},{p:[-.47,3.05,.24],l:[-.47,.33,.18]},{p:[2.15,2.28,1.51],l:[2.15,.37,.98]},{p:[1.49,1.5,-.7],l:[1.49,1.49,-1.966]},{p:[2.17,1.5,-.7],l:[2.17,1.49,-1.966]},{p:[2.85,1.5,-.7],l:[2.85,1.49,-1.966]},{p:[-2.18,2.09,1.01],l:[-2.18,.34,.95]}];
    const progress={value:0},look=new THREE.Vector3(),position=new THREE.Vector3(),nextLook=new THREE.Vector3(),nextPosition=new THREE.Vector3();let active=0;
    function updateCamera(){let n=THREE.MathUtils.clamp(progress.value,0,6);if(reduced.matches)n=Math.round(n);const index=Math.floor(n),next=Math.min(6,index+1);let t=n-index;t=t*t*(3-2*t);active=Math.round(n);look.set(...frames[index].l).lerp(nextLook.set(...frames[next].l),t);position.set(...frames[index].p).lerp(nextPosition.set(...frames[next].p),t);if(camera.aspect<1){const base=Math.max(1,1.03/camera.aspect);const zoom=[1,1,.84,1,1,1,.44];const factor=Math.max(1,base*THREE.MathUtils.lerp(zoom[index],zoom[next],t));position.sub(look).multiplyScalar(factor).add(look);}camera.position.copy(position);camera.lookAt(look);renderDirty=true;}
    function resize(){const ratio=pixelRatio();if(renderer.getPixelRatio()!==ratio)renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=camera.aspect<1?48:38;camera.updateProjectionMatrix();monitorSurface.refresh();updateCamera();ScrollTrigger.refresh();}
    resize();
    // Animate toward the current scroll position on every device, including after large wheel steps.
    ScrollTrigger.create({trigger:'#journey',start:'top top',end:'bottom bottom',onUpdate:self=>{
      const target=self.progress*6;
      if(reduced.matches){gsap.killTweensOf(progress);progress.value=target;updateCamera();}
      else gsap.to(progress,{value:target,duration:.7,ease:'power2.out',overwrite:true,onUpdate:updateCamera});
    }});window.addEventListener('resize',resize);window.addEventListener('orientationchange',resize);
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
    function pick(event){pointer.set(event.clientX/innerWidth*2-1,-event.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);const targets=active===0?[screen]:active===1?keys:active===2?[note]:active===6?[phoneScreen]:[];return raycaster.intersectObjects(targets)[0];}
    const isMonitorButton=hit=>{if(!hit)return false;const y=1-hit.uv.y;return innerWidth<innerHeight?y>(coarse.matches?.73:.83)&&y<.97&&hit.uv.x>.03&&hit.uv.x<.4:y>.68&&y<.76&&hit.uv.x>.71&&hit.uv.x<.91;};
    canvas.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse')return;const hit=pick(event);canvas.style.cursor=hit&&(active===0?isMonitorButton(hit):active===2?1-hit.uv.y>.90:true)?'pointer':'default';if(hit&&active===1)selectSkill(hit.object.userData.skill);});
    let pointerStart=null;canvas.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY};});
    canvas.addEventListener('pointerup',event=>{if(!pointerStart||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>12){pointerStart=null;return;}pointerStart=null;const hit=pick(event);if(!hit)return;if(active===1){selectSkill(hit.object.userData.skill);return;}const y=1-hit.uv.y;if(active===0){if(isMonitorButton(hit))onOpenTextView();return;}if(active===2){if(y>.90)setPage(page+(hit.uv.x<.5?-1:1));return;}if(active!==6)return;
      if(phonePage==='home'){if(y>.25&&y<.36)window.location.href='mailto:philippesaxer8@gmail.com';else if(y>.38&&y<.57)onOpenContact(y>=.49);else if(y>.62&&y<.67)setPhonePage('impressum');else if(y>.67&&y<.72)setPhonePage('datenschutz');else if(y>.72&&y<.77)setPhonePage('nutzung');else if(y>.77&&y<.83)setPhonePage('privacy');}
      else if(y<.16)setPhonePage('home');else if(phonePage==='privacy'){if(y>.49&&y<.59)setConsent('accepted');else if(y>.59&&y<.69)setConsent('denied');}
    });
    let frame=0;
    function animate(){frame=0;if(document.hidden||document.body.classList.contains('text-view'))return;frame=requestAnimationFrame(animate);if(!renderDirty)return;renderDirty=false;renderer.render(scene,camera);}
    function syncRender(){if(document.hidden||document.body.classList.contains('text-view')){cancelAnimationFrame(frame);frame=0;}else if(!frame){renderDirty=true;frame=requestAnimationFrame(animate);}}
    document.addEventListener('visibilitychange',syncRender);window.addEventListener('scenevisibilitychange',syncRender);syncRender();selectSkill(0);onPageChange(0);
    return {available:true,selectSkill,setPage,turnPage:delta=>setPage(page+delta),showProject,setPhonePage,setPhoneStatus,setConsent,refreshPhone:()=>phoneSurface.refresh()};
  }catch(error){canvas.hidden=true;console.warn('Die 3D-Ansicht ist auf diesem Gerät nicht verfügbar.',error);return {available:false,selectSkill(){},setPage(){},turnPage(){},showProject(){},setPhonePage(){},setPhoneStatus(){},setConsent(value){try{localStorage.setItem('philippe-consent',value);}catch{}},refreshPhone(){}};}
}
