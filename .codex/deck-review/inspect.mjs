import fs from 'node:fs/promises';
import { FileBlob, PresentationFile } from '@oai/artifact-tool';
const source = 'C:/Users/HP/Downloads/KrishiLoop2.pptx';
const out = 'D:/Krishiloop/.codex/deck-review';
const p = await PresentationFile.importPptx(await FileBlob.load(source));
const snap = await p.inspect({kind:'slide,textbox,shape,image,table,chart,notes,layout',maxChars:50000});
await fs.writeFile(out+'/inspect.ndjson', snap.ndjson, 'utf8');
console.log('slide count', p.slides.items.length);
console.log(snap.ndjson);
const montage = await p.export({format:'png',montage:true,scale:0.5});
await fs.writeFile(out+'/montage.png',new Uint8Array(await montage.arrayBuffer()));
for(let i=0;i<p.slides.items.length;i++){
 const image=await p.slides.items[i].export({format:'png',scale:1});
 await fs.writeFile(`${out}/slide-${i+1}.png`,new Uint8Array(await image.arrayBuffer()));
}
