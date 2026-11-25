import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { addWorkspaceAssets } from './workspace-assets.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function initScene({skills,projects,onSkillSelect,onPageChange,onStationChange,onProgress,onOpenTextView,onOpenProject,onContextLost}) {
  const canvas=document.querySelector('#scene');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');
  let selected=0,page=0,highlight=-1,renderDirty=true;
  let frame=0;
  canvas.hidden=false;
  try {
    const invalidate=()=>{renderDirty=true;if(!frame && !document.hidden && document.body.classList.contains('immersive'))frame=requestAnimationFrame(render);};
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
    function surface(w,h,draw){const source=document.createElement('canvas');source.width=w;source.height=h;const ctx=source.getContext('2d');const texture=new THREE.CanvasTexture(source);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());const refresh=()=>{draw(ctx,w,h);texture.needsUpdate=true;invalidate();};refresh();return {texture,refresh};}
    function text(c,value,x,y,size,color='#f1f0e7',weight='400',font='system-ui'){c.fillStyle=color;c.font=`${weight} ${size}px ${font}`;c.fillText(value,x,y);}
    function lines(c,value,x,y,max,size,color='#f1f0e7',lineHeight=1.35,weight='400'){c.font=`${weight} ${size}px system-ui`;c.fillStyle=color;let line='';for(const word of value.split(' ')){const next=line?`${line} ${word}`:word;if(c.measureText(next).width>max&&line){c.fillText(line,x,y);y+=size*lineHeight;line=word;}else line=next;}if(line)c.fillText(line,x,y);return y+size*lineHeight;}
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
      text(c,'Philippe Saxer',76,70,innerWidth<innerHeight?55:40,'#f1f0e7','700');
      if(innerWidth<innerHeight){
        text(c,'Hallo, ich bin Philippe!',90,230,128,'#f1f0e7','700');
        let y=350;y=lines(c,'Informatik EFZ – Applikationsentwicklung',90,y,1840,84,'#f1f0e7',1.16)+20;
        y=lines(c,'Bei Migros lerne ich Software zu entwickeln. KI und Spiele interessieren mich.',90,y,1840,84,'#f1f0e7',1.16)+28;
        text(c,`${projects.length} Projekte  /  8 Bereiche`,90,y,78,'#dfcbaa','700');
        text(c,'SCROLLEN, UM MEHR ZU ENTDECKEN',90,920,55,'#f1f0e7','700');c.fillStyle='#345a3e';c.fillRect(90,970,700,130);text(c,'LESEANSICHT  ↗',130,1055,64,'#f1f0e7','700');return;
      }
      text(c,'ÜBER MICH',130,205,31,'#dfcbaa','700');text(c,'Hallo, ich bin',130,345,96,'#f1f0e7','700');text(c,'Philippe!',130,455,110,'#dfcbaa','700');
      c.fillStyle='#c6a578';c.fillRect(130,495,215,8);
      let y=575;y=lines(c,'Lernender Informatiker EFZ Fachrichtung Applikationsentwicklung.',130,y,1150,50,'#f1f0e7',1.35)+40;
      lines(c,'Bei Migros lerne ich Software zu entwickeln. KI und Spieleentwicklung interessieren mich besonders.',130,y,1150,46,'#f1f0e7',1.35);
      c.fillStyle='#2f4937';c.fillRect(1430,220,465,680);text(c,'MEIN WEG',1480,292,30,'#dfcbaa','700');
      text(c,String(projects.length),1480,405,76,'#f1f0e7','700');text(c,'PROJEKTE',1580,405,26,'#f1f0e7','700');text(c,'8',1480,515,76,'#f1f0e7','700');text(c,'BEREICHE',1580,515,26,'#f1f0e7','700');text(c,'EFZ',1480,625,64,'#f1f0e7','700');text(c,'AUSBILDUNG',1480,680,26,'#f1f0e7','700');
      c.fillStyle='#416a4a';c.fillRect(1470,790,385,78);text(c,'LESEANSICHT  ↗',1493,840,34,'#f1f0e7','700');
      text(c,'SCROLLEN, UM DEN ARBEITSPLATZ ZU ERKUNDEN',130,1040,27,'#f1f0e7','700');
    });
    const monitor=new THREE.Group();monitor.name='monitor';room.add(monitor);
    // The base reaches the rear support and rests directly on the desktop.
    rounded(monitor,1.15,.1125,.98,.04,ink,-.4,.23375,-1.305);
    rounded(monitor,.23,.035,.23,.015,dark,-.4,.3,-1.65);
    rounded(monitor,.13,.72,.14,.03,metal,-.4,.6,-1.65);
    rounded(monitor,2.8,1.66,.15,.07,ink,-.4,1.48,-1.52);const screen=new THREE.Mesh(new THREE.PlaneGeometry(2.63,1.48),new THREE.MeshBasicMaterial({map:monitorSurface.texture,toneMapped:false}));screen.position.set(-.4,1.49,-1.435);monitor.add(screen);const glass=new THREE.Mesh(new THREE.PlaneGeometry(2.63,1.48),new THREE.MeshPhysicalMaterial({color:0xd6eee0,transparent:true,opacity:.035,roughness:.18,metalness:.12,depthWrite:false}));glass.position.set(-.4,1.49,-1.431);monitor.add(glass);rounded(monitor,.42,.035,.04,.015,ink,-.4,2.32,-1.46);cylinder(monitor,.025,.025,.012,mat(0xa4eab7,{emissive:0x72d994,emissiveIntensity:.6}),.83,.73,-1.43);
    // Printed keycaps and the small hardware display form the skills interface.
    const keyboard=new THREE.Group();keyboard.name='keyboard';room.add(keyboard);rounded(keyboard,2.45,.14,.91,.07,ink,-.47,.29,.48);
    const labels=skills.map(skill=>surface(256,256,c=>{c.clearRect(0,0,256,256);c.textAlign='center';text(c,skill[0],128,165,skill[0].length>3?92:110,'#142c20','700');}));
    const keys=[];for(let row=0;row<4;row++)for(let col=0;col<8;col++){const index=col;const km=mat((row===0&&col%4===0)?0x94b5a1:0xc7c9bc,{emissive:0x9de9af,emissiveIntensity:0,roughness:.5});const x=-1.415+col*.27,z=.18+row*.195;const key=rounded(keyboard,.23,.095,.16,.018,km,x,.4,z);key.userData.skill=index;keys.push(key);const label=new THREE.Mesh(new THREE.PlaneGeometry(.205,.14),new THREE.MeshBasicMaterial({map:labels[index].texture,transparent:true,depthWrite:false}));label.rotation.x=-Math.PI/2;label.position.set(x,.451,z);keyboard.add(label);}
    const skillDisplay=surface(1400,420,(c,w,h)=>{
      c.fillStyle='#10251a';c.fillRect(0,0,w,h);text(c,'TASTE WÄHLEN',45,68,55,'#dfcbaa','700');
      text(c,skills[selected][0],45,250,110,'#f1f0e7','700');
      text(c,skills[selected][1],390,155,65,'#f1f0e7','700');
      const names=projects.filter(project=>project[4].includes(skills[selected][2])).map(project=>project[0]);
      text(c,'PROJEKTE:',390,230,46,'#dfcbaa','700');const preview=names.length?`${names[0]}${names.length>1?` + ${names.length-1} weitere`:''}`:'In der Leseansicht';lines(c,preview,390,310,960,62,'#f1f0e7',1.1);
    });
    rounded(room,2.15,.065,.61,.035,ink,-.47,.24,-.29);const skillScreen=new THREE.Mesh(new THREE.PlaneGeometry(2.02,.53),new THREE.MeshBasicMaterial({map:skillDisplay.texture,toneMapped:false}));skillScreen.rotation.x=-Math.PI/2;skillScreen.position.set(-.47,.277,-.29);room.add(skillScreen);
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
    // One project per page keeps the type legible even on a small screen.
    const notebookSurface=surface(1600,1400,(c,w,h)=>{
      c.fillStyle='#f0eadb';c.fillRect(0,0,w,h);c.fillStyle='#526e59';c.fillRect(0,0,w,25);
      text(c,'PROJEKTE',95,130,58,'#294b34','700');
      text(c,`${page+1} / ${projects.length}`,1290,130,58,'#294b34','700');
      const project=projects[page];if(!project)return;
      text(c,project[1].toUpperCase(),95,275,58,'#31523a','700');
      let titleSize=108;c.font=`700 ${titleSize}px system-ui`;
      while(c.measureText(project[0]).width>1380 && titleSize>68){titleSize-=4;c.font=`700 ${titleSize}px system-ui`;}
      text(c,project[0],95,405,titleSize,'#172d20','700');
      c.fillStyle='#9bad9e';c.fillRect(95,455,1410,4);
      lines(c,project[2],95,560,1400,75,'#203429',1.28,'500');
      c.fillStyle='#e3dccb';c.fillRect(95,1060,1410,105);
      text(c,'PROJEKTERKLÄRUNG ÖFFNEN  ↗',130,1130,54,'#173d23','700');
      text(c,'←  VORHERIGE',95,1335,55,page>0?'#254c32':'#536b58','700');
      text(c,'NÄCHSTE  →',1120,1335,55,page<projects.length-1?'#254c32':'#536b58','700');
    });
    const notebook=new THREE.Group();notebook.name='notebook';room.add(notebook);rounded(notebook,1.5,.1,1.34,.025,mat(0x526a5a),2.15,.28,.98);rounded(notebook,1.42,.035,1.26,.015,paper,2.15,.35,.98);const note=new THREE.Mesh(new THREE.PlaneGeometry(1.34,1.18),new THREE.MeshBasicMaterial({map:notebookSurface.texture,toneMapped:false}));note.rotation.x=-Math.PI/2;note.position.set(2.15,.373,.98);notebook.add(note);
    for(let i=0;i<4;i++)box(notebook,1.39,.003,1.22,mat(i%2?0xcfc8b7:0xe1dac8),2.15,.32+i*.007,.98);
    rounded(notebook,.035,.012,1.28,.008,mat(0x354d3d),1.46,.374,.98);box(notebook,.09,.008,.24,mat(0x9e735c),2.57,.325,1.67);
    function setPage(value){page=THREE.MathUtils.clamp(value,0,projects.length-1);highlight=-1;notebookSurface.refresh();onPageChange(page);}
    function showProject(index){page=index;highlight=index;notebookSurface.refresh();onPageChange(page);}
    // Sticky notes are mounted on the board behind the desk.
    const board=new THREE.Group();board.name='notes';room.add(board);rounded(board,2.16,1.15,.08,.04,mat(0x5d5848),2.17,1.45,-2.04);
    const notes=[
      ['PROGRAMMIEREN','Mich begeistert, wie aus Ideen nutzbare Software entsteht.'],
      ['KI UND LERNEN','Ich interessiere mich für künstliche Intelligenz und Machine Learning.'],
      ['VIDEOSPIELE','Ich spiele gerne und interessiere mich für die Entwicklung von Videospielen.']
    ];
    notes.forEach((entry,i)=>{
      const x=1.49+i*.68;rounded(board,.58,.74,.025,.01,mat(i===1?0xe1c995:0xd2ddac),x,1.49,-1.985);
      const noteMap=surface(512,640,(c,w,h)=>{c.fillStyle=i===1?'#e5d2a6':'#dce5b8';c.fillRect(0,0,w,h);text(c,entry[0],38,115,47,'#314a31','700');lines(c,entry[1],38,205,435,50,'#253e2a',1.28);});
      const face=new THREE.Mesh(new THREE.PlaneGeometry(.54,.7),new THREE.MeshBasicMaterial({map:noteMap.texture,toneMapped:false}));face.position.set(x,1.49,-1.966);board.add(face);
    });
    // Contact is direct: the phone opens the visitor's email app.
    const currentPhoneTime=()=>{const now=new Date();return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;};
    let phoneTime=currentPhoneTime();
    const phoneSurface=surface(1024,1800,(c,w,h)=>{
      c.fillStyle='#e8f3e8';c.fillRect(0,0,w,h);
      text(c,phoneTime,70,96,56,'#102a1b','700');c.fillStyle='#9dbba3';c.fillRect(65,145,894,3);
      text(c,'HALLO!',70,280,55,'#21462d','700');text(c,'Schreib mir.',70,410,100,'#102a1b','700');
      lines(c,'Fragen, Projekte oder Austausch: Ich freue mich auf deine Nachricht.',70,570,860,58,'#173d23',1.35);
      c.fillStyle='#163a23';c.fillRect(70,920,880,170);text(c,'E-MAIL SCHREIBEN  ↗',105,1028,49,'#ffffff','700');
      text(c,'philippesaxer8@gmail.com',70,1220,52,'#102a1b','700');
      lines(c,'Impressum und Datenschutz findest du in der Leseansicht.',70,1440,860,48,'#173d23',1.3);
    });
    let phoneClockTimer;
    function updatePhoneClock(){clearTimeout(phoneClockTimer);const current=currentPhoneTime();if(current!==phoneTime){phoneTime=current;phoneSurface.refresh();}const now=new Date();phoneClockTimer=setTimeout(updatePhoneClock,Math.max(100,60050-now.getSeconds()*1000-now.getMilliseconds()));}
    updatePhoneClock();document.addEventListener('visibilitychange',()=>{if(!document.hidden)updatePhoneClock();});
    const phone=new THREE.Group();phone.name='phone';room.add(phone);rounded(phone,.66,.09,1.12,.09,ink,-2.18,.29,.95);const phoneScreen=new THREE.Mesh(new THREE.PlaneGeometry(.58,1.02),new THREE.MeshBasicMaterial({map:phoneSurface.texture,toneMapped:false}));phoneScreen.rotation.x=-Math.PI/2;phoneScreen.position.set(-2.18,.342,.95);phone.add(phoneScreen);rounded(phone,.1,.018,.018,.008,black,-2.18,.355,.48);rounded(phone,.065,.018,.018,.008,metal,-2.03,.355,.48);rounded(phone,.025,.035,.18,.01,metal,-1.84,.30,.78);
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
    const progress={value:0},look=new THREE.Vector3(),position=new THREE.Vector3(),nextLook=new THREE.Vector3(),nextPosition=new THREE.Vector3();let active=0,lastStation=-1;
    function updateCamera(){let n=THREE.MathUtils.clamp(progress.value,0,6);onProgress(n/6);if(reduced.matches)n=Math.round(n);const index=Math.floor(n),next=Math.min(6,index+1);let t=n-index;t=t*t*(3-2*t);active=Math.round(n);if(active!==lastStation){lastStation=active;onStationChange(active);}look.set(...frames[index].l).lerp(nextLook.set(...frames[next].l),t);position.set(...frames[index].p).lerp(nextPosition.set(...frames[next].p),t);if(camera.aspect<1){const base=Math.max(1,1.03/camera.aspect);const zoom=[1,1,.84,1,1,1,.44];const factor=Math.max(1,base*THREE.MathUtils.lerp(zoom[index],zoom[next],t));position.sub(look).multiplyScalar(factor).add(look);}camera.position.copy(position);camera.lookAt(look);invalidate();}
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
    canvas.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse')return;const hit=pick(event);canvas.style.cursor=hit&&(active===0?isMonitorButton(hit):active===2?(1-hit.uv.y>.90||(1-hit.uv.y>.18&&1-hit.uv.y<.84)):true)?'pointer':'default';if(hit&&active===1)selectSkill(hit.object.userData.skill);});
    let pointerStart=null;canvas.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY};});
    canvas.addEventListener('pointerup',event=>{if(!pointerStart||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>12){pointerStart=null;return;}pointerStart=null;const hit=pick(event);if(!hit)return;if(active===1){selectSkill(hit.object.userData.skill);return;}const y=1-hit.uv.y;if(active===0){if(isMonitorButton(hit))onOpenTextView();return;}if(active===2){if(y>.90)setPage(page+(hit.uv.x<.5?-1:1));else if(y>.18&&y<.84){onOpenProject(page);}return;}if(active===6&&y>.49&&y<.65)window.location.href='mailto:philippesaxer8@gmail.com';
    });
    function render(){frame=0;if(document.hidden||!document.body.classList.contains('immersive')||!renderDirty)return;renderDirty=false;renderer.render(scene,camera);}
    function syncRender(){if(document.hidden||!document.body.classList.contains('immersive')){cancelAnimationFrame(frame);frame=0;}else invalidate();}
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);frame=0;onContextLost();},{once:true});
    document.addEventListener('visibilitychange',syncRender);window.addEventListener('scenevisibilitychange',syncRender);syncRender();selectSkill(0);onPageChange(0);
    return {available:true,selectSkill,setPage,turnPage:delta=>setPage(page+delta),showProject};
  }catch(error){canvas.hidden=true;console.warn('Die 3D-Ansicht ist auf diesem Gerät nicht verfügbar.',error);return {available:false};}
}
