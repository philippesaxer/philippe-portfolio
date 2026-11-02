import { initScene } from './scene.js';

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
let world,phoneInputActive=false;
function focusPhoneField(key){phoneInputActive=true;elements[key].focus({preventScroll:true});}
const skillControls=document.querySelector('#skill-controls');
skills.forEach((skill,index)=>{const button=document.createElement('button');button.type='button';button.textContent=`${skill[0]} – ${skill[1]}: ${projects.filter(project=>project[1]===skill[2]).map(project=>project[0]).join(', ')}`;button.addEventListener('focus',()=>world?.selectSkill(index));button.addEventListener('click',()=>world?.selectSkill(index));skillControls.append(button);});
document.querySelectorAll('[data-project]').forEach(link=>link.addEventListener('focus',()=>world?.showProject(Number(link.dataset.project))));
const selectSkill=index=>{document.querySelector('#skill-status').textContent=`${skills[index][1]}: ${projects.filter(project=>project[1]===skills[index][2]).map(project=>project[0]).join(', ')}`;};
const selectPage=page=>{document.querySelector('#page-status').textContent=`Notizbuchseite ${page+1} von 4`;};
world=initScene({skills,projects,onSkillSelect:selectSkill,onPageChange:selectPage,elements,focusPhoneField,onOpenTextView:()=>setTextView(true,document.querySelector('#start'))});
const viewToggle=document.querySelector('#view-toggle');
function setTextView(enabled,stage){
  if(!world.available)return;
  const current=stage||Array.from(document.querySelectorAll('.story-stage')).reduce((closest,item)=>Math.abs(item.getBoundingClientRect().top)<Math.abs(closest.getBoundingClientRect().top)?item:closest);
  document.body.classList.toggle('text-view',enabled);window.dispatchEvent(new Event('scenevisibilitychange'));viewToggle.textContent=enabled?'3D-Ansicht':'Inhalte lesen';viewToggle.setAttribute('aria-pressed',String(enabled));
  window.dispatchEvent(new Event('resize'));current.scrollIntoView({behavior:'instant',block:'start'});
}
if(world.available){document.body.classList.add('immersive');viewToggle.hidden=false;window.dispatchEvent(new Event('resize'));}
viewToggle.addEventListener('click',()=>setTextView(!document.body.classList.contains('text-view')));
document.querySelector('#previous-page').addEventListener('click',()=>world.turnPage(-1));document.querySelector('#next-page').addEventListener('click',()=>world.turnPage(1));
document.querySelectorAll('[data-consent]').forEach(button=>button.addEventListener('click',()=>{world.setConsent(button.dataset.consent);document.querySelector('#consent-status').textContent=button.dataset.consent==='accepted'?'Optionale Technologien sind erlaubt.':'Nur notwendige Technologien sind erlaubt.';}));
for(const [key,element] of Object.entries(elements)){element.addEventListener('focus',()=>world.setPhonePage(key==='newsletter'?'newsletter':'form',key));element.addEventListener('input',()=>world.refreshPhone());}
// Phone fields keep their real input focus while their contents appear on the 3D screen.
// Other keyboard navigation still reveals the accessible HTML controls.
document.addEventListener('focusin',event=>{
  const form=event.target.closest('#contact-form, #newsletter-form');
  if(phoneInputActive&&form){
    if(event.target.matches('button[type="submit"]'))world.setPhonePage(form.id==='contact-form'?'form':'newsletter','submit');
    return;
  }
  phoneInputActive=false;const stage=event.target.closest('.story-stage');
  if(stage&&document.body.classList.contains('immersive')&&!document.body.classList.contains('text-view')){setTextView(true,stage);event.target.scrollIntoView({behavior:'instant',block:'nearest'});}
});
document.addEventListener('focusout',event=>{
  if(phoneInputActive&&event.target.closest('#contact-form, #newsletter-form')&&!event.relatedTarget?.closest?.('#contact-form, #newsletter-form'))phoneInputActive=false;
});
const clean=value=>value.replace(/[\u0000-\u001f\u007f<>]/g,' ').replace(/\s+/g,' ').trim();
const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
function prepareMail(form,isNewsletter){const data=new FormData(form),email=clean(String(data.get('email')||'')),name=clean(String(data.get('name')||'')),message=clean(String(data.get('message')||''));const status=document.querySelector(isNewsletter?'#newsletter-status':'#contact-status');if(data.get('website')||!validEmail(email)||(!isNewsletter&&(!name||!message))){status.textContent='Bitte fülle alle Felder aus und gib eine gültige E-Mail-Adresse ein.';world.setPhoneStatus(status.textContent);return;}form.elements.csrf_token.value=document.querySelector('meta[name="csrf-token"]')?.content||'';const subject=isNewsletter?'Anfrage zu Neuigkeiten':`Nachricht von ${name}`;const body=isNewsletter?`Hallo Philippe,\n\nich interessiere mich für Neuigkeiten.\n\nMeine E-Mail: ${email}`:`Hallo Philippe,\n\n${message}\n\n${name}\n${email}`;status.textContent='Dein E-Mail-Programm wird geöffnet. Bitte sende die Nachricht dort ab.';world.setPhoneStatus(status.textContent);window.location.href=`mailto:philippesaxer8@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;}
document.querySelector('#contact-form').addEventListener('submit',e=>{e.preventDefault();prepareMail(e.currentTarget,false);});document.querySelector('#newsletter-form').addEventListener('submit',e=>{e.preventDefault();prepareMail(e.currentTarget,true);});
