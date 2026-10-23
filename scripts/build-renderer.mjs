import { build } from 'esbuild';
import { copyFile,readFile,readdir,writeFile } from 'node:fs/promises';
const result=await build({entryPoints:['src/floor-pixi.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'assets/vendor/floor-pixi.js',minify:true,legalComments:'linked',metafile:true});
// Normalize trailing spaces in generated multiline shader sources for clean source diffs.
const bundle=await readFile('assets/vendor/floor-pixi.js','utf8');await writeFile('assets/vendor/floor-pixi.js',bundle.replace(/[ \t]+$/gm,''));
await copyFile('node_modules/pixi.js/LICENSE','assets/vendor/PixiJS-LICENSE');
const packages=new Set(Object.keys(result.metafile.inputs).map(p=>p.replaceAll('\\','/').match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)?.[1]).filter(Boolean));
let notices='Licenses of packages included in the combat renderer bundle.\n';
for(const name of [...packages].sort()){
  const root=`node_modules/${name}`,files=(await readdir(root)).filter(p=>/^licen[cs]e(?:\.|$)/i.test(p));
  const pkg=JSON.parse(await readFile(`${root}/package.json`,'utf8'));
  notices+=`\n\n=== ${name} ${pkg.version} (${pkg.license}) ===\n`;
  for(const file of files)notices+=await readFile(`${root}/${file}`,'utf8');
  if(!files.length&&name==='@pixi/colord')notices+=await readFile('assets/vendor/colord-LICENSE.md','utf8');
  else if(!files.length)throw Error(`Missing bundled dependency license: ${name}`);
}
await writeFile('assets/vendor/THIRD-PARTY-LICENSES.txt',notices);
console.log('Built PixiJS combat renderer.');
