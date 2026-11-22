import { initScene } from './scene.js';

// The scene keeps its original project and skill data independently of the 2D selection.
const skills = [
  ['GMS','Spieleentwicklung','Spiele'], ['BE','Serverentwicklung / Node.js','Server'], ['IoT','Vernetzte Geräte','Vernetzung'], ['FE','Frontend / JavaScript','Frontend'],
  ['PR','Python und Grundlagen','Programmierung'], ['DB','Datenbanken / SQL und UML','Datenbanken'], ['TL','Werkzeuge / MS Office','Werkzeuge'], ['SY','Systeme / Git und sauberer Code','Systeme']
];
const projects = [
  ['Migros Prop Hunt','Spiele','Ein kreatives Versteckspiel im Migros-Universum.','projekt-migrosprophunt.html'],
  ['Node.js API Development','Server','Serverseitige Entwicklung von REST-Schnittstellen.','projekt-nodejs.html'],
  ['Internet of Everything','Vernetzung','Physische Geräte vernetzen und Daten visualisieren.','projekt-iot.html'],
  ['JS Frontend','Frontend','Dynamische Webseiten mit reinem JavaScript.','projekt-frontend.html'],
  ['Python Crashcourse','Programmierung','Schnelleinstieg in die Programmiersprache Python.','projekt-python.html'],
  ['Datenbanken & UML','Datenbanken','Relationale Datenbanken entwerfen und modellieren.','projekt-database.html'],
  ['Microsoft Office','Werkzeuge','Professionelle Präsentationen mit PowerPoint.','projekt-office.html'],
  ['Programmiergrundlagen I','Programmierung','Erste Schritte: Variablen, Schleifen und Funktionen.','projekt-programming1.html'],
  ['Development Fundamentals','Systeme','Git, sauberer Code und Entwicklungsprozesse.','projekt-dev-fundamentals.html'],
  ['Windows Internals','Systeme','Einblicke in das Windows-Betriebssystem.','projekt-windows.html']
];
const elements = {name:document.querySelector('#name'),email:document.querySelector('#email'),message:document.querySelector('#message'),newsletter:document.querySelector('#newsletter-email')};
let world;
const skillControls=document.querySelector('#skill-controls');
skills.forEach((skill,index)=>{
  const button=document.createElement('button');
  button.type='button';button.tabIndex=-1;
  button.textContent=`${skill[0]} – ${skill[1]}: ${projects.filter(project=>project[1]===skill[2]).map(project=>project[0]).join(', ')}`;
  button.addEventListener('focus',()=>world?.selectSkill(index));button.addEventListener('click',()=>world?.selectSkill(index));skillControls.append(button);
});
const selectSkill=index=>{document.querySelector('#skill-status').textContent=`${skills[index][1]}: ${projects.filter(project=>project[1]===skills[index][2]).map(project=>project[0]).join(', ')}`;};
const selectPage=page=>{document.querySelector('#page-status').textContent=`Notizbuchseite ${page+1} von 4`;};
world=initScene({skills,projects,onSkillSelect:selectSkill,onPageChange:selectPage,elements,onOpenTextView:()=>setTextView(true,document.querySelector('#start'),true),onOpenContact:openPhoneForm});
const viewToggle=document.querySelector('#view-toggle');
let closingView=false;
function setTextView(enabled,stage,moveFocus=false){
  if(!world.available||closingView)return;
  if(enabled){
    document.body.classList.add('text-view');
    document.querySelector('#start .access-copy').getBoundingClientRect();
    window.dispatchEvent(new Event('scenevisibilitychange'));
    window.dispatchEvent(new Event('resize'));
    (stage||document.querySelector('#start')).scrollIntoView({behavior:'instant',block:'start'});
    if(moveFocus)document.querySelector('h1').focus({preventScroll:true});
    return;
  }
  const stages=Array.from(document.querySelectorAll('.story-stage')).filter(item=>item.getClientRects().length);
  const current=stage||stages.reduce((closest,item)=>Math.abs(item.getBoundingClientRect().top)<Math.abs(closest.getBoundingClientRect().top)?item:closest);
  closingView=true;
  document.body.classList.add('leaving-text');
  const delay=matchMedia('(prefers-reduced-motion: reduce)').matches?0:220;
  setTimeout(()=>{
    document.body.classList.remove('text-view','leaving-text');
    window.dispatchEvent(new Event('scenevisibilitychange'));
    window.dispatchEvent(new Event('resize'));
    window.scrollTo({top:current.offsetTop,left:0,behavior:'instant'});
    document.body.focus({preventScroll:true});
    closingView=false;
  },delay);
}
if(world.available){document.body.classList.add('immersive');viewToggle.hidden=false;window.dispatchEvent(new Event('resize'));}
viewToggle.addEventListener('click',()=>setTextView(false));
const phoneDialog=document.querySelector('#phone-form-dialog'),phoneFormContent=document.querySelector('#phone-form-content');
let phoneForm,phoneFormPlaceholder;
function openPhoneForm(isNewsletter){
  if(phoneFormPlaceholder)return;
  phoneForm=document.querySelector(isNewsletter?'#newsletter-form':'#contact-form');
  phoneFormPlaceholder=document.createComment('phone form');phoneForm.before(phoneFormPlaceholder);
  phoneFormContent.append(phoneForm);
  document.querySelector('#phone-form-title').textContent=isNewsletter?'Neuigkeiten':'Nachricht schreiben';
  world.setPhonePage(isNewsletter?'newsletter':'form');phoneDialog.showModal();
}
document.querySelector('#phone-form-close').addEventListener('click',()=>phoneDialog.close());
phoneDialog.addEventListener('close',()=>{if(phoneFormPlaceholder){phoneFormPlaceholder.replaceWith(phoneForm);phoneFormPlaceholder=null;phoneForm=null;}world.setPhonePage('home');});
document.querySelector('#previous-page').addEventListener('click',()=>world.turnPage(-1));document.querySelector('#next-page').addEventListener('click',()=>world.turnPage(1));
for(const element of Object.values(elements))element.addEventListener('input',()=>{element.removeAttribute('aria-invalid');world.refreshPhone();});
// Keyboard access to the scene's underlying content opens the readable view.
document.addEventListener('focusin',event=>{
  const stage=event.target.closest('.story-stage');
  if(stage&&document.body.classList.contains('immersive')&&!document.body.classList.contains('text-view')){setTextView(true,stage);event.target.scrollIntoView({behavior:'instant',block:'nearest'});}
});
document.querySelector('.copy-email').addEventListener('click',async()=>{
  const status=document.querySelector('#copy-status');
  try { await navigator.clipboard.writeText('philippesaxer8@gmail.com');status.textContent='E-Mail-Adresse kopiert.'; }
  catch { status.textContent='Kopieren nicht möglich. Die Adresse steht direkt darüber.'; }
});
const clean=value=>value.replace(/[\u0000-\u001f\u007f<>]/g,' ').replace(/\s+/g,' ').trim();
const cleanMessage=value=>value.replace(/\r\n?/g,'\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f<>]/g,' ').trim();
const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
function prepareMail(form,isNewsletter){
  const data=new FormData(form),email=clean(String(data.get('email')||'')),name=clean(String(data.get('name')||'')),message=cleanMessage(String(data.get('message')||''));
  const status=document.querySelector(isNewsletter?'#newsletter-status':'#contact-status');
  if(data.get('website'))return;
  const invalid=!isNewsletter&&!name?form.elements.name:!validEmail(email)?form.elements.email:!isNewsletter&&!message?form.elements.message:null;
  if(invalid){
    status.textContent='Bitte fülle alle Felder aus und gib eine gültige E-Mail-Adresse ein.';
    invalid.setAttribute('aria-invalid','true');world.setPhoneStatus(status.textContent);invalid.focus();return;
  }
  form.elements.csrf_token.value=document.querySelector('meta[name="csrf-token"]')?.content||'';
  const subject=isNewsletter?'Anfrage zu Neuigkeiten':`Nachricht von ${name}`;
  const body=isNewsletter?`Hallo Philippe,\n\nich interessiere mich für Neuigkeiten.\n\nMeine E-Mail: ${email}`:`Hallo Philippe,\n\n${message}\n\n${name}\n${email}`;
  status.textContent='Dein E-Mail-Programm wird geöffnet. Bitte sende die Nachricht dort ab.';world.setPhoneStatus(status.textContent);
  window.location.href=`mailto:philippesaxer8@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
document.querySelector('#contact-form').addEventListener('submit',e=>{e.preventDefault();prepareMail(e.currentTarget,false);});
document.querySelector('#newsletter-form').addEventListener('submit',e=>{e.preventDefault();prepareMail(e.currentTarget,true);});
