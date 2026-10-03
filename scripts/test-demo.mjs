import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
const dir=mkdtempSync(join(tmpdir(),'sibate-demo-test-'));
try {
 const compilation=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','scripts/test-demo-store.ts','--outDir',dir,'--rootDir','.','--module','commonjs','--target','es2022','--lib','es2022,dom','--esModuleInterop','--strict','--skipLibCheck','--types','node'],{stdio:'inherit'});
 if(compilation.error)throw compilation.error;
 if(compilation.status!==0)process.exitCode=compilation.status||1;
 else {
  writeFileSync(join(dir,'package.json'),'{"type":"commonjs"}');
  const test=spawnSync(process.execPath,['--test',join(dir,'scripts/test-demo-store.js')],{stdio:'inherit'});
  if(test.error)throw test.error;
  process.exitCode=test.status||0;
 }
} finally {
 if(dirname(resolve(dir))!==resolve(tmpdir())||!basename(dir).startsWith('sibate-demo-test-'))throw Error('Invalid temporary test directory');
 rmSync(dir,{recursive:true,force:true});
}
