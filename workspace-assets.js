import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Small manufacturing details are shared across the desk objects so their finishes
// react consistently to the same lights and environment.
export function addWorkspaceAssets(room) {
  const material = (color, options = {}) => new THREE.MeshStandardMaterial({color, roughness: .55, ...options});
  const graphite = material(0x26332f, {metalness: .55, roughness: .3});
  const rubber = material(0x18231f, {roughness: .9});
  const leather = material(0x34443c, {roughness: .78});
  const steel = material(0x9da8a0, {metalness: .85, roughness: .28});
  const brass = material(0xb58a63, {metalness: .78, roughness: .3});
  const cream = material(0xd9d3c1, {roughness: .26});
  const mesh = (parent, geometry, mat, x=0, y=0, z=0) => {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(x,y,z); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  };
  const cylinder = (parent, top, bottom, height, mat, x, y, z, segments=48) => mesh(parent, new THREE.CylinderGeometry(top,bottom,height,segments),mat,x,y,z);
  const rounded = (parent,w,h,d,r,mat,x,y,z) => mesh(parent,new RoundedBoxGeometry(w,h,d,4,r),mat,x,y,z);
  const ring = (parent,r,t,mat,x,y,z) => {const o=mesh(parent,new THREE.TorusGeometry(r,t,12,64),mat,x,y,z);o.rotation.x=Math.PI/2;return o;};
  const tube = (parent,points,r,mat) => mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),64,r,12,false),mat);
  const link = (parent,a,b,r,mat) => {
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
    const o=cylinder(parent,r,r,delta.length(),mat,...start.clone().add(end).multiplyScalar(.5).toArray(),24);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;
  };

  // Weighted base, articulated arms, real pivot hardware and a lined metal shade.
  const lamp = new THREE.Group(); room.add(lamp);
  cylinder(lamp,.29,.31,.065,graphite,-2.75,.255,-1.5);
  cylinder(lamp,.245,.29,.06,graphite,-2.75,.316,-1.5);
  ring(lamp,.26,.006,steel,-2.75,.35,-1.5);
  cylinder(lamp,.075,.09,.11,graphite,-2.75,.4,-1.5);
  const pivots=[[-2.75,.45,-1.5],[-2.67,1.37,-1.5],[-2.39,2.13,-1.5]];
  for(let i=0;i<2;i++) {
    const a=pivots[i],b=pivots[i+1];
    for(const dz of [-.045,.045]) link(lamp,[a[0],a[1],a[2]+dz],[b[0],b[1],b[2]+dz],.022,graphite);
    link(lamp,[a[0]+.035,a[1]+.08,a[2]],[b[0]-.035,b[1]-.08,b[2]],.008,steel);
  }
  for(const [x,y,z] of pivots){const pin=cylinder(lamp,.075,.075,.15,graphite,x,y,z);pin.rotation.x=Math.PI/2;const cap=cylinder(lamp,.034,.034,.16,brass,x,y,z);cap.rotation.x=Math.PI/2;}
  const shade = new THREE.Group();shade.position.set(-2.32,2.1,-1.5);shade.rotation.z=-.3;lamp.add(shade);
  cylinder(shade,.135,.36,.28,graphite,0,0,0);
  cylinder(shade,.135,.135,.035,steel,0,.155,0);
  cylinder(shade,.335,.335,.012,cream,0,-.145,0);
  ring(shade,.34,.012,graphite,0,-.15,0);
  cylinder(shade,.18,.18,.015,material(0xffe3ae,{emissive:0xffc77c,emissiveIntensity:1.5,roughness:.35}),0,-.157,0);
  const spot=new THREE.SpotLight(0xffce91,15,4,Math.PI/4.5,.85,1.5);spot.position.set(-2.27,1.94,-1.5);spot.target.position.set(-1.8,.2,-.8);room.add(spot,spot.target);
  tube(lamp,[[-2.78,.32,-1.56],[-2.93,.25,-1.72],[-3.08,.23,-2.04],[-2.9,.23,-2.12]],.012,rubber);

  // Hexagonal wooden pencil with fine grain, exposed cedar and graphite.
  const pencil=new THREE.Group();pencil.position.set(2.93,.405,.98);pencil.rotation.y=-.18;room.add(pencil);
  const grainCanvas=document.createElement('canvas');grainCanvas.width=512;grainCanvas.height=1024;
  const grain=grainCanvas.getContext('2d');grain.fillStyle='#80502f';grain.fillRect(0,0,512,1024);
  let seed=841;const random=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
  for(let i=0;i<210;i++){
    const x=random()*512;grain.strokeStyle=random()>.45?'rgba(55,25,12,.13)':'rgba(238,185,124,.10)';grain.lineWidth=.5+random()*2.5;
    grain.beginPath();grain.moveTo(x,0);grain.bezierCurveTo(x+random()*10-5,340,x+random()*10-5,680,x+random()*8-4,1024);grain.stroke();
  }
  const grainMap=new THREE.CanvasTexture(grainCanvas);grainMap.colorSpace=THREE.SRGBColorSpace;grainMap.anisotropy=8;
  const barrel=mesh(pencil,new THREE.CylinderGeometry(.028,.028,.73,6,1,true),material(0xffffff,{map:grainMap,roughness:.52}));
  barrel.geometry.rotateY(Math.PI/6);barrel.rotation.x=Math.PI/2;
  const cedarCanvas=document.createElement('canvas');cedarCanvas.width=256;cedarCanvas.height=512;
  const cedar=cedarCanvas.getContext('2d');cedar.fillStyle='#d4aa78';cedar.fillRect(0,0,256,512);
  for(let i=0;i<90;i++){
    const x=random()*256;cedar.strokeStyle=random()>.5?'rgba(105,63,36,.10)':'rgba(255,232,190,.12)';cedar.lineWidth=.4+random()*1.5;
    cedar.beginPath();cedar.moveTo(x,0);cedar.bezierCurveTo(x+random()*5-2.5,170,x+random()*5-2.5,340,x+random()*5-2.5,512);cedar.stroke();
  }
  const cedarMap=new THREE.CanvasTexture(cedarCanvas);cedarMap.colorSpace=THREE.SRGBColorSpace;cedarMap.anisotropy=8;
  // The exposed wood overlaps the barrel and ends at the graphite's full width.
  // Matching hexagonal sections and a concealed overlap avoid gaps and coplanar caps.
  const woodStart=.363,woodEnd=.485,leadRadius=.0065,leadStart=woodEnd-.001,leadEnd=.520;
  const tip=mesh(pencil,new THREE.CylinderGeometry(leadRadius,.028,woodEnd-woodStart,6,1,true),material(0xffffff,{map:cedarMap,roughness:.85}),0,0,(woodStart+woodEnd)/2);
  tip.geometry.rotateY(Math.PI/6);tip.rotation.x=Math.PI/2;
  const lead=mesh(pencil,new THREE.CylinderGeometry(0,leadRadius,leadEnd-leadStart,6,1,true),material(0x292722,{metalness:.1,roughness:.46}),0,0,(leadStart+leadEnd)/2);
  lead.geometry.rotateY(Math.PI/6);lead.rotation.x=Math.PI/2;
  const ferruleMaterial=material(0xa77c52,{metalness:.8,roughness:.3});
  const ferrule=cylinder(pencil,.029,.029,.075,ferruleMaterial,0,0,-.402,32);ferrule.rotation.x=Math.PI/2;
  for(const z of [-.435,-.422,-.409,-.396,-.383,-.37]) {const rib=ring(pencil,.029,.0015,brass,0,0,z);rib.rotation.x=0;}
  const eraser=cylinder(pencil,.025,.026,.07,material(0xc7a18e,{roughness:.9}),0,0,-.47,32);eraser.rotation.x=Math.PI/2;
  const eraserEnd=cylinder(pencil,.024,.025,.008,material(0xb99280,{roughness:.9}),0,0,-.508,32);eraserEnd.rotation.x=Math.PI/2;

  // A restrained foil imprint sits on the upper flat of the barrel.
  const imprintCanvas=document.createElement('canvas');imprintCanvas.width=128;imprintCanvas.height=1024;
  const imprint=imprintCanvas.getContext('2d');imprint.translate(64,512);imprint.rotate(Math.PI/2);imprint.textAlign='center';imprint.fillStyle='rgba(242,213,158,.72)';imprint.font='600 38px serif';imprint.fillText('HB  ·  CEDAR',0,13);
  const imprintMap=new THREE.CanvasTexture(imprintCanvas);imprintMap.colorSpace=THREE.SRGBColorSpace;
  const imprintMesh=mesh(pencil,new THREE.PlaneGeometry(.038,.38),new THREE.MeshBasicMaterial({map:imprintMap,transparent:true,depthWrite:false}),0,.0244,-.06);imprintMesh.rotation.x=-Math.PI/2;

  // Over-ear headphones resting on the desk: padded band, yokes and layered cups.
  const headphones=new THREE.Group();headphones.position.set(.95,.24,-1.3);headphones.rotation.y=-.13;room.add(headphones);
  const bandPoints=[[-.39,.12,0],[-.43,.12,-.2],[-.36,.12,-.43],[0,.12,-.55],[.36,.12,-.43],[.43,.12,-.2],[.39,.12,0]];
  tube(headphones,bandPoints,.055,graphite);
  tube(headphones,bandPoints.map(([x,y,z])=>[x*.91,y+.012,z*.91]),.033,leather);
  for(const side of [-1,1]){
    const x=side*.39;
    link(headphones,[side*.39,.12,-.12],[side*.39,.12,.03],.025,steel);
    rounded(headphones,.09,.1,.17,.035,graphite,x,.12,-.02);
    cylinder(headphones,.19,.18,.10,graphite,x,.09,.08);
    cylinder(headphones,.166,.17,.025,steel,x,.15,.08);
    cylinder(headphones,.148,.148,.027,leather,x,.172,.08);
    ring(headphones,.125,.045,leather,x,.19,.08);
    cylinder(headphones,.084,.084,.008,rubber,x,.182,.08);
    ring(headphones,.165,.004,brass,x,.165,.08);
    for(let i=0;i<3;i++) rounded(headphones,.013,.012,.022,.005,steel,x+side*.17,.10,.02+i*.035);
  }

  // Glazed ceramic cup with a visible inner wall, coffee and a rounded handle.
  const cup=new THREE.Group();cup.position.set(-2.4,.23,-.15);room.add(cup);
  const cupProfile=[[.17,0],[.21,.01],[.24,.05],[.26,.35],[.255,.4],[.23,.4],[.225,.36],[.205,.08],[.16,.06]].map(p=>new THREE.Vector2(...p));
  mesh(cup,new THREE.LatheGeometry(cupProfile,64),cream);
  cylinder(cup,.224,.224,.006,material(0x493428,{roughness:.2}),0,.345,0);
  ring(cup,.242,.008,cream,0,.397,0);
  const handle=mesh(cup,new THREE.TorusGeometry(.135,.035,16,48),cream,-.27,.22,0);handle.scale.set(.85,1.15,1);

  // A ceramic planter with soil and individually curved, veined leaves.
  const plant=new THREE.Group();plant.position.set(2.75,.23,-1.45);room.add(plant);
  const pot=material(0xa8a394,{roughness:.75});
  const potProfile=[[.19,0],[.23,.02],[.3,.38],[.31,.4],[.28,.41],[.27,.36]].map(p=>new THREE.Vector2(...p));
  mesh(plant,new THREE.LatheGeometry(potProfile,64),pot);
  cylinder(plant,.275,.275,.012,material(0x433c30,{roughness:1}),0,.365,0);
  ring(plant,.295,.012,pot,0,.395,0);
  const leaves=[material(0x54795d,{roughness:.62,side:THREE.DoubleSide}),material(0x6d9270,{roughness:.62,side:THREE.DoubleSide})];
  for(let i=0;i<11;i++){
    const angle=i*2.4, length=.36+(i%3)*.055, spread=.12+(i%4)*.035;
    const origin=[Math.cos(angle)*spread*.35,.46+(i%3)*.035,Math.sin(angle)*spread*.35];
    tube(plant,[[0,.36,0],[origin[0]*.6,.43,origin[2]*.6],origin],.006,leaves[0]);
    const leafGroup=new THREE.Group();leafGroup.position.set(...origin);leafGroup.rotation.y=-angle;leafGroup.rotation.z=-.55-(i%3)*.12;plant.add(leafGroup);
    const vertices=[],indices=[],rows=16,cols=8;
    for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
      const t=row/rows,u=col/cols*2-1,width=Math.sin(Math.PI*t)*(.065+(i%2)*.012);
      vertices.push(u*width,t*length,Math.sin(Math.PI*t)*.035*(1-u*u));
      if(row<rows&&col<cols){const a=row*(cols+1)+col,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1);}
    }
    const shape=new THREE.BufferGeometry();shape.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));shape.setIndex(indices);shape.computeVertexNormals();mesh(leafGroup,shape,leaves[i%2]);
    tube(leafGroup,[[0,0,.003],[0,length*.5,.038],[0,length,.003]],.0025,leaves[0]);
  }

  return {lamp,headphones,pencil};
}
